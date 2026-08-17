const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

// columns: [{ key, header, width? }]  rows: [{ [key]: value }]

async function toExcelBuffer({ title, columns, rows }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "IBWISE";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title.slice(0, 31) || "Report");
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 22 }));

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  sheet.getRow(1).alignment = { vertical: "middle" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  rows.forEach((r) => sheet.addRow(r));

  sheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell((cell) => {
      cell.border = { bottom: { style: "thin", color: { argb: "FFE5E7EB" } } };
    });
  });

  return workbook.xlsx.writeBuffer();
}

// Renders a simple, print-friendly landscape table PDF (title + generated-at
// stamp + header row + striped rows). Good enough for admin report exports
// without pulling in a full templating engine.
function toPdfBuffer({ title, subtitle, columns, rows }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: "A4", layout: "landscape" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(18).fillColor("#1F2937").text(title);
    doc.font("Helvetica").fontSize(9).fillColor("#6B7280")
      .text(`${subtitle ? subtitle + " — " : ""}Generated ${new Date().toLocaleString()}`);
    doc.moveDown(0.8);

    const startX = doc.page.margins.left;
    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = usableWidth / columns.length;
    let y = doc.y;

    function drawHeader() {
      doc.rect(startX, y, usableWidth, 20).fill("#1F2937");
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
      columns.forEach((c, i) => {
        doc.text(String(c.header), startX + i * colWidth + 4, y + 6, { width: colWidth - 8, ellipsis: true });
      });
      y += 20;
    }

    drawHeader();

    rows.forEach((r, idx) => {
      if (y > doc.page.height - doc.page.margins.bottom - 24) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeader();
      }
      if (idx % 2 === 0) doc.rect(startX, y, usableWidth, 18).fill("#F9FAFB");
      doc.fillColor("#111827").font("Helvetica").fontSize(8.5);
      columns.forEach((c, i) => {
        const val = r[c.key];
        doc.text(val === null || val === undefined ? "" : String(val), startX + i * colWidth + 4, y + 5, {
          width: colWidth - 8,
          ellipsis: true,
        });
      });
      y += 18;
    });

    doc.end();
  });
}

module.exports = { toExcelBuffer, toPdfBuffer };
