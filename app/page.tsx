import Link from "next/link";
import { FileSpreadsheet, FileText, Download, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="landing">
      <header className="landing-header">
        <Link href="/" className="landing-logo">
          <span className="logo-badge">
            <FileSpreadsheet size={32} />
          </span>
          <span>Invoice2Spreadsheet</span>
        </Link>
        <nav className="landing-actions">
          <Link href="/login" className="button button-ghost">
            Sign in
          </Link>
          <Link href="/signup" className="button button-primary">
            Get started
          </Link>
        </nav>
      </header>

      <section className="landing-hero">
        <h1>PDF invoices → Excel in seconds</h1>
        <p>
          Drop your invoices, we extract the data, you download a clean spreadsheet.
          No manual entry. No copy-paste.
        </p>
        <div className="landing-cta">
          <Link href="/app" className="button button-primary button-lg">
            Try it free
          </Link>
          <Link href="/signup" className="button button-lg">
            Create account
          </Link>
        </div>
      </section>

      <section className="landing-demo">
        <div className="demo-card">
          <div className="demo-header">
            <FileText size={20} />
            <span>Sample extraction</span>
          </div>
          <div className="demo-rows">
            <div className="demo-row">
              <span>Vendor</span>
              <strong>Acme Supplies</strong>
            </div>
            <div className="demo-row">
              <span>Invoice #</span>
              <strong>INV-2024-0847</strong>
            </div>
            <div className="demo-row">
              <span>Total</span>
              <strong>$4,280.00</strong>
            </div>
            <div className="demo-row">
              <span>Due Date</span>
              <strong>Feb 15, 2026</strong>
            </div>
          </div>
          <div className="demo-footer">
            <span className="demo-badge">
              <CheckCircle2 size={14} />
              Ready to export
            </span>
            <span className="demo-badge">
              <Download size={14} />
              .xlsx
            </span>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <div className="feature">
          <strong>Upload</strong>
          <p>Drag PDFs into the app</p>
        </div>
        <div className="feature">
          <strong>Review</strong>
          <p>Check extracted fields</p>
        </div>
        <div className="feature">
          <strong>Export</strong>
          <p>Download Excel or CSV</p>
        </div>
      </section>

      <footer className="landing-footer">
        <p>Built for operations teams who hate manual data entry.</p>
      </footer>
    </main>
  );
}
