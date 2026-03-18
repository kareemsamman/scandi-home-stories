import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const extractAnswerText = (content: unknown): string => {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const maybeText = (part as { text?: unknown }).text;
          return typeof maybeText === "string" ? maybeText : "";
        }
        return "";
      })
      .join(" ");
  }

  return "";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType || typeof imageBase64 !== "string" || typeof mimeType !== "string") {
      return new Response(JSON.stringify({ isReceipt: false, reason: "invalid_payload" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ isReceipt: false, reason: "verification_unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "You are a strict receipt classifier. Return YES only when the image clearly shows a payment receipt/transfer proof with payment evidence such as amount, transaction details, date, reference id, and payment context. If uncertain, return NO. Return exactly one token: YES or NO.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: "Is this a real payment receipt or transfer proof? Answer YES or NO only.",
              },
            ],
          },
        ],
        max_tokens: 4,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errText);
      return new Response(JSON.stringify({ isReceipt: false, reason: "gateway_error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawAnswer = extractAnswerText(data.choices?.[0]?.message?.content).trim().toUpperCase();

    const hasYes = /\bYES\b/.test(rawAnswer);
    const hasNo = /\bNO\b/.test(rawAnswer);
    const isReceipt = hasYes && !hasNo;

    return new Response(JSON.stringify({ isReceipt, answer: rawAnswer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("verify-receipt error:", error);
    return new Response(JSON.stringify({ isReceipt: false, reason: "unexpected_error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
