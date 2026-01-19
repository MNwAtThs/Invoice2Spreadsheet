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

Create the required tables in Supabase:

```sql
-- Profiles table (stores user info)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text,
  last_name text,
  company text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scans table (stores each PDF/text scan)
create table if not exists public.scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source text check (source in ('pdf', 'text')) default 'pdf',
  filename text,
  status text check (status in ('pending', 'parsed', 'failed')) default 'pending',
  created_at timestamptz default now()
);

-- Invoice results table (stores extracted document data with line items)
create table if not exists public.invoice_results (
  id uuid default gen_random_uuid() primary key,
  scan_id uuid references public.scans(id) on delete cascade not null,
  document_type text,
  vendor text,
  invoice_number text,
  po_number text,
  date text,
  due_date text,
  subtotal text,
  tax text,
  shipping text,
  discount text,
  surcharge text,
  total text,
  currency text,
  bill_to text,
  ship_to text,
  payment_terms text,
  notes text,
  line_items jsonb default '[]'::jsonb,
  raw_text_summary text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists scans_user_id_idx on public.scans (user_id, created_at desc);
create index if not exists invoice_results_scan_id_idx on public.invoice_results (scan_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.scans enable row level security;
alter table public.invoice_results enable row level security;

-- Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can view own scans" on public.scans for select using (auth.uid() = user_id);
create policy "Users can insert own scans" on public.scans for insert with check (auth.uid() = user_id);

create policy "Users can view own results" on public.invoice_results for select 
  using (scan_id in (select id from public.scans where user_id = auth.uid()));
create policy "Users can insert own results" on public.invoice_results for insert 
  with check (scan_id in (select id from public.scans where user_id = auth.uid()));
```

## Notes

- Excel export uses the SheetJS CDN to avoid deprecated npm dependencies.
- PDF extraction uses OpenAI GPT-4o-mini for intelligent parsing of invoices, purchase orders, and quotes.
- Line items are extracted and stored as JSONB for flexible querying.
- The system dynamically detects document types and extracts relevant fields accordingly.
