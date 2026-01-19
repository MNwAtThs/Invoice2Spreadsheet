"use client";

import { useState } from "react";
import { Modal, ModalHeader } from "./ui/Modal";
import { Button } from "./ui/Button";
import type { ExtractedDocument, DocumentMetadata, LineItem } from "@/types";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: ExtractedDocument[];
  onMetadataChange: (docIndex: number, field: keyof DocumentMetadata, value: string) => void;
  onLineItemChange: (docIndex: number, itemIndex: number, field: keyof LineItem, value: string) => void;
  onAddLineItem: (docIndex: number) => void;
  onRemoveLineItem: (docIndex: number, itemIndex: number) => void;
  onExportCsv: () => void;
  onExportXlsx: () => void;
  isXlsxReady: boolean;
}

type TabType = "overview" | "lineItems";

const METADATA_FIELDS: { key: keyof DocumentMetadata; label: string }[] = [
  { key: "documentType", label: "Document Type" },
  { key: "vendor", label: "Vendor" },
  { key: "invoiceNumber", label: "Invoice #" },
  { key: "poNumber", label: "PO #" },
  { key: "date", label: "Date" },
  { key: "dueDate", label: "Due Date" },
  { key: "billTo", label: "Bill To" },
  { key: "shipTo", label: "Ship To" },
  { key: "paymentTerms", label: "Payment Terms" },
];

const FINANCIAL_FIELDS: { key: keyof DocumentMetadata; label: string }[] = [
  { key: "subtotal", label: "Subtotal" },
  { key: "tax", label: "Tax" },
  { key: "shipping", label: "Shipping" },
  { key: "discount", label: "Discount" },
  { key: "surcharge", label: "Surcharge" },
  { key: "total", label: "Total" },
  { key: "currency", label: "Currency" },
];

const LINE_ITEM_COLUMNS: { key: keyof LineItem; label: string; width?: string }[] = [
  { key: "lineNumber", label: "#", width: "60px" },
  { key: "quantity", label: "Qty", width: "70px" },
  { key: "unit", label: "Unit", width: "70px" },
  { key: "description", label: "Description" },
  { key: "unitPrice", label: "Unit Price", width: "100px" },
  { key: "amount", label: "Amount", width: "100px" },
  { key: "notes", label: "Notes", width: "150px" },
];

export function ResultsModal({
  isOpen,
  onClose,
  documents,
  onMetadataChange,
  onLineItemChange,
  onAddLineItem,
  onRemoveLineItem,
  onExportCsv,
  onExportXlsx,
  isXlsxReady,
}: ResultsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [activeDocIndex, setActiveDocIndex] = useState(0);

  const currentDoc = documents[activeDocIndex];
  if (!currentDoc) return null;

  const totalLineItems = documents.reduce((sum, doc) => sum + doc.lineItems.length, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <ModalHeader
        title="Extracted Data"
        subtitle={`${documents.length} document(s) • ${totalLineItems} line item(s)`}
        onClose={onClose}
        actions={
          <>
            <Button onClick={onExportCsv}>Export CSV</Button>
            <Button variant="primary" onClick={onExportXlsx} disabled={!isXlsxReady}>
              Export Excel
            </Button>
          </>
        }
      />

      {/* Document selector for multiple documents */}
      {documents.length > 1 && (
        <div className="doc-selector">
          {documents.map((doc, index) => (
            <button
              key={doc.id}
              className={`doc-tab ${index === activeDocIndex ? "active" : ""}`}
              onClick={() => setActiveDocIndex(index)}
            >
              {doc.metadata.filename || `Document ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Tab navigation */}
      <div className="results-tabs">
        <button
          className={`results-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`results-tab ${activeTab === "lineItems" ? "active" : ""}`}
          onClick={() => setActiveTab("lineItems")}
        >
          Line Items ({currentDoc.lineItems.length})
        </button>
      </div>

      {/* Tab content */}
      <div className="results-content">
        {activeTab === "overview" ? (
          <div className="overview-grid">
            <div className="overview-section">
              <h4>Document Details</h4>
              <div className="metadata-grid">
                {METADATA_FIELDS.map((field) => (
                  <div key={field.key} className="metadata-field">
                    <label>{field.label}</label>
                    <input
                      value={currentDoc.metadata[field.key]}
                      onChange={(e) => onMetadataChange(activeDocIndex, field.key, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="overview-section">
              <h4>Financial Summary</h4>
              <div className="financial-grid">
                {FINANCIAL_FIELDS.map((field) => (
                  <div key={field.key} className="metadata-field">
                    <label>{field.label}</label>
                    <input
                      value={currentDoc.metadata[field.key]}
                      onChange={(e) => onMetadataChange(activeDocIndex, field.key, e.target.value)}
                      placeholder={field.key === "currency" ? "USD" : "0.00"}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="overview-section full-width">
              <h4>Notes</h4>
              <textarea
                value={currentDoc.metadata.notes}
                onChange={(e) => onMetadataChange(activeDocIndex, "notes", e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="line-items-section">
            <div className="line-items-header">
              <span>{currentDoc.lineItems.length} line items</span>
              <Button onClick={() => onAddLineItem(activeDocIndex)}>Add Item</Button>
            </div>
            <div className="modal-table">
              <table>
                <thead>
                  <tr>
                    {LINE_ITEM_COLUMNS.map((col) => (
                      <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                        {col.label}
                      </th>
                    ))}
                    <th style={{ width: "80px" }} />
                  </tr>
                </thead>
                <tbody>
                  {currentDoc.lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={LINE_ITEM_COLUMNS.length + 1} className="empty-state">
                        No line items extracted. Click "Add Item" to add manually.
                      </td>
                    </tr>
                  ) : (
                    currentDoc.lineItems.map((item, itemIndex) => (
                      <tr key={itemIndex}>
                        {LINE_ITEM_COLUMNS.map((col) => (
                          <td key={col.key}>
                            <input
                              value={item[col.key]}
                              onChange={(e) =>
                                onLineItemChange(activeDocIndex, itemIndex, col.key, e.target.value)
                              }
                            />
                          </td>
                        ))}
                        <td>
                          <Button
                            variant="ghost"
                            onClick={() => onRemoveLineItem(activeDocIndex, itemIndex)}
                          >
                            ×
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
