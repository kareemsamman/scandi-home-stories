import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, ImageIcon, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, useSubCategories } from "@/hooks/useDbData";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { useColorTaxonomy, useLengthTaxonomy, TaxColor, TaxLength } from "@/hooks/useProductTaxonomy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

/* ─── Types ─── */
interface SimpleColorVariant {
  colorId: string;
  price: string;
  stock: string;
  inStock: boolean;
}

// For variable: stock per color+length combo
type ComboKey = string; // `${colorId}|${lengthId}`
interface ComboStock { stock: string; inStock: boolean; }

/* ─── Helpers ─── */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    {children}
  </div>
);

const Section = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{title}</h2>
      {action}
    </div>
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
  const { data: allColors = [] } = useColorTaxonomy();
  const { data: allLengths = [] } = useLengthTaxonomy();

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

  /* ── Base form state ── */
  const [base, setBase] = useState<any>({
    slug: "", type: "retail", price: 0, sku: "", materials: "", dimensions: "",
    is_featured: false, is_new: false, sort_order: 0, images: [], use_color_groups: false,
    category_id: "", sub_category_id: "",
  });
  const [transHe, setTransHe] = useState({ name: "", description: "", long_description: "", length: "" });
  const [transAr, setTransAr] = useState({ name: "", description: "", long_description: "", length: "" });

  // Variant type: "simple" (colors only) | "variable" (colors × lengths)
  const [variantType, setVariantType] = useState<"simple" | "variable">("simple");

  // Selected color IDs from taxonomy
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  // Per-color data for simple products
  const [simpleVariants, setSimpleVariants] = useState<Record<string, SimpleColorVariant>>({});

  // Selected length IDs from taxonomy (variable only)
  const [selectedLengthIds, setSelectedLengthIds] = useState<string[]>([]);
  // Per color+length combo stock (variable products)
  const [comboStock, setComboStock] = useState<Record<ComboKey, ComboStock>>({});

  const [imageUrl, setImageUrl] = useState("");

  /* ── Populate when data loads ── */
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

    const rawColors: any[] = Array.isArray(p.colors) ? p.colors : [];
    const rawSizes: any[] = Array.isArray(p.sizes) ? p.sizes : [];
    const isVariable = rawSizes.length > 0;
    setVariantType(isVariable ? "variable" : "simple");

    // Match saved colors to taxonomy IDs (by label_he or hex)
    // We store taxonomy id in colors json as "tax_id" field
    const colorIds = rawColors.map((c: any) => c.tax_id || c.id).filter(Boolean);
    setSelectedColorIds(colorIds);

    const lengthIds = rawSizes.map((s: any) => s.tax_id || s.id).filter(Boolean);
    setSelectedLengthIds(lengthIds);

    // Rebuild simpleVariants
    const sv: Record<string, SimpleColorVariant> = {};
    for (const c of rawColors) {
      const taxId = c.tax_id || c.id;
      if (!taxId) continue;
      const invRow = inventory.find((i: any) => i.variation_key === `color:${taxId}`);
      sv[taxId] = {
        colorId: taxId,
        price: String(c.price ?? ""),
        stock: String(invRow?.stock_quantity ?? ""),
        inStock: invRow ? (invRow.stock_quantity ?? 0) > 0 : (c.in_stock !== false),
      };
    }
    setSimpleVariants(sv);

    // Rebuild comboStock for variable
    const cs: Record<string, ComboStock> = {};
    for (const inv_row of inventory) {
      const key = inv_row.variation_key || "";
      if (key.startsWith("combo:")) {
        const comboKey = key.replace("combo:", "");
        cs[comboKey] = { stock: String(inv_row.stock_quantity ?? ""), inStock: (inv_row.stock_quantity ?? 0) > 0 };
      }
    }
    setComboStock(cs);
  }, [productData]);

  /* ── Derived ── */
  const currentTrans = locale === "he" ? transHe : transAr;
  const setCurrentTrans = locale === "he" ? setTransHe : setTransAr;
  const isRtl = locale === "ar";

  const selectedColors = allColors.filter(c => selectedColorIds.includes(c.id));
  const selectedLengths = allLengths.filter(l => selectedLengthIds.includes(l.id));

  const toggleColor = (id: string) => {
    setSelectedColorIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    if (!selectedColorIds.includes(id)) {
      setSimpleVariants(prev => ({
        ...prev,
        [id]: { colorId: id, price: "", stock: "", inStock: true },
      }));
    }
  };

  const toggleLength = (id: string) => {
    setSelectedLengthIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getCombo = (colorId: string, lengthId: string): ComboStock =>
    comboStock[`${colorId}|${lengthId}`] ?? { stock: "", inStock: true };

  const setCombo = (colorId: string, lengthId: string, val: Partial<ComboStock>) => {
    const key = `${colorId}|${lengthId}`;
    setComboStock(prev => ({ ...prev, [key]: { ...getCombo(colorId, lengthId), ...val } }));
  };

  /* ── Save ── */
  const save = useMutation({
    mutationFn: async () => {
      // Build colors JSON
      const colorsJson = selectedColors.map(c => ({
        tax_id: c.id,
        label_he: c.label_he,
        label_ar: c.label_ar,
        hex: c.hex,
        price: variantType === "simple" ? (simpleVariants[c.id]?.price ? Number(simpleVariants[c.id].price) : undefined) : undefined,
        in_stock: variantType === "simple" ? (simpleVariants[c.id]?.inStock ?? true) : true,
      }));

      // Build sizes JSON
      const sizesJson = variantType === "variable"
        ? selectedLengths.map(l => ({ tax_id: l.id, label_he: l.label_he, label_ar: l.label_ar, value: l.value }))
        : [];

      const { id, created_at, updated_at, ...baseFields } = base;
      const payload = {
        ...baseFields,
        name: transHe.name || base.slug,
        colors: colorsJson,
        sizes: sizesJson,
      };

      let pid = id;
      if (pid) {
        const { error } = await db.from("products").update(payload).eq("id", pid);
        if (error) throw error;
      } else {
        const { data, error } = await db.from("products").insert(payload).select("id").single();
        if (error) throw error;
        pid = data.id;
      }

      // Translations
      for (const [loc, trans] of [["he", transHe], ["ar", transAr]] as const) {
        await db.from("product_translations").upsert(
          { product_id: pid, locale: loc, ...trans },
          { onConflict: "product_id,locale" }
        );
      }

      // Inventory
      if (variantType === "simple") {
        for (const c of selectedColors) {
          const sv = simpleVariants[c.id];
          await db.from("inventory").upsert(
            { product_id: pid, variation_key: `color:${c.id}`, stock_quantity: sv?.stock ? Number(sv.stock) : 0 },
            { onConflict: "product_id,variation_key" }
          );
        }
      } else {
        for (const c of selectedColors) {
          for (const l of selectedLengths) {
            const cs = getCombo(c.id, l.id);
            await db.from("inventory").upsert(
              { product_id: pid, variation_key: `combo:${c.id}|${l.id}`, stock_quantity: cs.stock ? Number(cs.stock) : 0 },
              { onConflict: "product_id,variation_key" }
            );
          }
        }
      }
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

  const productName = locale === "he" ? transHe.name : transAr.name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/admin/products")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Products
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">
          {isNew ? "New Product" : (productName || base.slug || "Edit Product")}
        </h1>
        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
          Editing: {locale === "he" ? "Hebrew 🇮🇱" : "Arabic 🇸🇦"}
        </span>
      </div>

      {/* Content (single language, based on admin toggle) */}
      <Section title={`Content — ${locale === "he" ? "Hebrew" : "Arabic"}`}>
        <div className="space-y-3" dir={isRtl ? "rtl" : "ltr"}>
          <Field label={locale === "he" ? "שם מוצר" : "اسم المنتج"}>
            <Input value={currentTrans.name} onChange={(e) => setCurrentTrans(p => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label={locale === "he" ? "תיאור קצר" : "وصف قصير"}>
            <Textarea value={currentTrans.description} onChange={(e) => setCurrentTrans(p => ({ ...p, description: e.target.value }))} rows={2} />
          </Field>
          <Field label={locale === "he" ? "תיאור מורחב" : "وصف مفصل"}>
            <Textarea value={currentTrans.long_description} onChange={(e) => setCurrentTrans(p => ({ ...p, long_description: e.target.value }))} rows={4} />
          </Field>
        </div>
      </Section>

      {/* Product Info */}
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
                {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name_he} / {c.name_ar}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Subcategory">
            <Select value={base.sub_category_id || "none"} onValueChange={(v) => setBase((p: any) => ({ ...p, sub_category_id: v === "none" ? null : v }))}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {filteredSubs.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name_he} / {s.name_ar}</SelectItem>)}
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
            <Input placeholder="Image URL..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && imageUrl.trim()) { setBase((p: any) => ({ ...p, images: [...(p.images || []), imageUrl.trim()] })); setImageUrl(""); } }} />
            <Button type="button" variant="outline" onClick={() => { if (imageUrl.trim()) { setBase((p: any) => ({ ...p, images: [...(p.images || []), imageUrl.trim()] })); setImageUrl(""); } }}>
              <ImageIcon className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </Section>

      {/* Variant Type */}
      <Section title="Product Variants">
        <div className="flex gap-3 mb-2">
          {(["simple", "variable"] as const).map(t => (
            <button
              key={t}
              onClick={() => setVariantType(t)}
              className={`px-5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                variantType === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {t === "simple" ? "Simple (Colors only)" : "Variable (Colors × Lengths)"}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          {variantType === "simple" ? "Each color has its own price and stock." : "Each color × length combination has its own stock."}
        </p>
      </Section>

      {/* Colors */}
      <Section
        title="Colors"
        action={<Link to="/admin/attributes" className="text-xs text-blue-600 hover:underline">Manage attributes →</Link>}
      >
        {allColors.length === 0 ? (
          <p className="text-sm text-gray-400">No colors defined. <Link to="/admin/attributes" className="text-blue-600 hover:underline">Add colors in Attributes →</Link></p>
        ) : (
          <div className="space-y-4">
            {/* Color checkboxes */}
            <div className="flex flex-wrap gap-2">
              {allColors.map(c => {
                const selected = selectedColorIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleColor(c.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                      selected ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0" style={{ background: c.hex }} />
                    {locale === "he" ? c.label_he : c.label_ar}
                    {selected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>

            {/* Simple: per-color price + stock */}
            {variantType === "simple" && selectedColors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Price & Stock per color</p>
                {selectedColors.map(c => {
                  const sv = simpleVariants[c.id] ?? { colorId: c.id, price: "", stock: "", inStock: true };
                  return (
                    <div key={c.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                      <span className="w-5 h-5 rounded-full shrink-0 border border-gray-200" style={{ background: c.hex }} />
                      <span className="text-sm font-medium text-gray-700 w-24 shrink-0">{locale === "he" ? c.label_he : c.label_ar}</span>
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-xs text-gray-400">₪</span>
                        <Input type="number" placeholder="Price" value={sv.price}
                          onChange={(e) => setSimpleVariants(p => ({ ...p, [c.id]: { ...sv, price: e.target.value } }))}
                          className="h-8 text-sm w-28" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Stock</span>
                        <Input type="number" placeholder="0" value={sv.stock}
                          onChange={(e) => setSimpleVariants(p => ({ ...p, [c.id]: { ...sv, stock: e.target.value } }))}
                          className="h-8 text-sm w-20" />
                      </div>
                      <button
                        onClick={() => setSimpleVariants(p => ({ ...p, [c.id]: { ...sv, inStock: !sv.inStock } }))}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors shrink-0 ${
                          sv.inStock ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        {sv.inStock ? <><Check className="w-3 h-3" /> In Stock</> : <><X className="w-3 h-3" /> Out</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Lengths (variable only) */}
      {variantType === "variable" && (
        <Section
          title="Lengths (אורך)"
          action={<Link to="/admin/attributes" className="text-xs text-blue-600 hover:underline">Manage attributes →</Link>}
        >
          {allLengths.length === 0 ? (
            <p className="text-sm text-gray-400">No lengths defined. <Link to="/admin/attributes" className="text-blue-600 hover:underline">Add lengths in Attributes →</Link></p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allLengths.map(l => {
                const selected = selectedLengthIds.includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLength(l.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                      selected ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {locale === "he" ? l.label_he : l.label_ar}
                    <span className="text-xs opacity-60">({l.value})</span>
                    {selected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* Variable stock grid */}
      {variantType === "variable" && selectedColors.length > 0 && selectedLengths.length > 0 && (
        <Section title="Stock per Variant">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4">Color \ Length</th>
                  {selectedLengths.map(l => (
                    <th key={l.id} className="text-center text-xs text-gray-500 font-medium pb-2 px-2 whitespace-nowrap">
                      {locale === "he" ? l.label_he : l.label_ar}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedColors.map(c => (
                  <tr key={c.id}>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full shrink-0 border border-gray-200" style={{ background: c.hex }} />
                        <span className="text-sm font-medium text-gray-700">{locale === "he" ? c.label_he : c.label_ar}</span>
                      </div>
                    </td>
                    {selectedLengths.map(l => {
                      const cs = getCombo(c.id, l.id);
                      return (
                        <td key={l.id} className="py-2 px-2">
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="number"
                              placeholder="0"
                              value={cs.stock}
                              onChange={(e) => setCombo(c.id, l.id, { stock: e.target.value })}
                              className="h-8 text-xs w-20 text-center"
                            />
                            <button
                              onClick={() => setCombo(c.id, l.id, { inStock: !cs.inStock })}
                              className={`text-[10px] px-2 py-0.5 rounded border font-medium transition-colors ${
                                cs.inStock ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"
                              }`}
                            >
                              {cs.inStock ? "In Stock" : "Out"}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-gray-900 hover:bg-gray-800 text-white h-11 px-8">
          {save.isPending ? "Saving..." : "Save Product"}
        </Button>
        <Button variant="outline" onClick={() => navigate("/admin/products")}>Cancel</Button>
      </div>
    </div>
  );
};

export default ProductEdit;
