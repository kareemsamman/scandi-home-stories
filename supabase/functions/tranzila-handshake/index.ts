// Tranzila Handshake token creator.
// Frontend calls this to obtain a `thtk` token before opening the iframe,
// when the Tranzila terminal has the Handshake mechanism enabled.
//
// Docs: https://docs.tranzila.com/docs/payments-billing/795m2yi7q4nmq-iframe-integration
// Endpoint: POST https://api.tranzila.com/v1/handshake/create
// Body params: supplier (terminal_name), TranzilaPW, sum (and optionally currency)
//
// We keep the terminal password server-side (read from app_settings.tranzila.terminal_password).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const { sum, currency } = await req.json().catch(() => ({}));

    const sumNum = Number(sum);
    if (!Number.isFinite(sumNum) || sumNum <= 0) {
      return json({ error: "invalid_sum" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error: settingsErr } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "tranzila")
      .maybeSingle();

    if (settingsErr) {
      console.error("tranzila-handshake settings error:", settingsErr);
      return json({ error: "settings_error" }, 500);
    }

    const settings = (row?.value ?? {}) as {
      terminal_name?: string;
      terminal_password?: string;
      enabled?: boolean;
    };

    if (!settings.enabled || !settings.terminal_name || !settings.terminal_password) {
      return json({ error: "tranzila_not_configured" }, 400);
    }

    const params = new URLSearchParams();
    params.set("supplier", settings.terminal_name);
    params.set("TranzilaPW", settings.terminal_password);
    params.set("sum", String(Math.round(sumNum * 100) / 100));
    params.set("currency", String(currency ?? 1));

    const tzRes = await fetch("https://api.tranzila.com/v1/handshake/create", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const text = await tzRes.text();
    console.log("tranzila-handshake response:", tzRes.status, text);

    // Tranzila returns either JSON {thtk: "..."} or a plain string token,
    // depending on terminal config — handle both.
    let thtk: string | null = null;
    let errorMessage: string | null = null;

    try {
      const parsed = JSON.parse(text);
      thtk =
        parsed?.thtk ??
        parsed?.THTK ??
        parsed?.token ??
        parsed?.Token ??
        null;
      errorMessage =
        parsed?.error_msg ?? parsed?.ErrorMessage ?? parsed?.error ?? null;
    } catch {
      // Not JSON — Tranzila sometimes returns the bare token.
      const trimmed = text.trim();
      if (trimmed && /^[A-Za-z0-9_\-]+$/.test(trimmed)) {
        thtk = trimmed;
      } else {
        errorMessage = trimmed || "unknown_handshake_error";
      }
    }

    if (!thtk) {
      return json(
        { error: "handshake_failed", message: errorMessage, status: tzRes.status },
        502,
      );
    }

    return json({ thtk });
  } catch (err) {
    console.error("tranzila-handshake unexpected error:", err);
    return json(
      { error: "unexpected", message: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});
