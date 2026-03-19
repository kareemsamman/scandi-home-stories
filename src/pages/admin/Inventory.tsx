import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  Package, AlertTriangle, Search, CheckCircle2, Minus, Plus,
  StickyNote, Send, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";

const db = supabase as any;

/* ── Parse variation_key ── */
const parseKey = (key: string) => {
  if (!key) return { colorId: null, sizeId: null };
  if (key.startsWith("color:")) return { colorId: key.slice(6), sizeId: null };
  if (key.startsWith("combo:")) {
    const [c, s] = key.slice(6).split("|");
    return { colorId: c || null, sizeId: s || null };
  }
  return { colorId: null, sizeId: null };
};

/* ── Derive phantom inv rows for untracked products ── */
const deriveRows = (product: any): any[] => {
  const colors = (product.colors || []) as any[];
  const sizes = (product.sizes || []) as any[];
  const phantom = (vk: string) => ({
    id: `ph-${product.id}-${vk}`,
    product_id: product.id,
    variation_key: vk,
    stock_quantity: 0,
    low_stock_threshold: 5,
    _phantom: true,
  });

  if (product.type === "contractor" && colors.length > 0 && sizes.length > 0) {
    const rows: any[] = [];
    for (const color of colors) {
      const cId = color.tax_id || color.id;
      const lengths: string[] = Array.isArray(color.lengths) ? color.lengths : [];
      const relevant = lengths.length > 0
        ? sizes.filter((s: any) => lengths.includes(s.tax_id || s.id))
        : sizes;
      for (const size of relevant) {
        rows.push(phantom(`combo:${cId}|${size.tax_id || size.id}`));
      }
    }
    return rows;
  }
  if (product.type === "retail" && colors.length > 0) {
    return colors.map((c: any) => phantom(`color:${c.id}`));
  }
  return [phantom("")];
};

/* ── Group inv rows by color ── */
const groupByColor = (invItems: any[], product: any) => {
  const colors = (product.colors || []) as any[];
  const sizes = (product.sizes || []) as any[];
  const colorMap = new Map<string, { colorObj: any; items: Array<{ inv: any; sizeObj: any }> }>();
  let simpleItem: any | null = null;

  invItems.forEach(inv => {
    const { colorId, sizeId } = parseKey(inv.variation_key || "");
    if (!colorId) { simpleItem = inv; return; }
    const colorObj = colors.find((c: any) => (c.tax_id || c.id) === colorId) ?? null;
    const sizeObj = sizeId ? sizes.find((s: any) => (s.tax_id || s.id) === sizeId) ?? null : null;
    if (!colorMap.has(colorId)) colorMap.set(colorId, { colorObj, items: [] });
    colorMap.get(colorId)!.items.push({ inv, sizeObj });
  });

  return { colorMap, simpleItem };
};

/* ── QtyRow ── */
const QtyRow = ({
  inv, label, saveStock, savingKeys, savedKeys, localQty, setLocalQty,
}: {
  inv: any; label?: string;
  saveStock: (inv: any, qty: number) => void;
  savingKeys: Set<string>; savedKeys: Set<string>;
  localQty: Record<string, number>;
  setLocalQty: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) => {
  const key = `${inv.product_id}-${inv.variation_key}`;
  const currentQty = localQty[key] ?? inv.stock_quantity;
  const isLow = currentQty <= inv.low_stock_threshold;
  const isSaving = savingKeys.has(key);
  const isSaved = savedKeys.has(key);

  return (
    <div className={`flex items-center gap-2 px-3 py-2 ${isLow ? "bg-red-50/60" : "bg-white"}`}>
      {/* Size label */}
      <div className="w-10 shrink-0">
        {label && <span className="text-xs font-bold text-gray-800">{label}</span>}
      </div>

      {/* − qty + */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => { const n = Math.max(0, currentQty - 1); setLocalQty(p => ({ ...p, [key]: n })); saveStock(inv, n); }}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center transition-all touch-manipulation shrink-0"
        >
          <Minus className="w-3.5 h-3.5 text-gray-600" />
        </button>
        <input
          type="number"
          value={currentQty}
          onChange={e => setLocalQty(p => ({ ...p, [key]: Math.max(0, +e.target.value) }))}
          onBlur={() => { const v = localQty[key]; if (v !== undefined && v !== inv.stock_quantity) saveStock(inv, v); }}
          className={`w-14 h-8 text-center text-sm font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${
            isLow ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50 text-gray-900"
          }`}
        />
        <button
          onClick={() => { const n = currentQty + 1; setLocalQty(p => ({ ...p, [key]: n })); saveStock(inv, n); }}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center transition-all touch-manipulation shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-gray-600" />
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        {isSaving ? (
          <span className="text-[10px] text-gray-400 animate-pulse">שומר…</span>
        ) : isSaved ? (
          <span className="text-[10px] text-green-600 flex items-center gap-0.5 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> נשמר
          </span>
        ) : isLow ? (
          <span className="text-[10px] font-semibold text-red-600 flex items-center gap-0.5">
            <AlertTriangle className="w-3 h-3" /> נמוך
          </span>
        ) : (
          <span className="text-[10px] text-gray-400">✓</span>
        )}
        <span className="text-[9px] text-gray-300 whitespace-nowrap">
          ⚠
          <input
            type="number"
            defaultValue={inv.low_stock_threshold}
            onBlur={e => db.from("inventory").upsert(
              { product_id: inv.product_id, variation_key: inv.variation_key, stock_quantity: inv.stock_quantity, low_stock_threshold: +e.target.value },
              { onConflict: "product_id,variation_key" }
            )}
            className="w-6 text-center bg-transparent border-b border-gray-200 focus:outline-none focus:border-blue-400 text-[9px] text-gray-400 mx-0.5"
          />
        </span>
      </div>
    </div>
  );
};

/* ── Notes panel for one product ── */
const NotesPanel = ({ productId, allNotes, onSave, onDelete }: {
  productId: string;
  allNotes: Record<string, Array<{ id: string; text: string; ts: string }>>;
  onSave: (productId: string, text: string) => Promise<void>;
  onDelete: (productId: string, noteId: string) => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const notes = allNotes[productId] || [];

  const handleSave = async () => {
    const t = text.trim();
    if (!t) return;
    setSaving(true);
    await onSave(productId, t);
    setText("");
    setSaving(false);
  };

  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <StickyNote className="w-3.5 h-3.5" />
        <span className="font-medium">הערות</span>
        {notes.length > 0 && (
          <span className="bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full px-1.5 py-0.5">{notes.length}</span>
        )}
        <span className="mr-auto">{open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {/* Existing notes */}
          {notes.map(note => (
            <div key={note.id} className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                <p className="text-[9px] text-gray-400 mt-1">
                  {new Date(note.ts).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <button
                onClick={() => onDelete(productId, note.id)}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* New note input */}
          <div className="flex gap-1.5">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
              placeholder="הוסף הערה... (Enter לשמור)"
              rows={2}
              className="flex-1 text-xs rounded-lg border border-gray-200 px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-gray-300"
            />
            <button
              onClick={handleSave}
              disabled={!text.trim() || saving}
              className="w-8 h-8 self-end rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main page ── */
const AdminInventory = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [localQty, setLocalQty] = useState<Record<string, number>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  /* ── Products ── */
  const { data: products = [] } = useQuery({
    queryKey: ["admin_inventory_products"],
    queryFn: async () => {
      const { data } = await db.from("products").select("id, name, sku, images, colors, sizes, type, status").order("sort_order");
      return data || [];
    },
  });

  /* ── Translations ── */
  const { data: transMap = new Map() } = useQuery({
    queryKey: ["admin_inv_product_trans", locale],
    queryFn: async () => {
      const { data } = await db.from("product_translations").select("product_id, name").eq("locale", locale);
      return new Map((data || []).map((t: any) => [t.product_id, t.name]));
    },
  });

  /* ── Inventory ── */
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["admin_inventory"],
    queryFn: async () => {
      const { data } = await db.from("inventory").select("*");
      return data || [];
    },
  });

  const inventoryMap = new Map<string, any[]>();
  inventory.forEach((inv: any) => {
    const arr = inventoryMap.get(inv.product_id) || [];
    arr.push(inv);
    inventoryMap.set(inv.product_id, arr);
  });

  /* ── Notes ── */
  const { data: allNotes = {}, refetch: refetchNotes } = useQuery({
    queryKey: ["inventory_notes"],
    queryFn: async () => {
      const { data } = await db.from("home_content").select("data").eq("locale", "global").eq("section", "inventory_notes").single();
      return (data?.data || {}) as Record<string, Array<{ id: string; text: string; ts: string }>>;
    },
  });

  const saveNote = async (productId: string, text: string) => {
    const current = { ...allNotes };
    const existing = current[productId] || [];
    const newNote = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, ts: new Date().toISOString() };
    current[productId] = [...existing, newNote];
    await db.from("home_content").upsert({ locale: "global", section: "inventory_notes", data: current }, { onConflict: "locale,section" });
    refetchNotes();
  };

  const deleteNote = async (productId: string, noteId: string) => {
    const current = { ...allNotes };
    current[productId] = (current[productId] || []).filter(n => n.id !== noteId);
    await db.from("home_content").upsert({ locale: "global", section: "inventory_notes", data: current }, { onConflict: "locale,section" });
    refetchNotes();
  };

  /* ── Auto-save qty ── */
  const saveStock = async (inv: any, newQty: number) => {
    const key = `${inv.product_id}-${inv.variation_key}`;
    setSavingKeys(prev => new Set([...prev, key]));
    try {
      await db.from("inventory").upsert(
        { product_id: inv.product_id, variation_key: inv.variation_key, stock_quantity: newQty, low_stock_threshold: inv.low_stock_threshold ?? 5 },
        { onConflict: "product_id,variation_key" }
      );
      // If this was a phantom row, refresh so it gets a real ID
      if (inv._phantom) qc.invalidateQueries({ queryKey: ["admin_inventory"] });
      setSavedKeys(prev => new Set([...prev, key]));
      setTimeout(() => setSavedKeys(prev => { const n = new Set(prev); n.delete(key); return n; }), 1800);
    } catch (e: any) {
      toast({ title: "שגיאה בשמירה", description: e.message, variant: "destructive" });
    } finally {
      setSavingKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  };

  const lowStockCount = inventory.filter((inv: any) => inv.stock_quantity <= inv.low_stock_threshold).length;

  const filtered = products.filter((p: any) => {
    const pName = (transMap as Map<string, string>).get(p.id) || p.name || "";
    if (search && !pName.toLowerCase().includes(search.toLowerCase()) && !(p.sku || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (showLowOnly) {
      const invItems = inventoryMap.get(p.id) || [];
      return invItems.some((inv: any) => inv.stock_quantity <= inv.low_stock_threshold);
    }
    return true;
  });

  const sharedQtyProps = { saveStock, savingKeys, savedKeys, localQty, setLocalQty };

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">מלאי</h1>
          <p className="text-gray-400 text-xs mt-0.5">ניהול כמויות מוצרים</p>
        </div>
        {lowStockCount > 0 && (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            {lowStockCount} {lowStockCount === 1 ? "מוצר במלאי נמוך" : "מוצרים במלאי נמוך"}
          </div>
        )}
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
          <input
            type="text"
            placeholder="חיפוש לפי שם או SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pr-9 pl-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowLowOnly(!showLowOnly)}
          className={`flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold transition-colors border shrink-0 ${
            showLowOnly ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-700"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          נמוך בלבד
        </button>
      </div>

      {/* Skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gray-200" />
                <div className="space-y-1.5"><div className="h-3.5 w-32 bg-gray-200 rounded" /><div className="h-2.5 w-20 bg-gray-200 rounded" /></div>
              </div>
              <div className="px-3 py-3 space-y-2"><div className="h-8 bg-gray-100 rounded-lg" /><div className="h-8 bg-gray-100 rounded-lg" /></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product: any) => {
            const dbItems = inventoryMap.get(product.id) || [];
            const invItems = dbItems.length > 0 ? dbItems : deriveRows(product);
            const pName = (transMap as Map<string, string>).get(product.id) || product.name;
            const hasLow = dbItems.some((inv: any) => inv.stock_quantity <= inv.low_stock_threshold);
            const { colorMap, simpleItem } = groupByColor(invItems, product);
            const noteCount = (allNotes[product.id] || []).length;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-xl border overflow-hidden ${hasLow ? "border-red-200" : "border-gray-200"}`}
              >
                {/* Product header */}
                <div className={`px-3 py-2.5 flex items-center gap-2.5 border-b ${hasLow ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm leading-tight truncate">{pName}</p>
                    {product.sku && <p className="text-[10px] text-gray-400 font-mono">SKU: {product.sku}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasLow && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    {noteCount > 0 && (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {noteCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                {colorMap.size > 0 ? (
                  <div>
                    {Array.from(colorMap.entries()).map(([colorId, { colorObj, items }]) => (
                      <div key={colorId}>
                        {/* Color row */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50/60 border-b border-gray-100">
                          {colorObj?.hex && (
                            <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: colorObj.hex }} />
                          )}
                          <span className="text-xs font-bold text-gray-800">
                            {colorObj?.label_he || colorObj?.name_he || colorObj?.name_ar || colorObj?.name || colorId}
                          </span>
                        </div>
                        {/* Size rows */}
                        <div className="divide-y divide-gray-50">
                          {items.map(({ inv, sizeObj }) => (
                            <QtyRow
                              key={inv.id}
                              inv={inv}
                              label={sizeObj?.label_he || sizeObj?.label_ar || sizeObj?.label || sizeObj?.name || undefined}
                              {...sharedQtyProps}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : simpleItem ? (
                  <QtyRow inv={simpleItem} label={undefined} {...sharedQtyProps} />
                ) : null}

                {/* Notes */}
                <NotesPanel
                  productId={product.id}
                  allNotes={allNotes}
                  onSave={saveNote}
                  onDelete={deleteNote}
                />
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">לא נמצאו מוצרים</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
