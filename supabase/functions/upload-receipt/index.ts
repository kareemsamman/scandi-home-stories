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

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Parse multipart form data
    const formData = await req.formData();
    const orderId = formData.get("orderId") as string;
    const token = formData.get("token") as string;
    const orderNumber = formData.get("orderNumber") as string;

    if (!orderNumber) {
      return json({ error: "Missing orderNumber" }, 400);
    }

    // If orderId and token are provided (not "pending"), verify the order token
    if (orderId && orderId !== "pending" && token && token !== "pending") {
      const { data: order, error: fetchErr } = await supabaseAdmin
        .from("orders")
        .select("id, payment_token")
        .eq("id", orderId)
        .maybeSingle();

      if (fetchErr || !order) return json({ error: "Order not found" }, 404);
      if (order.payment_token !== token) return json({ error: "Invalid token" }, 403);
    }

    // Collect files from form data
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file") && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return json({ error: "No files provided" }, 400);
    }

    if (files.length > 5) {
      return json({ error: "Maximum 5 files allowed" }, 400);
    }

    // Validate and upload each file
    const uploadedPaths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate MIME type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return json({ error: `File type not allowed: ${file.type}. Only JPG, PNG, PDF accepted.` }, 400);
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        return json({ error: `File too large (max 10MB)` }, 400);
      }

      // Validate extension matches MIME
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const validExts: Record<string, string[]> = {
        "image/jpeg": ["jpg", "jpeg"],
        "image/png": ["png"],
        "application/pdf": ["pdf"],
      };
      if (!validExts[file.type]?.includes(ext)) {
        return json({ error: `File extension doesn't match type` }, 400);
      }

      const safeOrderNum = orderNumber.replace(/[^a-zA-Z0-9]/g, "");
      const path = `receipts/${safeOrderNum}_${Date.now()}_${i + 1}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadErr } = await supabaseAdmin.storage
        .from("receipts")
        .upload(path, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadErr) {
        console.error("Upload error:", uploadErr.message);
        return json({ error: `Upload failed: ${uploadErr.message}` }, 500);
      }

      uploadedPaths.push(`receipts:${path}`);
    }

    return json({ success: true, paths: uploadedPaths });
  } catch (err: any) {
    console.error("upload-receipt error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
