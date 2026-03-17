import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const db = supabase as any;

export type OrderStatus =
  | "waiting_approval"
  | "in_process"
  | "in_delivery"
  | "not_approved"
  | "cancelled"
  | "pending"     // legacy
  | "confirmed"   // legacy
  | "shipped"     // legacy
  | "delivered";  // legacy

export interface OrderItem {
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  productId?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  discountAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  notes?: string;
  receiptUrl?: string;
  locale?: string;
}

/* ---- Inventory adjustment helper ---- */
// delta: negative to deduct stock, positive to restore
export const adjustInventory = async (
  items: { productId?: string; quantity: number; color?: string; size?: string }[],
  delta: -1 | 1
) => {
  for (const item of items) {
    if (!item.productId) continue;

    // Fetch all inventory rows for this product
    const { data: rows } = await db
      .from("inventory")
      .select("id, variation_key, stock_quantity")
      .eq("product_id", item.productId);

    if (!rows || rows.length === 0) continue; // product not tracked

    let targetRow = rows[0]; // default: first row

    if (rows.length > 1) {
      // Try to match variation_key by color/size
      const candidates = [
        item.color && item.size ? `${item.color}_${item.size}` : null,
        item.color && item.size ? `${item.size}_${item.color}` : null,
        item.color ?? null,
        item.size ?? null,
        "",
      ].filter(Boolean) as string[];

      for (const key of candidates) {
        const match = rows.find(
          (r: any) => r.variation_key.toLowerCase() === key.toLowerCase()
        );
        if (match) { targetRow = match; break; }
      }
    }

    const newQty = Math.max(0, targetRow.stock_quantity + delta * item.quantity);
    await db
      .from("inventory")
      .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
      .eq("id", targetRow.id);
  }
};

/* ---- fetch orders for current user ---- */
export const useOrders = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        date: new Date(o.created_at).toLocaleDateString("he-IL"),
        total: Number(o.total),
        discountAmount: Number(o.discount_amount || 0),
        status: o.status as OrderStatus,
        notes: o.notes || undefined,
        receiptUrl: o.receipt_url || undefined,
        locale: o.locale || "he",
        items: (o.order_items || []).map((item: any) => ({
          name: item.product_name,
          image: item.product_image,
          price: Number(item.price),
          quantity: item.quantity,
          size: item.size || undefined,
          color: item.color_name || undefined,
          productId: item.product_id || undefined,
        })),
      })) as Order[];
    },
    staleTime: 1000 * 60,
  });
};

/* ---- save a new order to DB ---- */
export const useAddOrder = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      order,
      items,
    }: {
      order: {
        orderNumber: string;
        total: number;
        notes?: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        city: string;
        address: string;
        apartment?: string;
        receiptUrl?: string;
        locale?: string;
        marketingOptIn?: boolean;
        discountCode?: string;
        discountAmount?: number;
      };
      items: OrderItem[];
    }) => {
      const { data: newOrder, error: orderErr } = await db
        .from("orders")
        .insert({
          user_id: user?.id || null,
          order_number: order.orderNumber,
          status: "waiting_approval",
          total: order.total,
          notes: order.notes || null,
          first_name: order.firstName,
          last_name: order.lastName,
          email: order.email,
          phone: order.phone,
          city: order.city,
          address: order.address,
          apartment: order.apartment || null,
          receipt_url: order.receiptUrl || null,
          locale: order.locale || "he",
          marketing_opt_in: order.marketingOptIn || false,
          discount_code: order.discountCode || null,
          discount_amount: order.discountAmount || 0,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      if (items.length > 0) {
        const { error: itemsErr } = await db.from("order_items").insert(
          items.map((item) => ({
            order_id: newOrder.id,
            product_id: item.productId || null,
            product_name: item.name,
            product_image: item.image,
            price: item.price,
            quantity: item.quantity,
            size: item.size || null,
            color_name: item.color || null,
          }))
        );
        if (itemsErr) throw itemsErr;
      }

      // Deduct stock for each ordered item
      await adjustInventory(
        items.map(i => ({ productId: i.productId, quantity: i.quantity, color: i.color, size: i.size })),
        -1
      );

      return newOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-orders"] });
      qc.invalidateQueries({ queryKey: ["admin_inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
};
