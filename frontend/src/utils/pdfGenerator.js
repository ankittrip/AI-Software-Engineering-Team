import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ✅ Helper: Safely extract text from AI JSON objects to avoid [object Object] in PDFs
const toText = (val, ...keys) => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  for (const k of keys) {
    if (val[k]) return val[k];
  }
  return JSON.stringify(val);
};

export const generatePDF = (scan) => {
  const doc = new jsPDF();
  const data = scan?.data || scan; // Handle nested API response structures

  // =====================================
  // COVER PAGE
  // =====================================

  doc.setFontSize(24);
  doc.text(
    "AI Software Engineering Team",
    105,
    35,
    { align: "center" }
  );

  doc.setFontSize(18);
  doc.text(
    "Code Audit Report",
    105,
    50,
    { align: "center" }
  );

  doc.setDrawColor(180);
  doc.line(20, 60, 190, 60);

  doc.setFontSize(12);

  doc.text(
    `Repository: ${data.repository || data.repoUrl || "Unknown"}`,
    20,
    90
  );

  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    20,
    100
  );

  doc.text(
    `Risk Level: ${data.riskLevel || "UNKNOWN"}`,
    20,
    110
  );

  doc.setFontSize(26);

  doc.text(
    `${data.overallScore || 0}/100`,
    20,
    140
  );

  doc.setFontSize(12);

  doc.text(
    "Overall Security & Quality Score",
    20,
    150
  );

  // =====================================
  // EXECUTIVE SUMMARY PAGE
  // =====================================

  doc.addPage();

  doc.setFontSize(20);
  doc.text("Executive Summary", 14, 20);

  doc.roundedRect(10, 30, 190, 60, 3, 3);

  doc.setFontSize(11);
  doc.text(
    doc.splitTextToSize(
      data.summary || "No summary available",
      175
    ),
    15,
    40
  );

  // Strengths
  autoTable(doc, {
    startY: 105,
    head: [["Key Strengths"]],
    body: data.strengths?.length > 0 
      ? data.strengths.map((item) => [toText(item, 'finding', 'observation')])
      : [["No strengths found"]],
  });

  // Weaknesses
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Critical Weaknesses"]],
    body: data.weaknesses?.length > 0
      ? data.weaknesses.map((item) => [toText(item, 'finding', 'observation', 'description')])
      : [["No weaknesses found"]],
  });

  // =====================================
  // ARCHITECTURE PAGE
  // =====================================

  doc.addPage();
  doc.setFontSize(20);
  doc.text("Architecture Analysis", 14, 20);

  doc.setFontSize(12);
  doc.text(`Architecture Score: ${data.architecture?.architectureScore || 0}/100`, 14, 30);

  autoTable(doc, {
    startY: 35,
    head: [["Technology Stack"]],
    body: data.architecture?.techStack?.length > 0
      ? [ [data.architecture.techStack.join(', ')] ]
      : [["No Data"]],
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Architecture Pattern"]],
    body: [
      [data.architecture?.architecturePattern || "Unknown"],
    ],
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Architectural Findings"]],
    body: data.architecture?.architecturalObservations?.length > 0
      ? data.architecture.architecturalObservations.map((item) => [toText(item, 'observation', 'finding')])
      : [["No Findings"]],
  });

  // =====================================
  // SECURITY PAGE
  // =====================================

  doc.addPage();
  doc.setFontSize(20);
  doc.text("Security Analysis", 14, 20);

  doc.setFontSize(12);
  doc.text(`Security Score: ${data.security?.securityScore || 0}/100`, 14, 30);

  autoTable(doc, {
    startY: 35,
    head: [["Critical Threats"]],
    body: data.security?.criticalThreats?.length > 0
      ? data.security.criticalThreats.map((item) => [toText(item, 'finding', 'issue')])
      : [["No Critical Threats"]],
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Security Recommendations"]],
    body: data.security?.securityRecommendations?.length > 0
      ? data.security.securityRecommendations.map((item) => [toText(item, 'action', 'finding')])
      : [["No Recommendations"]],
  });

  // =====================================
  // CODE REVIEW & PERFORMANCE PAGE
  // =====================================

  doc.addPage();
  doc.setFontSize(20);
  doc.text("Code Review & Performance", 14, 20);

  doc.setFontSize(12);
  doc.text(`Code Quality: ${data.codeReview?.qualityRating || 'N/A'} (${data.codeReview?.codeQualityScore || 0}/100)`, 14, 30);
  
  autoTable(doc, {
    startY: 35,
    head: [["Code Smells Detected"]],
    body: data.codeReview?.codeSmells?.length > 0
      ? data.codeReview.codeSmells.map((item) => [toText(item, 'finding')])
      : [["No Major Smells"]],
  });

  doc.setFontSize(12);
  doc.text(`Performance: ${data.performance?.performanceRating || 'N/A'} (${data.performance?.performanceScore || 0}/100)`, 14, doc.lastAutoTable.finalY + 15);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [["Identified Bottlenecks"]],
    body: data.performance?.bottlenecks?.length > 0
      ? data.performance.bottlenecks.map((item) => [toText(item, 'issue', 'finding')])
      : [["No Bottlenecks"]],
  });

  // =====================================
  // DEPENDENCY PAGE
  // =====================================

  doc.addPage();
  doc.setFontSize(20);
  doc.text("Dependency Analysis", 14, 20);

  // ⚡ FIX: Used the updated 'healthScore' property from the backend
  doc.setFontSize(12);
  doc.text(`Health Score: ${data.dependencies?.healthScore ?? 0}/100`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [["Dependency Strengths"]],
    body: data.dependencies?.strengths?.length > 0
      ? data.dependencies.strengths.map((item) => [toText(item, 'finding')])
      : [["No Data"]],
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Security Risks & Issues"]],
    body: data.dependencies?.issues?.length > 0
      ? data.dependencies.issues.map((item) => {
          if (typeof item === 'string') return [item];
          return [item.package ? `${item.package}: ${item.reason || item.finding}` : toText(item, 'finding', 'reason')];
        })
      : [["No Issues"]],
  });

  // =====================================
  // FINAL RECOMMENDATIONS PAGE
  // =====================================

  doc.addPage();
  doc.setFontSize(20);
  doc.text("Final Recommendations", 14, 20);

  autoTable(doc, {
    startY: 30,
    head: [["Priority Actions"]],
    body: data.recommendations?.length > 0
      ? data.recommendations.map((item, index) => [`P${index + 1}: ${toText(item, 'action', 'finding')}`])
      : [["No Recommendations"]],
  });

  // =====================================
  // PAGE NUMBERS
  // =====================================

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Page ${i} of ${pageCount}`, 180, 290);
  }

  // =====================================
  // SAVE
  // =====================================

  const repoFileName = (data.repository || data.repoUrl || "scan").replace(/https:\/\/github\.com\//g, '').replace(/\//g, '-');
  doc.save(`Audit-Report-${repoFileName}.pdf`);
};