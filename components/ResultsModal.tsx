"use client";

import { Modal, ModalHeader } from "./ui/Modal";
import { Button } from "./ui/Button";
import type { DocumentRow } from "@/types";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: DocumentRow[];
  onRowChange: (index: number, field: keyof DocumentRow, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onExportCsv: () => void;
  onExportXlsx: () => void;
  isXlsxReady: boolean;
}

const COLUMNS: { key: keyof DocumentRow; label: string }[] = [
  { key: "filename", label: "Filename" },
  { key: "vendor", label: "Vendor" },
  { key: "invoiceNumber", label: "Invoice #" },
  { key: "poNumber", label: "PO #" },
  { key: "date", label: "Date" },
  { key: "dueDate", label: "Due Date" },
  { key: "total", label: "Total" },
  { key: "currency", label: "Currency" },
  { key: "billTo", label: "Bill To" },
  { key: "notes", label: "Notes" },
];

export function ResultsModal({
  isOpen,
  onClose,
  rows,
  onRowChange,
  onAddRow,
  onRemoveRow,
  onExportCsv,
  onExportXlsx,
  isXlsxReady,
}: ResultsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader
        title="Extracted Data"
        subtitle="Review and edit before exporting."
        onClose={onClose}
        actions={
          <>
            <Button onClick={onAddRow}>Add row</Button>
            <Button onClick={onExportCsv}>Export CSV</Button>
            <Button variant="primary" onClick={onExportXlsx} disabled={!isXlsxReady}>
              Export Excel
            </Button>
          </>
        }
      />

      <div className="modal-table">
        <table>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {COLUMNS.map((col) => (
                  <td key={col.key}>
                    <input
                      value={row[col.key]}
                      onChange={(e) => onRowChange(index, col.key, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  <Button variant="ghost" onClick={() => onRemoveRow(index)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
