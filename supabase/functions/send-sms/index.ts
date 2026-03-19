import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Convert Israeli local number to 019 international format */
const formatPhone = (phone: string): string => {
  const clean = phone.replace(/[\s\-\+]/g, "");
  if (clean.startsWith("972")) return clean;
  if (clean.startsWith("0")) return "972" + clean.slice(1);
  return clean;
};

/** Escape XML special characters */
const escapeXml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // --- Auth: require valid JWT ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Auth: require admin or worker role ---
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "worker"]);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { phone, message } = await req.json();

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "phone and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate inputs
    if (typeof phone !== "string" || phone.length > 20 || typeof message !== "string" || message.length > 1000) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read SMS settings from DB using service role key (bypasses RLS)
    const { data: settingsRow } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "sms")
      .single();

    const s = settingsRow?.value as any;

    if (!s?.enabled) {
      return new Response(JSON.stringify({ success: false, reason: "SMS disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dlr = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const formattedPhone = formatPhone(phone);

    // 019 SMS API — XML format
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sms>
    <user><username>${escapeXml(s.user)}</username></user>
    <source>${escapeXml(s.source)}</source>
    <destinations><phone id="${dlr}">${formattedPhone}</phone></destinations>
    <message>${escapeXml(message)}</message>
</sms>`;

    const response = await fetch("https://019sms.co.il/api", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${s.token}`,
        "Content-Type": "application/xml",
        "charset": "utf-8",
      },
      body: xml,
    });

    const result = await response.text();

    return new Response(
      JSON.stringify({ success: response.ok, status: response.status, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
