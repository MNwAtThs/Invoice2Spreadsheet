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
import type { ExtractedDocument, DocumentMetadata, LineItem, ParseResponse } from "@/types";

const EMPTY_LINE_ITEM: LineItem = {
  lineNumber: "",
  quantity: "",
  unit: "",
  description: "",
  unitPrice: "",
  amount: "",
  notes: "",
};

export default function AppPage() {
  const { accessToken, userProfile, isAuthenticated, signOut, refreshProfile } = useAuth();
  const history = useHistory(accessToken);

  const [documents, setDocuments] = useState<ExtractedDocument[]>([]);
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

    setStatus("Extracting data with AI...", "info");

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

    setDocuments(payload.documents as ExtractedDocument[]);
    setIsResultsOpen(true);

    const totalItems = payload.documents.reduce(
      (sum, doc) => sum + ((doc as ExtractedDocument).lineItems?.length || 0),
      0
    );
    setStatus(
      `Extracted ${payload.documents.length} document(s) with ${totalItems} line item(s).`,
      "success"
    );

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

    setStatus("Analyzing text with AI...", "info");

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

    setDocuments(payload.documents as ExtractedDocument[]);
    setIsResultsOpen(true);

    const totalItems = payload.documents.reduce(
      (sum, doc) => sum + ((doc as ExtractedDocument).lineItems?.length || 0),
      0
    );
    setStatus(`Parsed text: ${totalItems} line item(s) found.`, "success");

    if (accessToken) {
      if (payload.history?.error) {
        history.setError(payload.history.error);
      }
      await history.load();
    }
  };

  const handleMetadataChange = (
    docIndex: number,
    field: keyof DocumentMetadata,
    value: string
  ) => {
    setDocuments((prev) => {
      const next = [...prev];
      next[docIndex] = {
        ...next[docIndex],
        metadata: { ...next[docIndex].metadata, [field]: value },
      };
      return next;
    });
  };

  const handleLineItemChange = (
    docIndex: number,
    itemIndex: number,
    field: keyof LineItem,
    value: string
  ) => {
    setDocuments((prev) => {
      const next = [...prev];
      const lineItems = [...next[docIndex].lineItems];
      lineItems[itemIndex] = { ...lineItems[itemIndex], [field]: value };
      next[docIndex] = { ...next[docIndex], lineItems };
      return next;
    });
  };

  const handleAddLineItem = (docIndex: number) => {
    setDocuments((prev) => {
      const next = [...prev];
      next[docIndex] = {
        ...next[docIndex],
        lineItems: [...next[docIndex].lineItems, { ...EMPTY_LINE_ITEM }],
      };
      return next;
    });
  };

  const handleRemoveLineItem = (docIndex: number, itemIndex: number) => {
    setDocuments((prev) => {
      const next = [...prev];
      next[docIndex] = {
        ...next[docIndex],
        lineItems: next[docIndex].lineItems.filter((_, i) => i !== itemIndex),
      };
      return next;
    });
  };

  const handleExportCsv = () => {
    if (!documents.length) {
      setStatus("No data to export.", "warning");
      return;
    }
    exportToCsv(documents);
  };

  const handleExportXlsx = () => {
    if (!documents.length) {
      setStatus("No data to export.", "warning");
      return;
    }
    exportToXlsx(documents);
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
        documents={documents}
        onMetadataChange={handleMetadataChange}
        onLineItemChange={handleLineItemChange}
        onAddLineItem={handleAddLineItem}
        onRemoveLineItem={handleRemoveLineItem}
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
