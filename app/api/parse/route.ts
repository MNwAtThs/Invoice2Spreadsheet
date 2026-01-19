import crypto from "node:crypto";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "nodejs";

type ExtractedDocument = {
  id: string;
  filename: string;
  vendor: string;
  invoiceNumber: string;
  poNumber: string;
  date: string;
  dueDate: string;
  total: string;
  currency: string;
  billTo: string;
  rawTextPreview: string;
  error?: string;
};

type OpenAiResult = Partial<Omit<ExtractedDocument, "id" | "filename">> & {
  rawTextSummary?: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function normalize(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function toDocument(result: OpenAiResult, filename: string): ExtractedDocument {
  return {
    id: crypto.randomUUID(),
    filename,
    vendor: result.vendor ?? "",
    invoiceNumber: result.invoiceNumber ?? "",
    poNumber: result.poNumber ?? "",
    date: result.date ?? "",
    dueDate: result.dueDate ?? "",
    total: result.total ?? "",
    currency: result.currency ?? "",
    billTo: result.billTo ?? "",
    rawTextPreview: result.rawTextSummary ?? "",
    error: result.error
  };
}

async function parseWithOpenAI(text: string, filename: string): Promise<ExtractedDocument> {
  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content:
          "You extract invoice fields from raw text. Return only JSON that matches the schema."
      },
      {
        role: "user",
        content: `Filename: ${filename}\n\nInvoice text:\n${text.slice(0, 12000)}`
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "invoice_extraction",
        schema: {
          type: "object",
          properties: {
            vendor: { type: "string" },
            invoiceNumber: { type: "string" },
            poNumber: { type: "string" },
            date: { type: "string" },
            dueDate: { type: "string" },
            total: { type: "string" },
            currency: { type: "string" },
            billTo: { type: "string" },
            rawTextSummary: { type: "string" }
          },
          required: [
            "vendor",
            "invoiceNumber",
            "poNumber",
            "date",
            "dueDate",
            "total",
            "currency",
            "billTo",
            "rawTextSummary"
          ],
          additionalProperties: false
        }
      }
    }
  });

  const outputText = response.output_text;
  if (!outputText) {
    return toDocument({ error: "No output from OpenAI." }, filename);
  }

  try {
    const parsed = JSON.parse(outputText) as OpenAiResult;
    return toDocument(parsed, filename);
  } catch {
    return toDocument({ error: "Failed to parse OpenAI response." }, filename);
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
      filename: document.filename,
      status: document.error ? "failed" : "parsed"
    })
    .select("id")
    .single();

  if (scanError || !scan?.id) {
    return { ok: false, error: scanError?.message || "Failed to save scan." };
  }

  const { error: resultError } = await supabaseServer.from("invoice_results").insert({
    scan_id: scan.id,
    vendor: document.vendor,
    invoice_number: document.invoiceNumber,
    po_number: document.poNumber,
    date: document.date,
    due_date: document.dueDate,
    total: document.total,
    currency: document.currency,
    bill_to: document.billTo,
    raw_text_summary: document.rawTextPreview
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
    // Allow parsing even if history storage is not configured.
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
      results.push(
        toDocument({ error: "Unsupported file type" }, "unknown")
      );
      continue;
    }

    if (!entry.type.includes("pdf")) {
      results.push(
        toDocument({ error: "Unsupported file type" }, entry.name)
      );
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
