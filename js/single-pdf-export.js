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

  function generateSinglePDF(result, prop) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF("p", "mm", "a4");
    var pw = 210, ph = 297, m = 20;
    var cw = pw - m * 2;
    var s = result.steps;

    var gateData = null;
    try { gateData = JSON.parse(localStorage.getItem("vacatad_gate_v1")); } catch (e) {}
    var userName    = gateData ? gateData.name    : "";
    var userCompany = gateData ? gateData.company : "";
    var userEmail   = gateData ? gateData.email   : "";
    var dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    // Build address line from prop or fall back
    var address = prop ? prop.full_address : "Property Assessment";
    var postcode = prop ? prop.postcode : "";
    var descText = prop ? prop.description_text : "";

    /* ══════════════════════════════════════════════════
       PAGE 1: COVER + PROPERTY DETAILS
       ══════════════════════════════════════════════════ */

    // Dark header
    doc.setFillColor(26, 28, 26);
    doc.rect(0, 0, pw, 65, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(219, 244, 204);
    doc.text("VacatAd", m, 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text("Business Rates Specialists  |  vacatad.com", m, 40);

    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text("0333 090 0443  |  hello@vacatad.com", pw - m, 28, { align: "right" });

    // Accent line
    doc.setFillColor(219, 244, 204);
    doc.rect(0, 65, pw, 1.5, "F");

    // Report title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(26, 28, 26);
    doc.text("Business Rates Assessment 2026/27", m, 82);

    // Prepared for + date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(130);
    var metaLine = dateStr;
    if (userName) metaLine = "Prepared for " + userName + (userCompany ? " (" + userCompany + ")" : "") + "  |  " + dateStr;
    doc.text(metaLine, m, 90);
    if (userEmail) {
      doc.text(userEmail, m, 96);
    }

    // ── Property address ──
    var propY = userEmail ? 110 : 104;
    doc.setFillColor(219, 244, 204);
    doc.rect(m, propY - 4.5, 3, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(26, 28, 26);
    doc.text("Property", m + 7, propY);

    var titleLines = doc.splitTextToSize(address, cw - 7);
    doc.setFontSize(12);
    doc.text(titleLines, m + 7, propY + 8);
    var afterAddr = propY + 8 + titleLines.length * 5.5;

    // Meta line
    if (descText || postcode) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100);
      var metaParts = [];
      if (descText) metaParts.push(descText);
      if (postcode) metaParts.push(postcode);
      if (prop && prop.is_rhl) metaParts.push("Retail, Hospitality & Leisure");
      if (prop && prop.is_industrial) metaParts.push("Industrial");
      if (prop && prop.is_london) metaParts.push("London");
      doc.text(metaParts.join("  |  "), m + 7, afterAddr + 3);
      afterAddr += 8;
    }

    // ── Rateable Values ──
    var rvY = afterAddr + 8;
    doc.setFillColor(219, 244, 204);
    doc.rect(m, rvY - 4.5, 3, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(26, 28, 26);
    doc.text("Rateable Values", m + 7, rvY);

    var rvRows = [];
    if (result.oldRV && result.oldRV > 0) {
      rvRows.push(["2023 List (previous)", cur(result.oldRV)]);
    }
    rvRows.push(["2026 List (current)", cur(result.inputs.rateableValue)]);
    if (result.oldRV && result.oldRV > 0 && result.inputs.rateableValue) {
      var ch = result.inputs.rateableValue - result.oldRV;
      var pct = ((ch / result.oldRV) * 100).toFixed(1);
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
    doc.setFontSize(13);
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
    doc.setFontSize(13);
    doc.setTextColor(26, 28, 26);
    doc.text("VacatAd Savings Estimate", m + 7, savY);

    var cycle = result.inputs.isIndustrial ? "6 months (industrial)" : "3 months (standard)";
    var savRows = [
      ["Empty property relief cycle", cycle],
      ["Rates-free weeks per year", result.reliefWeeks + " of " + result.weeksPerYear],
      ["Potential annual saving", cur(result.potentialAnnualSaving)],
      ["VacatAd fee (" + result.vacatadFee.feePercent + "%)", cur(result.vacatadFee.feeAmount)],
      ["Net annual saving", cur(result.potentialNetSaving)],
      ["Net monthly saving", cur(Math.round(result.potentialNetSaving / 12 * 100) / 100)],
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

    // ── CTA bar ──
    var ctaY = doc.lastAutoTable.finalY + 12;
    if (ctaY < ph - 50) {
      doc.setFillColor(90, 184, 187);
      doc.roundedRect(m, ctaY, cw, 18, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.textWithLink("Ready to start saving? Contact us: vacatad.com/contact  |  0333 090 0443", pw / 2, ctaY + 11.5, { align: "center", url: "https://vacatad.com/contact" });
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text("Estimates based on 2026/27 multipliers and published relief schemes. Actual bills determined by your local billing authority.", m, ph - 12);
    doc.text("Rateable values are set by the Valuation Office Agency. This report does not constitute financial advice.", m, ph - 7);
    doc.text(dateStr, m, ph - 2);
    doc.text("vacatad.com", pw - m, ph - 2, { align: "right" });

    // Build filename
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
})();
