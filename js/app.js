// Estimator updated for size-based pricing (PHP) and full-logo header balance.

(function(){
  // Base LED wall prices by size (PHP)
  const sizePrices = {
    '6x9': 12000,
    '9x12': 14000,
    '9x18': 16000,
    '9x24': 18000
  };

  // Extra services (PHP)
  const prices = {
    consultation: { type: 'flat', value: 2500 },
    design: { type: 'flat', value: 1500 },
    hardware: { type: 'flat', value: 2000 },
    installation: { type: 'flat', value: 3000 },
    controller: { type: 'per_item', value: 2000 }
  };

  const discountCodes = {
    WELCOME10: 0.10,
    PROCLIENT5: 0.05
  };

  const el = {
    size: document.getElementById('size'),
    transaction: document.getElementById('transaction'),
    quantity: document.getElementById('quantity'),
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
    return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(n);
  }

  function calculate(){
    const sizeKey = el.size.value;
    const basePrice = sizePrices[sizeKey] || 0;
    const qty = Math.max(1, parseInt(el.quantity.value,10) || 1);
    const transaction = el.transaction.value; // sale or rent
    const code = (el.discount.value || '').trim().toUpperCase();
    const discount = discountCodes[code] || 0;

    // Rent multiplier (example): daily/short-term rental tends to be fraction of sale price
    // using 20% of sale price as an example
    const rentMultiplier = 0.20;
    const effectiveBase = (transaction === 'rent') ? Math.round(basePrice * rentMultiplier) : basePrice;

    const selected = getSelectedServices();
    let subtotal = effectiveBase * qty;
    const lines = [];

    lines.push({label:`Base price (${sizeKey}) x ${qty}`, amount: effectiveBase * qty});

    // Extras
    if(selected.includes('consultation')){
      const v = prices.consultation.value;
      subtotal += v;
      lines.push({label:'Consultation (flat)', amount:v});
    }
    if(selected.includes('design')){
      const v = prices.design.value;
      subtotal += v;
      lines.push({label:'Design (flat)', amount:v});
    }
    if(selected.includes('hardware')){
      const v = prices.hardware.value;
      subtotal += v;
      lines.push({label:'Hardware / accessories', amount:v});
    }
    if(selected.includes('installation')){
      const v = prices.installation.value;
      subtotal += v;
      lines.push({label:'Installation (flat)', amount:v});
    }
    if(selected.includes('controller')){
      const unit = prices.controller.value;
      // if controllers not requested as quantity input, assume one per wall
      const controllersCount = Math.max(0, qty);
      const amount = unit * controllersCount;
      subtotal += amount;
      lines.push({label:`Controller setup (${controllersCount} x ${formatCurrency(unit)})`, amount});
    }

    // Apply discount
    let discountAmount = 0;
    if(discount > 0){
      discountAmount = subtotal * discount;
      lines.push({label:`Discount (${Math.round(discount*100)}%)`, amount: -discountAmount});
    }

    // Complexity and tax not applied in this simple estimator (could be added)
    const total = subtotal - discountAmount;
    return {lines, total, summary: {size: sizeKey, transaction, quantity: qty, discountCode: code || null, discountPercent: discount}};
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
      `Selected size: ${summary.size}`,
      `Transaction: ${summary.transaction}`,
      `Quantity: ${summary.quantity}`,
      `Selected services: ${selected}`,
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
