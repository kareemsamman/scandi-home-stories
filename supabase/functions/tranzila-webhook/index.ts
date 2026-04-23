// Tranzila server-to-server payment notification webhook (notify_url_address).
// Tranzila POSTs application/x-www-form-urlencoded; we also accept JSON as a fallback.
// Always return HTTP 200 so Tranzila does not retry — even when we ignore the call.

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  // ---- Parse body (form-urlencoded preferred, JSON fallback) ----
  let payload: Record<string, string> = {};
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      payload = Object.fromEntries(
        Object.entries(body || {}).map(([k, v]) => [k, String(v)]),
      );
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      payload = Object.fromEntries(params.entries());
    }
  } catch (err) {
    console.error("tranzila-webhook parse error:", err);
    return json({ ignored: true, reason: "invalid_body" }, 200);
  }

  console.log("tranzila-webhook payload:", payload);

  const responseCode = payload.Response ?? payload.response ?? "";
  const orderid = payload.orderid ?? payload.OrderId ?? payload.order_id ?? "";
  const sumStr = payload.sum ?? payload.Sum ?? "";
  const confirmationCode = payload.ConfirmationCode ?? payload.confirmation_code ?? "";
  const index = payload.index ?? payload.Index ?? "";
  const tranzilaToken = payload.TranzilaTK ?? payload.tranzila_tk ?? "";

  // Non-success transactions: ignore but ack with 200.
  if (responseCode !== "000") {
    console.warn("tranzila-webhook non-success response code:", responseCode);
    return json({ ignored: true, reason: "non_success_response", code: responseCode }, 200);
  }

  if (!orderid) {
    console.warn("tranzila-webhook missing orderid");
    return json({ ignored: true, reason: "missing_orderid" }, 200);
  }

  // ---- Supabase client (service role to bypass RLS) ----
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: order, error: lookupErr } = await supabase
    .from("orders")
    .select("id, order_number, total, payment_status")
    .eq("order_number", orderid)
    .maybeSingle();

  if (lookupErr) {
    console.error("tranzila-webhook order lookup error:", lookupErr);
    return json({ ignored: true, reason: "lookup_failed" }, 200);
  }

  if (!order) {
    console.warn("tranzila-webhook order_not_found:", orderid);
    return json({ ignored: true, reason: "order_not_found" }, 200);
  }

  // Idempotency: already paid
  if (order.payment_status === "paid") {
    return json({ already_paid: true, orderId: order.id }, 200);
  }

  // Fraud guard: amount must match within ₪0.01
  const paidAmount = Number(sumStr);
  const expected = Number(order.total);
  if (!Number.isFinite(paidAmount) || Math.abs(paidAmount - expected) > 0.01) {
    console.error("tranzila-webhook amount_mismatch", {
      orderid,
      paidAmount,
      expected,
    });
    return json(
      { ignored: true, reason: "amount_mismatch", paidAmount, expected },
      200,
    );
  }

  // ---- Mark as paid ----
  const { error: updateErr } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      transaction_id: confirmationCode || index || null,
      tranzila_token: tranzilaToken || null,
    })
    .eq("id", order.id);

  if (updateErr) {
    console.error("tranzila-webhook update error:", updateErr);
    return json({ ignored: true, reason: "update_failed" }, 200);
  }

  return json({ success: true, orderId: order.id }, 200);
});
