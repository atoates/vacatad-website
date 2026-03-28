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

  function trunc(s, max) {
    if (!s) return "";
    return s.length > max ? s.substring(0, max - 1) + "\u2026" : s;
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

    // ── CTA bar on page 1 ──
    var ctaY = doc.lastAutoTable.finalY + 12;
    if (ctaY < ph - 50) {
      doc.setFillColor(90, 184, 187);
      doc.roundedRect(m, ctaY, cw, 18, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.textWithLink("Ready to start saving? Contact us: vacatad.com/contact  |  0333 090 0443", pw / 2, ctaY + 11.5, { align: "center", url: "https://vacatad.com/contact" });
    }

    // Page 1 disclaimer
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text("Estimates based on 2026/27 multipliers and published relief schemes. Actual bills determined by your local billing authority.", m, ph - 12);
    doc.text("Rateable values are set by the Valuation Office Agency. This report does not constitute financial advice.", m, ph - 7);

    /* ── Helper: draw page header ribbon ── */
    function drawPageHeader(leftText, rightText) {
      doc.setFillColor(26, 28, 26);
      doc.rect(0, 0, pw, 14, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(200, 200, 200);
      doc.text(leftText, m, 9);
      doc.text(rightText, pw - m, 9, { align: "right" });
    }

    /* ── Helper: draw section heading with accent bar ── */
    function drawSectionHeading(title, y) {
      doc.setFillColor(219, 244, 204);
      doc.rect(m, y - 4.5, 3, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(26, 28, 26);
      doc.text(title, m + 7, y);
      return y + 8;
    }

    /* ══════════════════════════════════════════════════
       PAGE 2: HOW VACATAD WORKS
       ══════════════════════════════════════════════════ */
    doc.addPage();
    drawPageHeader("How VacatAd Works", "vacatad.com");

    var hy = drawSectionHeading("Our Process", 28);
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
      doc.setFillColor(26, 28, 26);
      doc.circle(m + 7, hy + 2, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(219, 244, 204);
      doc.text(step.num, m + 7, hy + 3.5, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(26, 28, 26);
      doc.text(step.title, m + 16, hy + 3);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80);
      var descLines = doc.splitTextToSize(step.desc, cw - 16);
      doc.text(descLines, m + 16, hy + 9);
      hy += 9 + descLines.length * 4 + 8;
    });

    // Why VacatAd boxes
    hy += 4;
    var whyY = drawSectionHeading("Why Choose VacatAd", hy);
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
       PAGE 3: LATEST INSIGHTS / BLOG POSTS
       ══════════════════════════════════════════════════ */
    doc.addPage();
    drawPageHeader("Insights & Resources", "vacatad.com");

    var iy = drawSectionHeading("Latest Insights from VacatAd", 28);
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
      doc.setFillColor(246, 247, 248);
      doc.roundedRect(m, iy, cw, 30, 2, 2, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(90, 184, 187);
      doc.text(post.date, m + 4, iy + 7);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(26, 28, 26);
      var titleLines = doc.splitTextToSize(post.title, cw - 8);
      doc.textWithLink(titleLines[0], m + 4, iy + 13, { url: post.url });
      if (titleLines[1]) doc.textWithLink(titleLines[1], m + 4, iy + 17.5, { url: post.url });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100);
      var descLine = trunc(post.desc, 120);
      var lastTitleY = titleLines[1] ? iy + 17.5 : iy + 13;
      doc.text(descLine, m + 4, lastTitleY + 5.5);

      iy += 34;
    });

    iy += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 184, 187);
    doc.textWithLink("View all insights at vacatad.com/blog", m + 7, iy, { url: "https://vacatad.com/blog/" });

    /* ══════════════════════════════════════════════════
       PAGE 4: CTA / CONTACT
       ══════════════════════════════════════════════════ */
    doc.addPage();

    doc.setFillColor(26, 28, 26);
    doc.rect(0, 0, pw, ph, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.setTextColor(219, 244, 204);
    doc.text("VacatAd", pw / 2, 80, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(200, 200, 200);
    doc.text("Business Rates Specialists", pw / 2, 92, { align: "center" });

    doc.setDrawColor(219, 244, 204);
    doc.setLineWidth(0.5);
    doc.line(pw / 2 - 30, 102, pw / 2 + 30, 102);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("Ready to Reduce Your", pw / 2, 125, { align: "center" });
    doc.text("Business Rates?", pw / 2, 137, { align: "center" });

    if (result.potentialNetSaving > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(180, 180, 180);
      doc.text("This property could save an estimated", pw / 2, 155, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(219, 244, 204);
      doc.text(cur(result.potentialNetSaving) + " per year", pw / 2, 170, { align: "center" });
    }

    var ctaBtnY = 190;
    doc.setFillColor(90, 184, 187);
    doc.roundedRect(pw / 2 - 50, ctaBtnY, 100, 16, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.textWithLink("Get in Touch", pw / 2, ctaBtnY + 10.5, { align: "center", url: "https://vacatad.com/contact" });

    var cdY = 222;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.textWithLink("vacatad.com/contact", pw / 2, cdY, { align: "center", url: "https://vacatad.com/contact" });
    doc.text("hello@vacatad.com  |  0333 090 0443", pw / 2, cdY + 10, { align: "center" });
    doc.text("86-90 Paul Street, London, EC2A 4NA", pw / 2, cdY + 20, { align: "center" });

    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text("VacatAd Ltd  |  Company registered in England & Wales", pw / 2, ph - 10, { align: "center" });

    /* ══════════════════════════════════════════════════
       PAGE NUMBERS (skip page 1 and final CTA page)
       ══════════════════════════════════════════════════ */
    var totalPages = doc.internal.getNumberOfPages();
    for (var p = 2; p < totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(160);
      doc.text("Page " + p + " of " + totalPages, pw / 2, ph - 8, { align: "center" });
      doc.text(dateStr, m, ph - 8);
      doc.text("vacatad.com", pw - m, ph - 8, { align: "right" });
    }

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
