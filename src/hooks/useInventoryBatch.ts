import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

interface InvRow {
  product_id: string;
  stock_quantity: number;
}

/**
 * Fetches ALL inventory rows in a single query (small table).
 * Shared across all ProductCard instances via React Query cache.
 */
export const useAllInventory = () => {
  return useQuery<InvRow[]>({
    queryKey: ["all_inventory"],
    queryFn: async () => {
      const { data } = await db
        .from("inventory")
        .select("product_id, stock_quantity");
      return (data || []) as InvRow[];
    },
    staleTime: 1000 * 60,
  });
};

/** Returns inventory rows for a specific product from the batch cache. */
export const useProductInventory = (productId: string) => {
  const { data: allInventory = [] } = useAllInventory();
  return allInventory.filter((r) => r.product_id === productId);
};
