/* eslint-disable prefer-const */
import jsPDF from "jspdf";

// Helper to draw multiple lines of text
const drawMultiLineText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y, { lineHeightFactor: 1.1 });
  return lines.length * lineHeight; // Return height of the text block
};

// Generate blank Final Notice of Eviction Date form
export const generateBlankFinalNoticeOfEvictionDatePDF = (): void => {
  const doc = new jsPDF("p", "pt", "letter");
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - 2 * margin;
  const lineHeight = 14;
  let yPos = margin;

  // --- Draw static form structure ---
  doc.setLineWidth(1);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 4;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("FINAL NOTICE OF EVICTION DATE", pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += lineHeight * 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Landlord
  doc.text(
    "LANDLORD Name: ____________________________________________________________________",
    margin,
    yPos
  );
  yPos += lineHeight * 1.5;
  doc.text(
    "LANDLORD Address: _________________________________________________________________",
    margin,
    yPos
  );
  yPos += lineHeight * 1.5;
  doc.text(
    "LANDLORD City: ___________________, State: _________, Zip: ____________",
    margin,
    yPos
  );
  yPos += lineHeight * 1.5;
  doc.text("LANDLORD Telephone #: ____________________", margin, yPos);
  yPos += lineHeight * 1.5;
  doc.text(
    "LANDLORD Email Address: ________________________________________________",
    margin,
    yPos
  );
  yPos += lineHeight * 2;

  // Tenant
  doc.text(
    "TENANT Name: ______________________________________________________________________",
    margin,
    yPos
  );
  yPos += lineHeight * 1.5;
  doc.text(
    "TENANT Address: __________________________________________________________________",
    margin,
    yPos
  );
  yPos += lineHeight * 1.5;
  doc.text(
    "TENANT City: ______________________, State: _________, Zip: ____________",
    margin,
    yPos
  );
  yPos += lineHeight * 1.5;
  doc.text("TENANT Telephone #: _____________________", margin, yPos);
  yPos += lineHeight * 1.5;
  doc.text(
    "TENANT Email Address: _________________________________________________",
    margin,
    yPos
  );
  yPos += lineHeight * 2;

  // Case Info
  doc.text("District Court Case Number: _____________________", margin, yPos);
  doc.text(
    "Date Warrant Was Ordered by Court: _________________",
    margin + 300,
    yPos
  );
  yPos += lineHeight * 2.5;

  // Eviction Date
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    "Initial Scheduled Date of Eviction: _____________________________",
    margin,
    yPos
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  yPos += lineHeight * 2;

  // Redemption Info
  yPos += drawMultiLineText(
    doc,
    "The eviction may occur on the date named above unless you either:",
    margin,
    yPos,
    usableWidth,
    lineHeight
  );
  yPos += lineHeight * 0.5;
  yPos += drawMultiLineText(
    doc,
    "1. Move out of the property and return control of the property to the landlord;",
    margin + 15,
    yPos,
    usableWidth - 15,
    lineHeight
  );
  yPos += lineHeight * 0.5;
  doc.text("or", margin + 15, yPos);
  yPos += lineHeight * 1.5;
  yPos += drawMultiLineText(
    doc,
    "2. Exercise the right to redemption (or 'Pay and Stay') under § 8-401 of the Maryland Code, unless the judgment was entered without the right of redemption.",
    margin + 15,
    yPos,
    usableWidth - 15,
    lineHeight
  );
  yPos += lineHeight * 2;

  // Amount Due
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Amount Due to redeem the property", pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += lineHeight * 1.8;
  doc.setFontSize(12);
  doc.text("$________________________", pageWidth / 2, yPos, {
    align: "center",
  });
  yPos += lineHeight * 2.5;

  // Warning
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("WARNING", margin, yPos);
  yPos += lineHeight;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const warningText1 = `"YOU COULD LOSE ALL YOUR PERSONAL BELONGINGS LEFT INSIDE YOUR HOME WHEN THE EVICTION OCCURS. LOCAL LAWS AND PRACTICES ABOUT DISPOSAL OF ANY OF YOUR PERSONAL BELONGINGS UPON EVICTION VARY."`;
  yPos += drawMultiLineText(
    doc,
    warningText1,
    margin,
    yPos,
    usableWidth,
    lineHeight
  );
  yPos += lineHeight * 0.5;
  const warningText2 = `"YOU MAY SEEK ADVICE BY CALLING 211 FOR A LEGAL REFERRAL OR BY CONTACTING THE DISTRICT COURT HELP CENTER AT 410-260-1392 OR https://www.courts.state.md.us/helpcenter/inperson/dc"`;
  yPos += drawMultiLineText(
    doc,
    warningText2,
    margin,
    yPos,
    usableWidth,
    lineHeight
  );
  yPos += lineHeight * 2;

  // Affidavit
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("AFFIDAVIT OF POSTING:", margin, yPos);
  doc.setFont("helvetica", "normal");
  yPos += lineHeight * 1.2;
  const affidavitText = `I hereby certify that I posted a completed copy of the above notice on the front door of the premises described above on the date: _____________________`;
  yPos += drawMultiLineText(
    doc,
    affidavitText,
    margin,
    yPos,
    usableWidth,
    lineHeight
  );
  yPos += lineHeight * 2;

  doc.text("Printed Name: ________________________________", margin, yPos);
  doc.text("Signature: ________________________________", margin + 320, yPos);
  yPos += lineHeight * 1.5;
  doc.text("Date: ________________________", margin, yPos);

  doc.save("Blank_Final_Notice_of_Eviction_Date.pdf");
};

// Generate blank Certificate of Mailing (Form 3817)
export const generateBlankCertificateOfMailingPDF = (): void => {
  const doc = new jsPDF("p", "pt", "letter");
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = margin;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("UNITED STATES\nPOSTAL SERVICE®", margin, y);
  doc.setFontSize(18);
  doc.text("Certificate Of\nMailing", 280, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("To pay fee, affix stamps or\nmeter postage here.", 450, y + 10);
  y += 50;

  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.text(
    "This Certificate of Mailing provides evidence that mail has been presented to USPS® for mailing.\nThis form may be used for domestic and international mail.",
    margin,
    y
  );
  y += 30;

  // From section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("From:", margin, y);
  y += 15;
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 25;
  doc.line(margin, y, pageWidth - margin, y);
  y += 25;
  doc.line(margin, y, pageWidth - margin, y);
  y += 25;
  doc.line(margin, y, pageWidth - margin, y);
  y += 35;

  // To section
  doc.text("To:", margin, y);
  const toLineY = y;
  y += 15;
  doc.line(margin, y, pageWidth - margin - 150, y);
  y += 25;
  doc.line(margin, y, pageWidth - margin - 150, y);
  y += 25;
  doc.line(margin, y, pageWidth - margin - 150, y);
  y += 25;
  doc.line(margin, y, pageWidth - margin - 150, y);
  y += 25;

  // Postmark Here box
  doc.rect(pageWidth - margin - 130, toLineY - 10, 130, 100);
  doc.text("Postmark Here", pageWidth - margin - 120, toLineY + 50);

  y = toLineY + 130;

  // Footer
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;
  doc.setFontSize(9);
  doc.text("PS Form 3817, April 2007  PSN 7530-02-000-9065", margin, y);

  doc.save("Blank_Certificate_of_Mailing_3817.pdf");
};

// Generate blank Firmbook (Form 3665)
export const generateBlankFirmbookPDF = (): void => {
  const doc = new jsPDF("l", "pt", "letter"); // landscape
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;
  let x = margin;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("UNITED STATES\nPOSTAL SERVICE®", x, y);

  doc.setFontSize(16);
  doc.text("Certificate of Mailing — Firm", pageWidth - margin, y + 10, {
    align: "right",
  });
  y += 40;

  // Sender Info & Top Boxes
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Name and Address of Sender", x, y);
  y += 15;
  const senderBoxX = x;
  const senderBoxY = y;
  const senderBoxWidth = 200;
  const senderBoxHeight = 100;
  doc.rect(senderBoxX, senderBoxY, senderBoxWidth, senderBoxHeight);

  const topBoxY = senderBoxY;
  const topBoxX = senderBoxX + senderBoxWidth + 10;
  const topBoxWidth1 = 150;
  const topBoxWidth2 = 180;
  const topBoxHeight1 = 50;
  const topBoxHeight2 = 50;

  // Top boxes
  doc.rect(topBoxX, topBoxY, topBoxWidth1, topBoxHeight1);
  doc.text("TOTAL NO.\nof Pieces Listed by Sender", topBoxX + 5, topBoxY + 15);

  doc.rect(topBoxX + topBoxWidth1, topBoxY, topBoxWidth2, topBoxHeight1);
  doc.text(
    "TOTAL NO.\nof Pieces Received at Post Office™",
    topBoxX + topBoxWidth1 + 5,
    topBoxY + 15
  );

  const stampBoxX = topBoxX + topBoxWidth1 + topBoxWidth2 + 10;
  const stampBoxWidth = pageWidth - margin - stampBoxX;
  const stampBoxHeight = topBoxHeight1 + topBoxHeight2;
  doc.rect(stampBoxX, topBoxY, stampBoxWidth, stampBoxHeight);
  doc.setFont("helvetica", "bold");
  doc.text(
    "Affix Stamp Here\nPostmark with Date of Receipt.",
    stampBoxX + 5,
    topBoxY + 15
  );
  doc.setFont("helvetica", "normal");

  doc.rect(
    topBoxX,
    topBoxY + topBoxHeight1,
    topBoxWidth1 + topBoxWidth2,
    topBoxHeight2
  );
  doc.text(
    "Postmaster, per (name of receiving employee)",
    topBoxX + 5,
    topBoxY + topBoxHeight1 + 15
  );

  y += senderBoxHeight + 10;

  // Main Table
  const tableStartY = y;
  const colWidths = [150, 250, 70, 70, 90, 90];
  const colHeaders = [
    "USPS Tracking Number\nFirm-specific Identifier",
    "Address\n(Name, Street, City, State, and ZIP Code™)",
    "Postage",
    "Fee",
    "Special Handling",
    "Parcel Airlift",
  ];
  const rowHeight = 30;
  const headerRowHeight = 40;
  const numRows = 6;

  // Draw headers
  doc.setFont("helvetica", "bold");
  let currentX = x;
  for (let i = 0; i < colHeaders.length; i++) {
    doc.rect(currentX, tableStartY, colWidths[i], headerRowHeight);
    doc.text(colHeaders[i], currentX + 5, tableStartY + 15, {
      lineHeightFactor: 1.1,
    });
    currentX += colWidths[i];
  }

  // Draw rows
  doc.setFont("helvetica", "normal");
  for (let i = 0; i < numRows; i++) {
    const rowY = tableStartY + headerRowHeight + i * rowHeight;
    let currentX = x;
    for (let j = 0; j < colWidths.length; j++) {
      doc.rect(currentX, rowY, colWidths[j], rowHeight);
      if (j === 0) {
        doc.text(`${i + 1}.`, currentX + 5, rowY + rowHeight / 2 + 5);
      }
      currentX += colWidths[j];
    }
  }

  // Footer
  const footerY = pageHeight - margin + 10;
  doc.setFontSize(9);
  doc.text(
    "PS Form 3665, January 2017 (Page ___ of ___) PSN 7530-17-000-5549",
    x,
    footerY
  );
  doc.text("See Reverse for Instructions", pageWidth - margin, footerY, {
    align: "right",
  });

  doc.save("Blank_Firmbook_3665.pdf");
};
