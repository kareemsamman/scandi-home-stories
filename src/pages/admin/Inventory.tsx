import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useDbData";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Package, AlertTriangle, Plus, Search, CheckCircle2, Minus } from "lucide-react";

const db = supabase as any;

/* Parse variation_key → readable color/size from product data */
const parseVariation = (key: string, product: any) => {
  if (!key || key === "default") return { colorName: null, colorHex: null, sizeName: null };

  if (key.startsWith("color:")) {
    const colorId = key.slice(6);
    const color = (product.colors || []).find((c: any) => c.id === colorId);
    return { colorName: color?.name || colorId, colorHex: color?.hex || null, sizeName: null };
  }

  if (key.startsWith("combo:")) {
    const [colorId, sizeId] = key.slice(6).split("|");
    const color = (product.colors || []).find((c: any) => c.id === colorId);
    const size = (product.sizes || []).find((s: any) => s.id === sizeId);
    return {
      colorName: color?.name || colorId,
      colorHex: color?.hex || null,
      sizeName: size?.name || size?.label || sizeId,
    };
  }

  return { colorName: null, colorHex: null, sizeName: key };
};

const AdminInventory = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: products = [] } = useProducts();

  const [search, setSearch] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [localQty, setLocalQty] = useState<Record<string, number>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["admin_inventory"],
    queryFn: async () => {
      const { data } = await db.from("inventory").select("*");
      return data || [];
    },
  });

  const { data: transMap = new Map() } = useQuery({
    queryKey: ["admin_inv_product_trans", locale],
    queryFn: async () => {
      const { data } = await db.from("product_translations").select("*").eq("locale", locale);
      return new Map((data || []).map((t: any) => [t.product_id, t]));
    },
  });

  /* Build inventoryMap: product_id → inventory[] */
  const inventoryMap = new Map<string, any[]>();
  inventory.forEach((inv: any) => {
    const arr = inventoryMap.get(inv.product_id) || [];
    arr.push(inv);
    inventoryMap.set(inv.product_id, arr);
  });

  /* Auto-save qty to DB */
  const saveStock = async (inv: any, newQty: number) => {
    const key = `${inv.product_id}-${inv.variation_key}`;
    setSavingKeys(prev => new Set([...prev, key]));
    try {
      await db.from("inventory").upsert(
        { product_id: inv.product_id, variation_key: inv.variation_key, stock_quantity: newQty, low_stock_threshold: inv.low_stock_threshold },
        { onConflict: "product_id,variation_key" }
      );
      qc.invalidateQueries({ queryKey: ["admin_inventory"] });
      setSavedKeys(prev => new Set([...prev, key]));
      setTimeout(() => setSavedKeys(prev => { const n = new Set(prev); n.delete(key); return n; }), 1800);
    } catch (e: any) {
      toast({ title: "שגיאה בשמירה", description: e.message, variant: "destructive" });
    } finally {
      setSavingKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  };

  /* Auto-save threshold on blur */
  const saveThreshold = async (inv: any, newThreshold: number) => {
    await db.from("inventory").upsert(
      { product_id: inv.product_id, variation_key: inv.variation_key, stock_quantity: inv.stock_quantity, low_stock_threshold: newThreshold },
      { onConflict: "product_id,variation_key" }
    );
    qc.invalidateQueries({ queryKey: ["admin_inventory"] });
  };

  const initInventory = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await db.from("inventory").upsert(
        { product_id: productId, variation_key: "", stock_quantity: 0, low_stock_threshold: 5 },
        { onConflict: "product_id,variation_key" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_inventory"] }),
  });

  const lowStockCount = inventory.filter((inv: any) => inv.stock_quantity <= inv.low_stock_threshold).length;

  const filtered = (products as any[]).filter((p) => {
    const pName = (transMap as Map<string, any>).get(p.id)?.name || p.name || "";
    if (search && !pName.toLowerCase().includes(search.toLowerCase()) && !(p.sku || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (showLowOnly) {
      const invItems = inventoryMap.get(p.id) || [];
      if (invItems.length === 0) return false;
      return invItems.some((inv: any) => inv.stock_quantity <= inv.low_stock_threshold);
    }
    return true;
  });

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">מלאי</h1>
          <p className="text-gray-500 text-sm mt-0.5">ניהול כמויות מוצרים</p>
        </div>
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4" />
            {lowStockCount} {lowStockCount === 1 ? "מוצר במלאי נמוך" : "מוצרים במלאי נמוך"}
          </div>
        )}
      </div>

      {/* ── Search + filter ── */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="חיפוש לפי שם מוצר או SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pr-10 pl-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowLowOnly(!showLowOnly)}
          className={`flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold transition-colors border shrink-0 ${
            showLowOnly
              ? "bg-amber-500 border-amber-500 text-white shadow-sm"
              : "bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          מלאי נמוך בלבד
        </button>
      </div>

      {/* ── Loading skeletons ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="px-4 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="px-4 py-4 space-y-3">
                <div className="h-12 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (

        /* ── Product cards grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((product: any) => {
            const invItems = inventoryMap.get(product.id) || [];
            const pName = (transMap as Map<string, any>).get(product.id)?.name || product.name;
            const hasLow = invItems.some((inv: any) => inv.stock_quantity <= inv.low_stock_threshold);

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-shadow ${
                  hasLow ? "border-red-200 shadow-sm shadow-red-100" : "border-gray-200"
                }`}
              >
                {/* Product header row */}
                <div className={`px-4 py-3.5 flex items-center gap-3 border-b ${
                  hasLow ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"
                }`}>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm leading-tight">{pName}</p>
                    {product.sku && (
                      <p className="text-xs text-gray-400 font-mono mt-0.5">SKU: {product.sku}</p>
                    )}
                  </div>
                  {hasLow && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                </div>

                {/* Variants */}
                {invItems.length === 0 ? (
                  /* Untracked product */
                  <div className="px-4 py-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-400">לא במעקב</p>
                    <button
                      onClick={() => initInventory.mutate(product.id)}
                      disabled={initInventory.isPending}
                      className="flex items-center gap-1.5 h-9 px-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      התחל מעקב
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {invItems.map((inv: any) => {
                      const key = `${inv.product_id}-${inv.variation_key}`;
                      const { colorName, colorHex, sizeName } = parseVariation(inv.variation_key, product);
                      const currentQty = localQty[key] ?? inv.stock_quantity;
                      const isLow = currentQty <= inv.low_stock_threshold;
                      const isSaving = savingKeys.has(key);
                      const isSaved = savedKeys.has(key);

                      return (
                        <div key={inv.id} className={`px-4 py-3 ${isLow ? "bg-red-50/50" : ""}`}>

                          {/* Color / size label */}
                          {(colorName || sizeName) && (
                            <div className="flex items-center gap-1.5 mb-2.5">
                              {colorHex && (
                                <span
                                  className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                                  style={{ backgroundColor: colorHex }}
                                />
                              )}
                              {colorName && <span className="text-xs font-semibold text-gray-700">{colorName}</span>}
                              {sizeName && <span className="text-xs text-gray-500">· {sizeName}</span>}
                            </div>
                          )}

                          {/* Controls row */}
                          <div className="flex items-center justify-between gap-3">

                            {/* ─ Qty +/- ─ */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const newQty = Math.max(0, currentQty - 1);
                                  setLocalQty(prev => ({ ...prev, [key]: newQty }));
                                  saveStock(inv, newQty);
                                }}
                                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors touch-manipulation"
                              >
                                <Minus className="w-4 h-4 text-gray-600" />
                              </button>

                              <input
                                type="number"
                                value={currentQty}
                                onChange={e => setLocalQty(prev => ({ ...prev, [key]: Math.max(0, +e.target.value) }))}
                                onBlur={() => {
                                  const val = localQty[key];
                                  if (val !== undefined && val !== inv.stock_quantity) saveStock(inv, val);
                                }}
                                className={`w-16 h-10 text-center text-lg font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${
                                  isLow
                                    ? "border-red-300 bg-red-50 text-red-700"
                                    : "border-gray-200 bg-gray-50 text-gray-900"
                                }`}
                              />

                              <button
                                onClick={() => {
                                  const newQty = currentQty + 1;
                                  setLocalQty(prev => ({ ...prev, [key]: newQty }));
                                  saveStock(inv, newQty);
                                }}
                                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors touch-manipulation"
                              >
                                <Plus className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>

                            {/* ─ Status + threshold ─ */}
                            <div className="flex flex-col items-end gap-1 min-w-0">
                              {isSaving ? (
                                <span className="text-xs text-gray-400 animate-pulse">שומר…</span>
                              ) : isSaved ? (
                                <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> נשמר
                                </span>
                              ) : isLow ? (
                                <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> מלאי נמוך
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-green-600">במלאי ✓</span>
                              )}
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                התראה ב-
                                <input
                                  type="number"
                                  defaultValue={inv.low_stock_threshold}
                                  onBlur={e => saveThreshold(inv, +e.target.value)}
                                  className="w-8 text-center bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-400 text-[10px] text-gray-600 mx-0.5"
                                />
                              </span>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="sm:col-span-2 text-center py-16 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">לא נמצאו מוצרים</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
