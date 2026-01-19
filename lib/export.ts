import type { DocumentRow } from "@/types";

declare global {
  interface Window {
    XLSX?: {
      utils: {
        json_to_sheet: (data: DocumentRow[]) => unknown;
        book_new: () => unknown;
        book_append_sheet: (workbook: unknown, worksheet: unknown, name: string) => void;
      };
      writeFile: (workbook: unknown, filename: string) => void;
    };
  }
}

export function exportToCsv(rows: DocumentRow[], filename = "invoices.csv"): void {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]) as (keyof DocumentRow)[];
  const lines = [headers.join(",")];

  rows.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header] ?? "";
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    lines.push(values.join(","));
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

export function exportToXlsx(rows: DocumentRow[], filename = "invoices.xlsx"): boolean {
  if (!rows.length || !window.XLSX) return false;

  const worksheet = window.XLSX.utils.json_to_sheet(rows);
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
  window.XLSX.writeFile(workbook, filename);
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
