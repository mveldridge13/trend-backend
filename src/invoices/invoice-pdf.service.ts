import { Injectable } from "@nestjs/common";
// pdfkit is a CommonJS module that exports the constructor via `export =`.
// This project compiles without `esModuleInterop`, so a default import emits
// `pdfkit_1.default` (undefined at runtime). Import-equals is the correct form.
import PDFDocument = require("pdfkit");
import { InvoiceWithRelations } from "./repositories/invoices.repository";

@Injectable()
export class InvoicePdfService {
  // Renders an invoice to a PDF buffer suitable for emailing as an attachment.
  async generate(
    invoice: InvoiceWithRelations,
    from: { name: string; email: string },
  ): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const money = (value: unknown) =>
        `${invoice.currency} ${Number(value).toFixed(2)}`;
      const date = (value: Date) =>
        new Date(value).toISOString().split("T")[0];

      // Header
      doc.fontSize(26).text("INVOICE", { align: "right" });
      doc
        .fontSize(10)
        .text(invoice.invoiceNumber, { align: "right" })
        .text(`Issued: ${date(invoice.issueDate)}`, { align: "right" })
        .text(`Due: ${date(invoice.dueDate)}`, { align: "right" });

      // From / To
      doc.moveDown(2);
      const topY = doc.y;
      doc.fontSize(10).font("Helvetica-Bold").text("From", 50, topY);
      doc
        .font("Helvetica")
        .text(from.name)
        .text(from.email);

      doc.font("Helvetica-Bold").text("Bill To", 320, topY);
      doc.font("Helvetica").text(invoice.client.name);
      if (invoice.client.company) doc.text(invoice.client.company);
      doc.text(invoice.client.email);
      if (invoice.client.address) doc.text(invoice.client.address);

      // Line items table
      doc.moveDown(3);
      let y = doc.y;
      doc.font("Helvetica-Bold").fontSize(10);
      doc.text("Description", 50, y);
      doc.text("Qty", 300, y, { width: 50, align: "right" });
      doc.text("Unit", 360, y, { width: 80, align: "right" });
      doc.text("Amount", 450, y, { width: 95, align: "right" });
      y += 18;
      doc
        .moveTo(50, y)
        .lineTo(545, y)
        .strokeColor("#cccccc")
        .stroke();
      y += 8;

      doc.font("Helvetica").fontSize(10);
      for (const item of invoice.lineItems) {
        doc.text(item.description, 50, y, { width: 240 });
        doc.text(Number(item.quantity).toString(), 300, y, {
          width: 50,
          align: "right",
        });
        doc.text(money(item.unitPrice), 360, y, { width: 80, align: "right" });
        doc.text(money(item.amount), 450, y, { width: 95, align: "right" });
        y = doc.y + 8;
      }

      doc
        .moveTo(50, y)
        .lineTo(545, y)
        .strokeColor("#cccccc")
        .stroke();
      y += 12;

      // Totals
      const totalRow = (label: string, value: unknown, bold = false) => {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica");
        doc.text(label, 360, y, { width: 80, align: "right" });
        doc.text(money(value), 450, y, { width: 95, align: "right" });
        y += 16;
      };
      totalRow("Subtotal", invoice.subtotal);
      if (Number(invoice.discountTotal) > 0)
        totalRow("Discount", invoice.discountTotal);
      if (Number(invoice.taxTotal) > 0) totalRow("Tax", invoice.taxTotal);
      totalRow("Total", invoice.total, true);

      // Notes & terms
      if (invoice.notes) {
        doc.moveDown(3).font("Helvetica-Bold").text("Notes", 50);
        doc.font("Helvetica").text(invoice.notes, { width: 495 });
      }
      if (invoice.terms) {
        doc.moveDown(1).font("Helvetica-Bold").text("Terms", 50);
        doc.font("Helvetica").text(invoice.terms, { width: 495 });
      }

      doc.end();
    });
  }
}
