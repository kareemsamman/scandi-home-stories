import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Optional auth — guests can place orders too
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) userId = user.id;
    }

    const body = await req.json();
    const {
      orderNumber, notes, firstName, lastName, email, phone,
      city, address, house_number, apartment, receiptUrl, locale,
      origin, shippingCost,
      marketingOptIn, discountCode,
      payment_status: rawPaymentStatus,
      items, // Array of { productId, quantity, size?, color?, colorId?, sizeId? }
    } = body;

    // --- Check if caller is admin (allows optional email + pay_later) ---
    let isAdminCaller = false;
    if (userId) {
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin");
      isAdminCaller = !!(roleData && roleData.length > 0);
    }
    const paymentStatus = isAdminCaller && rawPaymentStatus === "unpaid" ? "unpaid" : "paid";

    // --- Input validation ---
    if (!orderNumber || typeof orderNumber !== "string" || orderNumber.length > 50) {
      return jsonResponse({ error: "Invalid order number" }, 400);
    }
    if (!firstName || typeof firstName !== "string" || firstName.length > 100) {
      return jsonResponse({ error: "Invalid first name" }, 400);
    }
    if (!lastName || typeof lastName !== "string" || lastName.length > 100) {
      return jsonResponse({ error: "Invalid last name" }, 400);
    }
    // Email optional for admin pay-later orders
    if (!isAdminCaller && (!email || typeof email !== "string" || email.length > 255)) {
      return jsonResponse({ error: "Invalid email" }, 400);
    }
    if (email && (typeof email !== "string" || email.length > 255)) {
      return jsonResponse({ error: "Invalid email" }, 400);
    }
    if (!phone || typeof phone !== "string" || phone.length > 20) {
      return jsonResponse({ error: "Invalid phone" }, 400);
    }
    if (!city || typeof city !== "string" || city.length > 200) {
      return jsonResponse({ error: "Invalid city" }, 400);
    }
    if (!address || typeof address !== "string" || address.length > 500) {
      return jsonResponse({ error: "Invalid address" }, 400);
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      return jsonResponse({ error: "Invalid items" }, 400);
    }

    // --- Server-side price lookup ---
    const productIds = [...new Set(items.map((i: any) => i.productId).filter(Boolean))];
    if (productIds.length === 0) {
      return jsonResponse({ error: "No valid product IDs" }, 400);
    }

    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, price, name, images, status")
      .in("id", productIds);

    if (prodErr || !products) {
      return jsonResponse({ error: "Failed to fetch products" }, 500);
    }

    const priceMap = new Map(products.map((p: any) => [p.id, p]));

    // Validate all items have valid products and compute server-side total
    let serverTotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1 || item.quantity > 999) {
        return jsonResponse({ error: `Invalid item: ${item.productId}` }, 400);
      }
      const product = priceMap.get(item.productId);
      if (!product) {
        return jsonResponse({ error: `Product not found: ${item.productId}` }, 400);
      }
      if (product.status !== "published") {
        return jsonResponse({ error: `Product unavailable: ${product.name}` }, 400);
      }

      const lineTotal = Number(product.price) * item.quantity;
      serverTotal += lineTotal;

      validatedItems.push({
        product_id: item.productId,
        product_name: product.name || "",
        product_image: product.images?.[0] || "",
        price: Number(product.price),
        quantity: item.quantity,
        size: item.size || null,
        color_name: item.color || null,
      });
    }

    // --- Server-side coupon validation ---
    let discountAmount = 0;
    let validatedCouponId: string | null = null;

    if (discountCode && typeof discountCode === "string") {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", discountCode.toUpperCase().trim())
        .single();

      if (coupon && coupon.is_active) {
        // Admin-only coupon — skip if caller is not admin
        const couponAdminOk = !coupon.admin_only || isAdminCaller;

        // Phone-restricted coupon — skip if order phone not in allowed list
        let couponPhoneOk = true;
        if (coupon.allowed_phones?.length > 0) {
          const normalizePhone = (p: string) => p.replace(/[\s\-\+]/g, "").replace(/^972/, "0");
          const normalizedOrderPhone = normalizePhone(phone || "");
          const allowed = coupon.allowed_phones.map(normalizePhone);
          couponPhoneOk = !!normalizedOrderPhone && allowed.includes(normalizedOrderPhone);
        }

        const now = new Date();
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
        const withinDates = (!validFrom || validFrom <= now) && (!validUntil || validUntil >= now);
        const withinUses = coupon.max_uses === null || coupon.uses < coupon.max_uses;

        if (withinDates && withinUses && couponAdminOk && couponPhoneOk) {
          // Check per-user limit
          let userOk = true;
          if (userId && coupon.max_uses_per_user > 0) {
            const { count } = await supabaseAdmin
              .from("coupon_uses")
              .select("*", { count: "exact", head: true })
              .eq("coupon_id", coupon.id)
              .eq("user_id", userId);
            if ((count ?? 0) >= coupon.max_uses_per_user) userOk = false;
          }

          if (userOk) {
            // Calculate applicable subtotal
            let applicableSubtotal = serverTotal;
            const hasProductRestriction = coupon.product_ids?.length > 0;
            const hasCategoryRestriction = coupon.category_ids?.length > 0;

            if (hasProductRestriction || hasCategoryRestriction) {
              applicableSubtotal = 0;
              for (const item of items) {
                const matchProd = hasProductRestriction && coupon.product_ids.includes(item.productId);
                const matchCat = hasCategoryRestriction && item.product?.collection && coupon.category_ids.includes(item.product.collection);
                if (matchProd || matchCat) {
                  const p = priceMap.get(item.productId);
                  if (p) applicableSubtotal += Number(p.price) * item.quantity;
                }
              }
            }

            if (applicableSubtotal > 0 && serverTotal >= coupon.min_order_amount) {
              discountAmount = coupon.type === "percentage"
                ? (applicableSubtotal * coupon.value) / 100
                : Math.min(coupon.value, applicableSubtotal);

              if (coupon.max_discount_amount !== null && coupon.max_discount_amount > 0) {
                discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
              }
              discountAmount = Math.round(discountAmount * 100) / 100;
              validatedCouponId = coupon.id;
            }
          }
        }
      }
    }

    const finalTotal = Math.max(0, serverTotal - discountAmount);

    // --- Insert order ---
    const { data: newOrder, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        order_number: orderNumber,
        status: "waiting_approval",
        total: finalTotal,
        notes: (notes && typeof notes === "string") ? notes.slice(0, 1000) : null,
        first_name: (firstName || "").slice(0, 100),
        last_name: (lastName || "").slice(0, 100),
        email: email ? String(email).slice(0, 255) : null,
        phone: (phone || "").slice(0, 20),
        city: (city || "").slice(0, 200),
        address: (address || "").slice(0, 500),
        house_number: (house_number && typeof house_number === "string") ? house_number.slice(0, 50) : null,
        apartment: (apartment && typeof apartment === "string") ? apartment.slice(0, 100) : null,
        receipt_url: (receiptUrl && typeof receiptUrl === "string") ? receiptUrl.slice(0, 2000) : null,
        payment_status: paymentStatus,
        locale: locale === "ar" ? "ar" : "he",
        marketing_opt_in: !!marketingOptIn,
        discount_code: discountCode || null,
        discount_amount: discountAmount,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // --- Insert order items ---
    if (validatedItems.length > 0) {
      const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(
        validatedItems.map((item: any) => ({
          ...item,
          order_id: newOrder.id,
        }))
      );
      if (itemsErr) throw itemsErr;
    }

    // --- Deduct inventory ---
    for (const item of items) {
      if (!item.productId) continue;
      const { data: rows } = await supabaseAdmin
        .from("inventory")
        .select("id, variation_key, stock_quantity")
        .eq("product_id", item.productId);

      if (!rows || rows.length === 0) continue;

      let targetRow: any = null;
      if (item.colorId && item.sizeId) {
        targetRow = rows.find((r: any) => r.variation_key === `combo:${item.colorId}|${item.sizeId}`);
      }
      if (!targetRow && item.colorId) {
        targetRow = rows.find((r: any) => r.variation_key === `color:${item.colorId}`);
      }
      if (!targetRow) {
        targetRow = rows[0];
      }

      const newQty = Math.max(0, (targetRow.stock_quantity || 0) - item.quantity);
      await supabaseAdmin
        .from("inventory")
        .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
        .eq("id", targetRow.id);
    }

    // --- Auto-create customer account if no user yet ---
    try {
      if (!userId && phone) {
        const normalizePhone = (raw: string) => {
          const digits = raw.replace(/[\s\-\+\(\)]/g, "");
          if (digits.startsWith("972")) return "0" + digits.slice(3);
          if (digits.startsWith("00972")) return "0" + digits.slice(5);
          return digits;
        };
        const local = normalizePhone(phone);
        const intl = local.startsWith("0") ? "972" + local.slice(1) : local;

        // Check if profile with this phone already exists
        const { data: existingProfiles } = await supabaseAdmin
          .from("profiles")
          .select("user_id")
          .or(`phone.eq.${local},phone.eq.${intl},phone.eq.+${intl}`);

        if (!existingProfiles || existingProfiles.length === 0) {
          // Create a new auth user
          const userEmail = email || `${local.replace(/\D/g, "")}@no-email.amg-pergola.com`;
          const tempPassword = crypto.randomUUID();
          const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: userEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { first_name: firstName, last_name: lastName, phone: local },
          });

          if (!createErr && newUser?.user) {
            const newUserId = newUser.user.id;
            // Create profile
            await supabaseAdmin.from("profiles").upsert({
              user_id: newUserId,
              first_name: firstName,
              last_name: lastName,
              phone: local,
              needs_password: true,
            }, { onConflict: "user_id" });
            // Link order to new user
            await supabaseAdmin.from("orders").update({ user_id: newUserId }).eq("id", newOrder.id);
            console.log("[auto-user] created user for phone:", local);
          } else {
            console.error("[auto-user] failed:", createErr?.message);
          }
        }
      }
    } catch (autoUserErr) {
      console.error("[auto-user] error:", autoUserErr);
      // Don't fail the order if auto-user creation fails
    }

    // --- Record coupon use ---
    if (validatedCouponId && discountAmount > 0) {
      await supabaseAdmin.from("coupon_uses").insert({
        coupon_id: validatedCouponId,
        user_id: userId,
        order_number: orderNumber,
        discount_amount: discountAmount,
      });
      const { data: current } = await supabaseAdmin
        .from("coupons")
        .select("uses")
        .eq("id", validatedCouponId)
        .single();
      await supabaseAdmin
        .from("coupons")
        .update({ uses: (current?.uses ?? 0) + 1 })
        .eq("id", validatedCouponId);
    }

    // --- Send SMS notifications ---
    try {
      const [{ data: smsRow }, { data: msgRow }] = await Promise.all([
        supabaseAdmin.from("app_settings").select("value").eq("key", "sms").single(),
        supabaseAdmin.from("app_settings").select("value").eq("key", "sms_messages").single(),
      ]);
      const smsSettings = smsRow?.value as any;
      const smsMessages = msgRow?.value as any;
      console.log("[SMS] enabled:", smsSettings?.enabled, "hasMessages:", !!smsMessages);

      if (smsSettings?.enabled && smsMessages) {
        const escapeXml = (s: string) =>
          s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

        const fmtPhone = (p: string) => {
          const c = p.replace(/[\s\-\+]/g, "");
          if (c.startsWith("972")) return c;
          if (c.startsWith("0")) return "972" + c.slice(1);
          return c;
        };

        const formatSms = (tpl: string, vars: Record<string, string>) =>
          Object.entries(vars).reduce(
            (m, [k, v]) => m.replace(new RegExp(`\\{${k}\\}`, "g"), v), tpl
          );

        const sendSmsApi = async (toPhone: string, message: string) => {
          const dlr = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
          const formatted = fmtPhone(toPhone);
          const xml = `<?xml version="1.0" encoding="UTF-8"?><sms><user><username>${escapeXml(smsSettings.user)}</username></user><source>${escapeXml(smsSettings.source)}</source><destinations><phone id="${dlr}">${formatted}</phone></destinations><message>${escapeXml(message)}</message></sms>`;
          console.log("[SMS] sending to:", formatted);
          try {
            const resp = await fetch("https://019sms.co.il/api", {
              method: "POST",
              headers: { "Authorization": `Bearer ${smsSettings.token}`, "Content-Type": "application/xml" },
              body: xml,
            });
            const body = await resp.text();
            console.log("[SMS] response:", resp.status, body);
          } catch (fetchErr) {
            console.error("[SMS] fetch error:", fetchErr);
          }
        };

        const itemsList = validatedItems
          .map(i => `• ${i.product_name} ×${i.quantity} – ₪${(i.price * i.quantity).toLocaleString()}`)
          .join("\n");

        const siteOrigin = (typeof origin === "string" && origin.startsWith("http")) ? origin : "https://pergolaamg.com";
        const customerLocalePrefix = locale === "ar" ? "ar" : "he";
        const orderLink = `${siteOrigin}/${customerLocalePrefix}/account/order/${newOrder.id}`;
        const invoiceLink = `${siteOrigin}/invoice/${newOrder.id}`;
        const shippingLabel = shippingCost > 0 ? `₪${Number(shippingCost).toLocaleString()}` : "חינם";

        const vars: Record<string, string> = {
          name: firstName,
          order_number: orderNumber,
          phone: phone,
          total: finalTotal.toLocaleString(),
          items: itemsList,
          shipping: shippingLabel,
          order_link: orderLink,
          invoice_link: invoiceLink,
        };

        const customerLocale = locale === "ar" ? "ar" : "he";
        const customerMsg = smsMessages.order_received?.[customerLocale] || smsMessages.order_received?.he;
        if (customerMsg) {
          await sendSmsApi(phone, formatSms(customerMsg, vars));
        }

        if (smsMessages.admin_new_order && smsSettings.admin_phone) {
          await sendSmsApi(
            smsSettings.admin_phone,
            formatSms(smsMessages.admin_new_order, { ...vars, name: `${firstName} ${lastName}` })
          );
        }
      }
    } catch (smsErr) {
      console.error("SMS send error:", smsErr);
      // Don't fail the order if SMS errors
    }

    return jsonResponse({
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.order_number,
      total: finalTotal,
      discountAmount,
    });
  } catch (err: any) {
    console.error("create-order error:", err);
    return jsonResponse({ error: "Failed to create order" }, 500);
  }
});
