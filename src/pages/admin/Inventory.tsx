import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useDbData";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Package, AlertTriangle, Save, Plus, Search } from "lucide-react";

const db = supabase as any;

const AdminInventory = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: products = [] } = useProducts();
  const [search, setSearch] = useState("");
  const [editingStock, setEditingStock] = useState<Record<string, number>>({});
  const [showLowOnly, setShowLowOnly] = useState(false);

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["admin_inventory"],
    queryFn: async () => {
      const { data } = await db.from("inventory").select("*");
      return data || [];
    },
  });

  // Build inventory map: product_id -> inventory[]
  const inventoryMap = new Map<string, any[]>();
  inventory.forEach((inv: any) => {
    const arr = inventoryMap.get(inv.product_id) || [];
    arr.push(inv);
    inventoryMap.set(inv.product_id, arr);
  });

  const saveStock = useMutation({
    mutationFn: async ({ productId, variationKey, quantity, threshold }: {
      productId: string; variationKey: string; quantity: number; threshold: number;
    }) => {
      const { error } = await db.from("inventory").upsert({
        product_id: productId,
        variation_key: variationKey,
        stock_quantity: quantity,
        low_stock_threshold: threshold,
      }, { onConflict: "product_id,variation_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_inventory"] });
      toast({ title: "Stock updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const initInventory = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await db.from("inventory").upsert({
        product_id: productId,
        variation_key: "",
        stock_quantity: 0,
        low_stock_threshold: 5,
      }, { onConflict: "product_id,variation_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_inventory"] });
      toast({ title: "Inventory initialized" });
    },
  });

  const { data: transMap = new Map() } = useQuery({
    queryKey: ["admin_inv_product_trans", locale],
    queryFn: async () => {
      const { data } = await db.from("product_translations").select("*").eq("locale", locale);
      return new Map((data || []).map((t: any) => [t.product_id, t]));
    },
  });

  const filtered = products.filter((p) => {
    const pName = transMap.get(p.id)?.name || p.name || "";
    if (search && !pName.toLowerCase().includes(search.toLowerCase()) && !(p.sku || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (showLowOnly) {
      const invItems = inventoryMap.get(p.id) || [];
      if (invItems.length === 0) return true; // No inventory = potentially low
      return invItems.some((inv: any) => inv.stock_quantity <= inv.low_stock_threshold);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage product stock quantities</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={showLowOnly} onChange={(e) => setShowLowOnly(e.target.checked)} />
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Low stock only
        </label>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? <p className="text-gray-400">Loading...</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600">Variation</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600 w-32">Stock</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600 w-32">Low Threshold</th>
                <th className="text-start px-4 py-3 font-medium text-gray-600 w-24">Status</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => {
                const invItems = inventoryMap.get(product.id) || [];
                const pName = transMap.get(product.id)?.name || product.name;

                if (invItems.length === 0) {
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{pName}</p>
                            <p className="text-xs text-gray-400">{product.sku || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">—</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">Not tracked</td>
                      <td className="px-4 py-3">—</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">Untracked</span>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" onClick={() => initInventory.mutate(product.id)} className="text-blue-600 text-xs">
                          <Plus className="w-3 h-3 mr-1" /> Track
                        </Button>
                      </td>
                    </tr>
                  );
                }

                return invItems.map((inv: any, idx: number) => {
                  const isLow = inv.stock_quantity <= inv.low_stock_threshold;
                  const stockKey = `${inv.product_id}-${inv.variation_key}`;
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      {idx === 0 && (
                        <td className="px-4 py-3" rowSpan={invItems.length}>
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{pName}</p>
                              <p className="text-xs text-gray-400">{product.sku || "—"}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-600 text-xs">{inv.variation_key || "Default"}</td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          value={editingStock[stockKey] ?? inv.stock_quantity}
                          onChange={(e) => setEditingStock({ ...editingStock, [stockKey]: +e.target.value })}
                          className="w-24 h-8 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          value={inv.low_stock_threshold}
                          onChange={(e) => saveStock.mutate({
                            productId: inv.product_id, variationKey: inv.variation_key,
                            quantity: editingStock[stockKey] ?? inv.stock_quantity, threshold: +e.target.value,
                          })}
                          className="w-24 h-8 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Low
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">In Stock</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => saveStock.mutate({
                            productId: inv.product_id, variationKey: inv.variation_key,
                            quantity: editingStock[stockKey] ?? inv.stock_quantity, threshold: inv.low_stock_threshold,
                          })}
                          className="text-blue-600 h-8"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                });
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
