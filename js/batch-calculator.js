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
      if (batchProperties.length > 0) generateReport();
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
  }

  function doBatchSearch() {
    var query = batchSearch.value.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "");
    if (!query || query.length < 3) return;

    batchResults.innerHTML = '<div class="calc-search-loading">Searching VOA rating list\u2026</div>';
    batchResults.style.display = "block";

    if (batchController) batchController.abort();
    batchController = new AbortController();

    fetch(API_URL + "/api/lookup?postcode=" + encodeURIComponent(query), { signal: batchController.signal })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        batchController = null;
        if (data.properties && data.properties.length > 0) {
          showBatchResults(data.properties);
        } else {
          batchResults.innerHTML = '<div class="calc-search-empty">No properties found for <strong>' + esc(query) + '</strong>.</div>';
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

  function renderBatchList() {
    if (batchProperties.length === 0) {
      batchList.innerHTML = '<div class="batch-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg><p>Search for a postcode above and click a property to add it to your batch.</p></div>';
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
              '<div class="batch-item-meta">' + badges +
                '<span class="batch-item-desc">' + esc(prop.description_text) + '</span>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="batch-item-remove" data-index="' + i + '" aria-label="Remove property">&times;</button>' +
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

  function generateReport() {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF("p", "mm", "a4");
    var pw = 210, ph = 297, m = 20;
    var cw = pw - m * 2;

    // Grab user info from the gate
    var gateData = null;
    try { gateData = JSON.parse(localStorage.getItem("vacatad_gate_v1")); } catch (e) {}
    var userName    = gateData ? gateData.name    : "";
    var userCompany = gateData ? gateData.company : "";

    // Portfolio totals
    var totalRV = 0, totalBill = 0, totalGross = 0, totalFee = 0, totalNet = 0;
    batchProperties.forEach(function (item) {
      totalRV    += item.prop.rv_2026 || 0;
      totalBill  += item.result.annualBill || 0;
      totalGross += item.result.potentialAnnualSaving || 0;
      totalFee   += item.result.vacatadFee.feeAmount || 0;
      totalNet   += item.result.potentialNetSaving || 0;
    });

    /* ── PAGE 1: COVER ── */
    // Header bar
    doc.setFillColor(26, 28, 26);
    doc.rect(0, 0, pw, 60, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(219, 244, 204);
    doc.text("VacatAd", m, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(200, 200, 200);
    doc.text("Business Rates Specialists", m, 50);

    // Title
    doc.setTextColor(26, 28, 26);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Portfolio Business Rates Report", m, 90);
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("2026/27 Financial Year", m, 102);

    // Prepared for
    var y = 125;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Prepared for:", m, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(26, 28, 26);
    doc.text(userName || "Property Portfolio", m, y + 10);
    if (userCompany) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(80);
      doc.text(userCompany, m, y + 20);
    }

    // Date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Generated: " + new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), m, y + 35);

    // Summary stat boxes
    var boxY = 195;
    var boxW = (cw - 15) / 4;
    var stats = [
      { label: "Properties",       value: String(batchProperties.length) },
      { label: "Total RV (2026)",  value: cur(totalRV) },
      { label: "Total Annual Bill", value: cur(totalBill) },
      { label: "Total Net Saving", value: cur(totalNet) },
    ];
    stats.forEach(function (stat, i) {
      var x = m + i * (boxW + 5);
      doc.setFillColor(246, 247, 248);
      doc.roundedRect(x, boxY, boxW, 40, 3, 3, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(stat.label, x + boxW / 2, boxY + 14, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      if (i === 3) { doc.setTextColor(34, 139, 34); } else { doc.setTextColor(26, 28, 26); }
      doc.text(stat.value, x + boxW / 2, boxY + 30, { align: "center" });
    });

    // Cover disclaimer
    doc.setDrawColor(200);
    doc.line(m, ph - 25, pw - m, ph - 25);
    doc.setFontSize(7.5);
    doc.setTextColor(150);
    doc.text("This report provides estimates based on the 2026/27 multipliers and published relief schemes.", m, ph - 18);
    doc.text("Actual bills are determined by your local billing authority. Rateable values are set by the Valuation Office Agency.", m, ph - 13);

    /* ── PAGE 2+: SUMMARY TABLE ── */
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(26, 28, 26);
    doc.text("Portfolio Summary", m, 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(batchProperties.length + " properties  |  2026/27 financial year", m, 33);

    var tableBody = batchProperties.map(function (item, i) {
      var type = item.prop.is_rhl ? "RHL" : item.prop.is_industrial ? "Industrial" : "Standard";
      return [
        String(i + 1),
        trunc(item.prop.full_address, 38),
        type,
        cur(item.prop.rv_2026 || 0),
        cur(item.result.annualBill),
        cur(item.result.potentialAnnualSaving),
        cur(item.result.potentialNetSaving),
      ];
    });

    // Totals row
    tableBody.push([
      "", "PORTFOLIO TOTAL", "",
      cur(totalRV), cur(totalBill), cur(totalGross), cur(totalNet),
    ]);

    doc.autoTable({
      startY: 40,
      margin: { left: m, right: m },
      head: [["#", "Address", "Type", "RV 2026", "Annual Bill", "Gross Saving", "Net Saving"]],
      body: tableBody,
      headStyles:   { fillColor: [26, 28, 26], textColor: [219, 244, 204], fontStyle: "bold", fontSize: 8 },
      bodyStyles:   { fontSize: 8, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [246, 247, 248] },
      columnStyles: {
        0: { cellWidth: 8,  halign: "center" },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 22, halign: "right" },
        4: { cellWidth: 22, halign: "right" },
        5: { cellWidth: 24, halign: "right" },
        6: { cellWidth: 22, halign: "right" },
      },
      didParseCell: function (data) {
        if (data.row.index === tableBody.length - 1 && data.section === "body") {
          data.cell.styles.fontStyle  = "bold";
          data.cell.styles.fillColor  = [26, 28, 26];
          data.cell.styles.textColor  = [255, 255, 255];
        }
      },
    });

    /* ── APPENDIX: PER-PROPERTY BREAKDOWN ── */
    batchProperties.forEach(function (item, i) {
      doc.addPage();
      drawPropertyPage(doc, item, i + 1, m, cw, pw);
    });

    /* ── PAGE NUMBERS ── */
    var totalPages = doc.internal.getNumberOfPages();
    for (var p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7.5);
      doc.setTextColor(150);
      doc.text("Page " + p + " of " + totalPages, pw / 2, ph - 10, { align: "center" });
      if (p > 1) {
        doc.text("Generated " + new Date().toLocaleDateString("en-GB"), m, ph - 10);
        doc.text("vacatad.com", pw - m, ph - 10, { align: "right" });
      }
    }

    doc.save("VacatAd-Portfolio-Report-2026-27.pdf");

    if (typeof gtag === "function") {
      gtag("event", "batch_report_generated", {
        event_category: "engagement",
        batch_size: batchProperties.length,
        total_net_saving: totalNet,
      });
    }
  }

  /* ── Per-property appendix page ── */
  function drawPropertyPage(doc, item, index, m, cw, pw) {
    var prop   = item.prop;
    var result = item.result;
    var s      = result.steps;

    // Header ribbon
    doc.setFillColor(246, 247, 248);
    doc.rect(0, 0, pw, 15, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Property " + index + " of " + batchProperties.length, m, 10);
    doc.text("VacatAd Portfolio Report 2026/27", pw - m, 10, { align: "right" });

    // Address
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(26, 28, 26);
    var titleLines = doc.splitTextToSize(prop.full_address, cw);
    doc.text(titleLines, m, 28);
    var metaY = 28 + titleLines.length * 5.5 + 4;

    // Meta line
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    var meta = [prop.description_text, prop.postcode];
    if (prop.is_rhl) meta.push("Retail, Hospitality & Leisure");
    if (prop.is_industrial) meta.push("Industrial");
    if (prop.is_london) meta.push("London");
    doc.text(meta.join("  |  "), m, metaY);

    // ── Rateable Values ──
    var rvY = metaY + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 28, 26);
    doc.text("Rateable Values", m, rvY);

    var rvRows = [];
    if (prop.rv_2023) rvRows.push(["2023 List (previous)", cur(prop.rv_2023)]);
    rvRows.push(["2026 List (current)", cur(prop.rv_2026 || 0)]);
    if (prop.rv_2023 && prop.rv_2026) {
      var ch = prop.rv_2026 - prop.rv_2023;
      var pct = ((ch / prop.rv_2023) * 100).toFixed(1);
      var pfx = ch >= 0 ? "+" : "";
      rvRows.push(["Change", pfx + cur(Math.abs(ch)) + "  (" + pfx + pct + "%)"]);
    }

    doc.autoTable({
      startY: rvY + 4,
      margin: { left: m, right: m + cw / 2 + 5 },
      body: rvRows,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { textColor: [100, 100, 100] },
        1: { fontStyle: "bold", halign: "right" },
      },
    });

    // ── Bill Breakdown ──
    var brkY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 28, 26);
    doc.text("Bill Breakdown 2026/27", m, brkY);

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
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [246, 247, 248] },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 55, halign: "right", fontStyle: "bold" },
      },
      didParseCell: function (data) {
        if (data.row.index === brkRows.length - 2 && data.section === "body") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [26, 28, 26];
          data.cell.styles.textColor = [255, 255, 255];
        }
      },
    });

    // ── VacatAd Savings ──
    var savY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 28, 26);
    doc.text("VacatAd Savings Estimate", m, savY);

    var cycle = result.inputs.isIndustrial ? "6 months (industrial)" : "3 months (standard)";
    var savRows = [
      ["Empty property relief cycle", cycle],
      ["Rates-free weeks per year",   result.reliefWeeks + " of " + result.weeksPerYear],
      ["Potential annual saving",     cur(result.potentialAnnualSaving)],
      ["VacatAd fee (" + result.vacatadFee.feePercent + "%)", cur(result.vacatadFee.feeAmount)],
      ["Net annual saving",           cur(result.potentialNetSaving)],
      ["Net monthly saving",          cur(Math.round(result.potentialNetSaving / 12 * 100) / 100)],
    ];

    doc.autoTable({
      startY: savY + 4,
      margin: { left: m, right: m },
      body: savRows,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [246, 247, 248] },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 55, halign: "right", fontStyle: "bold" },
      },
      didParseCell: function (data) {
        if (data.row.index === 4 && data.section === "body") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [34, 139, 34];
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
