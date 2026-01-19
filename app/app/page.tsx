"use client";

import Script from "next/script";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHistory } from "@/hooks/useHistory";
import { exportToCsv, exportToXlsx } from "@/lib/export";
import { FileSpreadsheet } from "lucide-react";
import {
  Button,
  Sidebar,
  DropZone,
  ResultsModal,
  SettingsModal,
} from "@/components";
import type { DocumentRow, ExtractedDocument, ParseResponse } from "@/types";

const EMPTY_ROW: DocumentRow = {
  filename: "",
  vendor: "",
  invoiceNumber: "",
  poNumber: "",
  date: "",
  dueDate: "",
  total: "",
  currency: "",
  billTo: "",
  notes: "",
};

function normalizeRow(doc: ExtractedDocument): DocumentRow {
  return {
    filename: doc.filename || "",
    vendor: doc.vendor || "",
    invoiceNumber: doc.invoiceNumber || "",
    poNumber: doc.poNumber || "",
    date: doc.date || "",
    dueDate: doc.dueDate || "",
    total: doc.total || "",
    currency: doc.currency || "",
    billTo: doc.billTo || "",
    notes: doc.error ? `Error: ${doc.error}` : doc.rawTextPreview || "",
  };
}

export default function AppPage() {
  const { accessToken, userProfile, isAuthenticated, signOut, refreshProfile } = useAuth();
  const history = useHistory(accessToken);

  const [dataRows, setDataRows] = useState<DocumentRow[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"info" | "success" | "warning" | "error">("info");
  const [isXlsxReady, setIsXlsxReady] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"scan" | "paste">("scan");
  const [pastedText, setPastedText] = useState("");

  // Load history on auth change
  useEffect(() => {
    if (accessToken) {
      history.load();
    } else {
      history.clear();
    }
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = useCallback((message: string, type: typeof statusType = "info") => {
    setStatusMessage(message);
    setStatusType(type);
  }, []);

  const parseFiles = async (files: File[]) => {
    const pdfs = files.filter((f) => f.type === "application/pdf");
    if (!pdfs.length) {
      setStatus("Please upload PDF files only.", "warning");
      return;
    }

    const formData = new FormData();
    pdfs.forEach((file) => formData.append("files", file));

    setStatus("Extracting invoice data...", "info");

    const response = await fetch("/api/parse", {
      method: "POST",
      body: formData,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });

    if (!response.ok) {
      setStatus("Upload failed. Please try again.", "error");
      return;
    }

    const payload: ParseResponse = await response.json();

    if (!payload.documents?.length) {
      setStatus("No data extracted.", "warning");
      return;
    }

    setDataRows(payload.documents.map(normalizeRow));
    setIsResultsOpen(true);
    setStatus(`Loaded ${payload.documents.length} document(s).`, "success");

    if (accessToken) {
      if (payload.history?.error) {
        history.setError(payload.history.error);
      }
      await history.load();
    }
  };

  const parseText = async () => {
    if (!pastedText.trim()) {
      setStatus("Paste some text to analyze.", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("text", pastedText);

    setStatus("Parsing text...", "info");

    const response = await fetch("/api/parse", {
      method: "POST",
      body: formData,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });

    if (!response.ok) {
      setStatus("Text parsing failed. Please try again.", "error");
      return;
    }

    const payload: ParseResponse = await response.json();

    if (!payload.documents?.length) {
      setStatus("No data extracted.", "warning");
      return;
    }

    setDataRows(payload.documents.map(normalizeRow));
    setIsResultsOpen(true);
    setStatus("Parsed text.", "success");

    if (accessToken) {
      if (payload.history?.error) {
        history.setError(payload.history.error);
      }
      await history.load();
    }
  };

  const handleRowChange = (index: number, field: keyof DocumentRow, value: string) => {
    setDataRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddRow = () => setDataRows((prev) => [...prev, { ...EMPTY_ROW }]);

  const handleRemoveRow = (index: number) => {
    setDataRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExportCsv = () => {
    if (!dataRows.length) {
      setStatus("No data to export.", "warning");
      return;
    }
    exportToCsv(dataRows);
  };

  const handleExportXlsx = () => {
    if (!dataRows.length) {
      setStatus("No data to export.", "warning");
      return;
    }
    exportToXlsx(dataRows);
  };

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
        onLoad={() => setIsXlsxReady(true)}
      />

      <main className="page app-shell">
        <Sidebar
          userProfile={userProfile}
          historyItems={history.items}
          historyError={history.error}
          isAuthenticated={isAuthenticated}
          onUserClick={() => setIsSettingsOpen(true)}
        />

        <section className="app-main">
          <header className="hero">
            <div className="brand">
              <div className="brand-badge">
                <FileSpreadsheet size={32} />
              </div>
              <div>
                <h1>Invoice2Spreadsheet</h1>
                <p>Drop PDFs and get editable spreadsheet-ready data.</p>
              </div>
            </div>
          </header>

          <section className="card main-card">
            <div className="card-header">
              <div className="card-title">
                <span className="card-icon">📄</span>
                <h2>Order Input</h2>
              </div>
            </div>

            <div className="tab-row">
              <button
                type="button"
                className={`tab ${activeTab === "scan" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("scan")}
              >
                Scan PDF
              </button>
              <button
                type="button"
                className={`tab ${activeTab === "paste" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("paste")}
              >
                Paste Text
              </button>
            </div>

            {activeTab === "scan" ? (
              <DropZone onFiles={parseFiles} />
            ) : (
              <div className="paste-area">
                <textarea
                  className="paste-textarea"
                  placeholder="Paste invoice/quote text here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
                <Button variant="primary" onClick={parseText}>
                  Analyze Text
                </Button>
              </div>
            )}

            {statusMessage && (
              <p className="status" data-type={statusType}>
                {statusMessage}
              </p>
            )}
          </section>
        </section>
      </main>

      <ResultsModal
        isOpen={isResultsOpen}
        onClose={() => setIsResultsOpen(false)}
        rows={dataRows}
        onRowChange={handleRowChange}
        onAddRow={handleAddRow}
        onRemoveRow={handleRemoveRow}
        onExportCsv={handleExportCsv}
        onExportXlsx={handleExportXlsx}
        isXlsxReady={isXlsxReady}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userProfile={userProfile}
        onSignOut={signOut}
        onProfileUpdate={refreshProfile}
      />
    </>
  );
}
