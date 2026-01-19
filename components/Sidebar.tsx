"use client";

import { FileSpreadsheet } from "lucide-react";
import { HistoryList } from "./HistoryList";
import type { HistoryItem, UserProfile } from "@/types";

interface SidebarProps {
  userProfile: UserProfile | null;
  historyItems: HistoryItem[];
  historyError: string | null;
  isAuthenticated: boolean;
  onUserClick: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar({
  userProfile,
  historyItems,
  historyError,
  isAuthenticated,
  onUserClick,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-body">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-badge">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <strong>Invoice2Spreadsheet</strong>
            </div>
          </div>
        </div>

        <HistoryList
          items={historyItems}
          error={historyError}
          isAuthenticated={isAuthenticated}
        />
      </div>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-user" onClick={onUserClick}>
          <div className="user-avatar">
            {userProfile ? getInitials(userProfile.fullName) : "?"}
          </div>
          <div>
            <strong>{userProfile?.fullName || "Guest"}</strong>
            <span>{userProfile?.company || "Sign in to continue"}</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
