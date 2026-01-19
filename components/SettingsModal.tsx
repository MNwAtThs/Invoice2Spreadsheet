"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Sliders,
  Database,
  Shield,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Toggle } from "./ui/Toggle";
import type { UserProfile, SettingsSection } from "@/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onSignOut: () => void;
  onProfileUpdate?: () => void;
}

const NAV_ITEMS: { id: SettingsSection; label: string; icon: typeof Settings }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: Sliders },
  { id: "data", label: "Data & Exports", icon: Database },
  { id: "security", label: "Security", icon: Shield },
];

export function SettingsModal({
  isOpen,
  onClose,
  userProfile,
  onSignOut,
  onProfileUpdate,
}: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [autoDownload, setAutoDownload] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [compactView, setCompactView] = useState(false);

  // Editable profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Initialize editable fields when modal opens or profile changes
  useEffect(() => {
    if (isOpen && userProfile) {
      const nameParts = userProfile.fullName.split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
      setCompany(userProfile.company === "Your company" ? "" : userProfile.company);
      setSaveMessage(null);
    }
  }, [isOpen, userProfile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    const fullName = `${firstName} ${lastName}`.trim();

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        company: company,
      },
    });

    setIsSaving(false);

    if (error) {
      setSaveMessage({ type: "error", text: error.message });
      return;
    }

    setSaveMessage({ type: "success", text: "Profile updated!" });
    onProfileUpdate?.();
  };

  const hasChanges = () => {
    if (!userProfile) return false;
    const nameParts = userProfile.fullName.split(" ");
    const originalFirst = nameParts[0] || "";
    const originalLast = nameParts.slice(1).join(" ") || "";
    const originalCompany = userProfile.company === "Your company" ? "" : userProfile.company;

    return (
      firstName !== originalFirst ||
      lastName !== originalLast ||
      company !== originalCompany
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="settings-section">
            <h3>General</h3>

            <div className="settings-row">
              <div className="settings-row-full">
                <strong>Email</strong>
                <p className="settings-readonly">{userProfile?.email || "—"}</p>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-full">
                <strong>First name</strong>
                <input
                  type="text"
                  className="settings-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-full">
                <strong>Last name</strong>
                <input
                  type="text"
                  className="settings-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-full">
                <strong>Company</strong>
                <input
                  type="text"
                  className="settings-input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company name"
                />
              </div>
            </div>

            {saveMessage && (
              <p className={saveMessage.type === "success" ? "form-success" : "form-error"}>
                {saveMessage.text}
              </p>
            )}

            <Button
              variant="primary"
              onClick={handleSaveProfile}
              disabled={isSaving || !hasChanges()}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        );

      case "notifications":
        return (
          <div className="settings-section">
            <h3>Notifications</h3>
            <div className="settings-row settings-row-toggle">
              <div>
                <strong>Email notifications</strong>
                <p>Receive updates about your scans via email.</p>
              </div>
              <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="settings-section">
            <h3>Preferences</h3>
            <div className="settings-row settings-row-toggle">
              <div>
                <strong>Compact view</strong>
                <p>Show less whitespace in the results table.</p>
              </div>
              <Toggle checked={compactView} onChange={setCompactView} />
            </div>
          </div>
        );

      case "data":
        return (
          <div className="settings-section">
            <h3>Data & Exports</h3>
            <div className="settings-row settings-row-select">
              <div>
                <strong>Default export format</strong>
                <p>Choose the file format for exports.</p>
              </div>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                options={[
                  { value: "xlsx", label: "Excel (.xlsx)" },
                  { value: "csv", label: "CSV (.csv)" },
                ]}
              />
            </div>
            <div className="settings-row settings-row-toggle">
              <div>
                <strong>Auto-download</strong>
                <p>Automatically download file after parsing.</p>
              </div>
              <Toggle checked={autoDownload} onChange={setAutoDownload} />
            </div>
          </div>
        );

      case "security":
        return (
          <div className="settings-section">
            <h3>Security</h3>
            <div className="settings-row">
              <div>
                <strong>Sign out</strong>
                <p>End your current session.</p>
              </div>
              <Button variant="danger" onClick={onSignOut}>
                Sign out
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="modal-settings">
      <div className="settings-layout">
        <aside className="settings-nav">
          <button className="settings-close" type="button" onClick={onClose}>
            <X size={18} />
          </button>
          <nav>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`settings-nav-item ${activeSection === id ? "settings-nav-active" : ""}`}
                onClick={() => setActiveSection(id)}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </aside>
        <div className="settings-content">{renderSection()}</div>
      </div>
    </Modal>
  );
}
