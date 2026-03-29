/**
 * VacatAd Batch Calculator 2026/27
 * Lets users add multiple properties and generate a portfolio PDF report.
 * Depends on: calculator-data.js, calculator.js (for calculateBusinessRates etc.)
 */
(function () {
  "use strict";

  var API_URL = "https://vacatad-voa-lookup.vacatad.workers.dev";
  var batchProperties = []; // Array of { prop, result }

  /* ── DOM refs (set on DOMContentLoaded) ── */
  var modeTabs, singleMode, batchMode;
  var batchSearch, batchSearchBtn, batchResults;
  var batchList, batchTotals, batchGenerateBtn;
  var batchController = null;
  var batchSearchMode = "postcode"; // "postcode" or "address"

  document.addEventListener("DOMContentLoaded", function () {
    modeTabs        = document.querySelectorAll(".calc-mode-tab");
    singleMode      = document.getElementById("singleMode");
    batchMode       = document.getElementById("batchMode");
    batchSearch     = document.getElementById("batchPostcodeSearch");
    batchSearchBtn  = document.getElementById("batchSearchBtn");
    batchResults    = document.getElementById("batchResults");
    batchList       = document.getElementById("batchPropertyList");
    batchTotals     = document.getElementById("batchTotals");
    batchGenerateBtn = document.getElementById("batchGenerateReport");

    if (!batchMode) return;

    initModeTabs();
    initBatchSearch();
    batchGenerateBtn.addEventListener("click", function () {
      if (batchProperties.length > 0 && !batchGenerateBtn.disabled) {
        batchGenerateBtn.disabled = true;
        batchGenerateBtn.textContent = "Generating\u2026";
        generateReport().finally(function () {
          batchGenerateBtn.disabled = false;
          batchGenerateBtn.textContent = "Generate Portfolio Report (PDF)";
        });
      }
    });
  });

  /* ═══════════════════════════════════════════
     MODE TABS
     ═══════════════════════════════════════════ */

  function initModeTabs() {
    modeTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        modeTabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        var mode = tab.getAttribute("data-mode");
        singleMode.style.display = mode === "single" ? "" : "none";
        batchMode.style.display  = mode === "batch"  ? "" : "none";
      });
    });
  }

  /* ═══════════════════════════════════════════
     BATCH POSTCODE SEARCH
     ═══════════════════════════════════════════ */

  function initBatchSearch() {
    batchSearchBtn.addEventListener("click", doBatchSearch);
    batchSearch.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); doBatchSearch(); }
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest("#batch-postcode-field")) {
        batchResults.style.display = "none";
        batchResults.innerHTML = "";
      }
    });

    // Search mode toggle
    var toggleBtns = document.querySelectorAll("#batchSearchModeToggle .calc-mode-btn");
    toggleBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        toggleBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        batchSearchMode = btn.getAttribute("data-mode");
        batchSearch.value = "";
        batchResults.style.display = "none";
        batchResults.innerHTML = "";
        batchSearch.placeholder = batchSearchMode === "address"
          ? "Search by address, e.g. Power Road London"
          : "Enter postcode, e.g. SW1A 1AA";
        batchSearch.focus();
      });
    });
  }

  function doBatchSearch() {
    var raw = batchSearch.value.trim();
    if (!raw) return;

    var url;
    if (batchSearchMode === "address") {
      if (raw.length < 4) return;
      url = API_URL + "/api/lookup?q=" + encodeURIComponent(raw);
    } else {
      var postcode = raw.toUpperCase().replace(/[^A-Z0-9\s]/g, "");
      if (postcode.length < 3) return;
      url = API_URL + "/api/lookup?postcode=" + encodeURIComponent(postcode);
    }

    var loadingMsg = batchSearchMode === "address"
      ? "Searching VOA rating list by address\u2026"
      : "Searching VOA rating list\u2026";
    batchResults.innerHTML = '<div class="calc-search-loading">' + loadingMsg + '</div>';
    batchResults.style.display = "block";

    if (batchController) batchController.abort();
    batchController = new AbortController();

    fetch(url, { signal: batchController.signal })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        batchController = null;
        if (data.properties && data.properties.length > 0) {
          showBatchResults(data.properties);
        } else {
          var hint = batchSearchMode === "address"
            ? "Try a different address or switch to postcode search."
            : "Check the postcode and try again.";
          batchResults.innerHTML = '<div class="calc-search-empty">No properties found for <strong>' + esc(raw) + '</strong>. ' + hint + '</div>';
        }
      })
      .catch(function (err) {
        batchController = null;
        if (err.name !== "AbortError") {
          batchResults.innerHTML = '<div class="calc-search-empty">Search error. Please try again.</div>';
        }
      });
  }

  var lastBatchResults = null; // Store for client-side filtering

  function showBatchResults(properties) {
    lastBatchResults = properties;

    // Build filter input (shown when 3+ results)
    var filterHtml = "";
    if (properties.length >= 3) {
      filterHtml =
        '<div class="calc-results-filter">' +
          '<input type="text" id="batchResultsFilter" class="calc-results-filter-input" ' +
            'placeholder="Filter ' + properties.length + ' results by address or type\u2026" autocomplete="off">' +
          '<span class="calc-results-count" id="batchResultsCount">' + properties.length + ' properties</span>' +
        '</div>';
    }

    var itemsHtml = buildBatchResultItems(properties);

    batchResults.innerHTML = filterHtml + '<div id="batchResultsWrap">' + itemsHtml + '</div>';
    batchResults.style.display = "block";

    bindBatchResultClicks(properties);

    // Bind filter input
    var filterInput = document.getElementById("batchResultsFilter");
    if (filterInput) {
      filterInput.addEventListener("input", function () {
        filterBatchResults(this.value.trim());
      });
      filterInput.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
  }

  function buildBatchResultItems(properties) {
    var html = "";
    properties.forEach(function (prop, index) {
      var rv23 = prop.rv_2023 ? "\u00A3" + Number(prop.rv_2023).toLocaleString("en-GB") : "N/A";
      var rv26 = prop.rv_2026 ? "\u00A3" + Number(prop.rv_2026).toLocaleString("en-GB") : "N/A";
      var badge = "";
      if (prop.is_rhl) badge = '<span class="calc-search-result-type rhl">RHL</span>';
      else if (prop.is_industrial) badge = '<span class="calc-search-result-type industrial">Industrial</span>';

      var added = batchProperties.some(function (bp) { return bp.prop.uarn === prop.uarn; });

      html +=
        '<button type="button" class="calc-search-result-item' + (added ? ' already-added' : '') + '" data-index="' + index + '"' + (added ? ' disabled' : '') + '>' +
          '<div class="calc-search-result-address">' + esc(prop.full_address) + (added ? ' <span class="batch-added-badge">Added</span>' : '') + '</div>' +
          '<div class="calc-search-result-meta">' +
            (prop.postcode ? '<span>' + esc(prop.postcode) + '</span>' : '') +
            '<span>2023: <span class="calc-search-result-rv">' + rv23 + '</span></span>' +
            '<span>2026: <span class="calc-search-result-rv">' + rv26 + '</span></span>' +
            '<span>' + esc(prop.description_text) + '</span>' +
            badge +
          '</div>' +
        '</button>';
    });
    return html;
  }

  function bindBatchResultClicks(properties) {
    batchResults.querySelectorAll(".calc-search-result-item:not(.already-added)").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-index"), 10);
        addToBatch(properties[idx]);
        btn.classList.add("already-added");
        btn.disabled = true;
        var addr = btn.querySelector(".calc-search-result-address");
        if (addr) addr.innerHTML += ' <span class="batch-added-badge">Added</span>';
      });
    });
  }

  function filterBatchResults(query) {
    if (!lastBatchResults) return;

    var listWrap = document.getElementById("batchResultsWrap");
    var countEl  = document.getElementById("batchResultsCount");
    if (!listWrap) return;

    if (!query) {
      listWrap.innerHTML = buildBatchResultItems(lastBatchResults);
      bindBatchResultClicks(lastBatchResults);
      if (countEl) countEl.textContent = lastBatchResults.length + " properties";
      return;
    }

    var phrase = query.toUpperCase();
    var filtered = [];
    var filteredIndices = [];

    lastBatchResults.forEach(function (prop, index) {
      var haystack = [
        prop.full_address || "",
        prop.firm_name || "",
        prop.description_text || "",
        prop.description_code || ""
      ].join(" ").toUpperCase();

      if (haystack.indexOf(phrase) !== -1) {
        filtered.push(prop);
        filteredIndices.push(index);
      }
    });

    if (filtered.length === 0) {
      listWrap.innerHTML = '<div class="calc-search-empty">No matching properties. Try a different filter.</div>';
      if (countEl) countEl.textContent = "0 of " + lastBatchResults.length;
    } else {
      var html = "";
      filtered.forEach(function (prop, i) {
        var rv23 = prop.rv_2023 ? "\u00A3" + Number(prop.rv_2023).toLocaleString("en-GB") : "N/A";
        var rv26 = prop.rv_2026 ? "\u00A3" + Number(prop.rv_2026).toLocaleString("en-GB") : "N/A";
        var badge = "";
        if (prop.is_rhl) badge = '<span class="calc-search-result-type rhl">RHL</span>';
        else if (prop.is_industrial) badge = '<span class="calc-search-result-type industrial">Industrial</span>';

        var added = batchProperties.some(function (bp) { return bp.prop.uarn === prop.uarn; });

        html +=
          '<button type="button" class="calc-search-result-item' + (added ? ' already-added' : '') + '" data-index="' + filteredIndices[i] + '"' + (added ? ' disabled' : '') + '>' +
            '<div class="calc-search-result-address">' + esc(prop.full_address) + (added ? ' <span class="batch-added-badge">Added</span>' : '') + '</div>' +
            '<div class="calc-search-result-meta">' +
              (prop.postcode ? '<span>' + esc(prop.postcode) + '</span>' : '') +
              '<span>2023: <span class="calc-search-result-rv">' + rv23 + '</span></span>' +
              '<span>2026: <span class="calc-search-result-rv">' + rv26 + '</span></span>' +
              '<span>' + esc(prop.description_text) + '</span>' +
              badge +
            '</div>' +
          '</button>';
      });

      listWrap.innerHTML = html;
      bindBatchResultClicks(lastBatchResults);
      if (countEl) countEl.textContent = filtered.length + " of " + lastBatchResults.length;
    }
  }

  /* ═══════════════════════════════════════════
     BATCH LIST MANAGEMENT
     ═══════════════════════════════════════════ */

  function addToBatch(prop) {
    if (batchProperties.some(function (bp) { return bp.prop.uarn === prop.uarn; })) return;

    var previousBill = calculatePreviousBill(prop.rv_2023 || 0);
    var inputs = {
      rateableValue:  prop.rv_2026 || 0,
      oldRV:          prop.rv_2023 || null,
      isRHL:          prop.is_rhl || false,
      isSoleProperty: false,
      isPubOrVenue:   prop.is_pub_venue || false,
      isIndustrial:   prop.is_industrial || false,
      isLondon:       prop.is_london || false,
      previousBill:   previousBill,
      lostRelief:     false,
    };

    var result = calculateBusinessRates(inputs);
    result.previousBillCalc = previousBill;
    result.oldRV = prop.rv_2023;

    // Enforce minimum fee for batch: floor at £500
    var minFee = RATES_CONFIG.minimumFee || 500;
    if (result.vacatadFee.belowMinimum) {
      result.vacatadFee.feeAmount = minFee;
      result.potentialNetSaving = Math.round((result.potentialAnnualSaving - minFee) * 100) / 100;
      if (result.potentialNetSaving < 0) result.potentialNetSaving = 0;
    }

    batchProperties.push({ prop: prop, result: result });
    renderBatchList();
    updateBatchTotals();

    if (typeof gtag === "function") {
      gtag("event", "batch_property_added", {
        event_category: "engagement",
        batch_size: batchProperties.length,
      });
    }
  }

  function removeFromBatch(index) {
    batchProperties.splice(index, 1);
    renderBatchList();
    updateBatchTotals();
  }

  function recalcBatchItem(index) {
    var item = batchProperties[index];
    var prop = item.prop;
    var previousBill = calculatePreviousBill(prop.rv_2023 || 0);
    var inputs = {
      rateableValue:  prop.rv_2026 || 0,
      oldRV:          prop.rv_2023 || null,
      isRHL:          prop.is_rhl || false,
      isSoleProperty: false,
      isPubOrVenue:   prop.is_pub_venue || false,
      isIndustrial:   prop.is_industrial || false,
      isLondon:       prop.is_london || false,
      previousBill:   previousBill,
      lostRelief:     false,
    };
    var result = calculateBusinessRates(inputs);
    result.previousBillCalc = previousBill;
    result.oldRV = prop.rv_2023;

    var minFee = RATES_CONFIG.minimumFee || 500;
    if (result.vacatadFee.belowMinimum) {
      result.vacatadFee.feeAmount = minFee;
      result.potentialNetSaving = Math.round((result.potentialAnnualSaving - minFee) * 100) / 100;
      if (result.potentialNetSaving < 0) result.potentialNetSaving = 0;
    }

    item.result = result;
    renderBatchList();
    updateBatchTotals();
  }

  function renderBatchList() {
    if (batchProperties.length === 0) {
      batchList.innerHTML = '<div class="batch-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg><p>Search by postcode or address above and click a property to add it to your batch.</p></div>';
      batchGenerateBtn.disabled = true;
      batchTotals.style.display = "none";
      return;
    }

    var html = '';
    batchProperties.forEach(function (item, i) {
      var prop = item.prop;
      var result = item.result;
      var rv26 = prop.rv_2026 ? "\u00A3" + Number(prop.rv_2026).toLocaleString("en-GB") : "N/A";

      var badges = "";
      if (prop.is_rhl) badges += '<span class="batch-type-badge rhl">RHL</span>';
      else if (prop.is_industrial) badges += '<span class="batch-type-badge industrial">Industrial</span>';
      if (prop.is_london) badges += '<span class="batch-type-badge london">London</span>';

      html +=
        '<div class="batch-item">' +
          '<div class="batch-item-header">' +
            '<div class="batch-item-info">' +
              '<div class="batch-item-address">' + esc(prop.full_address) + '</div>' +
              '<div class="batch-item-meta">' +
                (prop.postcode ? '<span class="batch-item-postcode">' + esc(prop.postcode) + '</span>' : '') +
                badges +
                '<span class="batch-item-desc">' + esc(prop.description_text) + '</span>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="batch-item-remove" data-index="' + i + '" aria-label="Remove property">&times;</button>' +
          '</div>' +
          '<div class="batch-item-toggles">' +
            '<label class="batch-inline-toggle">' +
              '<input type="checkbox" data-index="' + i + '" data-field="industrial"' + (prop.is_industrial ? ' checked' : '') + '>' +
              'Industrial' +
            '</label>' +
          '</div>' +
          '<div class="batch-item-figures">' +
            '<div class="batch-figure"><span class="batch-figure-label">RV 2026</span><span class="batch-figure-value">' + rv26 + '</span></div>' +
            '<div class="batch-figure"><span class="batch-figure-label">Annual Bill</span><span class="batch-figure-value">\u00A3' + result.annualBill.toLocaleString("en-GB", { minimumFractionDigits: 2 }) + '</span></div>' +
            '<div class="batch-figure"><span class="batch-figure-label">Net Saving</span><span class="batch-figure-value batch-figure-green">\u00A3' + result.potentialNetSaving.toLocaleString("en-GB", { minimumFractionDigits: 2 }) + '</span></div>' +
          '</div>' +
        '</div>';
    });

    batchList.innerHTML = html;
    batchGenerateBtn.disabled = false;
    batchTotals.style.display = "";

    batchList.querySelectorAll(".batch-item-remove").forEach(function (btn) {
      btn.addEventListener("click", function () {
        removeFromBatch(parseInt(this.getAttribute("data-index"), 10));
      });
    });

    batchList.querySelectorAll('.batch-inline-toggle input').forEach(function (cb) {
      cb.addEventListener("change", function () {
        var idx = parseInt(this.getAttribute("data-index"), 10);
        var field = this.getAttribute("data-field");
        if (field === "industrial") {
          batchProperties[idx].prop.is_industrial = this.checked;
          recalcBatchItem(idx);
        }
      });
    });
  }

  function updateBatchTotals() {
    var count = batchProperties.length;
    var totalRV = 0, totalBill = 0, totalSaving = 0;
    batchProperties.forEach(function (item) {
      totalRV     += item.prop.rv_2026 || 0;
      totalBill   += item.result.annualBill || 0;
      totalSaving += item.result.potentialNetSaving || 0;
    });
    document.getElementById("batchCount").textContent      = count;
    document.getElementById("batchTotalRV").textContent     = "\u00A3" + totalRV.toLocaleString("en-GB");
    document.getElementById("batchTotalBill").textContent   = "\u00A3" + totalBill.toLocaleString("en-GB", { minimumFractionDigits: 2 });
    document.getElementById("batchTotalSaving").textContent = "\u00A3" + totalSaving.toLocaleString("en-GB", { minimumFractionDigits: 2 });
  }

  /* ═══════════════════════════════════════════
     PDF REPORT GENERATION (jsPDF + AutoTable)
     ═══════════════════════════════════════════ */

  /* Brand colours */
  var BC = {
    dark:   [26, 28, 26],
    mint:   [219, 244, 204],
    teal:   [90, 184, 187],
    green:  [34, 120, 34],
    white:  [255, 255, 255],
    off:    [248, 249, 248],
    grey:   [100, 100, 100],
    ltGrey: [160, 160, 160],
  };

  async function generateReport() {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF("p", "mm", "a4");
    var pw = 210, ph = 297, m = 18;
    var cw = pw - m * 2;

    var gateData = null;
    try { gateData = JSON.parse(localStorage.getItem("vacatad_gate_v1")); } catch (e) {}
    var userName    = gateData ? gateData.name    : "";
    var userCompany = gateData ? gateData.company : "";
    var userEmail   = gateData ? gateData.email   : "";

    var totalRV = 0, totalBill = 0, totalGross = 0, totalFee = 0, totalNet = 0;
    batchProperties.forEach(function (item) {
      totalRV    += item.prop.rv_2026 || 0;
      totalBill  += item.result.annualBill || 0;
      totalGross += item.result.potentialAnnualSaving || 0;
      totalFee   += item.result.vacatadFee.feeAmount || 0;
      totalNet   += item.result.potentialNetSaving || 0;
    });

    var quoteNumber = "";
    try {
      var payload = {
        email: userEmail, name: userName, company: userCompany,
        total_rv: totalRV, total_bill: totalBill, total_net: totalNet,
        properties: batchProperties.map(function (item) {
          return {
            address: item.prop.full_address || "", postcode: item.prop.postcode || "",
            description_code: item.prop.description_code || "", rv_2026: item.prop.rv_2026 || 0,
            annual_bill: item.result.annualBill || 0, net_saving: item.result.potentialNetSaving || 0,
          };
        }),
      };
      var res = await fetch(API_URL + "/api/batch-report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      var data = await res.json();
      if (data.quote_number) quoteNumber = data.quote_number;
    } catch (e) {}

    var dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    /* ── Shared helpers ── */
    function pageHeader(leftText, rightText) {
      doc.setFillColor.apply(doc, BC.dark);
      doc.rect(0, 0, pw, 16, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      doc.text(leftText, m, 10.5);
      doc.text(rightText, pw - m, 10.5, { align: "right" });
    }

    function sectionHead(title, y) {
      doc.setFillColor.apply(doc, BC.mint);
      doc.rect(m, y - 5, 3, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor.apply(doc, BC.dark);
      doc.text(title, m + 8, y);
      return y + 9;
    }

    /* ══════════════════════════════════════════════════
       PAGE 1: COVER
       ══════════════════════════════════════════════════ */
    doc.setFillColor.apply(doc, BC.dark);
    doc.rect(0, 0, pw, 80, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(34);
    doc.setTextColor.apply(doc, BC.mint);
    doc.text("VacatAd", m, 32);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(180, 180, 180);
    doc.text("Business Rates Specialists  |  vacatad.com", m, 44);

    if (quoteNumber) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor.apply(doc, BC.mint);
      doc.text(quoteNumber, pw - m, 32, { align: "right" });
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text("0333 090 0443  |  hello@vacatad.com", pw - m, 44, { align: "right" });

    doc.setFillColor.apply(doc, BC.mint);
    doc.rect(0, 80, pw, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor.apply(doc, BC.dark);
    doc.text("Portfolio Business Rates", m, 106);
    doc.text("Report 2026/27", m, 118);

    var y = 136;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor.apply(doc, BC.grey);
    doc.text("PREPARED FOR", m, y);
    doc.setDrawColor.apply(doc, BC.mint);
    doc.setLineWidth(0.5);
    doc.line(m, y + 3, m + 42, y + 3);

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor.apply(doc, BC.dark);
    doc.text(userName || "Property Portfolio", m, y);
    if (userCompany) {
      y += 9;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.setTextColor(80, 80, 80);
      doc.text(userCompany, m, y);
    }
    if (userEmail) {
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor.apply(doc, BC.grey);
      doc.text(userEmail, m, y);
    }
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor.apply(doc, BC.grey);
    doc.text(dateStr, m, y);

    // ── Executive summary stat boxes ──
    var boxY = 200;
    var boxW = (cw - 12) / 4;
    var stats = [
      { label: "Properties",        value: String(batchProperties.length), green: false },
      { label: "Total RV (2026)",   value: cur(totalRV),   green: false },
      { label: "Total Annual Bill", value: cur(totalBill),  green: false },
      { label: "Est. Net Saving",   value: cur(totalNet),  green: true },
    ];
    stats.forEach(function (stat, i) {
      var x = m + i * (boxW + 4);
      doc.setFillColor.apply(doc, stat.green ? BC.dark : BC.off);
      doc.roundedRect(x, boxY, boxW, 44, 3, 3, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(stat.green ? 180 : 120);
      doc.text(stat.label.toUpperCase(), x + boxW / 2, boxY + 14, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(stat.green ? 16 : 15);
      doc.setTextColor.apply(doc, stat.green ? BC.mint : BC.dark);
      doc.text(stat.value, x + boxW / 2, boxY + 32, { align: "center" });
    });

    // CTA bar
    var ctaY = 258;
    doc.setFillColor.apply(doc, BC.teal);
    doc.roundedRect(m, ctaY, cw, 16, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor.apply(doc, BC.white);
    doc.textWithLink("Ready to start saving?  vacatad.com/contact  |  0333 090 0443", pw / 2, ctaY + 10.5, { align: "center", url: "https://vacatad.com/contact" });

    doc.setFontSize(7);
    doc.setTextColor.apply(doc, BC.ltGrey);
    doc.text("Estimates based on 2026/27 multipliers and published relief schemes. This report does not constitute financial advice.", m, ph - 7);

    /* ══════════════════════════════════════════════════
       PAGE 2: PORTFOLIO SUMMARY TABLE
       ══════════════════════════════════════════════════ */
    doc.addPage();
    pageHeader("Portfolio Summary", quoteNumber || "vacatad.com");

    var sy = sectionHead("Portfolio Overview", 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor.apply(doc, BC.grey);
    doc.text(batchProperties.length + " properties   |   2026/27 financial year   |   " + dateStr, m + 8, sy);

    var tableBody = batchProperties.map(function (item, i) {
      var type = item.prop.is_rhl ? "RHL" : item.prop.is_industrial ? "Ind." : "Std";
      return [
        String(i + 1),
        trunc(item.prop.full_address, 36),
        type,
        cur(item.prop.rv_2026 || 0),
        cur(item.result.annualBill),
        cur(item.result.potentialAnnualSaving),
        cur(item.result.potentialNetSaving),
      ];
    });
    tableBody.push(["", "PORTFOLIO TOTAL", "", cur(totalRV), cur(totalBill), cur(totalGross), cur(totalNet)]);

    doc.autoTable({
      startY: sy + 7,
      margin: { left: m, right: m },
      head: [["#", "Property Address", "Type", "RV 2026", "Annual Bill", "Gross Saving", "Net Saving"]],
      body: tableBody,
      headStyles: { fillColor: BC.dark, textColor: BC.mint, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [50, 50, 50], cellPadding: 3 },
      alternateRowStyles: { fillColor: BC.off },
      columnStyles: {
        0: { cellWidth: 9, halign: "center" },
        2: { cellWidth: 14, halign: "center" },
        3: { cellWidth: 24, halign: "right" },
        4: { cellWidth: 24, halign: "right" },
        5: { cellWidth: 26, halign: "right" },
        6: { cellWidth: 24, halign: "right" },
      },
      didParseCell: function (data) {
        if (data.row.index === tableBody.length - 1 && data.section === "body") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = BC.dark;
          data.cell.styles.textColor = BC.white;
        }
        if (data.column.index === 6 && data.section === "body" && data.row.index < tableBody.length - 1) {
          data.cell.styles.textColor = BC.green;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    var keyY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("RHL = Retail, Hospitality & Leisure   |   Ind. = Industrial   |   Std = Standard multiplier   |   Net Saving = after VacatAd fee", m, keyY);

    /* ══════════════════════════════════════════════════
       PAGES 3+: PER-PROPERTY BREAKDOWNS
       ══════════════════════════════════════════════════ */
    batchProperties.forEach(function (item, i) {
      doc.addPage();
      drawPropertyPage(doc, item, i + 1, m, cw, pw, quoteNumber);
    });

    /* ══════════════════════════════════════════════════
       HOW VACATAD WORKS PAGE
       ══════════════════════════════════════════════════ */
    doc.addPage();
    pageHeader("How VacatAd Works", quoteNumber || "vacatad.com");

    var hy = sectionHead("Our Process", 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(80, 80, 80);
    var introLines = doc.splitTextToSize(
      "VacatAd helps commercial landlords legally reduce business rates on vacant properties through compliant beneficial occupation using plug-and-play Wi-Fi technology. With a 100% relief success rate across 250+ UK properties, we deliver proven results.",
      cw - 8
    );
    doc.text(introLines, m + 8, hy);
    hy += introLines.length * 5.2 + 10;

    var steps = [
      { num: "01", title: "Free Assessment", desc: "We evaluate your property's business rates relief potential and provide a detailed savings estimate at no cost." },
      { num: "02", title: "Plug-and-Play Setup", desc: "Our secure Wi-Fi technology is installed rapidly and non-disruptively, typically operational within days." },
      { num: "03", title: "Beneficial Occupation", desc: "We create compliant occupation for the required period, resetting relief cycles and reducing holding costs." },
      { num: "04", title: "Compliance Evidence", desc: "Continuous monitoring produces documented proof of genuine occupation with a full audit trail." },
      { num: "05", title: "Ongoing Savings", desc: "Relief cycles are managed continuously. You receive regular reporting and our team handles everything." },
    ];

    steps.forEach(function (step) {
      doc.setFillColor.apply(doc, BC.dark);
      doc.circle(m + 8, hy + 2.5, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, BC.mint);
      doc.text(step.num, m + 8, hy + 4, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor.apply(doc, BC.dark);
      doc.text(step.title, m + 18, hy + 4);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      var dLines = doc.splitTextToSize(step.desc, cw - 20);
      doc.text(dLines, m + 18, hy + 11);
      hy += 11 + dLines.length * 5 + 8;
    });

    // Why Choose VacatAd
    hy += 4;
    doc.setFillColor.apply(doc, BC.mint);
    doc.rect(m, hy - 5, 3, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor.apply(doc, BC.dark);
    doc.text("Why Choose VacatAd", m + 8, hy);
    hy += 10;

    var whyItems = [
      { title: "Technology-First", desc: "Plug-and-play Wi-Fi routers with real-time monitoring" },
      { title: "100% Compliant", desc: "Fully aligned with VOA regulations and current case law" },
      { title: "Rapid Deployment", desc: "Go live in under a week from first call" },
      { title: "Proven Track Record", desc: "100% success rate across 250+ UK properties" },
    ];
    var whyBoxW = (cw - 8) / 2;
    whyItems.forEach(function (item, i) {
      var col = i % 2;
      var row = Math.floor(i / 2);
      var bx = m + col * (whyBoxW + 8);
      var by = hy + row * 28;
      doc.setFillColor.apply(doc, BC.off);
      doc.roundedRect(bx, by, whyBoxW, 24, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor.apply(doc, BC.dark);
      doc.text(item.title, bx + 6, by + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, BC.grey);
      doc.text(item.desc, bx + 6, by + 18);
    });

    /* ══════════════════════════════════════════════════
       FINAL PAGE: CTA / CONTACT
       ══════════════════════════════════════════════════ */
    doc.addPage();
    doc.setFillColor.apply(doc, BC.dark);
    doc.rect(0, 0, pw, ph, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(38);
    doc.setTextColor.apply(doc, BC.mint);
    doc.text("VacatAd", pw / 2, 80, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(200, 200, 200);
    doc.text("Business Rates Specialists", pw / 2, 94, { align: "center" });

    doc.setDrawColor.apply(doc, BC.mint);
    doc.setLineWidth(0.5);
    doc.line(pw / 2 - 30, 106, pw / 2 + 30, 106);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor.apply(doc, BC.white);
    doc.text("Ready to Reduce Your", pw / 2, 128, { align: "center" });
    doc.text("Business Rates?", pw / 2, 142, { align: "center" });

    if (totalNet > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(180, 180, 180);
      doc.text("Your portfolio could save an estimated", pw / 2, 160, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(30);
      doc.setTextColor.apply(doc, BC.mint);
      doc.text(cur(totalNet) + " per year", pw / 2, 176, { align: "center" });
    }

    var ctaBtnY = 196;
    doc.setFillColor.apply(doc, BC.teal);
    doc.roundedRect(pw / 2 - 55, ctaBtnY, 110, 18, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor.apply(doc, BC.white);
    doc.textWithLink("Get in Touch", pw / 2, ctaBtnY + 12, { align: "center", url: "https://vacatad.com/contact" });

    var cdY = 230;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(180, 180, 180);
    doc.textWithLink("vacatad.com/contact", pw / 2, cdY, { align: "center", url: "https://vacatad.com/contact" });
    doc.text("hello@vacatad.com  |  0333 090 0443", pw / 2, cdY + 12, { align: "center" });
    doc.text("86-90 Paul Street, London, EC2A 4NA", pw / 2, cdY + 24, { align: "center" });

    if (quoteNumber) {
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text("Quote Reference: " + quoteNumber, pw / 2, ph - 20, { align: "center" });
    }
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text("VacatAd Ltd  |  Company registered in England & Wales", pw / 2, ph - 10, { align: "center" });

    /* ── Page numbers (skip cover and final page) ── */
    var totalPages = doc.internal.getNumberOfPages();
    for (var p = 2; p < totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor.apply(doc, BC.ltGrey);
      doc.text(dateStr, m, ph - 7);
      doc.text("Page " + p + " of " + totalPages, pw / 2, ph - 7, { align: "center" });
      if (quoteNumber) doc.text(quoteNumber, pw - m, ph - 7, { align: "right" });
    }

    var fileName = quoteNumber ? "VacatAd-" + quoteNumber + ".pdf" : "VacatAd-Portfolio-Report-2026-27.pdf";
    doc.save(fileName);

    if (typeof gtag === "function") {
      gtag("event", "batch_report_generated", {
        event_category: "engagement",
        batch_size: batchProperties.length,
        total_net_saving: totalNet,
      });
    }
  }

  /* ══════════════════════════════════════════════════
     PER-PROPERTY APPENDIX PAGE
     ══════════════════════════════════════════════════ */
  function drawPropertyPage(doc, item, index, m, cw, pw, quoteNumber) {
    var prop   = item.prop;
    var result = item.result;
    var s      = result.steps;

    // Header ribbon
    doc.setFillColor.apply(doc, BC.dark);
    doc.rect(0, 0, pw, 16, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text("Property " + index + " of " + batchProperties.length, m, 10.5);
    doc.text(quoteNumber || "VacatAd Portfolio Report 2026/27", pw - m, 10.5, { align: "right" });

    // Address
    doc.setFillColor.apply(doc, BC.mint);
    doc.rect(m, 22, 3, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor.apply(doc, BC.dark);
    var titleLines = doc.splitTextToSize(prop.full_address, cw - 10);
    doc.text(titleLines, m + 8, 27);
    var metaY = 27 + titleLines.length * 6.5 + 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor.apply(doc, BC.grey);
    var meta = [prop.description_text, prop.postcode];
    if (prop.is_rhl) meta.push("Retail, Hospitality & Leisure");
    if (prop.is_industrial) meta.push("Industrial");
    if (prop.is_london) meta.push("London");
    doc.text(meta.join("   |   "), m + 8, metaY);

    // ── Savings hero banner ──
    var heroY = metaY + 8;
    doc.setFillColor.apply(doc, BC.dark);
    doc.roundedRect(m, heroY, cw, 30, 3, 3, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text("NET ANNUAL SAVING", m + 10, heroY + 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor.apply(doc, BC.mint);
    doc.text(cur(result.potentialNetSaving), m + 10, heroY + 24);

    var rightCol = pw / 2 + 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text("ANNUAL BILL", rightCol, heroY + 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor.apply(doc, BC.white);
    doc.text(cur(result.annualBill), rightCol, heroY + 24);

    // ── Rateable Values ──
    var rvY = heroY + 38;
    doc.setFillColor.apply(doc, BC.mint);
    doc.rect(m, rvY - 5, 3, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor.apply(doc, BC.dark);
    doc.text("Rateable Values", m + 8, rvY);

    var rvRows = [];
    if (prop.rv_2023) rvRows.push(["2023 List (previous)", cur(prop.rv_2023)]);
    rvRows.push(["2026 List (current)", cur(prop.rv_2026 || 0)]);
    var batchRvChangePositive = false;
    if (prop.rv_2023 && prop.rv_2026) {
      var ch = prop.rv_2026 - prop.rv_2023;
      var pct = ((ch / prop.rv_2023) * 100).toFixed(1);
      var pfx = ch >= 0 ? "+" : "";
      batchRvChangePositive = ch > 0;
      rvRows.push(["Change", pfx + cur(Math.abs(ch)) + "  (" + pfx + pct + "%)"]);
    }

    doc.autoTable({
      startY: rvY + 4,
      margin: { left: m, right: m + cw / 2 + 5 },
      body: rvRows,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 2.5 },
      columnStyles: {
        0: { textColor: BC.grey },
        1: { fontStyle: "bold", halign: "right" },
      },
      didParseCell: function (data) {
        if (data.row.raw && data.row.raw[0] === "Change" && data.column.index === 1 && batchRvChangePositive) {
          data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });

    // ── Bill Breakdown ──
    var brkY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor.apply(doc, BC.mint);
    doc.rect(m, brkY - 5, 3, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor.apply(doc, BC.dark);
    doc.text("Bill Breakdown 2026/27", m + 8, brkY);

    var brkRows = [
      ["Multiplier", s.multiplier.label],
      ["Basic bill (before reliefs)", cur(s.basicBill)],
    ];
    if (s.sbrr.reliefPercent > 0) {
      brkRows.push(["Small Business Rate Relief", "-" + cur(s.basicBill - s.sbrr.billAfterSBRR) + "  (" + s.sbrr.reliefPercent.toFixed(1) + "%)"]);
    }
    if (s.pubsRelief.applies) {
      brkRows.push(["Pubs & Venues Relief (15%)", "-" + cur(s.pubsRelief.amount)]);
    }
    if (s.transitionalRelief.applies) {
      brkRows.push(["Transitional Relief", "-" + cur(s.transitionalRelief.saving) + "  (capped at " + s.transitionalRelief.capPercent + "%)"]);
    }
    if (s.ssbRelief.applies) {
      brkRows.push(["Supporting Small Business Relief", "-" + cur(s.ssbRelief.saving)]);
    }
    if (s.supplement.applies) {
      brkRows.push(["Transitional Supplement (1p)", "+" + cur(s.supplement.amount)]);
    }
    brkRows.push(["Estimated annual bill", cur(result.annualBill)]);
    brkRows.push(["Estimated monthly", cur(result.monthlyBill)]);

    doc.autoTable({
      startY: brkY + 4,
      margin: { left: m, right: m },
      body: brkRows,
      theme: "striped",
      styles: { fontSize: 10, cellPadding: 3.5 },
      alternateRowStyles: { fillColor: BC.off },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 58, halign: "right", fontStyle: "bold" },
      },
      didParseCell: function (data) {
        if (data.row.index === brkRows.length - 2 && data.section === "body") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = BC.dark;
          data.cell.styles.textColor = BC.white;
        }
      },
    });

    // ── VacatAd Savings ──
    var savY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor.apply(doc, BC.mint);
    doc.rect(m, savY - 5, 3, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor.apply(doc, BC.dark);
    doc.text("VacatAd Savings Estimate", m + 8, savY);

    var cycle = result.inputs.isIndustrial ? "6 months (industrial)" : "3 months (standard)";
    var savRows = [
      ["Empty property relief cycle", cycle],
      ["Rates-free weeks per year",   result.reliefWeeks + " of " + result.weeksPerYear],
      ["Potential annual saving",     cur(result.potentialAnnualSaving)],
      [result.vacatadFee.belowMinimum ? "VacatAd fee (minimum)" : "VacatAd fee (" + result.vacatadFee.feePercent + "%)", cur(result.vacatadFee.feeAmount)],
      ["Net annual saving",           cur(result.potentialNetSaving)],
      ["Net monthly saving",          cur(Math.round(result.potentialNetSaving / 12 * 100) / 100)],
    ];

    doc.autoTable({
      startY: savY + 4,
      margin: { left: m, right: m },
      body: savRows,
      theme: "striped",
      styles: { fontSize: 10, cellPadding: 3.5 },
      alternateRowStyles: { fillColor: BC.off },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 58, halign: "right", fontStyle: "bold" },
      },
      didParseCell: function (data) {
        if (data.row.index === 4 && data.section === "body") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = BC.green;
          data.cell.styles.textColor = BC.white;
          data.cell.styles.fontSize = 11;
        }
      },
    });
  }

  /* ── Helpers ── */
  function cur(n) {
    return "\u00A3" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function trunc(s, max) {
    if (!s) return "";
    return s.length > max ? s.substring(0, max - 1) + "\u2026" : s;
  }

  function esc(s) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(s || ""));
    return d.innerHTML;
  }
})();
