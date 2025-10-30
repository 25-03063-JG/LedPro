// Interactive estimator for LedPro
// Keeps everything client-side; opens mailto to request a formal quote.

(function(){
  const prices = {
    consultation: { type: 'flat', value: 50 },
    design: { type: 'per_m', value: 30 },
    hardware: { type: 'per_m', value: 10 },
    installation: { type: 'per_m', value: 20 },
    controller: { type: 'per_item', value: 40 }
  };

  const discountCodes = {
    WELCOME10: 0.10,
    PROCLIENT5: 0.05
  };

  const el = {
    length: document.getElementById('length'),
    controllers: document.getElementById('controllers'),
    complexity: document.getElementById('complexity'),
    discount: document.getElementById('discount'),
    breakdown: document.getElementById('breakdown'),
    totalAmount: document.getElementById('totalAmount'),
    getQuote: document.getElementById('getQuote'),
    downloadJson: document.getElementById('downloadJson'),
    form: document.getElementById('estimatorForm')
  };

  function getSelectedServices(){
    return Array.from(el.form.querySelectorAll('input[name="service"]:checked')).map(i=>i.value);
  }

  function formatCurrency(n){
    return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
  }

  function calculate(){
    const meters = Math.max(0, parseFloat(el.length.value) || 0);
    const controllers = Math.max(0, parseInt(el.controllers.value,10) || 0);
    const complexityFactor = parseFloat(el.complexity.value) || 1;
    const code = (el.discount.value || '').trim().toUpperCase();
    const discount = discountCodes[code] || 0;

    const selected = getSelectedServices();
    let subtotal = 0;
    const lines = [];

    // Consultation (flat)
    if(selected.includes('consultation')){
      const v = prices.consultation.value;
      subtotal += v;
      lines.push({label:'Consultation (flat)', amount:v});
    }

    // Per-meter services
    ['design','hardware','installation'].forEach(k=>{
      if(selected.includes(k)){
        const unit = prices[k].value;
        const amount = unit * meters;
        subtotal += amount;
        const label = `${k[0].toUpperCase()+k.slice(1)} (${meters} m @ ${formatCurrency(unit)}/m)`;
        lines.push({label, amount});
      }
    });

    // Controllers
    if(selected.includes('controller')){
      const unit = prices.controller.value;
      const amount = unit * controllers;
      subtotal += amount;
      lines.push({label:`Controller setup (${controllers} x ${formatCurrency(unit)})`, amount});
    }

    // Apply complexity factor
    const complexAmount = subtotal * (complexityFactor - 1);
    if(complexAmount > 0){
      lines.push({label:`Site complexity multiplier x${complexityFactor}`, amount: complexAmount});
      subtotal += complexAmount;
    }

    // Discount
    let discountAmount = 0;
    if(discount > 0){
      discountAmount = subtotal * discount;
      lines.push({label:`Discount (${Math.round(discount*100)}%)`, amount: -discountAmount});
    }

    // Estimated tax (optional example) - disabled by default
    const tax = 0; // e.g. 0.07 for 7%
    const taxAmount = (subtotal - discountAmount) * tax;

    const total = subtotal - discountAmount + taxAmount;
    return {lines, total, summary: {meters, controllers, complexityFactor, discountCode: code || null, discountPercent: discount}};
  }

  function render(){
    const res = calculate();
    el.breakdown.innerHTML = '';
    res.lines.forEach(l=>{
      const div = document.createElement('div');
      div.className = 'line';
      const left = document.createElement('div');
      left.textContent = l.label;
      const right = document.createElement('div');
      right.textContent = formatCurrency(l.amount);
      div.appendChild(left);
      div.appendChild(right);
      el.breakdown.appendChild(div);
    });
    el.totalAmount.textContent = formatCurrency(res.total);
  }

  // Hooks
  el.form.addEventListener('input', render);
  el.form.addEventListener('change', render);

  el.getQuote.addEventListener('click', function(){
    const res = calculate();
    const selected = getSelectedServices().join(', ') || 'None';
    const summary = res.summary;
    const bodyLines = [
      `LED Pro - Quote Request`,
      ``,
      `Selected services: ${selected}`,
      `Total LED length: ${summary.meters} m`,
      `Controllers: ${summary.controllers}`,
      `Site complexity factor: ${summary.complexityFactor}`,
      `Discount code: ${summary.discountCode || 'N/A'}`,
      ``,
      `Estimated total: ${el.totalAmount.textContent}`,
      ``,
      `Estimate details:`
    ];
    res.lines.forEach(l=>{
      bodyLines.push(`- ${l.label}: ${formatCurrency(l.amount)}`);
    });
    bodyLines.push('', 'Please contact me to schedule a site visit or request a formal quote.');
    const mailto = `mailto:info@ledpro.example?subject=${encodeURIComponent('LedPro Quote Request')}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = mailto;
  });

  el.downloadJson.addEventListener('click', function(){
    const res = calculate();
    const payload = {
      generated_at: new Date().toISOString(),
      subtotal_breakdown: res.lines,
      total: res.total,
      inputs: res.summary
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ledpro-quote.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Initial render
  render();
})();
