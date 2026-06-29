// Tranzila server-to-server payment notification webhook (notify_url_address).
// Tranzila POSTs application/x-www-form-urlencoded; we also accept JSON as a fallback.
// Always return HTTP 200 so Tranzila does not retry — even when we ignore the call.
//
// On a successful charge we (optionally) issue a חשבונית מס/קבלה via the Tranzila
// Documents API and text the PDF link to the customer.

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

// ---- Tranzila TRAPI auth: HMAC-SHA256(appKey, secret + time + nonce) ----
async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Issues a חשבונית מס/קבלה (Invoice-Receipt) and returns { number, url } or null.
async function issueTranzilaInvoice(
  tz: any,
  order: any,
  items: any[],
): Promise<{ number: string; url: string } | null> {
  const appKey = tz?.app_key;
  const secret = tz?.secret_key;
  const terminal = tz?.terminal_name;
  const endpoint = tz?.documents_api_url ||
    "https://billing5.tranzila.com/api/documents_db/create_document";

  if (!appKey || !secret || !terminal) {
    console.warn("tranzila-webhook: documents API not configured (missing keys)");
    return null;
  }

  const rate = Number(order.vat_rate) || 0;
  const factor = 1 + rate / 100;

  // All lines are sent as GROSS (price_type "G", VAT-inclusive) so the document
  // total reconciles exactly with the amount the customer actually paid.
  const docItems: any[] = items.map((it) => ({
    type: "I",
    name: String(it.product_name || "פריט").slice(0, 250),
    price_type: "G",
    unit_price: round2(Number(it.price) * factor),
    units_number: Number(it.quantity) || 1,
    unit_type: 1,
    currency_code: "ILS",
  }));

  const discount = Number(order.discount_amount) || 0;
  if (discount > 0) {
    docItems.push({
      type: "I",
      name: "הנחה",
      price_type: "G",
      unit_price: -round2(discount * factor),
      units_number: 1,
      unit_type: 1,
      currency_code: "ILS",
    });
  }

  const shipping = Number(order.shipping_cost) || 0;
  if (shipping > 0) {
    docItems.push({
      type: "I",
      name: "דמי משלוח",
      price_type: "G",
      unit_price: round2(shipping),
      units_number: 1,
      unit_type: 1,
      currency_code: "ILS",
    });
  }

  const docTotal = round2(
    docItems.reduce((s, i) => s + i.unit_price * i.units_number, 0),
  );

  const payload: Record<string, unknown> = {
    terminal_name: terminal,
    document_type: "IR", // חשבונית מס/קבלה (Invoice-Receipt)
    action: 1,
    document_language: order.locale === "ar" ? "heb" : "heb",
    document_currency_code: "ILS",
    response_language: "eng",
    client_name: `${order.first_name || ""} ${order.last_name || ""}`.trim() || "לקוח",
    client_email: order.email || "",
    client_address_line_1: [order.address, order.house_number].filter(Boolean).join(" ").slice(0, 250),
    client_city: (order.city || "").slice(0, 100),
    client_country_code: "IL",
    created_by_system: "amg-pergola",
    created_by_user: order.order_number,
    items: docItems,
    payments: [
      {
        payment_method: 1, // credit card
        amount: docTotal,
        currency_code: "ILS",
      },
    ],
  };
  if (rate > 0) payload.vat_percent = rate;

  const time = Math.floor(Date.now() / 1000);
  const nonceBytes = new Uint8Array(40);
  crypto.getRandomValues(nonceBytes);
  const nonce = [...nonceBytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  const accessToken = await hmacSha256Hex(secret + time + nonce, appKey);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-tranzila-api-app-key": appKey,
        "X-tranzila-api-request-time": String(time),
        "X-tranzila-api-nonce": nonce,
        "X-tranzila-api-access-token": accessToken,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log("tranzila-webhook create_document response:", res.status, text);

    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* ignore */ }

    if (!parsed || Number(parsed.status_code) !== 0 || !parsed.document) {
      console.error("tranzila-webhook invoice creation failed:", parsed?.status_msg || text);
      return null;
    }

    const doc = parsed.document;
    const url = doc.retrieval_key
      ? `https://my.tranzila.com/api/get_financial_document/${doc.retrieval_key}`
      : "";
    return { number: String(doc.number || doc.id || ""), url };
  } catch (err) {
    console.error("tranzila-webhook create_document error:", err);
    return null;
  }
}

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
    .select(
      "id, order_number, total, payment_status, first_name, last_name, email, phone, city, address, house_number, locale, discount_amount, shipping_cost, vat_rate, payment_token, invoice_url",
    )
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

  // ---- Automatic tax invoice (חשבונית מס) + SMS to customer ----
  let invoice: { number: string; url: string } | null = null;
  try {
    const { data: tzRow } = await supabase
      .from("app_settings").select("value").eq("key", "tranzila").maybeSingle();
    const tz = (tzRow?.value ?? {}) as any;

    if (tz.auto_invoice && !order.invoice_url) {
      const { data: items } = await supabase
        .from("order_items")
        .select("product_name, price, quantity")
        .eq("order_id", order.id);

      invoice = await issueTranzilaInvoice(tz, order, items || []);

      if (invoice?.url) {
        await supabase
          .from("orders")
          .update({
            invoice_url: invoice.url,
            invoice_number: invoice.number || null,
            invoice_issued_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        // SMS the invoice link to the customer
        try {
          const [{ data: smsRow }, { data: msgRow }] = await Promise.all([
            supabase.from("app_settings").select("value").eq("key", "sms").maybeSingle(),
            supabase.from("app_settings").select("value").eq("key", "sms_messages").maybeSingle(),
          ]);
          const sms = smsRow?.value as any;
          const messages = msgRow?.value as any;
          const tpl = messages?.invoice_ready?.[order.locale === "ar" ? "ar" : "he"]
            || messages?.invoice_ready?.he;

          if (sms?.enabled && tpl && order.phone) {
            const escapeXml = (s: string) =>
              s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
            const fmtPhone = (p: string) => {
              const c = p.replace(/[\s\-\+]/g, "");
              if (c.startsWith("972")) return c;
              if (c.startsWith("0")) return "972" + c.slice(1);
              return c;
            };
            const message = tpl
              .replace(/\{name\}/g, order.first_name || "")
              .replace(/\{order_number\}/g, order.order_number || "")
              .replace(/\{invoice_number\}/g, invoice.number || "")
              .replace(/\{invoice_link\}/g, invoice.url);

            const dlr = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
            const xml = `<?xml version="1.0" encoding="UTF-8"?><sms><user><username>${escapeXml(sms.user)}</username></user><source>${escapeXml(sms.source)}</source><destinations><phone id="${dlr}">${fmtPhone(order.phone)}</phone></destinations><message>${escapeXml(message)}</message></sms>`;
            const smsRes = await fetch("https://019sms.co.il/api", {
              method: "POST",
              headers: { "Authorization": `Bearer ${sms.token}`, "Content-Type": "application/xml" },
              body: xml,
            });
            console.log("tranzila-webhook invoice SMS:", smsRes.status, await smsRes.text());
          }
        } catch (smsErr) {
          console.error("tranzila-webhook invoice SMS error:", smsErr);
        }
      }
    }
  } catch (invErr) {
    console.error("tranzila-webhook invoice flow error:", invErr);
    // Never fail the payment ack because of invoicing
  }

  return json({ success: true, orderId: order.id, invoice_number: invoice?.number ?? null }, 200);
});
