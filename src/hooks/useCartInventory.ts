import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "./useCart";
import { ContractorProduct } from "@/data/products";

interface InvRow {
  product_id: string;
  variation_key: string;
  stock_quantity: number;
}

/** Fetches inventory for all products currently in the cart (single batch query). */
export const useCartInventory = (items: CartItem[]) => {
  const productIds = [...new Set(items.map(i => i.product.id))];

  const { data: inventory = [] } = useQuery<InvRow[]>({
    queryKey: ["cart_inventory", ...productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data } = await (supabase as any)
        .from("inventory")
        .select("product_id, variation_key, stock_quantity")
        .in("product_id", productIds);
      return (data || []) as InvRow[];
    },
    enabled: productIds.length > 0,
    staleTime: 30_000,
  });

  /**
   * Returns the maximum quantity allowed for this cart item based on live stock.
   * Returns 9999 if the product has no inventory rows (= untracked / unlimited).
   */
  const getStockMax = (item: CartItem): number => {
    const rows = inventory.filter(r => r.product_id === item.product.id);
    if (rows.length === 0) return 9999; // product not tracked in inventory

    const colorId = item.options?.color?.id;
    const sizeLabel = item.options?.size;

    if (item.product.type === "contractor" && colorId && sizeLabel) {
      const contractor = item.product as ContractorProduct;
      const sizeId = contractor.sizes?.find(s => s.label === sizeLabel)?.id;
      if (sizeId) {
        const row = rows.find(r => r.variation_key === `combo:${colorId}|${sizeId}`);
        if (row) return row.stock_quantity;
      }
    }

    if (colorId) {
      const row = rows.find(r => r.variation_key === `color:${colorId}`);
      if (row) return row.stock_quantity;
    }

    // Fallback: sum all variations (single-variation products)
    return rows.reduce((s, r) => s + r.stock_quantity, 0);
  };

  return { getStockMax };
};
