"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { HistoryItem } from "@/types";

interface HistoryListProps {
  items: HistoryItem[];
  error: string | null;
  isAuthenticated: boolean;
}

export function HistoryList({ items, error, isAuthenticated }: HistoryListProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [search, setSearch] = useState("");

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const result = item.invoice_results?.[0];
    return (
      item.filename?.toLowerCase().includes(q) ||
      result?.vendor?.toLowerCase().includes(q) ||
      result?.invoice_number?.toLowerCase().includes(q)
    );
  });

  const renderContent = () => {
    if (!isAuthenticated) {
      return <p className="history-empty">Sign in to see history.</p>;
    }
    if (error) {
      return <p className="history-empty">{error}</p>;
    }
    if (filtered.length === 0) {
      return <p className="history-empty">No uploads yet.</p>;
    }
    return filtered.map((item) => {
      const result = item.invoice_results?.[0];
      const label = result?.vendor || item.filename || "Unknown";
      return (
        <button key={item.id} className="sidebar-item" type="button">
          {label}
        </button>
      );
    });
  };

  return (
    <div className="sidebar-history">
      <div className="sidebar-search">
        <div className="search-input">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        className="sidebar-history-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>History</span>
        <ChevronDown size={14} className={`chevron ${isOpen ? "chevron-open" : ""}`} />
      </button>

      {isOpen && <div className="sidebar-history-list">{renderContent()}</div>}
    </div>
  );
}
