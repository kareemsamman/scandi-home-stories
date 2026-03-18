import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      // If no API key configured, skip validation and allow the upload
      return new Response(JSON.stringify({ isReceipt: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: "Is this image a bank transfer confirmation, payment receipt, or any kind of payment proof? Answer only YES or NO.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      // On API error, allow upload to not block the customer
      console.error("Anthropic API error:", response.status);
      return new Response(JSON.stringify({ isReceipt: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const answer = (data.content?.[0]?.text || "").trim().toUpperCase();
    const isReceipt = answer.startsWith("YES");

    return new Response(JSON.stringify({ isReceipt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("verify-receipt error:", error);
    // On unexpected error, allow upload to proceed
    return new Response(JSON.stringify({ isReceipt: true, skipped: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
