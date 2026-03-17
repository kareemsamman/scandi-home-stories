import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

/* ── Types ── */
export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  max_uses: number | null;
  max_uses_per_user: number;
  uses: number;
  valid_from: string | null;
  valid_until: string | null;
  product_ids: string[];
  category_ids: string[];
  is_active: boolean;
  created_at: string;
}

export interface AppliedCoupon {
  coupon: Coupon;
  discountAmount: number;
}

/* ── Zustand store — persists applied coupon across Cart → Checkout ── */
interface CouponStore {
  applied: AppliedCoupon | null;
  apply: (coupon: Coupon, discountAmount: number) => void;
  remove: () => void;
}

export const useCouponStore = create<CouponStore>()(
  persist(
    (set) => ({
      applied: null,
      apply: (coupon, discountAmount) => set({ applied: { coupon, discountAmount } }),
      remove: () => set({ applied: null }),
    }),
    { name: "amg-coupon" }
  )
);

/* ── Validation ── */
export interface CartItemForValidation {
  product: { id: string; price: number; collection?: string };
  quantity: number;
}

export const validateCoupon = async (
  code: string,
  cartItems: CartItemForValidation[],
  subtotal: number,
  userId?: string
): Promise<{ coupon?: Coupon; discountAmount?: number; error?: string }> => {
  const { data: coupon, error: fetchErr } = await db
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .single();

  if (fetchErr || !coupon) return { error: "קוד הנחה לא תקין" };
  if (!coupon.is_active) return { error: "קוד הנחה אינו פעיל" };

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now)
    return { error: "קוד הנחה עדיין לא בתוקף" };
  if (coupon.valid_until && new Date(coupon.valid_until) < now)
    return { error: "קוד הנחה פג תוקף" };

  if (coupon.max_uses !== null && coupon.uses >= coupon.max_uses)
    return { error: "קוד הנחה מוצה" };

  if (userId && coupon.max_uses_per_user > 0) {
    const { count } = await db
      .from("coupon_uses")
      .select("*", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId);
    if ((count ?? 0) >= coupon.max_uses_per_user)
      return { error: "כבר השתמשת בקוד הנחה זה" };
  }

  // Calculate applicable subtotal (product / category restrictions)
  let applicableSubtotal = subtotal;
  const hasProductRestriction = coupon.product_ids?.length > 0;
  const hasCategoryRestriction = coupon.category_ids?.length > 0;
  if (hasProductRestriction || hasCategoryRestriction) {
    applicableSubtotal = cartItems.reduce((sum, item) => {
      const matchProd = hasProductRestriction && coupon.product_ids.includes(item.product.id);
      const matchCat = hasCategoryRestriction && item.product.collection && coupon.category_ids.includes(item.product.collection);
      if (matchProd || matchCat || (!hasProductRestriction && !hasCategoryRestriction))
        return sum + item.product.price * item.quantity;
      return sum;
    }, 0);
    if (applicableSubtotal === 0) return { error: "קוד הנחה לא חל על המוצרים בסל" };
  }

  if (coupon.min_order_amount > 0 && subtotal < coupon.min_order_amount)
    return { error: `מינימום הזמנה ₪${coupon.min_order_amount} לשימוש בקוד` };

  let discountAmount =
    coupon.type === "percentage"
      ? (applicableSubtotal * coupon.value) / 100
      : Math.min(coupon.value, applicableSubtotal);

  if (coupon.max_discount_amount !== null && coupon.max_discount_amount > 0)
    discountAmount = Math.min(discountAmount, coupon.max_discount_amount);

  discountAmount = Math.round(discountAmount * 100) / 100;
  return { coupon, discountAmount };
};

/* ── Record coupon use after successful order ── */
export const recordCouponUse = async (
  couponId: string,
  userId: string | undefined,
  orderNumber: string,
  discountAmount: number
) => {
  await db.from("coupon_uses").insert({
    coupon_id: couponId,
    user_id: userId ?? null,
    order_number: orderNumber,
    discount_amount: discountAmount,
  });
  // Increment uses counter
  const { data: current } = await db.from("coupons").select("uses").eq("id", couponId).single();
  await db.from("coupons").update({ uses: (current?.uses ?? 0) + 1 }).eq("id", couponId);
};

/* ── Admin hooks ── */
export const useCoupons = () =>
  useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await db.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Coupon[];
    },
  });

export const useSaveCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: Partial<Coupon> & { id?: string }) => {
      const { id, created_at, uses, ...fields } = coupon as any;
      const payload = {
        ...fields,
        code: (fields.code || "").toUpperCase().trim(),
        product_ids: fields.product_ids || [],
        category_ids: fields.category_ids || [],
      };
      if (id) {
        const { error } = await db.from("coupons").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await db.from("coupons").insert({ ...payload, uses: 0 });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
};

export const useDeleteCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
};

export const useToggleCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await db.from("coupons").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
};

export const useCouponUsage = (couponId: string) =>
  useQuery({
    queryKey: ["coupon_uses", couponId],
    queryFn: async () => {
      const { data } = await db.from("coupon_uses").select("*").eq("coupon_id", couponId).order("used_at", { ascending: false });
      return data || [];
    },
    enabled: !!couponId,
  });
