/* ============================================================
   CLARRO — roi-calculator.js
   Simple, transparent ROI estimate for the ROI-Rechner page.
   Only runs if the calculator markup is present on the page.
   ============================================================ */

(function () {
  'use strict';

  var form = document.getElementById('roiForm');
  if (!form) return;

  var visitorsEl   = document.getElementById('roiVisitors');
  var convRateEl   = document.getElementById('roiConversion');
  var customerValEl = document.getElementById('roiCustomerValue');
  var upliftEl     = document.getElementById('roiUplift');
  var investEl     = document.getElementById('roiInvestment');

  var outVisitors   = document.getElementById('roiVisitorsOut');
  var outConvRate   = document.getElementById('roiConversionOut');
  var outUplift     = document.getElementById('roiUpliftOut');

  var resCustomersBefore = document.getElementById('roiCustomersBefore');
  var resCustomersAfter  = document.getElementById('roiCustomersAfter');
  var resExtraRevenue    = document.getElementById('roiExtraRevenue');
  var resNetGain          = document.getElementById('roiNetGain');
  var resRoiPercent       = document.getElementById('roiPercent');

  function fmtEUR(n) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  }
  function fmtNum(n, decimals) {
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: decimals || 0 }).format(n);
  }

  function calculate() {
    var visitors    = parseFloat(visitorsEl.value) || 0;
    var convRate    = parseFloat(convRateEl.value) || 0;
    var customerVal = parseFloat(customerValEl.value) || 0;
    var uplift      = parseFloat(upliftEl.value) || 0;
    var investment  = parseFloat(investEl.value) || 0;

    if (outVisitors) outVisitors.textContent = fmtNum(visitors);
    if (outConvRate) outConvRate.textContent = fmtNum(convRate, 1) + '%';
    if (outUplift) outUplift.textContent = '+' + fmtNum(uplift) + '%';

    var customersBefore = visitors * (convRate / 100);
    var newConvRate      = convRate * (1 + uplift / 100);
    var customersAfter   = visitors * (newConvRate / 100);
    var extraCustomers   = Math.max(0, customersAfter - customersBefore);
    var extraRevenue     = extraCustomers * customerVal;
    var netGain          = extraRevenue - investment;
    var roiPercent        = investment > 0 ? (netGain / investment) * 100 : 0;

    if (resCustomersBefore) resCustomersBefore.textContent = fmtNum(customersBefore, 1);
    if (resCustomersAfter)  resCustomersAfter.textContent  = fmtNum(customersAfter, 1);
    if (resExtraRevenue)    resExtraRevenue.textContent    = fmtEUR(extraRevenue) + ' / Monat';
    if (resNetGain) {
      resNetGain.textContent = (netGain >= 0 ? '+' : '') + fmtEUR(netGain) + ' / Monat';
    }
    if (resRoiPercent) resRoiPercent.textContent = (roiPercent >= 0 ? '+' : '') + fmtNum(roiPercent) + '%';
  }

  [visitorsEl, convRateEl, customerValEl, upliftEl, investEl].forEach(function (el) {
    if (el) el.addEventListener('input', calculate);
  });

  calculate();
})();
