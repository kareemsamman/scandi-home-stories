import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { orderId, token, receiptPaths } = await req.json();

    if (!orderId || !token) return json({ error: "Missing orderId or token" }, 400);

    // Verify token matches the order
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("id, payment_token, payment_status")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchErr || !order) return json({ error: "Order not found" }, 404);
    if (order.payment_token !== token) return json({ error: "Invalid token" }, 403);
    if (order.payment_status === "paid") return json({ error: "already_paid" }, 409);

    // Build receipt_url from paths
    const receiptUrl = Array.isArray(receiptPaths) && receiptPaths.length > 0
      ? receiptPaths.join("|")
      : null;

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", receipt_url: receiptUrl })
      .eq("id", orderId);

    if (updateErr) throw updateErr;

    return json({ success: true });
  } catch (err: any) {
    console.error("submit-payment error:", err);
    return json({ error: err?.message || "Internal error" }, 500);
  }
});
