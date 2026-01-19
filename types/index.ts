// Document types
export type DocumentType = "invoice" | "purchase_order" | "quote" | "receipt" | "other";

export type LineItem = {
  lineNumber: string;
  quantity: string;
  unit: string;
  description: string;
  unitPrice: string;
  amount: string;
  notes: string;
};

export type DocumentMetadata = {
  documentType: DocumentType;
  filename: string;
  vendor: string;
  invoiceNumber: string;
  poNumber: string;
  date: string;
  dueDate: string;
  subtotal: string;
  tax: string;
  shipping: string;
  discount: string;
  surcharge: string;
  total: string;
  currency: string;
  billTo: string;
  shipTo: string;
  paymentTerms: string;
  notes: string;
};

export type ExtractedDocument = {
  id: string;
  metadata: DocumentMetadata;
  lineItems: LineItem[];
  rawTextPreview: string;
  error?: string;
};

// Legacy flat row for simple exports (one row per document)
export type DocumentRow = {
  filename: string;
  vendor: string;
  invoiceNumber: string;
  poNumber: string;
  date: string;
  dueDate: string;
  total: string;
  currency: string;
  billTo: string;
  notes: string;
};

// History types
export type InvoiceResult = {
  id: string;
  vendor: string | null;
  invoice_number: string | null;
  total: string | null;
  currency: string | null;
};

export type HistoryItem = {
  id: string;
  filename: string | null;
  created_at: string;
  invoice_results: InvoiceResult[] | null;
};

// User types
export type UserProfile = {
  fullName: string;
  company: string;
  email: string;
};

// API response types
export type ParseResponse = {
  documents?: ExtractedDocument[];
  history?: {
    saved?: boolean;
    error?: string | null;
  };
};

export type HistoryResponse = {
  history?: HistoryItem[];
  error?: string;
};

// Settings types
export type SettingsSection =
  | "general"
  | "notifications"
  | "preferences"
  | "data"
  | "security";

export type UserPreferences = {
  defaultExportFormat: "xlsx" | "csv";
  autoDownload: boolean;
  emailNotifications: boolean;
  compactView: boolean;
};
