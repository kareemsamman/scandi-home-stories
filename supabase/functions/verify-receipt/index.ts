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

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ isReceipt: true, skipped: true }), {
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
            content: `You are a strict image classifier. Your ONLY job is to determine if an image is a genuine bank transfer confirmation, payment receipt, or payment proof.

Rules:
- A valid receipt/payment proof MUST contain monetary amounts, transaction details, bank/payment service branding, dates, or reference numbers.
- Random photos, screenshots of websites, product images, selfies, documents without payment info, memes, or any non-payment image must be classified as NO.
- If the image is blurry but appears to show payment details, answer YES.
- If there is ANY doubt that this is a payment document, answer NO.
- Answer ONLY with the single word YES or NO. Nothing else.`
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
                text: "Is this image a bank transfer confirmation, payment receipt, or payment proof? Answer YES or NO only.",
              },
            ],
          },
        ],
        max_tokens: 5,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errText);
      return new Response(JSON.stringify({ isReceipt: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const answer = (data.choices?.[0]?.message?.content || "").trim().toUpperCase();
    console.log("AI receipt check answer:", answer);
    const isReceipt = answer.startsWith("YES");

    return new Response(JSON.stringify({ isReceipt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("verify-receipt error:", error);
    return new Response(JSON.stringify({ isReceipt: true, skipped: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
