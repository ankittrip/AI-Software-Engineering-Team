// File: src/utils/pdfGenerator.js

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePDF = (scan) => {
  const doc = new jsPDF();

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
    `Repository: ${scan.repository}`,
    20,
    90
  );

  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    20,
    100
  );

  doc.text(
    `Risk Level: ${scan.riskLevel}`,
    20,
    110
  );

  doc.setFontSize(26);

  doc.text(
    `${scan.overallScore || 0}/100`,
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

  doc.text(
    "Executive Summary",
    14,
    20
  );

  doc.roundedRect(
    10,
    30,
    190,
    60,
    3,
    3
  );

  doc.setFontSize(11);

  doc.text(
    doc.splitTextToSize(
      scan.summary || "No summary available",
      175
    ),
    15,
    40
  );

  // Strengths

  autoTable(doc, {
    startY: 105,
    head: [["Key Strengths"]],
    body:
      scan.strengths?.map((item) => [
        item,
      ]) || [["No strengths found"]],
  });

  autoTable(doc, {
    startY:
      doc.lastAutoTable.finalY + 10,
    head: [["Weaknesses"]],
    body:
      scan.weaknesses?.map((item) => [
        item,
      ]) || [["No weaknesses found"]],
  });

  // =====================================
  // ARCHITECTURE PAGE
  // =====================================

  doc.addPage();

  doc.setFontSize(20);

  doc.text(
    "Architecture Analysis",
    14,
    20
  );

  autoTable(doc, {
    startY: 30,
    head: [["Technology Stack"]],
    body:
      scan.architecture?.techStack?.map(
        (tech) => [tech]
      ) || [["No Data"]],
  });

  autoTable(doc, {
    startY:
      doc.lastAutoTable.finalY + 10,
    head: [["Architecture Pattern"]],
    body: [
      [
        scan.architecture
          ?.architecturePattern ||
          "Unknown",
      ],
    ],
  });

  autoTable(doc, {
    startY:
      doc.lastAutoTable.finalY + 10,
    head: [["Architectural Findings"]],
    body:
      scan.architecture?.architecturalObservations?.map(
        (item) => [
          typeof item === "string"
            ? item
            : item?.observation ||
              JSON.stringify(item),
        ]
      ) || [["No Findings"]],
  });

  // =====================================
  // SECURITY PAGE
  // =====================================

  doc.addPage();

  doc.setFontSize(20);

  doc.text(
    "Security Analysis",
    14,
    20
  );

  autoTable(doc, {
    startY: 30,
    head: [["Critical Threats"]],
    body:
      scan.security?.criticalThreats?.map(
        (item) => [item]
      ) || [["No Critical Threats"]],
  });

  autoTable(doc, {
    startY:
      doc.lastAutoTable.finalY + 10,
    head: [["Security Recommendations"]],
    body:
      scan.security?.securityRecommendations?.map(
        (item) => [item]
      ) || [["No Recommendations"]],
  });

  // =====================================
  // DEPENDENCY PAGE
  // =====================================

  doc.addPage();

  doc.setFontSize(20);

  doc.text(
    "Dependency Analysis",
    14,
    20
  );

  doc.text(
    `Health Score: ${
      scan.dependencies
        ?.dependencyHealthScore || 0
    }/100`,
    14,
    35
  );

  autoTable(doc, {
    startY: 45,
    head: [["Dependency Strengths"]],
    body:
      scan.dependencies?.strengths?.map(
        (item) => [item.finding]
      ) || [["No Data"]],
  });

  autoTable(doc, {
    startY:
      doc.lastAutoTable.finalY + 10,
    head: [["Security Risks"]],
    body:
      scan.dependencies?.securityRisks?.map(
        (item) => [
          `${item.severity}: ${item.finding}`,
        ]
      ) || [["No Risks"]],
  });

  autoTable(doc, {
    startY:
      doc.lastAutoTable.finalY + 10,
    head: [["Missing Essentials"]],
    body:
      scan.dependencies?.missingEssentials?.map(
        (item) => [
          `${item.package} - ${item.reason}`,
        ]
      ) || [["None"]],
  });

  // =====================================
  // RECOMMENDATIONS PAGE
  // =====================================

  doc.addPage();

  doc.setFontSize(20);

  doc.text(
    "Final Recommendations",
    14,
    20
  );

  autoTable(doc, {
    startY: 30,
    head: [["Priority Actions"]],
    body:
      scan.recommendations?.map(
        (item, index) => [
          `P${index + 1}: ${item}`,
        ]
      ) || [["No Recommendations"]],
  });

  // =====================================
  // PAGE NUMBERS
  // =====================================

  const pageCount =
    doc.getNumberOfPages();

  for (
    let i = 1;
    i <= pageCount;
    i++
  ) {
    doc.setPage(i);

    doc.setFontSize(10);

    doc.text(
      `Page ${i} of ${pageCount}`,
      180,
      290
    );
  }

  // =====================================
  // SAVE
  // =====================================

  doc.save(
    `audit-report-${Date.now()}.pdf`
  );
};