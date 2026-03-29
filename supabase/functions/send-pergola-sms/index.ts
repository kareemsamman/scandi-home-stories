import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const formatPhone = (phone: string): string => {
  const clean = phone.replace(/[\s\-\+]/g, "");
  if (clean.startsWith("972")) return clean;
  if (clean.startsWith("0")) return "972" + clean.slice(1);
  return clean;
};

const escapeXml = (str: string): string =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

async function sendSms(phone: string, message: string, smsSettings: any): Promise<boolean> {
  if (!smsSettings?.enabled) return false;
  const dlr = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const formattedPhone = formatPhone(phone);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sms>
    <user><username>${escapeXml(smsSettings.user)}</username></user>
    <source>${escapeXml(smsSettings.source || "AMGPergola")}</source>
    <destinations><phone id="${dlr}">${formattedPhone}</phone></destinations>
    <message>${escapeXml(message)}</message>
</sms>`;

  const response = await fetch("https://019sms.co.il/api", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${smsSettings.token}`,
      "Content-Type": "application/xml",
      "charset": "utf-8",
    },
    body: xml,
  });
  return response.ok;
}

function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value || "");
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { action, request_id, site_origin } = await req.json();

    if (!action || !request_id) {
      return new Response(JSON.stringify({ error: "action and request_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get SMS settings
    const { data: smsRow } = await supabaseAdmin.from("app_settings").select("value").eq("key", "sms").single();
    const smsSettings = smsRow?.value as any;

    // Get pergola SMS message templates
    const { data: msgRow } = await supabaseAdmin.from("app_settings").select("value").eq("key", "sms_messages").single();
    const allMessages = msgRow?.value as any;

    // Get the pergola request
    const { data: request, error: reqError } = await supabaseAdmin
      .from("pergola_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (reqError || !request) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const locale = request.locale || "he";
    const origin = site_origin || "https://amg-pergola-ltd.lovable.app";

    if (action === "notify_admin") {
      // Send SMS to admin phone
      const adminPhone = smsSettings?.admin_phone;
      if (!adminPhone) {
        return new Response(JSON.stringify({ success: false, reason: "No admin phone configured" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const templateKey = "pergola_admin_new";
      const template = allMessages?.[templateKey]?.[locale] || allMessages?.[templateKey]?.he ||
        `🏗 בקשת פרגולה חדשה!\n👤 {name}\n📞 {phone}\n📏 {width}×{length} cm\n🔗 {link}`;

      const adminLink = `${origin}/admin/pergola-requests/${request_id}`;
      const message = replacePlaceholders(template, {
        name: request.customer_name,
        phone: request.customer_phone,
        email: request.customer_email || "",
        width: String(Math.round(request.width / 10)),
        length: String(Math.round(request.length / 10)),
        type: request.pergola_type,
        link: adminLink,
      });

      const sent = await sendSms(adminPhone, message, smsSettings);
      return new Response(JSON.stringify({ success: sent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "notify_customer") {
      // Auth check - only admin/worker can trigger this
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: roleData } = await supabaseAdmin
        .from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "worker"]);
      if (!roleData || roleData.length === 0) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate response token if not exists
      let token = request.response_token;
      if (!token) {
        token = crypto.randomUUID();
        await supabaseAdmin.from("pergola_requests").update({
          response_token: token,
          admin_response_sent_at: new Date().toISOString(),
        }).eq("id", request_id);
      } else {
        await supabaseAdmin.from("pergola_requests").update({
          admin_response_sent_at: new Date().toISOString(),
        }).eq("id", request_id);
      }

      const templateKey = "pergola_customer_response";
      const template = allMessages?.[templateKey]?.[locale] || allMessages?.[templateKey]?.he ||
        `שלום {name} 👋\n🏗 קיבלנו תשובה לבקשת הפרגולה שלך!\n💰 מחיר: ₪{price}\n🔗 צפה בפרטים: {link}\n\n🏗 AMG PERGOLA`;

      const responseLink = `${origin}/${locale}/pergola-response/${request_id}?token=${token}`;
      const message = replacePlaceholders(template, {
        name: request.customer_name,
        price: request.quoted_price ? String(request.quoted_price) : "-",
        link: responseLink,
      });

      const sent = await sendSms(request.customer_phone, message, smsSettings);
      return new Response(JSON.stringify({ success: sent, token }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-pergola-sms error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
