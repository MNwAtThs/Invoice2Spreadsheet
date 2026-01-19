# Invoice2Spreadsheet

Drag and drop invoice or quote PDFs, preview extracted data, edit fields, and export to CSV or Excel.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`.

## Next.js migration

- Marketing page: `/`
- App dashboard: `/app`
- PDF extraction API: `/api/extract`

## Supabase auth

Create a `.env.local` file in the project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these in your Supabase project settings under API.

Create the history table in Supabase:

```sql
create table if not exists public.invoice_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  filename text,
  vendor text,
  invoice_number text,
  total text,
  currency text,
  created_at timestamptz default now()
);

create index if not exists invoice_history_user_id_idx on public.invoice_history (user_id, created_at desc);
```

## Notes

- Excel export uses the SheetJS CDN to avoid deprecated npm dependencies.
- The PDF extraction uses lightweight heuristics. For higher accuracy, consider connecting an OCR/LLM pipeline.
