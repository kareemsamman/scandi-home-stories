import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, GripVertical, ImageIcon, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, useSubCategories } from "@/hooks/useDbData";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

/* ─── Types ─── */
interface ColorVariant {
  _key: string; // local temp key for react
  label_he: string;
  label_ar: string;
  hex: string;
  price: string;
  stock_quantity: string;
  in_stock: boolean;
}

interface LengthVariant {
  _key: string;
  label_he: string;
  label_ar: string;
  value: string;
  price: string;
  stock_quantity: string;
  in_stock: boolean;
}

const uid = () => Math.random().toString(36).slice(2);

const emptyColor = (): ColorVariant => ({
  _key: uid(), label_he: "", label_ar: "", hex: "#cccccc",
  price: "", stock_quantity: "", in_stock: true,
});

const emptyLength = (): LengthVariant => ({
  _key: uid(), label_he: "", label_ar: "", value: "",
  price: "", stock_quantity: "", in_stock: true,
});

/* ─── Field ─── */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    {children}
  </div>
);

/* ─── Color Variant Row ─── */
const ColorRow = ({ v, onChange, onRemove }: {
  v: ColorVariant;
  onChange: (updated: ColorVariant) => void;
  onRemove: () => void;
}) => {
  const set = (k: keyof ColorVariant, val: any) => onChange({ ...v, [k]: val });
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-300" />
          <div
            className="w-7 h-7 rounded-full border-2 border-white shadow-sm cursor-pointer relative overflow-hidden"
            style={{ background: v.hex }}
          >
            <input
              type="color"
              value={v.hex}
              onChange={(e) => set("hex", e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="text-sm font-medium text-gray-700">{v.label_he || "צבע חדש"}</span>
        </div>
        <button onClick={onRemove} className="text-red-400 hover:text-red-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="שם (עברית)">
          <Input value={v.label_he} onChange={(e) => set("label_he", e.target.value)} placeholder="לבן" />
        </Field>
        <Field label="שם (ערבית)">
          <Input value={v.label_ar} onChange={(e) => set("label_ar", e.target.value)} placeholder="أبيض" />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="מחיר (₪)">
          <Input type="number" value={v.price} onChange={(e) => set("price", e.target.value)} placeholder="0" />
        </Field>
        <Field label="מלאי">
          <Input type="number" value={v.stock_quantity} onChange={(e) => set("stock_quantity", e.target.value)} placeholder="0" />
        </Field>
        <Field label="סטטוס">
          <button
            type="button"
            onClick={() => set("in_stock", !v.in_stock)}
            className={`w-full h-9 rounded-md border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              v.in_stock
                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            }`}
          >
            {v.in_stock ? <><Check className="w-3.5 h-3.5" /> במלאי</> : <><X className="w-3.5 h-3.5" /> אזל</>}
          </button>
        </Field>
      </div>
    </div>
  );
};

/* ─── Length Variant Row ─── */
const LengthRow = ({ v, onChange, onRemove }: {
  v: LengthVariant;
  onChange: (updated: LengthVariant) => void;
  onRemove: () => void;
}) => {
  const set = (k: keyof LengthVariant, val: any) => onChange({ ...v, [k]: val });
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-300" />
          <span className="text-sm font-medium text-gray-700">{v.label_he || "אורך חדש"}</span>
        </div>
        <button onClick={onRemove} className="text-red-400 hover:text-red-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="שם (עברית)">
          <Input value={v.label_he} onChange={(e) => set("label_he", e.target.value)} placeholder="2 מטר" />
        </Field>
        <Field label="שם (ערבית)">
          <Input value={v.label_ar} onChange={(e) => set("label_ar", e.target.value)} placeholder="متران" />
        </Field>
        <Field label="ערך">
          <Input value={v.value} onChange={(e) => set("value", e.target.value)} placeholder="2m" />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="מחיר (₪)">
          <Input type="number" value={v.price} onChange={(e) => set("price", e.target.value)} placeholder="0" />
        </Field>
        <Field label="מלאי">
          <Input type="number" value={v.stock_quantity} onChange={(e) => set("stock_quantity", e.target.value)} placeholder="0" />
        </Field>
        <Field label="סטטוס">
          <button
            type="button"
            onClick={() => set("in_stock", !v.in_stock)}
            className={`w-full h-9 rounded-md border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              v.in_stock
                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            }`}
          >
            {v.in_stock ? <><Check className="w-3.5 h-3.5" /> במלאי</> : <><X className="w-3.5 h-3.5" /> אזל</>}
          </button>
        </Field>
      </div>
    </div>
  );
};

/* ─── Section Card ─── */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{title}</h2>
    {children}
  </div>
);

/* ─── Main Page ─── */
const ProductEdit = () => {
  const { productId } = useParams<{ productId: string }>();
  const isNew = productId === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { locale } = useAdminLanguage();
  const { data: categories = [] } = useCategories();
  const { data: subCategories = [] } = useSubCategories();

  /* ── Load product ── */
  const { data: productData, isLoading } = useQuery({
    queryKey: ["admin_product_edit", productId],
    enabled: !isNew,
    queryFn: async () => {
      const [{ data: p }, { data: trans }, { data: inv }] = await Promise.all([
        db.from("products").select("*").eq("id", productId).single(),
        db.from("product_translations").select("*").eq("product_id", productId),
        db.from("inventory").select("*").eq("product_id", productId),
      ]);
      return { product: p, translations: trans || [], inventory: inv || [] };
    },
  });

  /* ── Form state ── */
  const [base, setBase] = useState<any>({
    slug: "", type: "retail", price: 0, sku: "", materials: "", dimensions: "",
    is_featured: false, is_new: false, sort_order: 0, images: [],
    use_color_groups: false,
  });
  const [transHe, setTransHe] = useState({ name: "", description: "", long_description: "", length: "" });
  const [transAr, setTransAr] = useState({ name: "", description: "", long_description: "", length: "" });
  const [colors, setColors] = useState<ColorVariant[]>([]);
  const [lengths, setLengths] = useState<LengthVariant[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  /* ── Populate form when data loads ── */
  useEffect(() => {
    if (!productData) return;
    const { product: p, translations, inventory } = productData;
    setBase({
      id: p.id,
      slug: p.slug || "",
      type: p.type || "retail",
      price: p.price || 0,
      sku: p.sku || "",
      materials: p.materials || "",
      dimensions: p.dimensions || "",
      is_featured: p.is_featured || false,
      is_new: p.is_new || false,
      sort_order: p.sort_order || 0,
      images: p.images || [],
      use_color_groups: p.use_color_groups || false,
      category_id: p.category_id || "",
      sub_category_id: p.sub_category_id || "",
    });

    const he = translations.find((t: any) => t.locale === "he") || {};
    const ar = translations.find((t: any) => t.locale === "ar") || {};
    setTransHe({ name: he.name || "", description: he.description || "", long_description: he.long_description || "", length: he.length || "" });
    setTransAr({ name: ar.name || "", description: ar.description || "", long_description: ar.long_description || "", length: ar.length || "" });

    // Build color variants from colors JSON + inventory
    const rawColors: any[] = Array.isArray(p.colors) ? p.colors : [];
    setColors(rawColors.map((c: any) => {
      const invRow = inventory.find((i: any) => i.variation_key === `color:${c.label_he || c.value || c.name_he}`);
      return {
        _key: uid(),
        label_he: c.label_he || c.name_he || "",
        label_ar: c.label_ar || c.name_ar || "",
        hex: c.hex || c.value || "#cccccc",
        price: String(c.price ?? ""),
        stock_quantity: String(invRow?.stock_quantity ?? ""),
        in_stock: invRow ? (invRow.stock_quantity ?? 0) > 0 : (c.in_stock !== false),
      };
    }));

    // Build length variants from sizes JSON + inventory
    const rawSizes: any[] = Array.isArray(p.sizes) ? p.sizes : [];
    setLengths(rawSizes.map((s: any) => {
      const invRow = inventory.find((i: any) => i.variation_key === `length:${s.value || s.label_he || s.name_he}`);
      return {
        _key: uid(),
        label_he: s.label_he || s.name_he || "",
        label_ar: s.label_ar || s.name_ar || "",
        value: s.value || "",
        price: String(s.price ?? ""),
        stock_quantity: String(invRow?.stock_quantity ?? ""),
        in_stock: invRow ? (invRow.stock_quantity ?? 0) > 0 : (s.in_stock !== false),
      };
    }));
  }, [productData]);

  /* ── Save ── */
  const save = useMutation({
    mutationFn: async () => {
      // Build colors JSON
      const colorsJson = colors.map((c) => ({
        label_he: c.label_he,
        label_ar: c.label_ar,
        hex: c.hex,
        price: c.price ? Number(c.price) : undefined,
        in_stock: c.in_stock,
      }));

      // Build sizes JSON
      const sizesJson = lengths.map((l) => ({
        label_he: l.label_he,
        label_ar: l.label_ar,
        value: l.value,
        price: l.price ? Number(l.price) : undefined,
        in_stock: l.in_stock,
      }));

      const { id, created_at, updated_at, ...baseFields } = base;
      const payload = {
        ...baseFields,
        name: transHe.name || base.slug,
        colors: colorsJson,
        sizes: sizesJson,
      };

      let productId = id;
      if (productId) {
        const { error } = await db.from("products").update(payload).eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await db.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id;
      }

      // Upsert translations
      for (const [loc, trans] of [["he", transHe], ["ar", transAr]] as const) {
        await db.from("product_translations").upsert(
          { product_id: productId, locale: loc, ...trans },
          { onConflict: "product_id,locale" }
        );
      }

      // Sync inventory for colors
      for (const c of colors) {
        if (!c.label_he) continue;
        const key = `color:${c.label_he}`;
        await db.from("inventory").upsert(
          { product_id: productId, variation_key: key, stock_quantity: c.stock_quantity ? Number(c.stock_quantity) : 0 },
          { onConflict: "product_id,variation_key" }
        );
      }

      // Sync inventory for lengths
      for (const l of lengths) {
        if (!l.value && !l.label_he) continue;
        const key = `length:${l.value || l.label_he}`;
        await db.from("inventory").upsert(
          { product_id: productId, variation_key: key, stock_quantity: l.stock_quantity ? Number(l.stock_quantity) : 0 },
          { onConflict: "product_id,variation_key" }
        );
      }

      return productId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product saved" });
      navigate("/admin/products");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filteredSubs = subCategories.filter((s: any) => s.category_id === base.category_id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/products")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Products
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? "New Product" : (transHe.name || base.slug || "Edit Product")}
        </h1>
      </div>

      {/* Translations */}
      <Section title="Content">
        <div className="grid grid-cols-2 gap-6">
          {/* Hebrew */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Hebrew 🇮🇱</p>
            <Field label="שם מוצר">
              <Input value={transHe.name} onChange={(e) => setTransHe((p) => ({ ...p, name: e.target.value }))} placeholder="שם המוצר" />
            </Field>
            <Field label="תיאור קצר">
              <Textarea value={transHe.description} onChange={(e) => setTransHe((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </Field>
            <Field label="תיאור מורחב">
              <Textarea value={transHe.long_description} onChange={(e) => setTransHe((p) => ({ ...p, long_description: e.target.value }))} rows={3} />
            </Field>
            {base.type === "contractor" && (
              <Field label="אורך">
                <Input value={transHe.length} onChange={(e) => setTransHe((p) => ({ ...p, length: e.target.value }))} placeholder="2 מטר" />
              </Field>
            )}
          </div>
          {/* Arabic */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Arabic 🇸🇦</p>
            <Field label="اسم المنتج">
              <Input value={transAr.name} onChange={(e) => setTransAr((p) => ({ ...p, name: e.target.value }))} placeholder="اسم المنتج" dir="rtl" />
            </Field>
            <Field label="وصف قصير">
              <Textarea value={transAr.description} onChange={(e) => setTransAr((p) => ({ ...p, description: e.target.value }))} rows={2} dir="rtl" />
            </Field>
            <Field label="وصف مفصل">
              <Textarea value={transAr.long_description} onChange={(e) => setTransAr((p) => ({ ...p, long_description: e.target.value }))} rows={3} dir="rtl" />
            </Field>
            {base.type === "contractor" && (
              <Field label="الطول">
                <Input value={transAr.length} onChange={(e) => setTransAr((p) => ({ ...p, length: e.target.value }))} dir="rtl" />
              </Field>
            )}
          </div>
        </div>
      </Section>

      {/* Basic Info */}
      <Section title="Product Info">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Slug">
            <Input value={base.slug} onChange={(e) => setBase((p: any) => ({ ...p, slug: e.target.value }))} placeholder="product-slug" />
          </Field>
          <Field label="Type">
            <Select value={base.type} onValueChange={(v) => setBase((p: any) => ({ ...p, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Base Price (₪)">
            <Input type="number" value={base.price} onChange={(e) => setBase((p: any) => ({ ...p, price: +e.target.value }))} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="SKU">
            <Input value={base.sku} onChange={(e) => setBase((p: any) => ({ ...p, sku: e.target.value }))} />
          </Field>
          <Field label="Sort Order">
            <Input type="number" value={base.sort_order} onChange={(e) => setBase((p: any) => ({ ...p, sort_order: +e.target.value }))} />
          </Field>
          <Field label="Materials">
            <Input value={base.materials} onChange={(e) => setBase((p: any) => ({ ...p, materials: e.target.value }))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <Select value={base.category_id || ""} onValueChange={(v) => setBase((p: any) => ({ ...p, category_id: v, sub_category_id: "" }))}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name_he} / {c.name_ar}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Subcategory">
            <Select value={base.sub_category_id || "none"} onValueChange={(v) => setBase((p: any) => ({ ...p, sub_category_id: v === "none" ? null : v }))}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {filteredSubs.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name_he} / {s.name_ar}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded" checked={base.is_featured} onChange={(e) => setBase((p: any) => ({ ...p, is_featured: e.target.checked }))} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded" checked={base.is_new} onChange={(e) => setBase((p: any) => ({ ...p, is_new: e.target.checked }))} />
            New
          </label>
          {base.type === "contractor" && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" checked={base.use_color_groups} onChange={(e) => setBase((p: any) => ({ ...p, use_color_groups: e.target.checked }))} />
              Shared color groups
            </label>
          )}
        </div>
      </Section>

      {/* Images */}
      <Section title="Images">
        <div className="space-y-2">
          {(base.images || []).map((url: string, idx: number) => (
            <div key={idx} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <img src={url} alt="" className="w-10 h-10 rounded object-cover border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <span className="flex-1 text-xs text-gray-600 truncate">{url}</span>
              <button onClick={() => setBase((p: any) => ({ ...p, images: p.images.filter((_: string, i: number) => i !== idx) }))} className="text-red-400 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && imageUrl.trim()) {
                  setBase((p: any) => ({ ...p, images: [...(p.images || []), imageUrl.trim()] }));
                  setImageUrl("");
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (imageUrl.trim()) {
                  setBase((p: any) => ({ ...p, images: [...(p.images || []), imageUrl.trim()] }));
                  setImageUrl("");
                }
              }}
            >
              <ImageIcon className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          <p className="text-xs text-gray-400">Press Enter or click Add to add an image URL</p>
        </div>
      </Section>

      {/* Colors — retail */}
      {base.type === "retail" && (
        <Section title="Colors / Variants">
          <div className="space-y-3">
            {colors.map((c, idx) => (
              <ColorRow
                key={c._key}
                v={c}
                onChange={(updated) => setColors((prev) => prev.map((x, i) => i === idx ? updated : x))}
                onRemove={() => setColors((prev) => prev.filter((_, i) => i !== idx))}
              />
            ))}
            <button
              type="button"
              onClick={() => setColors((prev) => [...prev, emptyColor()])}
              className="w-full h-10 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Color
            </button>
          </div>
        </Section>
      )}

      {/* Lengths — contractor */}
      {base.type === "contractor" && (
        <Section title="Lengths / Variants">
          <div className="space-y-3">
            {lengths.map((l, idx) => (
              <LengthRow
                key={l._key}
                v={l}
                onChange={(updated) => setLengths((prev) => prev.map((x, i) => i === idx ? updated : x))}
                onRemove={() => setLengths((prev) => prev.filter((_, i) => i !== idx))}
              />
            ))}
            <button
              type="button"
              onClick={() => setLengths((prev) => [...prev, emptyLength()])}
              className="w-full h-10 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Length
            </button>
          </div>
        </Section>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="bg-gray-900 hover:bg-gray-800 text-white h-11 px-8"
        >
          {save.isPending ? "Saving..." : "Save Product"}
        </Button>
        <Button variant="outline" onClick={() => navigate("/admin/products")}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ProductEdit;
