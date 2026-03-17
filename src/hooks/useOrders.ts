import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const db = supabase as any;

export interface OrderItem {
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  items: OrderItem[];
  notes?: string;
}

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
        status: o.status as Order["status"],
        notes: o.notes || undefined,
        items: (o.order_items || []).map((item: any) => ({
          name: item.product_name,
          image: item.product_image,
          price: Number(item.price),
          quantity: item.quantity,
          size: item.size || undefined,
          color: item.color_name || undefined,
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
      };
      items: OrderItem[];
    }) => {
      const { data: newOrder, error: orderErr } = await db
        .from("orders")
        .insert({
          user_id: user?.id || null,
          order_number: order.orderNumber,
          status: "pending",
          total: order.total,
          notes: order.notes || null,
          first_name: order.firstName,
          last_name: order.lastName,
          email: order.email,
          phone: order.phone,
          city: order.city,
          address: order.address,
          apartment: order.apartment || null,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      if (items.length > 0) {
        const { error: itemsErr } = await db.from("order_items").insert(
          items.map((item) => ({
            order_id: newOrder.id,
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

      return newOrder;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-orders"] }),
  });
};
