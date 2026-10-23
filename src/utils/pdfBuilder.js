import PDFDocument from "pdfkit";

export const buildPdf = ({ title, userName, dateRange, headers, rows }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Header branding
      doc.fontSize(22).font("Helvetica-Bold").fillColor("#111111").text("FORGE", { align: "left" });
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#333333").text(title, { align: "left" });
      doc.moveDown(0.5);

      doc.fontSize(10).font("Helvetica").fillColor("#666666");
      if (userName) doc.text(`Athlete: ${userName}`);
      if (dateRange) doc.text(`Period: ${dateRange}`);
      doc.text(`Generated on: ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`);
      doc.moveDown(1);

      // Table layout
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const numCols = headers.length;
      const colWidth = pageWidth / numCols;
      const startX = doc.page.margins.left;

      const drawHeader = () => {
        const y = doc.y;
        doc.rect(startX, y, pageWidth, 22).fill("#222222");
        doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8);
        headers.forEach((header, i) => {
          doc.text(String(header), startX + i * colWidth + 4, y + 6, {
            width: colWidth - 8,
            ellipsis: true,
          });
        });
        doc.y = y + 24;
      };

      drawHeader();

      let isAlt = false;
      rows.forEach((row) => {
        if (doc.y + 20 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          drawHeader();
        }

        const y = doc.y;
        if (isAlt) {
          doc.rect(startX, y, pageWidth, 18).fill("#f9f9f9");
        }
        isAlt = !isAlt;

        doc.fillColor("#222222").font("Helvetica").fontSize(7.5);
        row.forEach((cell, i) => {
          doc.text(String(cell ?? ""), startX + i * colWidth + 4, y + 4, {
            width: colWidth - 8,
            ellipsis: true,
          });
        });
        doc.y = y + 18;
      });

      doc.moveDown(1);
      if (doc.y + 30 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }

      doc.fontSize(10).font("Helvetica-Bold").fillColor("#111111");
      doc.text(`Total Records: ${rows.length}`, { align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
