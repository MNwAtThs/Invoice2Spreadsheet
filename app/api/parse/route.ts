import crypto from "node:crypto";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { supabaseServer } from "../../../lib/supabaseServer";
import type { ExtractedDocument, DocumentMetadata, LineItem, DocumentType } from "@/types";

export const runtime = "nodejs";

type OpenAiResult = {
  documentType: string;
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
  lineItems: Array<{
    lineNumber: string;
    quantity: string;
    unit: string;
    description: string;
    unitPrice: string;
    amount: string;
    notes: string;
  }>;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function normalize(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function normalizeDocumentType(type: string): DocumentType {
  const lower = type.toLowerCase();
  if (lower.includes("invoice")) return "invoice";
  if (lower.includes("purchase") || lower.includes("po")) return "purchase_order";
  if (lower.includes("quote") || lower.includes("estimate")) return "quote";
  if (lower.includes("receipt")) return "receipt";
  return "other";
}

function toDocument(result: Partial<OpenAiResult>, filename: string, error?: string): ExtractedDocument {
  const metadata: DocumentMetadata = {
    documentType: normalizeDocumentType(result.documentType ?? "other"),
    filename,
    vendor: result.vendor ?? "",
    invoiceNumber: result.invoiceNumber ?? "",
    poNumber: result.poNumber ?? "",
    date: result.date ?? "",
    dueDate: result.dueDate ?? "",
    subtotal: result.subtotal ?? "",
    tax: result.tax ?? "",
    shipping: result.shipping ?? "",
    discount: result.discount ?? "",
    surcharge: result.surcharge ?? "",
    total: result.total ?? "",
    currency: result.currency ?? "",
    billTo: result.billTo ?? "",
    shipTo: result.shipTo ?? "",
    paymentTerms: result.paymentTerms ?? "",
    notes: result.notes ?? ""
  };

  const lineItems: LineItem[] = (result.lineItems ?? []).map((item) => ({
    lineNumber: item.lineNumber ?? "",
    quantity: item.quantity ?? "",
    unit: item.unit ?? "",
    description: item.description ?? "",
    unitPrice: item.unitPrice ?? "",
    amount: item.amount ?? "",
    notes: item.notes ?? ""
  }));

  return {
    id: crypto.randomUUID(),
    metadata,
    lineItems,
    rawTextPreview: "",
    error
  };
}

async function parseWithOpenAI(text: string, filename: string): Promise<ExtractedDocument> {
  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content: `You are an expert document parser. Analyze the provided text and extract ALL relevant information.

IMPORTANT INSTRUCTIONS:
1. First, determine what type of document this is (invoice, purchase_order, quote, receipt, or other)
2. Extract ALL line items - every single product, service, or charge listed
3. Be thorough - complex documents may have 20+ line items
4. For each line item, extract: line number, quantity, unit of measure, description, unit price, and total amount
5. Capture all financial details: subtotal, tax, shipping, discounts, surcharges, and final total
6. Extract both "bill to" and "ship to" addresses if present
7. Extract payment terms if mentioned
8. Use empty string "" for any field that's not present or unclear

Return ONLY valid JSON matching the schema. Be comprehensive and extract everything.`
      },
      {
        role: "user",
        content: `Filename: ${filename}\n\nDocument text:\n${text.slice(0, 15000)}`
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "document_extraction",
        schema: {
          type: "object",
          properties: {
            documentType: {
              type: "string",
              description: "Type of document: invoice, purchase_order, quote, receipt, or other"
            },
            vendor: {
              type: "string",
              description: "Company/vendor name issuing the document"
            },
            invoiceNumber: {
              type: "string",
              description: "Invoice number or document reference number"
            },
            poNumber: {
              type: "string",
              description: "Purchase order number"
            },
            date: {
              type: "string",
              description: "Document date or invoice date"
            },
            dueDate: {
              type: "string",
              description: "Payment due date or delivery date"
            },
            subtotal: {
              type: "string",
              description: "Subtotal before tax/shipping/fees"
            },
            tax: {
              type: "string",
              description: "Tax amount"
            },
            shipping: {
              type: "string",
              description: "Shipping/freight charges"
            },
            discount: {
              type: "string",
              description: "Any discounts applied"
            },
            surcharge: {
              type: "string",
              description: "Any surcharges or additional fees"
            },
            total: {
              type: "string",
              description: "Final total amount"
            },
            currency: {
              type: "string",
              description: "Currency code (USD, EUR, etc.)"
            },
            billTo: {
              type: "string",
              description: "Billing address/recipient"
            },
            shipTo: {
              type: "string",
              description: "Shipping address if different from billing"
            },
            paymentTerms: {
              type: "string",
              description: "Payment terms (Net 30, Net 60, etc.)"
            },
            notes: {
              type: "string",
              description: "Any additional notes or special instructions"
            },
            lineItems: {
              type: "array",
              description: "All line items/products/services in the document",
              items: {
                type: "object",
                properties: {
                  lineNumber: {
                    type: "string",
                    description: "Line number or item number"
                  },
                  quantity: {
                    type: "string",
                    description: "Quantity ordered/sold"
                  },
                  unit: {
                    type: "string",
                    description: "Unit of measure (ea, SF, box, etc.)"
                  },
                  description: {
                    type: "string",
                    description: "Full item description including any mark numbers or specifications"
                  },
                  unitPrice: {
                    type: "string",
                    description: "Price per unit"
                  },
                  amount: {
                    type: "string",
                    description: "Line total (quantity × unit price)"
                  },
                  notes: {
                    type: "string",
                    description: "Any notes specific to this line item"
                  }
                },
                required: ["lineNumber", "quantity", "unit", "description", "unitPrice", "amount", "notes"],
                additionalProperties: false
              }
            }
          },
          required: [
            "documentType",
            "vendor",
            "invoiceNumber",
            "poNumber",
            "date",
            "dueDate",
            "subtotal",
            "tax",
            "shipping",
            "discount",
            "surcharge",
            "total",
            "currency",
            "billTo",
            "shipTo",
            "paymentTerms",
            "notes",
            "lineItems"
          ],
          additionalProperties: false
        }
      }
    }
  });

  const outputText = response.output_text;
  if (!outputText) {
    return toDocument({}, filename, "No output from OpenAI.");
  }

  try {
    const parsed = JSON.parse(outputText) as OpenAiResult;
    return toDocument(parsed, filename);
  } catch {
    return toDocument({}, filename, "Failed to parse OpenAI response.");
  }
}

async function resolveUserId(request: Request) {
  if (!supabaseServer) return null;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error) return null;
  return data.user?.id ?? null;
}

async function saveHistory(userId: string, document: ExtractedDocument, source: "pdf" | "text") {
  if (!supabaseServer) {
    return { ok: false, error: "Supabase not configured." };
  }

  const { data: scan, error: scanError } = await supabaseServer
    .from("scans")
    .insert({
      user_id: userId,
      source,
      filename: document.metadata.filename,
      status: document.error ? "failed" : "parsed"
    })
    .select("id")
    .single();

  if (scanError || !scan?.id) {
    return { ok: false, error: scanError?.message || "Failed to save scan." };
  }

  const { error: resultError } = await supabaseServer.from("invoice_results").insert({
    scan_id: scan.id,
    document_type: document.metadata.documentType,
    vendor: document.metadata.vendor,
    invoice_number: document.metadata.invoiceNumber,
    po_number: document.metadata.poNumber,
    date: document.metadata.date,
    due_date: document.metadata.dueDate,
    subtotal: document.metadata.subtotal,
    tax: document.metadata.tax,
    shipping: document.metadata.shipping,
    discount: document.metadata.discount,
    surcharge: document.metadata.surcharge,
    total: document.metadata.total,
    currency: document.metadata.currency,
    bill_to: document.metadata.billTo,
    ship_to: document.metadata.shipTo,
    payment_terms: document.metadata.paymentTerms,
    notes: document.metadata.notes,
    line_items: document.lineItems
  });

  if (resultError) {
    return { ok: false, error: resultError.message };
  }

  return { ok: true };
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "Missing OPENAI_API_KEY." }, { status: 500 });
  }
  if (!supabaseServer) {
    console.warn("Supabase service role key missing. History will not be saved.");
  }

  const formData = await request.formData();
  const files = formData.getAll("files");
  const textInput = formData.get("text");
  const userId = await resolveUserId(request);

  const results: ExtractedDocument[] = [];
  let historyError: string | null = null;

  if (typeof textInput === "string" && textInput.trim()) {
    const normalized = normalize(textInput);
    const document = await parseWithOpenAI(normalized, "pasted-text");
    results.push(document);
    if (userId) {
      const saveResult = await saveHistory(userId, document, "text");
      if (!saveResult.ok && saveResult.error) {
        historyError = saveResult.error;
      }
    }
    return Response.json({
      documents: results,
      history: userId ? { saved: !historyError, error: historyError } : undefined
    });
  }

  if (!files.length) {
    return Response.json({ error: "No files uploaded." }, { status: 400 });
  }

  for (const entry of files) {
    if (!(entry instanceof File)) {
      results.push(toDocument({}, "unknown", "Unsupported file type"));
      continue;
    }

    if (!entry.type.includes("pdf")) {
      results.push(toDocument({}, entry.name, "Unsupported file type"));
      continue;
    }

    const buffer = Buffer.from(await entry.arrayBuffer());
    const parsed = await pdfParse(buffer);
    const text = normalize(parsed.text || "");
    const document = await parseWithOpenAI(text, entry.name);
    results.push(document);
    if (userId) {
      const saveResult = await saveHistory(userId, document, "pdf");
      if (!saveResult.ok && saveResult.error) {
        historyError = saveResult.error;
      }
    }
  }

  return Response.json({
    documents: results,
    history: userId ? { saved: !historyError, error: historyError } : undefined
  });
}
