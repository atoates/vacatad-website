/**
 * VacatAd Single Property PDF Export 2026/27
 * Generates a branded PDF report for a single property calculation.
 * Depends on: jspdf.umd.min.js, jspdf.plugin.autotable.min.js,
 *             calculator.js (window._vacatadLastResult),
 *             voa-lookup.js (window._vacatadSelectedProp)
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("singlePdfExport");
    if (!btn) return;

    btn.addEventListener("click", function () {
      var result = window._vacatadLastResult;
      if (!result) return;
      generateSinglePDF(result, window._vacatadSelectedProp || null);
    });
  });

  function cur(n) {
    return "\u00A3" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function curWhole(n) {
    return "\u00A3" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function trunc(s, max) {
    if (!s) return "";
    return s.length > max ? s.substring(0, max - 1) + "\u2026" : s;
  }

  /* Brand colours */
  var C = {
    dark:   [26, 28, 26],
    mint:   [219, 244, 204],
    teal:   [90, 184, 187],
    green:  [34, 120, 34],
    white:  [255, 255, 255],
    off:    [248, 249, 248],
    grey:   [100, 100, 100],
    ltGrey: [160, 160, 160],
  };

  function generateSinglePDF(result, prop) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF("p", "mm", "a4");
    var pw = 210, ph = 297, m = 18;
    var cw = pw - m * 2;
    var s = result.steps;

    var gateData = null;
    try { gateData = JSON.parse(localStorage.getItem("vacatad_gate_v1")); } catch (e) {}
    var userName    = gateData ? gateData.name    : "";
    var userCompany = gateData ? gateData.company : "";
    var userEmail   = gateData ? gateData.email   : "";
    var dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    var address  = prop ? prop.full_address : "Property Assessment";
    var postcode = prop ? prop.postcode : "";
    var descText = prop ? prop.description_text : "";

    /* ══════════════════════════════════════════════════
       PAGE 1: PROPERTY ASSESSMENT
       ══════════════════════════════════════════════════ */

    // ── Dark header band ──
    doc.setFillColor.apply(doc, C.dark);
    doc.rect(0, 0, pw, 44, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor.apply(doc, C.mint);
    doc.text("VacatAd", m, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text("Business Rates Specialists", m, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text("0333 090 0443  |  hello@vacatad.com", pw - m, 20, { align: "right" });
    doc.text("vacatad.com", pw - m, 30, { align: "right" });

    // Accent bar
    doc.setFillColor.apply(doc, C.mint);
    doc.rect(0, 44, pw, 1.5, "F");

    // ── Report title + meta ──
    var y = 56;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor.apply(doc, C.dark);
    doc.text("Business Rates Assessment 2026/27", m, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor.apply(doc, C.grey);
    var metaParts = [dateStr];
    if (userName) metaParts.unshift(userName + (userCompany ? " (" + userCompany + ")" : ""));
    doc.text(metaParts.join("   |   "), m, y);

    // ── Property address block ──
    y += 12;
    doc.setFillColor.apply(doc, C.mint);
    doc.rect(m, y - 5, 3, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor.apply(doc, C.dark);
    var addrLines = doc.splitTextToSize(address, cw - 8);
    doc.text(addrLines, m + 8, y);
    y += addrLines.length * 6;

    if (descText || postcode) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor.apply(doc, C.grey);
      var tags = [];
      if (descText) tags.push(descText);
      if (postcode) tags.push(postcode);
      if (prop && prop.is_rhl) tags.push("Retail, Hospitality & Leisure");
      if (prop && prop.is_industrial) tags.push("Industrial");
      if (prop && prop.is_london) tags.push("London");
      doc.text(tags.join("   |   "), m + 8, y + 2);
      y += 8;
    }

    // ── Hero savings banner ──
    y += 6;
    var heroH = 38;
    doc.setFillColor.apply(doc, C.dark);
    doc.roundedRect(m, y, cw, heroH, 3, 3, "F");

    // Left side: Net annual saving
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text("ESTIMATED NET ANNUAL SAVING", m + 12, y + 13);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor.apply(doc, C.mint);
    doc.text(cur(result.potentialNetSaving), m + 12, y + 30);

    // Right side: Annual bill
    var rightCol = pw / 2 + 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text("ANNUAL RATES BILL", rightCol, y + 13);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor.apply(doc, C.white);
    doc.text(cur(result.annualBill), rightCol, y + 30);

    y += heroH + 10;

    // ── Two-column layout ──
    var colW = (cw - 8) / 2;

    // Left: Rateable Values
    function sectionHead(title, x, sy) {
      doc.setFillColor.apply(doc, C.mint);
      doc.rect(x, sy - 4, 3, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor.apply(doc, C.dark);
      doc.text(title, x + 7, sy);
      return sy + 7;
    }

    var leftY = sectionHead("Rateable Values", m, y);
    var rvRows = [];
    if (result.oldRV && result.oldRV > 0) {
      rvRows.push(["2023 List", cur(result.oldRV)]);
    }
    rvRows.push(["2026 List", cur(result.inputs.rateableValue)]);
    if (result.oldRV && result.oldRV > 0 && result.inputs.rateableValue) {
      var ch = result.inputs.rateableValue - result.oldRV;
      var pct = ((ch / result.oldRV) * 100).toFixed(1);
      var pfx = ch >= 0 ? "+" : "";
      rvRows.push(["Change", pfx + cur(Math.abs(ch)) + " (" + pfx + pct + "%)"]);
    }

    doc.autoTable({
      startY: leftY,
      margin: { left: m, right: pw - m - colW },
      body: rvRows,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 } },
      columnStyles: {
        0: { textColor: C.grey },
        1: { fontStyle: "bold", halign: "right" },
      },
    });

    // Right: Key Figures
    var rightX = m + colW + 8;
    var rightY = sectionHead("Key Figures", rightX, y);
    var kfRows = [
      ["Multiplier", s.multiplier.label],
      ["Basic bill", cur(s.basicBill)],
      ["Annual bill", cur(result.annualBill)],
      ["Monthly bill", cur(result.monthlyBill)],
    ];

    doc.autoTable({
      startY: rightY,
      margin: { left: rightX, right: m },
      body: kfRows,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 } },
      columnStyles: {
        0: { textColor: C.grey },
        1: { fontStyle: "bold", halign: "right" },
      },
      didParseCell: function (data) {
        if (data.row.index === 2 && data.section === "body") {
          data.cell.styles.fillColor = C.dark;
          data.cell.styles.textColor = C.white;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    // ── Bill Breakdown (reliefs) ──
    var tableBottom = Math.max(doc.lastAutoTable.finalY, leftY + rvRows.length * 8 + 5);
    var brkY = sectionHead("Bill Breakdown", m, tableBottom + 8);

    var brkRows = [];
    if (s.sbrr.reliefPercent > 0) {
      brkRows.push(["Small Business Rate Relief (" + s.sbrr.reliefPercent.toFixed(0) + "%)", "-" + cur(s.basicBill - s.sbrr.billAfterSBRR)]);
    }
    if (s.pubsRelief.applies) {
      brkRows.push(["Pubs & Venues Relief (15%)", "-" + cur(s.pubsRelief.amount)]);
    }
    if (s.transitionalRelief.applies) {
      brkRows.push(["Transitional Relief (cap " + s.transitionalRelief.capPercent + "%)", "-" + cur(s.transitionalRelief.saving)]);
    }
    if (s.ssbRelief.applies) {
      brkRows.push(["Supporting Small Business Relief", "-" + cur(s.ssbRelief.saving)]);
    }
    if (s.supplement.applies) {
      brkRows.push(["Transitional Supplement (1p)", "+" + cur(s.supplement.amount)]);
    }

    if (brkRows.length > 0) {
      doc.autoTable({
        startY: brkY,
        margin: { left: m, right: m },
        body: brkRows,
        theme: "striped",
        styles: { fontSize: 10, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
        alternateRowStyles: { fillColor: C.off },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 50, halign: "right", fontStyle: "bold" },
        },
      });
      brkY = doc.lastAutoTable.finalY + 6;
    }

    // ── VacatAd Savings ──
    var savY = sectionHead("VacatAd Savings Estimate", m, brkY + 3);
    var cycle = result.inputs.isIndustrial ? "6 months (industrial)" : "3 months (standard)";
    var savRows = [
      ["Relief cycle", cycle],
      ["Rates-free weeks", result.reliefWeeks + " of " + result.weeksPerYear],
      ["Potential annual saving", cur(result.potentialAnnualSaving)],
      ["VacatAd fee (" + result.vacatadFee.feePercent + "%)", cur(result.vacatadFee.feeAmount)],
      ["Net annual saving", cur(result.potentialNetSaving)],
      ["Net monthly saving", cur(Math.round(result.potentialNetSaving / 12 * 100) / 100)],
    ];

    doc.autoTable({
      startY: savY,
      margin: { left: m, right: m },
      body: savRows,
      theme: "striped",
      styles: { fontSize: 10, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
      alternateRowStyles: { fillColor: C.off },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 50, halign: "right", fontStyle: "bold" },
      },
      didParseCell: function (data) {
        if (data.row.index === 4 && data.section === "body") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = C.green;
          data.cell.styles.textColor = C.white;
          data.cell.styles.fontSize = 11;
        }
      },
    });

    // ── CTA bar ──
    var ctaBarY = doc.lastAutoTable.finalY + 8;
    if (ctaBarY < ph - 30) {
      doc.setFillColor.apply(doc, C.teal);
      doc.roundedRect(m, ctaBarY, cw, 16, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor.apply(doc, C.white);
      doc.textWithLink("Ready to start saving?  vacatad.com/contact  |  0333 090 0443", pw / 2, ctaBarY + 10.5, { align: "center", url: "https://vacatad.com/contact" });
    }

    // Disclaimer
    doc.setFontSize(7);
    doc.setTextColor.apply(doc, C.ltGrey);
    doc.text("Estimates based on 2026/27 multipliers and published relief schemes. Actual bills determined by your local billing authority.", m, ph - 10);
    doc.text("Rateable values set by the Valuation Office Agency. This report does not constitute financial advice.", m, ph - 6);

    /* ═════════════════════════════════════════════
       PAGE 2: HOW VACATAD WORKS + CTA
       ═════════════════════════════════════════════ */
    doc.addPage();

    // Mini header ribbon
    doc.setFillColor.apply(doc, C.dark);
    doc.rect(0, 0, pw, 16, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text("How VacatAd Works", m, 10.5);
    doc.text("vacatad.com", pw - m, 10.5, { align: "right" });

    var hy = 30;
    doc.setFillColor.apply(doc, C.mint);
    doc.rect(m, hy - 5, 3, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor.apply(doc, C.dark);
    doc.text("Our Process", m + 8, hy);

    hy += 8;
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
      { num: "03", title: "Beneficial Occupation", desc: "We create compliant occupation for the required period, resetting relief cycles and reducing your holding costs." },
      { num: "04", title: "Compliance Evidence", desc: "Continuous monitoring produces documented proof of genuine occupation with a full audit trail." },
      { num: "05", title: "Ongoing Savings", desc: "Relief cycles are managed continuously. You receive regular reporting and our team handles everything." },
    ];

    steps.forEach(function (step) {
      // Number badge
      doc.setFillColor.apply(doc, C.dark);
      doc.circle(m + 8, hy + 2.5, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, C.mint);
      doc.text(step.num, m + 8, hy + 4, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor.apply(doc, C.dark);
      doc.text(step.title, m + 18, hy + 4);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      var dLines = doc.splitTextToSize(step.desc, cw - 20);
      doc.text(dLines, m + 18, hy + 11);
      hy += 11 + dLines.length * 5 + 8;
    });

    // ── Why Choose VacatAd (2x2 grid) ──
    hy += 4;
    doc.setFillColor.apply(doc, C.mint);
    doc.rect(m, hy - 5, 3, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor.apply(doc, C.dark);
    doc.text("Why Choose VacatAd", m + 8, hy);
    hy += 10;

    var whyItems = [
      { title: "Technology-First", desc: "Plug-and-play Wi-Fi routers with real-time monitoring" },
      { title: "100% Compliant", desc: "Fully aligned with VOA regulations and current case law" },
      { title: "Rapid Deployment", desc: "Go live in under a week from first call" },
      { title: "Proven Track Record", desc: "100% success rate across 250+ UK properties" },
    ];
    var boxW = (cw - 8) / 2;
    whyItems.forEach(function (item, i) {
      var col = i % 2;
      var row = Math.floor(i / 2);
      var bx = m + col * (boxW + 8);
      var by = hy + row * 28;
      doc.setFillColor.apply(doc, C.off);
      doc.roundedRect(bx, by, boxW, 24, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor.apply(doc, C.dark);
      doc.text(item.title, bx + 6, by + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, C.grey);
      doc.text(item.desc, bx + 6, by + 18);
    });

    // ── CTA section at bottom ──
    var ctaTop = ph - 52;
    doc.setFillColor.apply(doc, C.dark);
    doc.roundedRect(m, ctaTop, cw, 40, 4, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor.apply(doc, C.white);
    doc.text("Ready to Reduce Your Business Rates?", pw / 2, ctaTop + 14, { align: "center" });

    if (result.potentialNetSaving > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor.apply(doc, C.mint);
      doc.text("This property could save " + cur(result.potentialNetSaving) + " per year", pw / 2, ctaTop + 24, { align: "center" });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.textWithLink("vacatad.com/contact  |  hello@vacatad.com  |  0333 090 0443", pw / 2, ctaTop + 34, { align: "center", url: "https://vacatad.com/contact" });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor.apply(doc, C.ltGrey);
    doc.text("VacatAd Ltd  |  86-90 Paul Street, London, EC2A 4NA  |  Company registered in England & Wales", pw / 2, ph - 6, { align: "center" });

    // ── Page numbers ──
    var totalPages = doc.internal.getNumberOfPages();
    for (var p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor.apply(doc, C.ltGrey);
      if (p > 1) {
        doc.text(dateStr, m, ph - 6);
        doc.text("Page " + p + " of " + totalPages, pw - m, ph - 6, { align: "right" });
      }
    }

    // Save
    var fileName = "VacatAd-Assessment";
    if (postcode) fileName += "-" + postcode.replace(/\s+/g, "");
    fileName += "-2026-27.pdf";
    doc.save(fileName);

    if (typeof gtag === "function") {
      gtag("event", "single_pdf_export", {
        event_category: "engagement",
        annual_bill: result.annualBill,
        net_saving: result.potentialNetSaving,
      });
    }
  }

  /* Expose globally so calculator.js can call it directly on submit */
  window.generateSinglePDF = generateSinglePDF;
})();
