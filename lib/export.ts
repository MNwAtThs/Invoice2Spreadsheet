import type { ExtractedDocument } from "@/types";

declare global {
  interface Window {
    XLSX?: {
      utils: {
        aoa_to_sheet: (data: unknown[][]) => unknown;
        book_new: () => unknown;
        book_append_sheet: (workbook: unknown, worksheet: unknown, name: string) => void;
      };
      writeFile: (workbook: unknown, filename: string) => void;
    };
  }
}

function formatDocumentType(type: string): string {
  const labels: Record<string, string> = {
    invoice: "Invoice",
    purchase_order: "Purchase Order",
    quote: "Quote",
    receipt: "Receipt",
    other: "Document",
  };
  return labels[type] || "Document";
}

function buildSheetData(doc: ExtractedDocument): unknown[][] {
  const m = doc.metadata;
  const rows: unknown[][] = [];

  // === HEADER SECTION ===
  rows.push([formatDocumentType(m.documentType).toUpperCase()]);
  rows.push([]); // blank row

  // Document info in two columns
  if (m.vendor) rows.push(["Vendor", m.vendor]);
  if (m.invoiceNumber) rows.push(["Invoice #", m.invoiceNumber]);
  if (m.poNumber) rows.push(["PO #", m.poNumber]);
  if (m.date) rows.push(["Date", m.date]);
  if (m.dueDate) rows.push(["Due Date", m.dueDate]);
  if (m.paymentTerms) rows.push(["Payment Terms", m.paymentTerms]);

  rows.push([]); // blank row

  // Bill To / Ship To
  if (m.billTo) {
    rows.push(["Bill To"]);
    rows.push([m.billTo]);
    rows.push([]);
  }

  if (m.shipTo) {
    rows.push(["Ship To"]);
    rows.push([m.shipTo]);
    rows.push([]);
  }

  // === LINE ITEMS SECTION ===
  if (doc.lineItems.length > 0) {
    rows.push(["LINE ITEMS"]);
    rows.push(["#", "Qty", "Unit", "Description", "Unit Price", "Amount", "Notes"]);

    doc.lineItems.forEach((item) => {
      rows.push([
        item.lineNumber,
        item.quantity,
        item.unit,
        item.description,
        item.unitPrice,
        item.amount,
        item.notes,
      ]);
    });

    rows.push([]); // blank row
  }

  // === FINANCIAL SUMMARY ===
  rows.push(["SUMMARY"]);
  if (m.subtotal) rows.push(["Subtotal", m.subtotal]);
  if (m.discount) rows.push(["Discount", m.discount]);
  if (m.shipping) rows.push(["Shipping", m.shipping]);
  if (m.surcharge) rows.push(["Surcharge", m.surcharge]);
  if (m.tax) rows.push(["Tax", m.tax]);
  rows.push(["Total", m.total || "—", m.currency || ""]);

  // === NOTES ===
  if (m.notes) {
    rows.push([]);
    rows.push(["NOTES"]);
    rows.push([m.notes]);
  }

  return rows;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-. ]/g, "_").replace(/\.pdf$/i, "");
}

export function exportToCsv(documents: ExtractedDocument[]): void {
  // Export each document as a separate CSV
  documents.forEach((doc) => {
    const rows = buildSheetData(doc);
    const lines = rows.map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    );

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const filename = `${sanitizeFilename(doc.metadata.filename || "document")}.csv`;
    downloadBlob(blob, filename);
  });
}

export function exportToXlsx(documents: ExtractedDocument[]): boolean {
  if (!documents.length || !window.XLSX) return false;

  // Export each document as a separate Excel file
  documents.forEach((doc) => {
    const workbook = window.XLSX.utils.book_new();
    const sheetData = buildSheetData(doc);
    const worksheet = window.XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths for better presentation
    worksheet["!cols"] = [
      { wch: 15 },  // Column A (labels/line #)
      { wch: 10 },  // Column B (qty/values)
      { wch: 10 },  // Column C (unit)
      { wch: 50 },  // Column D (description)
      { wch: 12 },  // Column E (unit price)
      { wch: 12 },  // Column F (amount)
      { wch: 25 },  // Column G (notes)
    ];

    const sheetName = formatDocumentType(doc.metadata.documentType);
    window.XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const filename = `${sanitizeFilename(doc.metadata.filename || "document")}.xlsx`;
    window.XLSX.writeFile(workbook, filename);
  });

  return true;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
