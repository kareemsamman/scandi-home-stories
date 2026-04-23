// Tranzila server-to-server payment notification webhook (notify_url_address).
// Tranzila POSTs application/x-www-form-urlencoded; we also accept JSON as fallback.
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

  // Parse body — Tranzila sends form-urlencoded; tolerate JSON.
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
    return json({ error: "invalid_body" }, 200);
  }

  console.log("tranzila-webhook payload:", payload);

  const responseCode = payload.Response ?? payload.response ?? "";
  const orderid = payload.orderid ?? payload.OrderId ?? payload.order_id ?? "";
  const sumStr = payload.sum ?? payload.Sum ?? "";
  const confirmationCode = payload.ConfirmationCode ?? payload.confirmation_code ?? "";
  const index = payload.index ?? payload.Index ?? "";
  const tranzilaToken = payload.TranzilaTK ?? payload.tranzila_tk ?? "";

  // Non-success transactions: ignore but acknowledge.
  if (responseCode !== "