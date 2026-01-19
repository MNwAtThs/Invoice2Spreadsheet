import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!supabaseServer) {
    return Response.json(
      { error: "Supabase service role key missing. Restart dev server after adding SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseServer.auth.getUser(token);
  if (userError || !userData.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabaseServer
    .from("scans")
    .select("id, filename, created_at, invoice_results(id, vendor, invoice_number, total, currency)")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return Response.json(
      { error: `Failed to load history: ${error.message}` },
      { status: 500 }
    );
  }

  return Response.json({ history: data });
}
