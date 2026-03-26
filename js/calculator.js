/**
 * VacatAd Business Rates Calculator 2026/27
 * Depends on: calculator-data.js (must be loaded first)
 */

function getMultiplier(rateableValue, isRHL) {
  const { multipliers, thresholds } = RATES_CONFIG;
  if (rateableValue >= thresholds.largePropertyFloor) {
    return { multiplier: multipliers.large, label: "Large property (50.8p)" };
  }
  if (rateableValue < thresholds.smallBusinessCeiling) {
    return isRHL
      ? { multiplier: multipliers.smallBusinessRHL, label: "Small business RHL (38.2p)" }
      : { multiplier: multipliers.smallBusinessNonRHL, label: "Small business (43.2p)" };
  }
  return isRHL
    ? { multiplier: multipliers.standardRHL, label: "Standard RHL (43.0p)" }
    : { multiplier: multipliers.standardNonRHL, label: "Standard (48.0p)" };
}

function calculatePreviousBill(oldRV) {
  if (!oldRV || oldRV <= 0) return null;
  const prev = RATES_CONFIG.previousYear;
  const multiplier = oldRV < prev.smallBusinessCeiling
    ? prev.smallBusinessMultiplier
    : prev.standardMultiplier;
  return Math.round(oldRV * multiplier * 100) / 100;
}

function calculateBasicBill(rateableValue, multiplier) {
  return rateableValue * multiplier;
}

function calculateSBRR(rateableValue, isSoleProperty) {
  if (!isSoleProperty) return { reliefPercent: 0, reliefAmount: 0 };
  const { fullReliefCeiling, partialReliefCeiling } = RATES_CONFIG.sbrr;
  if (rateableValue <= fullReliefCeiling) {
    return { reliefPercent: 100, reliefAmount: null };
  }
  if (rateableValue < partialReliefCeiling) {
    const reliefPercent =
      ((partialReliefCeiling - rateableValue) /
        (partialReliefCeiling - fullReliefCeiling)) * 100;
    return { reliefPercent: Math.round(reliefPercent * 100) / 100, reliefAmount: null };
  }
  return { reliefPercent: 0, reliefAmount: 0 };
}

function calculatePubsRelief(billAfterSBRR, isPubOrVenue, rateableValue) {
  if (!isPubOrVenue || rateableValue >= RATES_CONFIG.thresholds.largePropertyFloor) return 0;
  return billAfterSBRR * RATES_CONFIG.pubsRelief.percentage;
}

function calculateTransitionalRelief(newBill, previousBill, rateableValue, isLondon) {
  if (!previousBill || previousBill <= 0 || newBill <= previousBill) {
    return { applies: false, cappedBill: newBill };
  }
  const tr = RATES_CONFIG.transitionalRelief.year1;
  const smallCeiling = isLondon ? tr.small.rvCeilingLondon : tr.small.rvCeiling;
  var capPercent;
  if (rateableValue <= smallCeiling) {
    capPercent = tr.small.cap;
  } else if (rateableValue <= tr.medium.rvCeiling) {
    capPercent = tr.medium.cap;
  } else {
    capPercent = tr.large.cap;
  }
  var maxAllowedBill = previousBill * (1 + capPercent);
  if (newBill > maxAllowedBill) {
    return {
      applies: true,
      cappedBill: Math.round(maxAllowedBill * 100) / 100,
      saving: Math.round((newBill - maxAllowedBill) * 100) / 100,
      capPercent: capPercent * 100,
    };
  }
  return { applies: false, cappedBill: newBill };
}

function calculateSSBRelief(newBill, previousBill, lostRelief, rateableValue, isLondon) {
  if (!lostRelief || !previousBill || previousBill <= 0) {
    return { applies: false, cappedBill: newBill };
  }
  const tr = RATES_CONFIG.transitionalRelief.year1;
  const smallCeiling = isLondon ? tr.small.rvCeilingLondon : tr.small.rvCeiling;
  var capPercent;
  if (rateableValue <= smallCeiling) {
    capPercent = tr.small.cap;
  } else if (rateableValue <= tr.medium.rvCeiling) {
    capPercent = tr.medium.cap;
  } else {
    capPercent = tr.large.cap;
  }
  var trCap = previousBill * capPercent;
  var maxIncrease = Math.max(RATES_CONFIG.ssb.annualCap, trCap);
  var maxAllowedBill = previousBill + maxIncrease;
  if (newBill > maxAllowedBill) {
    return {
      applies: true,
      cappedBill: Math.round(maxAllowedBill * 100) / 100,
      saving: Math.round((newBill - maxAllowedBill) * 100) / 100,
      maxIncrease: Math.round(maxIncrease * 100) / 100,
    };
  }
  return { applies: false, cappedBill: newBill };
}

function calculateTRSupplement(rateableValue, receivingTR, receivingSSB) {
  if (receivingTR || receivingSSB) return 0;
  return rateableValue * RATES_CONFIG.transitionalSupplement.pencePerPound;
}

function calculateVacatAdFee(rateableValue, annualBill) {
  const tier = RATES_CONFIG.vacatadFees.find(function(t) { return rateableValue < t.rvCeiling; });
  var feePercent = tier ? tier.feePercent : 10;
  return {
    feePercent: feePercent,
    feeAmount: Math.round(annualBill * (feePercent / 100) * 100) / 100,
  };
}

function calculateBusinessRates(inputs) {
  var result = { inputs: Object.assign({}, inputs), steps: {} };

  var multiplierData = getMultiplier(inputs.rateableValue, inputs.isRHL);
  result.steps.multiplier = { value: multiplierData.multiplier, label: multiplierData.label };

  var basicBill = calculateBasicBill(inputs.rateableValue, multiplierData.multiplier);
  result.steps.basicBill = Math.round(basicBill * 100) / 100;

  var sbrr = calculateSBRR(inputs.rateableValue, inputs.isSoleProperty);
  var billAfterSBRR = basicBill;
  if (sbrr.reliefPercent > 0) {
    billAfterSBRR = basicBill * (1 - sbrr.reliefPercent / 100);
  }
  billAfterSBRR = Math.round(billAfterSBRR * 100) / 100;
  result.steps.sbrr = Object.assign({}, sbrr, { billAfterSBRR: billAfterSBRR });

  var pubsReliefAmount = calculatePubsRelief(billAfterSBRR, inputs.isPubOrVenue, inputs.rateableValue);
  var billAfterPubs = Math.round((billAfterSBRR - pubsReliefAmount) * 100) / 100;
  result.steps.pubsRelief = {
    applies: pubsReliefAmount > 0,
    amount: Math.round(pubsReliefAmount * 100) / 100,
    billAfterPubs: billAfterPubs,
  };

  var tr = calculateTransitionalRelief(billAfterPubs, inputs.previousBill, inputs.rateableValue, inputs.isLondon);
  result.steps.transitionalRelief = tr;
  var currentBill = tr.cappedBill;

  var ssb = calculateSSBRelief(currentBill, inputs.previousBill, inputs.lostRelief, inputs.rateableValue, inputs.isLondon);
  result.steps.ssbRelief = ssb;
  currentBill = ssb.applies ? ssb.cappedBill : currentBill;

  var supplement = calculateTRSupplement(inputs.rateableValue, tr.applies, ssb.applies);
  currentBill = Math.round((currentBill + supplement) * 100) / 100;
  result.steps.supplement = {
    applies: supplement > 0,
    amount: Math.round(supplement * 100) / 100,
  };

  result.annualBill = currentBill;
  result.monthlyBill = Math.round((currentBill / 12) * 100) / 100;

  result.vacatadFee = calculateVacatAdFee(inputs.rateableValue, currentBill);
  result.potentialAnnualSaving = currentBill;
  result.potentialNetSaving = Math.round((currentBill - result.vacatadFee.feeAmount) * 100) / 100;

  return result;
}


/* ── UI Logic ── */

document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("rates-calculator");
  var resultsPanel = document.getElementById("results");
  if (!form || !resultsPanel) return;

  // Progressive disclosure: show pub/venue field when RHL = yes
  var rhlRadios = document.querySelectorAll('input[name="isRHL"]');
  rhlRadios.forEach(function(r) {
    r.addEventListener("change", function () {
      document.getElementById("pubVenueGroup").style.display =
        this.value === "yes" ? "" : "none";
    });
  });

  // Show lost-relief field when previous RV is entered
  var prevRVInput = document.getElementById("previousRV");
  if (prevRVInput) {
    prevRVInput.addEventListener("input", function () {
      var group = document.getElementById("lostReliefGroup");
      if (group) {
        group.style.display = this.value && parseFloat(this.value) > 0 ? "" : "none";
      }
    });
  }

  // Format currency inputs on blur
  var currencyInputs = document.querySelectorAll('.calc-input-currency input[type="number"]');
  currencyInputs.forEach(function(input) {
    input.addEventListener("focus", function() {
      this.closest(".calc-input-currency").classList.add("focused");
    });
    input.addEventListener("blur", function() {
      this.closest(".calc-input-currency").classList.remove("focused");
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var rv = parseFloat(document.getElementById("rateableValue").value);
    if (!rv || rv <= 0) {
      showError("rateableValue", "Please enter a valid rateable value");
      return;
    }
    clearError("rateableValue");

    var getRadio = function(name) {
      var el = document.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value === "yes" : false;
    };

    var oldRV = parseFloat(document.getElementById("previousRV").value) || null;
    var previousBill = calculatePreviousBill(oldRV);

    var inputs = {
      rateableValue: rv,
      oldRV: oldRV,
      isRHL: getRadio("isRHL"),
      isSoleProperty: getRadio("isSoleProperty"),
      isPubOrVenue: getRadio("isPubOrVenue"),
      isLondon: getRadio("isLondon"),
      previousBill: previousBill,
      lostRelief: getRadio("lostRelief"),
    };

    var result = calculateBusinessRates(inputs);
    result.previousBillCalc = previousBill;
    result.oldRV = oldRV;
    displayResults(result);

    if (typeof gtag === "function") {
      gtag("event", "calculator_submit", {
        event_category: "engagement",
        event_label: "business_rates_2026",
        rv_band: rv < 51000 ? "small" : rv < 500000 ? "standard" : "large",
        annual_bill: result.annualBill,
      });
    }
  });

  function showError(inputId, message) {
    var input = document.getElementById(inputId);
    var group = input.closest(".calc-field");
    group.classList.add("has-error");
    var errEl = group.querySelector(".calc-error");
    if (errEl) errEl.textContent = message;
  }

  function clearError(inputId) {
    var input = document.getElementById(inputId);
    var group = input.closest(".calc-field");
    group.classList.remove("has-error");
  }

  function formatCurrency(amount) {
    return "£" + amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatCurrencyShort(amount) {
    if (amount >= 1000) {
      return "£" + (amount / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return "£" + Math.round(amount);
  }

  function animateValue(el, start, end, duration) {
    var startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = start + (end - start) * eased;
      el.textContent = formatCurrency(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function displayResults(result) {
    var s = result.steps;

    document.getElementById("res-rv").textContent = formatCurrency(result.inputs.rateableValue);
    document.getElementById("res-multiplier").textContent = s.multiplier.label;
    document.getElementById("res-basic").textContent = formatCurrency(s.basicBill);

    // Old bill comparison
    var comparisonRow = document.getElementById("row-old-bill");
    if (result.previousBillCalc && result.previousBillCalc > 0) {
      comparisonRow.style.display = "flex";
      document.getElementById("res-old-bill").textContent = formatCurrency(result.previousBillCalc);
      var changePercent = ((result.annualBill - result.previousBillCalc) / result.previousBillCalc * 100).toFixed(1);
      var changeEl = document.getElementById("res-change");
      if (changeEl) {
        var prefix = result.annualBill > result.previousBillCalc ? "+" : "";
        changeEl.textContent = prefix + changePercent + "%";
        changeEl.className = result.annualBill > result.previousBillCalc ? "change-up" : "change-down";
      }
    } else {
      comparisonRow.style.display = "none";
    }

    // SBRR
    var rowSBRR = document.getElementById("row-sbrr");
    if (s.sbrr.reliefPercent > 0) {
      rowSBRR.style.display = "flex";
      document.getElementById("res-sbrr").textContent =
        "-" + formatCurrency(s.basicBill - s.sbrr.billAfterSBRR) +
        " (" + s.sbrr.reliefPercent.toFixed(1) + "%)";
    } else {
      rowSBRR.style.display = "none";
    }

    // Pubs
    var rowPubs = document.getElementById("row-pubs");
    if (s.pubsRelief.applies) {
      rowPubs.style.display = "flex";
      document.getElementById("res-pubs").textContent = "-" + formatCurrency(s.pubsRelief.amount);
    } else {
      rowPubs.style.display = "none";
    }

    // Transitional
    var rowTR = document.getElementById("row-tr");
    if (s.transitionalRelief.applies) {
      rowTR.style.display = "flex";
      document.getElementById("res-tr").textContent =
        "-" + formatCurrency(s.transitionalRelief.saving) +
        " (capped at " + s.transitionalRelief.capPercent + "%)";
    } else {
      rowTR.style.display = "none";
    }

    // SSB
    var rowSSB = document.getElementById("row-ssb");
    if (s.ssbRelief.applies) {
      rowSSB.style.display = "flex";
      document.getElementById("res-ssb").textContent = "-" + formatCurrency(s.ssbRelief.saving);
    } else {
      rowSSB.style.display = "none";
    }

    // Supplement
    var rowSupplement = document.getElementById("row-supplement");
    if (s.supplement.applies) {
      rowSupplement.style.display = "flex";
      document.getElementById("res-supplement").textContent = "+" + formatCurrency(s.supplement.amount);
    } else {
      rowSupplement.style.display = "none";
    }

    // Totals with animation
    animateValue(document.getElementById("res-annual"), 0, result.annualBill, 800);
    animateValue(document.getElementById("res-monthly"), 0, result.monthlyBill, 800);

    // VacatAd savings
    animateValue(document.getElementById("res-saving"), 0, result.potentialAnnualSaving, 1000);
    document.getElementById("res-fee-percent").textContent = result.vacatadFee.feePercent;
    animateValue(document.getElementById("res-fee-amount"), 0, result.vacatadFee.feeAmount, 800);
    animateValue(document.getElementById("res-net-saving"), 0, result.potentialNetSaving, 1200);
    document.getElementById("res-monthly-saving").textContent = formatCurrency(Math.round(result.potentialNetSaving / 12 * 100) / 100);

    resultsPanel.style.display = "block";
    resultsPanel.classList.add("animate-in");
    setTimeout(function() {
      resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    // CTA tracking
    var ctaBtn = document.getElementById("calc-cta-btn");
    if (ctaBtn) {
      ctaBtn.onclick = function() {
        if (typeof gtag === "function") {
          gtag("event", "calculator_cta_click", {
            event_category: "engagement",
            annual_bill: result.annualBill,
            vacatad_fee: result.vacatadFee.feeAmount,
          });
        }
      };
    }
  }
});
