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

  async function generateReport() {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF("p", "mm", "a4");
    var pw = 210, ph = 297, m = 20;
    var cw = pw - m * 2;

    // Grab user info from the gate
    var gateData = null;
    try { gateData = JSON.parse(localStorage.getItem("vacatad_gate_v1")); } catch (e) {}
    var userName    = gateData ? gateData.name    : "";
    var userCompany = gateData ? gateData.company : "";
    var userEmail   = gateData ? gateData.email   : "";

    // Portfolio totals
    var totalRV = 0, totalBill = 0, totalGross = 0, totalFee = 0, totalNet = 0;
    batchProperties.forEach(function (item) {
      totalRV    += item.prop.rv_2026 || 0;
      totalBill  += item.result.annualBill || 0;
      totalGross += item.result.potentialAnnualSaving || 0;
      totalFee   += item.result.vacatadFee.feeAmount || 0;
      totalNet   += item.result.potentialNetSaving || 0;
    });

    // Get quotation number from server
    var quoteNumber = "";
    try {
      var payload = {
        email:   userEmail,
        name:    userName,
        company: userCompany,
        total_rv:   totalRV,
        total_bill:  totalBill,
        total_net:   totalNet,
        properties: batchProperties.map(function (item) {
          return {
            address:          item.prop.full_address || "",
            postcode:         item.prop.postcode || "",
            description_code: item.prop.description_code || "",
            rv_2026:          item.prop.rv_2026 || 0,
            annual_bill:      item.result.annualBill || 0,
            net_saving:       item.result.potentialNetSaving || 0,
          };
        }),
      };
      var res = await fetch(API_URL + "/api/batch-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      var data = await res.json();
      if (data.quote_number) quoteNumber = data.quote_number;
    } catch (e) { /* continue without quote number */ }

    var dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    /* ── Helper: draw page header ribbon on inner pages ── */
    function drawPageHeader(doc, leftText, rightText) {
      doc.setFillColor(26, 28, 26);
      doc.rect(0, 0, pw, 14, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(200, 200, 200);
      doc.text(leftText, m, 9);
      doc.text(rightText, pw - m, 9, { align: "right" });
    }

    /* ── Helper: draw section heading with accent bar ── */
    function drawSectionHeading(doc, title, y) {
      doc.setFillColor(219, 244, 204);
      doc.rect(m, y - 4.5, 3, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(26, 28, 26);
      doc.text(title, m + 7, y);
      return y + 8;
    }

    /* ══════════════════════════════════════════════════
       PAGE 1: COVER
       ══════════════════════════════════════════════════ */

    // Full-width dark header
    doc.setFillColor(26, 28, 26);
    doc.rect(0, 0, pw, 80, "F");

    // Brand name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(219, 244, 204);
    doc.text("VacatAd", m, 30);

    // Tagline
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(180, 180, 180);
    doc.text("Business Rates Specialists  |  vacatad.com", m, 42);

    // Quote number in header
    if (quoteNumber) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(219, 244, 204);
      doc.text(quoteNumber, pw - m, 30, { align: "right" });
    }

    // Contact details in header
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text("0333 090 0443  |  hello@vacatad.com", pw - m, 42, { align: "right" });

    // Thin accent line
    doc.setFillColor(219, 244, 204);
    doc.rect(0, 80, pw, 1.5, "F");

    // Report title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(26, 28, 26);
    doc.text("Portfolio Business Rates", m, 105);
    doc.text("Report 2026/27", m, 117);

    // Prepared for block
    var y = 135;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.text("PREPARED FOR", m, y);
    doc.setDrawColor(219, 244, 204);
    doc.setLineWidth(0.5);
    doc.line(m, y + 2, m + 40, y + 2);

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(26, 28, 26);
    doc.text(userName || "Property Portfolio", m, y);
    if (userCompany) {
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(80);
      doc.text(userCompany, m, y);
    }
    if (userEmail) {
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(userEmail, m, y);
    }
    y += 7;
    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.text(dateStr, m, y);

    // Executive summary stat boxes
    var boxY = 195;
    var boxW = (cw - 15) / 4;
    var stats = [
      { label: "Properties",       value: String(batchProperties.length), green: false },
      { label: "Total RV (2026)",  value: cur(totalRV),    green: false },
      { label: "Total Annual Bill", value: cur(totalBill),  green: false },
      { label: "Est. Net Saving",  value: cur(totalNet),   green: true },
    ];
    stats.forEach(function (stat, i) {
      var x = m + i * (boxW + 5);
      if (stat.green) {
        doc.setFillColor(26, 28, 26);
      } else {
        doc.setFillColor(246, 247, 248);
      }
      doc.roundedRect(x, boxY, boxW, 42, 3, 3, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(stat.green ? 180 : 120);
      doc.text(stat.label.toUpperCase(), x + boxW / 2, boxY + 13, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      if (stat.green) { doc.setTextColor(219, 244, 204); } else { doc.setTextColor(26, 28, 26); }
      doc.text(stat.value, x + boxW / 2, boxY + 30, { align: "center" });
    });

    // CTA bar
    var ctaY = 252;
    doc.setFillColor(90, 184, 187);
    doc.roundedRect(m, ctaY, cw, 18, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.textWithLink("Ready to start saving? Contact us: vacatad.com/contact  |  0333 090 0443", pw / 2, ctaY + 11.5, { align: "center", url: "https://vacatad.com/contact" });

    // Footer disclaimer
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text("Estimates based on 2026/27 multipliers and published relief schemes. Actual bills are determined by your local billing authority.", m, ph - 12);
    doc.text("Rateable values are set by the Valuation Office Agency. This report does not constitute financial advice.", m, ph - 7);

    /* ══════════════════════════════════════════════════
       PAGE 2: PORTFOLIO SUMMARY TABLE
       ══════════════════════════════════════════════════ */
    doc.addPage();
    drawPageHeader(doc, "Portfolio Summary", quoteNumber || "vacatad.com");

    var sy = drawSectionHeading(doc, "Portfolio Overview", 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(batchProperties.length + " properties  |  2026/27 financial year  |  " + dateStr, m + 7, sy);

    var tableBody = batchProperties.map(function (item, i) {
      var type = item.prop.is_rhl ? "RHL" : item.prop.is_industrial ? "Ind." : "Std";
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

    tableBody.push([
      "", "PORTFOLIO TOTAL", "",
      cur(totalRV), cur(totalBill), cur(totalGross), cur(totalNet),
    ]);

    doc.autoTable({
      startY: sy + 6,
      margin: { left: m, right: m },
      head: [["#", "Property Address", "Type", "RV 2026", "Annual Bill", "Gross Saving", "Net Saving"]],
      body: tableBody,
      headStyles:   { fillColor: [26, 28, 26], textColor: [219, 244, 204], fontStyle: "bold", fontSize: 7.5 },
      bodyStyles:   { fontSize: 7.5, textColor: [50, 50, 50], cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [248, 249, 248] },
      columnStyles: {
        0: { cellWidth: 8,  halign: "center" },
        2: { cellWidth: 14, halign: "center" },
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
        // Green highlight on net saving column
        if (data.column.index === 6 && data.section === "body" && data.row.index < tableBody.length - 1) {
          data.cell.styles.textColor = [34, 120, 34];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    // Key below table
    var keyY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text("RHL = Retail, Hospitality & Leisure  |  Ind. = Industrial  |  Std = Standard multiplier  |  Net Saving = after VacatAd fee", m, keyY);

    /* ══════════════════════════════════════════════════
       PAGES 3+: PER-PROPERTY BREAKDOWNS
       ══════════════════════════════════════════════════ */
    batchProperties.forEach(function (item, i) {
      doc.addPage();
      drawPropertyPage(doc, item, i + 1, m, cw, pw, quoteNumber);
    });

    /* ══════════════════════════════════════════════════
       HOW VACATAD WORKS - PROCESS PAGE
       ══════════════════════════════════════════════════ */
    doc.addPage();
    drawPageHeader(doc, "How VacatAd Works", quoteNumber || "vacatad.com");

    var hy = drawSectionHeading(doc, "Our Process", 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80);
    var introLines = doc.splitTextToSize(
      "VacatAd helps commercial landlords legally reduce business rates on vacant properties through compliant beneficial occupation using plug-and-play Wi-Fi technology. With a 100% relief success rate across 250+ UK properties, we deliver proven results.",
      cw - 7
    );
    doc.text(introLines, m + 7, hy);
    hy += introLines.length * 4.5 + 8;

    var steps = [
      { num: "01", title: "Free Assessment", desc: "We evaluate your property's business rates relief potential and provide a detailed savings estimate at no cost. Our experts analyse your rateable values, applicable reliefs, and the optimal strategy for your portfolio." },
      { num: "02", title: "Plug-and-Play Setup", desc: "Our secure Wi-Fi technology is installed rapidly and non-disruptively, typically operational within days. There's no impact on your property plans, existing tenants, or building condition." },
      { num: "03", title: "Beneficial Occupation", desc: "We create compliant occupation for the required period, resetting relief cycles and reducing your holding costs. Our method is fully aligned with VOA regulations and case law." },
      { num: "04", title: "Compliance Evidence", desc: "Continuous monitoring produces documented proof of genuine occupation. We maintain a full audit trail ready for any local authority enquiry, giving you complete peace of mind." },
      { num: "05", title: "Ongoing Savings", desc: "Relief cycles are managed continuously to maximise savings. You receive regular reporting, and our team is always available to discuss changes in legislation or your portfolio." },
    ];

    steps.forEach(function (step) {
      // Number circle
      doc.setFillColor(26, 28, 26);
      doc.circle(m + 7, hy + 2, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(219, 244, 204);
      doc.text(step.num, m + 7, hy + 3.5, { align: "center" });

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(26, 28, 26);
      doc.text(step.title, m + 16, hy + 3);

      // Description
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80);
      var descLines = doc.splitTextToSize(step.desc, cw - 16);
      doc.text(descLines, m + 16, hy + 9);
      hy += 9 + descLines.length * 4 + 8;
    });

    // Why VacatAd boxes
    hy += 4;
    var whyY = drawSectionHeading(doc, "Why Choose VacatAd", hy);
    var whyItems = [
      { title: "Technology-First", desc: "Plug-and-play Wi-Fi routers with real-time monitoring" },
      { title: "100% Compliant", desc: "Fully aligned with VOA regulations and current case law" },
      { title: "Rapid Deployment", desc: "Go live in under a week from first call" },
      { title: "Proven Track Record", desc: "100% success rate across 250+ UK properties" },
    ];
    var whyBoxW = (cw - 10) / 2;
    whyItems.forEach(function (item, i) {
      var col = i % 2;
      var row = Math.floor(i / 2);
      var bx = m + col * (whyBoxW + 10);
      var by = whyY + row * 24;
      doc.setFillColor(248, 249, 248);
      doc.roundedRect(bx, by, whyBoxW, 20, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(26, 28, 26);
      doc.text(item.title, bx + 4, by + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100);
      doc.text(item.desc, bx + 4, by + 14);
    });

    /* ══════════════════════════════════════════════════
       RECENT INSIGHTS / BLOG POSTS PAGE
       ══════════════════════════════════════════════════ */
    doc.addPage();
    drawPageHeader(doc, "Insights & Resources", quoteNumber || "vacatad.com");

    var iy = drawSectionHeading(doc, "Latest Insights from VacatAd", 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("Stay informed on business rates changes, legislation updates, and strategies to reduce your property holding costs.", m + 7, iy);
    iy += 10;

    var blogPosts = [
      { date: "26 Mar 2026", title: "The Double Squeeze: Why Rising Rates and EPC Rules Are a Perfect Storm for Vacant Property Owners", url: "https://vacatad.com/blog/posts/26-03-26-the-double-squeeze-why-rising-rates-and-epc-rules-are-a-perfect-storm-for-vacant-property-owners/", desc: "Commercial landlords with vacant properties face mounting pressure from the April 2026 business rates overhaul alongside tightening EPC regulations." },
      { date: "12 Mar 2026", title: "The April Reset: Your Complete Guide to the Biggest Rates Overhaul in a Decade", url: "https://vacatad.com/blog/posts/26-03-12-the-april-reset-your-complete-guide-to-the-biggest-rates-overhaul-in-a-decade/", desc: "A comprehensive guide to the new five-tier multiplier system and what it means for your business rates bill from April 2026." },
      { date: "19 Feb 2026", title: "The Vacant Properties Bill: Could Councils Force Open Your Empty Units?", url: "https://vacatad.com/blog/posts/26-02-19-the-vacant-properties-bill-could-councils-force-open-your-empty-units/", desc: "Analysis of the new Private Members' Bill proposing councils place charities and small businesses in vacant commercial properties." },
      { date: "22 Jan 2026", title: "2026 Revaluation Unveiled: What the Draft Values Reveal About Your Rates Bill", url: "https://vacatad.com/blog/posts/26-01-22-2026-revaluation-unveiled-what-the-draft-values-reveal-about-your-rates-bill/", desc: "The VOA has published draft 2026 rateable values, revealing a 19.2% national increase. We break down the regional impacts." },
      { date: "8 Jan 2026", title: "2026 Budget Predictions: What Commercial Landlords Should Expect for Business Rates Reform", url: "https://vacatad.com/blog/posts/26-01-08-2026-budget-predictions-what-commercial-landlords-should-expect-for-business-rates-reform/", desc: "Expert analysis of expected business rates reforms covering revaluation cycles and multiplier changes." },
      { date: "25 Sep 2025", title: "High Court's 2025 Ruling Reshapes Business Rates Mitigation Landscape", url: "https://vacatad.com/blog/posts/25-09-25-high-courts-2025-ruling-reshapes-business-rates-mitigation-landscape/", desc: "A landmark High Court ruling marks a turning point for commercial landlords seeking to reduce empty property rates." },
    ];

    blogPosts.forEach(function (post) {
      // Date badge
      doc.setFillColor(246, 247, 248);
      doc.roundedRect(m, iy, cw, 30, 2, 2, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(90, 184, 187);
      doc.text(post.date, m + 4, iy + 7);

      // Title as link
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(26, 28, 26);
      var titleLines = doc.splitTextToSize(post.title, cw - 8);
      doc.textWithLink(titleLines[0], m + 4, iy + 13, { url: post.url });
      if (titleLines[1]) doc.textWithLink(titleLines[1], m + 4, iy + 17.5, { url: post.url });

      // Description
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100);
      var descLine = trunc(post.desc, 120);
      var lastTitleY = titleLines[1] ? iy + 17.5 : iy + 13;
      doc.text(descLine, m + 4, lastTitleY + 5.5);

      iy += 34;
    });

    // Blog CTA
    iy += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 184, 187);
    doc.textWithLink("View all insights at vacatad.com/blog", m + 7, iy, { url: "https://vacatad.com/blog/" });

    /* ══════════════════════════════════════════════════
       FINAL PAGE: CTA / CONTACT
       ══════════════════════════════════════════════════ */
    doc.addPage();

    // Full dark background
    doc.setFillColor(26, 28, 26);
    doc.rect(0, 0, pw, ph, "F");

    // VacatAd brand
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.setTextColor(219, 244, 204);
    doc.text("VacatAd", pw / 2, 80, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(200, 200, 200);
    doc.text("Business Rates Specialists", pw / 2, 92, { align: "center" });

    // Divider
    doc.setDrawColor(219, 244, 204);
    doc.setLineWidth(0.5);
    doc.line(pw / 2 - 30, 102, pw / 2 + 30, 102);

    // Headline
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("Ready to Reduce Your", pw / 2, 125, { align: "center" });
    doc.text("Business Rates?", pw / 2, 137, { align: "center" });

    // Savings highlight
    if (totalNet > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(180, 180, 180);
      doc.text("Your portfolio could save an estimated", pw / 2, 155, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(219, 244, 204);
      doc.text(cur(totalNet) + " per year", pw / 2, 170, { align: "center" });
    }

    // CTA button
    var ctaBtnY = 190;
    doc.setFillColor(90, 184, 187);
    doc.roundedRect(pw / 2 - 50, ctaBtnY, 100, 16, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.textWithLink("Get in Touch", pw / 2, ctaBtnY + 10.5, { align: "center", url: "https://vacatad.com/contact" });

    // Contact details
    var cdY = 222;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.textWithLink("vacatad.com/contact", pw / 2, cdY, { align: "center", url: "https://vacatad.com/contact" });
    doc.text("hello@vacatad.com  |  0333 090 0443", pw / 2, cdY + 10, { align: "center" });
    doc.text("86-90 Paul Street, London, EC2A 4NA", pw / 2, cdY + 20, { align: "center" });

    // Quote number on final page
    if (quoteNumber) {
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("Quote Reference: " + quoteNumber, pw / 2, ph - 20, { align: "center" });
    }

    // Legal footer
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text("VacatAd Ltd  |  Company registered in England & Wales", pw / 2, ph - 10, { align: "center" });

    /* ══════════════════════════════════════════════════
       PAGE NUMBERS (skip cover and final page)
       ══════════════════════════════════════════════════ */
    var totalPages = doc.internal.getNumberOfPages();
    for (var p = 2; p < totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(160);
      doc.text("Page " + p + " of " + totalPages, pw / 2, ph - 8, { align: "center" });
      if (quoteNumber) {
        doc.text(quoteNumber, pw - m, ph - 8, { align: "right" });
      }
      doc.text(dateStr, m, ph - 8);
    }

    var fileName = quoteNumber
      ? "VacatAd-" + quoteNumber + ".pdf"
      : "VacatAd-Portfolio-Report-2026-27.pdf";
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
    doc.setFillColor(26, 28, 26);
    doc.rect(0, 0, pw, 14, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(200, 200, 200);
    doc.text("Property " + index + " of " + batchProperties.length, m, 9);
    doc.text(quoteNumber || "VacatAd Portfolio Report 2026/27", pw - m, 9, { align: "right" });

    // Address
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(26, 28, 26);
    var titleLines = doc.splitTextToSize(prop.full_address, cw);
    doc.text(titleLines, m, 28);
    var metaY = 28 + titleLines.length * 6 + 3;

    // Meta badges
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100);
    var meta = [prop.description_text, prop.postcode];
    if (prop.is_rhl) meta.push("Retail, Hospitality & Leisure");
    if (prop.is_industrial) meta.push("Industrial");
    if (prop.is_london) meta.push("London");
    doc.text(meta.join("  |  "), m, metaY);

    // ── Rateable Values ──
    var rvY = metaY + 10;
    doc.setFillColor(219, 244, 204);
    doc.rect(m, rvY - 4.5, 3, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 28, 26);
    doc.text("Rateable Values", m + 7, rvY);

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
    var brkY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(219, 244, 204);
    doc.rect(m, brkY - 4.5, 3, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 28, 26);
    doc.text("Bill Breakdown 2026/27", m + 7, brkY);

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
      alternateRowStyles: { fillColor: [248, 249, 248] },
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
    var savY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(219, 244, 204);
    doc.rect(m, savY - 4.5, 3, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 28, 26);
    doc.text("VacatAd Savings Estimate", m + 7, savY);

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
      alternateRowStyles: { fillColor: [248, 249, 248] },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 55, halign: "right", fontStyle: "bold" },
      },
      didParseCell: function (data) {
        if (data.row.index === 4 && data.section === "body") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [34, 120, 34];
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
