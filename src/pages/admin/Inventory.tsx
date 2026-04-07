import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  Package, AlertTriangle, Search, CheckCircle2, Minus, Plus,
  StickyNote, Send, Trash2, X, ChevronDown, Check,
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
    const seen = new Set<string>();
    for (const color of colors) {
      const cId = color.tax_id || color.id;
      const lengths: string[] = Array.isArray(color.lengths) ? color.lengths : [];
      const relevant = lengths.length > 0
        ? sizes.filter((s: any) => lengths.includes(s.tax_id || s.id))
        : sizes;
      for (const size of relevant) {
        const sId = size.tax_id || size.id;
        const key = `${cId}|${sId}`;
        if (seen.has(key)) continue; // skip duplicates
        seen.add(key);
        rows.push(phantom(`combo:${cId}|${sId}`));
      }
    }
    return rows;
  }
  if (product.type === "retail" && colors.length > 0) {
    return colors.map((c: any) => phantom(`color:${c.id}`));
  }
  return [phantom("")];
};

/* ── Merge DB rows with expected phantoms, discard stale DB entries ── */
const mergeInventory = (product: any, dbItems: any[]): any[] => {
  const expected = deriveRows(product);
  if (expected.length === 0) return dbItems.length > 0 ? dbItems : expected;
  const dbMap = new Map<string, any>();
  for (const row of dbItems) dbMap.set(row.variation_key ?? "", row);
  return expected.map(phantom => dbMap.get(phantom.variation_key) ?? phantom);
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
    const colorObj = colors.find((c: any) => (c.tax_id || c.id || c.hex) === colorId) ?? null;
    const sizeObj = sizeId ? sizes.find((s: any) => (s.tax_id || s.id || s.value) === sizeId) ?? null : null;
    if (!colorMap.has(colorId)) colorMap.set(colorId, { colorObj, items: [] });
    colorMap.get(colorId)!.items.push({ inv, sizeObj });
  });

  return { colorMap, simpleItem };
};

/* ── QtyRow ── */
const QtyRow = ({
  inv, label, saveStock, savingKeys, savedKeys,
  localQty, setLocalQty, localThreshold, setLocalThreshold,
}: {
  inv: any; label?: string;
  saveStock: (inv: any, qty: number) => void;
  savingKeys: Set<string>; savedKeys: Set<string>;
  localQty: Record<string, number>;
  setLocalQty: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  localThreshold: Record<string, number>;
  setLocalThreshold: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) => {
  const key = `${inv.product_id}-${inv.variation_key}`;
  const currentQty = localQty[key] ?? inv.stock_quantity;
  const threshold = localThreshold[key] ?? inv.low_stock_threshold;
  const isLow = currentQty <= threshold;
  const isSaving = savingKeys.has(key);
  const isSaved = savedKeys.has(key);

  const saveThreshold = async (val: number) => {
    setLocalThreshold(p => ({ ...p, [key]: val }));
    await db.from("inventory").upsert(
      { product_id: inv.product_id, variation_key: inv.variation_key, stock_quantity: inv.stock_quantity, low_stock_threshold: val },
      { onConflict: "product_id,variation_key" }
    );
  };

  return (
    <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 ${isLow ? "bg-red-50/50" : "bg-white"}`}>
      {/* Size label */}
      <div className="w-10 sm:w-12 shrink-0">
        {label && <span className="text-xs font-bold text-gray-700">{label}</span>}
      </div>

      {/* − qty + */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => { const n = Math.max(0, currentQty - 1); setLocalQty(p => ({ ...p, [key]: n })); saveStock(inv, n); }}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center transition-all touch-manipulation"
        >
          <Minus className="w-3.5 h-3.5 text-gray-600" />
        </button>
        <input
          type="number"
          value={currentQty}
          onChange={e => setLocalQty(p => ({ ...p, [key]: Math.max(0, +e.target.value) }))}
          onBlur={() => { const v = localQty[key]; if (v !== undefined && v !== inv.stock_quantity) saveStock(inv, v); }}
          className={`w-16 h-8 text-center text-sm font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors ${
            isLow ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50 text-gray-900"
          }`}
        />
        <button
          onClick={() => { const n = currentQty + 1; setLocalQty(p => ({ ...p, [key]: n })); saveStock(inv, n); }}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 flex items-center justify-center transition-all touch-manipulation"
        >
          <Plus className="w-3.5 h-3.5 text-gray-600" />
        </button>
      </div>

      {/* Status + threshold */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        <div className="text-right">
          {isSaving ? (
            <span className="text-[10px] text-gray-400 animate-pulse">جارٍ الحفظ...</span>
          ) : isSaved ? (
            <span className="text-[10px] text-green-600 flex items-center gap-0.5 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> تم الحفظ
            </span>
          ) : isLow ? (
            <span className="text-[10px] font-semibold text-red-600 flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3" /> منخفض
            </span>
          ) : (
            <span className="text-[10px] text-gray-300">✓</span>
          )}
        </div>
        {/* Threshold */}
        <div className="flex items-center gap-1 text-[10px] text-gray-400 border border-gray-200 rounded-lg px-2 py-1 bg-gray-50">
          <AlertTriangle className="w-2.5 h-2.5 text-gray-300" />
          <input
            type="number"
            value={localThreshold[key] ?? inv.low_stock_threshold}
            onChange={e => setLocalThreshold(p => ({ ...p, [key]: Math.max(0, +e.target.value) }))}
            onBlur={e => saveThreshold(Math.max(0, +e.target.value))}
            className="w-7 text-center bg-transparent focus:outline-none text-[10px] text-gray-500 font-semibold"
          />
        </div>
      </div>
    </div>
  );
};

/* ── Notes modal (chat style) ── */
const NotesModal = ({ productName, productId, allNotes, onSave, onDelete, onClose }: {
  productName: string;
  productId: string;
  allNotes: Record<string, Array<{ id: string; text: string; ts: string }>>;
  onSave: (productId: string, text: string) => Promise<void>;
  onDelete: (productId: string, noteId: string) => Promise<void>;
  onClose: () => void;
}) => {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const notes = allNotes[productId] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus();
  }, [notes.length]);

  const handleSave = async () => {
    const t = text.trim();
    if (!t || saving) return;
    setSaving(true);
    await onSave(productId, t);
    setText("");
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl"
        style={{ maxHeight: "85vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
          <StickyNote className="w-4 h-4 text-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900">ملاحظات</p>
            <p className="text-[10px] text-gray-400 truncate">{productName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
          {notes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-24 text-gray-300 text-xs gap-1">
              <StickyNote className="w-8 h-8 opacity-30" />
              <span>لا توجد ملاحظات بعد</span>
            </div>
          )}
          {notes.map(note => (
            <div key={note.id} className="flex items-end gap-2 justify-end">
              <button
                onClick={() => onDelete(productId, note.id)}
                className="w-5 h-5 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all mb-1 shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <div className="max-w-[80%]">
                <div className="bg-blue-500 text-white rounded-2xl rounded-br-sm px-3 py-2">
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{note.text}</p>
                </div>
                <p className="text-[9px] text-gray-400 mt-0.5 text-left">
                  {new Date(note.ts).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-100 px-3 py-3 flex gap-2 items-end shrink-0">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
            placeholder="اكتب ملاحظة... (Enter للإرسال)"
            rows={1}
            className="flex-1 text-sm rounded-xl border border-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-gray-300 max-h-24"
          />
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving}
            className="w-9 h-9 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-30 flex items-center justify-center transition-colors shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Category multi-select ── */
const CategoryMultiSelect = ({
  parentCats, allSubCats, selected, onChange,
}: {
  parentCats: any[]; allSubCats: any[];
  selected: string[]; onChange: (ids: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const subCats = (pid: string) => allSubCats.filter((s: any) => s.category_id === pid);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (id: string) => {
    const isParent = parentCats.find((c: any) => c.id === id);
    if (isParent) {
      const subIds = subCats(id).map((s: any) => s.id);
      const allSelected = selected.includes(id) && subIds.every(sid => selected.includes(sid));
      if (allSelected) {
        onChange(selected.filter(x => x !== id && !subIds.includes(x)));
      } else {
        const next = new Set([...selected, id, ...subIds]);
        onChange([...next]);
      }
    } else {
      onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
    }
  };

  const clearAll = () => onChange([]);
  const isAllSelected = selected.length === 0;

  const label = selected.length === 0
    ? "جميع الفئات"
    : `${selected.length} تم اختيارهم`;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 h-10 px-3 rounded-xl border text-sm transition-colors ${
          selected.length > 0
            ? "border-blue-400 bg-blue-50 text-blue-700"
            : "border-gray-200 bg-white text-gray-700"
        }`}
      >
        <span className="font-medium">{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-12 right-0 z-50 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* All categories row */}
          <button
            onClick={clearAll}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors ${isAllSelected ? "text-blue-600" : "text-gray-600"}`}
          >
            <span className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${isAllSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}>
              {isAllSelected && <Check className="w-2.5 h-2.5 text-white" />}
            </span>
            جميع الفئات
          </button>
          <div className="border-t border-gray-100" />

          <div className="max-h-72 overflow-y-auto">
            {parentCats.map((cat: any) => {
              const subs = subCats(cat.id);
              const catSelected = selected.includes(cat.id);
              const subIds = subs.map((s: any) => s.id);
              const allSubsSel = subIds.length > 0 && subIds.every((sid: string) => selected.includes(sid));
              const someSubsSel = subIds.some((sid: string) => selected.includes(sid));
              const isChecked = catSelected || allSubsSel;
              const isIndeterminate = !isChecked && someSubsSel;

              return (
                <div key={cat.id}>
                  <button
                    onClick={() => toggle(cat.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-gray-50 transition-colors text-gray-800"
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                      isChecked ? "bg-blue-500 border-blue-500" : isIndeterminate ? "bg-blue-100 border-blue-300" : "border-gray-300"
                    }`}>
                      {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                      {isIndeterminate && <span className="w-2 h-0.5 bg-blue-500 rounded" />}
                    </span>
                    {cat.name_he || cat.name_ar || cat.id}
                  </button>
                  {subs.map((sub: any) => (
                    <button
                      key={sub.id}
                      onClick={() => toggle(sub.id)}
                      className="w-full flex items-center gap-3 pr-9 pl-4 py-2 text-xs hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        selected.includes(sub.id) ? "bg-blue-500 border-blue-500" : "border-gray-300"
                      }`}>
                        {selected.includes(sub.id) && <Check className="w-2 h-2 text-white" />}
                      </span>
                      {sub.name_he || sub.name_ar || sub.id}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          {selected.length > 0 && (
            <>
              <div className="border-t border-gray-100" />
              <button
                onClick={clearAll}
                className="w-full px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors font-medium"
              >
                مسح الاختيار ({selected.length})
              </button>
            </>
          )}
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
  const [categoryFilters, setCategoryFilters] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("inv_category_filters") || "[]"); } catch { return []; }
  });

  const handleCategoryFilters = (ids: string[]) => {
    setCategoryFilters(ids);
    localStorage.setItem("inv_category_filters", JSON.stringify(ids));
  };
  const [localQty, setLocalQty] = useState<Record<string, number>>({});
  const [localThreshold, setLocalThreshold] = useState<Record<string, number>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [notesModal, setNotesModal] = useState<{ productId: string; productName: string } | null>(null);

  /* ── Products ── */
  const { data: products = [] } = useQuery({
    queryKey: ["admin_inventory_products"],
    queryFn: async () => {
      const { data } = await db.from("products").select("id, name, sku, images, colors, sizes, type, status, category_id, sub_category_id").order("sort_order");
      return data || [];
    },
  });

  /* ── Categories ── */
  const { data: catData = { cats: [], subs: [] } } = useQuery({
    queryKey: ["inv_cats_filter"],
    queryFn: async () => {
      const [{ data: cats }, { data: subs }] = await Promise.all([
        db.from("categories").select("*").order("sort_order"),
        db.from("sub_categories").select("*").order("sort_order"),
      ]);
      return { cats: cats || [], subs: subs || [] };
    },
  });
  const parentCats = catData.cats;
  const allSubCats = catData.subs;
  const subCats = (parentId: string) => allSubCats.filter((s: any) => s.category_id === parentId);

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
    current[productId] = [...(current[productId] || []), { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, ts: new Date().toISOString() }];
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
        { product_id: inv.product_id, variation_key: inv.variation_key, stock_quantity: newQty, low_stock_threshold: localThreshold[key] ?? inv.low_stock_threshold ?? 5 },
        { onConflict: "product_id,variation_key" }
      );
      if (inv._phantom) qc.invalidateQueries({ queryKey: ["admin_inventory"] });
      setSavedKeys(prev => new Set([...prev, key]));
      setTimeout(() => setSavedKeys(prev => { const n = new Set(prev); n.delete(key); return n; }), 1800);
    } catch (e: any) {
      toast({ title: "שגיאה בשמירה", description: e.message, variant: "destructive" });
    } finally {
      setSavingKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  };

  /* ── Filter ── */
  const isProductLow = (product: any) => {
    const dbItems = inventoryMap.get(product.id) || [];
    const merged = mergeInventory(product, dbItems);
    return merged.some((inv: any) => {
      const k = `${inv.product_id}-${inv.variation_key}`;
      const qty = localQty[k] ?? inv.stock_quantity;
      const thr = localThreshold[k] ?? inv.low_stock_threshold;
      return qty <= thr;
    });
  };

  const matchesSearchAndCategory = (p: any) => {
    const pName = (transMap as Map<string, string>).get(p.id) || p.name || "";
    if (search && !pName.toLowerCase().includes(search.toLowerCase()) && !(p.sku || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilters.length > 0) {
      const matches = categoryFilters.some(filterId => {
        const isParent = parentCats.find((c: any) => c.id === filterId);
        if (isParent) {
          const subIds = subCats(filterId).map((s: any) => s.id);
          return p.category_id === filterId || subIds.includes(p.sub_category_id);
        }
        return p.sub_category_id === filterId;
      });
      if (!matches) return false;
    }
    return true;
  };

  const baseFiltered = products.filter(matchesSearchAndCategory);
  const filtered = showLowOnly ? baseFiltered.filter(isProductLow) : baseFiltered;

  const totalLow = baseFiltered.filter(isProductLow).length;

  const sharedQtyProps = { saveStock, savingKeys, savedKeys, localQty, setLocalQty, localThreshold, setLocalThreshold };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">المخزون</h1>
          <p className="text-gray-400 text-xs mt-0.5">إدارة كميات المنتجات</p>
        </div>
        {totalLow > 0 && (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            {totalLow} {totalLow === 1 ? "منتج مخزون منخفض" : "منتجات مخزون منخفض"}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث حسب الاسم أو SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pr-9 pl-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          />
        </div>

        {/* Category filter */}
        <CategoryMultiSelect
          parentCats={parentCats}
          allSubCats={allSubCats}
          selected={categoryFilters}
          onChange={handleCategoryFilters}
        />

        {/* Low stock only */}
        <button
          onClick={() => setShowLowOnly(!showLowOnly)}
          className={`flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold transition-colors border shrink-0 ${
            showLowOnly ? "bg-red-500 border-red-500 text-white" : "bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-600"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          منخفض فقط {showLowOnly && totalLow > 0 && `(${totalLow})`}
        </button>
      </div>

      {/* Skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="space-y-1.5"><div className="h-4 w-36 bg-gray-200 rounded" /><div className="h-2.5 w-24 bg-gray-200 rounded" /></div>
              </div>
              <div className="px-4 py-3 space-y-2"><div className="h-9 bg-gray-100 rounded-xl" /><div className="h-9 bg-gray-100 rounded-xl" /></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product: any) => {
            const dbItems = inventoryMap.get(product.id) || [];
            const invItems = mergeInventory(product, dbItems);
            const pName = (transMap as Map<string, string>).get(product.id) || product.name;
            const hasLow = isProductLow(product);
            const { colorMap, simpleItem } = groupByColor(invItems, product);
            const noteCount = (allNotes[product.id] || []).length;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${hasLow ? "border-red-200" : "border-gray-200"}`}
              >
                {/* Product header */}
                <div className={`px-4 py-3 flex items-center gap-3 border-b ${hasLow ? "bg-red-50 border-red-100" : "bg-gray-50/80 border-gray-100"}`}>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 border border-white shadow-sm" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm leading-tight truncate">{pName}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                      SKU: {product.sku || <span className="text-gray-300 italic">לא הוגדר</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasLow && (
                      <span className="flex items-center gap-1 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-lg">
                        <AlertTriangle className="w-3 h-3" /> منخفض
                      </span>
                    )}
                    {noteCount > 0 && (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {noteCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Inventory rows */}
                {colorMap.size > 0 ? (
                  <div>
                    {Array.from(colorMap.entries()).map(([colorId, { colorObj, items }]) => (
                      <div key={colorId}>
                        {/* Color header */}
                        <div className="flex items-center gap-2.5 px-4 py-2 bg-gray-50 border-b border-gray-100">
                          {colorObj?.hex ? (
                            <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: colorObj.hex }} />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-gray-300 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-gray-700">
                            {colorObj?.label_he || colorObj?.label_ar || colorObj?.name_he || colorObj?.name_ar || colorObj?.name?.he || colorObj?.name?.ar || colorObj?.name || colorId}
                          </span>
                          {colorObj?.label_ar && colorObj?.label_he && (
                            <span className="text-[10px] text-gray-400 ms-2">
                              {colorObj?.label_ar}
                            </span>
                          )}
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
                  <QtyRow inv={simpleItem} {...sharedQtyProps} />
                ) : null}

                {/* Notes footer */}
                <div className="border-t border-gray-100 flex items-center justify-between px-4 py-2.5 bg-gray-50/50">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <StickyNote className="w-3.5 h-3.5" />
                    <span>ملاحظات</span>
                    {noteCount > 0 && (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full px-1.5 py-0.5">{noteCount}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setNotesModal({ productId: product.id, productName: pName })}
                    className="text-[11px] font-semibold text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    {noteCount > 0 ? "פתח" : "+ הוסף"}
                  </button>
                </div>
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

      {/* Notes modal */}
      {notesModal && (
        <NotesModal
          productId={notesModal.productId}
          productName={notesModal.productName}
          allNotes={allNotes}
          onSave={saveNote}
          onDelete={deleteNote}
          onClose={() => setNotesModal(null)}
        />
      )}
    </div>
  );
};

export default AdminInventory;
