import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, ImageIcon, Check, Upload, Pipette, Eye, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, useSubCategories } from "@/hooks/useDbData";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import {
  useColorTaxonomy, useLengthTaxonomy,
  useSaveColorTaxonomy, useSaveLengthTaxonomy,
  TaxColor, TaxLength,
} from "@/hooks/useProductTaxonomy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;
const uid = () => Math.random().toString(36).slice(2, 9);

/* ─── Types ─── */
interface SimpleColorVariant { colorId: string; price: string; stock: string; }
// For variable: per-color selected length IDs
// colorLengths[colorId] = string[] of lengthIds
// comboStock[colorId|lengthId] = stock string

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

/* ─── Quick-add color inline ─── */
const QuickAddColor = ({ locale, onAdded }: { locale: "he" | "ar"; onAdded: (c: TaxColor) => void }) => {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [hex, setHex] = useState("#3b82f6");
  const colorInputRef = useRef<HTMLInputElement>(null);
  const saveColors = useSaveColorTaxonomy();
  const { data: allColors = [] } = useColorTaxonomy();
  const qc = useQueryClient();

  const handleAdd = async () => {
    if (!label.trim()) return;
    const newColor: TaxColor = {
      id: uid(),
      label_he: locale === "he" ? label.trim() : "",
      label_ar: locale === "ar" ? label.trim() : "",
      hex,
    };
    await saveColors.mutateAsync([...allColors, newColor]);
    qc.invalidateQueries({ queryKey: ["taxonomy", "colors"] });
    onAdded(newColor);
    setLabel(""); setHex("#3b82f6"); setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors mt-1">
        <Plus className="w-3 h-3" /> Quick add color
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
      {/* Color swatch — click to open picker */}
      <div className="relative shrink-0 w-8 h-8 rounded-full border-2 border-white ring-1 ring-gray-300 overflow-hidden cursor-pointer" style={{ background: hex }}
        onClick={() => colorInputRef.current?.click()} title="Click to pick color">
        <Pipette className="absolute inset-0 m-auto w-3 h-3 text-white drop-shadow pointer-events-none" />
        <input ref={colorInputRef} type="color" value={hex} onChange={(e) => setHex(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
      </div>
      {/* Name */}
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={locale === "he" ? "שם הצבע" : "اسم اللون"}
        className="h-8 text-sm flex-1"
        dir={locale === "ar" ? "rtl" : "ltr"}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        autoFocus
      />
      {/* Hex text input */}
      <Input
        value={hex}
        onChange={(e) => setHex(e.target.value)}
        placeholder="#3b82f6"
        className="h-8 text-xs font-mono w-24"
        maxLength={7}
      />
      <button onClick={handleAdd} disabled={saveColors.isPending || !label.trim()} className="text-green-600 hover:text-green-800 disabled:opacity-40 shrink-0">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 shrink-0 text-xl leading-none">×</button>
    </div>
  );
};

/* ─── Quick-add length inline ─── */
const QuickAddLength = ({ locale, onAdded }: { locale: "he" | "ar"; onAdded: (l: TaxLength) => void }) => {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const saveLengths = useSaveLengthTaxonomy();
  const { data: allLengths = [] } = useLengthTaxonomy();
  const qc = useQueryClient();

  const handleAdd = async () => {
    if (!label.trim()) return;
    const newLength: TaxLength = {
      id: uid(),
      label_he: locale === "he" ? label.trim() : "",
      label_ar: locale === "ar" ? label.trim() : "",
      value: value.trim(),
    };
    await saveLengths.mutateAsync([...allLengths, newLength]);
    qc.invalidateQueries({ queryKey: ["taxonomy", "lengths"] });
    onAdded(newLength);
    setLabel(""); setValue(""); setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors">
        <Plus className="w-3 h-3" /> Add length
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={locale === "he" ? "שם האורך" : "اسم الطول"}
        className="h-7 text-xs flex-1"
        dir={locale === "ar" ? "rtl" : "ltr"}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        autoFocus
      />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. 2m"
        className="h-7 text-xs w-20"
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />
      <button onClick={handleAdd} disabled={saveLengths.isPending || !label.trim()} className="text-green-600 hover:text-green-800 disabled:opacity-40 shrink-0">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 shrink-0 text-xl leading-none">×</button>
    </div>
  );
};

/* ─── Per-color variable card ─── */
const ColorVariantCard = ({
  color, locale, allLengths,
  selectedLengthIds, onToggleLength,
  comboStock, onStockChange,
  comboPrice, onPriceChange,
  onAddLength,
}: {
  color: TaxColor;
  locale: "he" | "ar";
  allLengths: TaxLength[];
  selectedLengthIds: string[];
  onToggleLength: (lengthId: string) => void;
  comboStock: Record<string, string>;
  onStockChange: (lengthId: string, val: string) => void;
  comboPrice: Record<string, string>;
  onPriceChange: (lengthId: string, val: string) => void;
  onAddLength: (l: TaxLength) => void;
}) => {
  const colorLabel = locale === "he" ? color.label_he : color.label_ar;
  const selectedLengths = allLengths.filter(l => selectedLengthIds.includes(l.id));

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Color header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <span className="w-4 h-4 rounded-full shrink-0 border border-gray-200" style={{ background: color.hex }} />
        <span className="text-sm font-semibold text-gray-800">{colorLabel}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Length pill selection for this color */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Select lengths for this color</p>
          <div className="flex flex-wrap gap-1.5 items-center">
            {allLengths.map(l => {
              const sel = selectedLengthIds.includes(l.id);
              const lLabel = locale === "he" ? l.label_he : l.label_ar;
              return (
                <button
                  key={l.id}
                  onClick={() => onToggleLength(l.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                    sel ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {lLabel || l.value}
                  {l.value && lLabel && <span className="opacity-50">({l.value})</span>}
                  {sel && <Check className="w-2.5 h-2.5" />}
                </button>
              );
            })}
            <QuickAddLength locale={locale} onAdded={onAddLength} />
          </div>
        </div>

        {/* Price + Stock inputs for selected lengths */}
        {selectedLengths.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-x-3 gap-y-1 items-center mb-1 px-1">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Length</span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide text-center">Price (₪)</span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide text-center">Stock</span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Status</span>
            </div>
            <div className="space-y-1.5">
              {selectedLengths.map(l => {
                const stock = comboStock[`${color.id}|${l.id}`] ?? "0";
                const price = comboPrice[`${color.id}|${l.id}`] ?? "";
                const inStock = Number(stock) > 0;
                const lLabel = locale === "he" ? l.label_he : l.label_ar;
                return (
                  <div key={l.id} className="grid grid-cols-[auto_1fr_1fr_auto] gap-x-3 items-center">
                    <span className="text-xs font-medium text-gray-700 w-12">{lLabel || l.value}</span>
                    <Input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) => onPriceChange(l.id, e.target.value)}
                      className="h-8 text-xs text-center"
                      placeholder="0"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={stock}
                      onChange={(e) => onStockChange(l.id, e.target.value)}
                      className="h-8 text-xs text-center"
                      placeholder="0"
                    />
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {inStock ? "In Stock" : "Out"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── HTML Content Editor ─── */
const HtmlEditor = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef(value);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
      innerRef.current = value;
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== innerRef.current) {
      editorRef.current.innerHTML = value;
      innerRef.current = value;
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    if (editorRef.current) { innerRef.current = editorRef.current.innerHTML; onChange(editorRef.current.innerHTML); }
  };

  const insertImage = () => {
    const url = prompt("Image URL:");
    if (url) exec("insertHTML", `<img src="${url}" style="max-width:100%;border-radius:8px;margin:8px 0;" alt="" />`);
  };

  const insertVideo = () => {
    const url = prompt("YouTube URL or video URL:");
    if (!url) return;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
    if (ytMatch) {
      exec("insertHTML", `<div style="position:relative;padding-bottom:56.25%;height:0;margin:8px 0;overflow:hidden;border-radius:8px;"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen></iframe></div>`);
    } else {
      exec("insertHTML", `<video src="${url}" controls style="max-width:100%;border-radius:8px;margin:8px 0;"></video>`);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        {[
          { label: "B", cmd: () => exec("bold"), title: "Bold", className: "font-bold" },
          { label: "I", cmd: () => exec("italic"), title: "Italic", className: "italic" },
          { label: "H2", cmd: () => exec("formatBlock", "h2"), title: "Heading 2", className: "font-semibold" },
          { label: "H3", cmd: () => exec("formatBlock", "h3"), title: "Heading 3" },
          { label: "• List", cmd: () => exec("insertUnorderedList"), title: "Bullet list" },
          { label: "1. List", cmd: () => exec("insertOrderedList"), title: "Numbered list" },
        ].map(btn => (
          <button key={btn.label} onClick={btn.cmd} title={btn.title}
            className={`px-2 py-1 text-xs hover:bg-gray-200 rounded ${btn.className || ""}`}>
            {btn.label}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button onClick={insertImage} className="px-2 py-1 text-xs hover:bg-gray-200 rounded flex items-center gap-1">📷 Image</button>
        <button onClick={insertVideo} className="px-2 py-1 text-xs hover:bg-gray-200 rounded flex items-center gap-1">▶ Video</button>
        <button onClick={() => { const url = prompt("Link URL:"); if (url) exec("createLink", url); }} className="px-2 py-1 text-xs hover:bg-gray-200 rounded">🔗 Link</button>
        <button onClick={() => exec("removeFormat")} className="px-2 py-1 text-xs hover:bg-gray-200 rounded text-gray-500">Clear</button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button onClick={() => setIsPreview(p => !p)} className={`px-2 py-1 text-xs rounded transition-colors ${isPreview ? "bg-blue-100 text-blue-700" : "hover:bg-gray-200"}`}>
          {isPreview ? "Edit" : "Preview"}
        </button>
      </div>
      {isPreview ? (
        <div className="p-4 min-h-[180px] prose prose-sm max-w-none [&_img]:rounded-lg [&_video]:rounded-lg [&_iframe]:rounded-lg" dangerouslySetInnerHTML={{ __html: value }} />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => { if (editorRef.current) { innerRef.current = editorRef.current.innerHTML; onChange(editorRef.current.innerHTML); } }}
          className="p-4 min-h-[180px] focus:outline-none text-sm [&_img]:rounded-lg [&_video]:rounded-lg [&_img]:max-w-full"
          data-placeholder={placeholder}
        />
      )}
    </div>
  );
};

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
    category_id: "", sub_category_id: "", status: "published",
  });
  const [transHe, setTransHe] = useState({ name: "", description: "", long_description: "", length: "", content_html: "" });
  const [transAr, setTransAr] = useState({ name: "", description: "", long_description: "", length: "", content_html: "" });
  const [productDetails, setProductDetails] = useState<{ label_he: string; label_ar: string; value_he: string; value_ar: string }[]>([]);

  const [variantType, setVariantType] = useState<"simple" | "variable">("simple");
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [simpleVariants, setSimpleVariants] = useState<Record<string, SimpleColorVariant>>({});

  // Variable: per-color length selection { [colorId]: string[] }
  const [colorLengths, setColorLengths] = useState<Record<string, string[]>>({});
  // Variable: combo stock { [colorId|lengthId]: stockString }
  const [comboStock, setComboStock] = useState<Record<string, string>>({});
  // Variable: combo price { [colorId|lengthId]: priceString }
  const [comboPrice, setComboPrice] = useState<Record<string, string>>({});
  const [imageUrl, setImageUrl] = useState("");

  /* ── Populate on load ── */
  useEffect(() => {
    if (!productData) return;
    const { product: p, translations, inventory } = productData;
    setBase({
      id: p.id, slug: p.slug || "", type: p.type || "retail", price: p.price || 0,
      sku: p.sku || "", materials: p.materials || "", dimensions: p.dimensions || "",
      is_featured: p.is_featured || false, is_new: p.is_new || false,
      sort_order: p.sort_order || 0, images: p.images || [],
      category_id: p.category_id || "", sub_category_id: p.sub_category_id || "",
      status: p.status || "published",
    });

    const he = translations.find((t: any) => t.locale === "he") || {};
    const ar = translations.find((t: any) => t.locale === "ar") || {};
    setTransHe({ name: he.name || "", description: he.description || "", long_description: he.long_description || "", length: he.length || "", content_html: he.content_html || "" });
    setTransAr({ name: ar.name || "", description: ar.description || "", long_description: ar.long_description || "", length: ar.length || "", content_html: ar.content_html || "" });

    // Load product details
    const pd = Array.isArray(p.product_details) ? p.product_details : [];
    setProductDetails(pd);

    const rawColors: any[] = Array.isArray(p.colors) ? p.colors : [];
    const rawSizes: any[] = Array.isArray(p.sizes) ? p.sizes : [];
    const isVariable = rawSizes.length > 0;
    setVariantType(isVariable ? "variable" : "simple");

    const colorIds = rawColors.map((c: any) => c.tax_id || c.id).filter(Boolean);
    setSelectedColorIds(colorIds);

    // Per-color lengths: stored in colors json as c.lengths
    const cl: Record<string, string[]> = {};
    for (const c of rawColors) {
      const taxId = c.tax_id || c.id;
      if (!taxId) continue;
      cl[taxId] = Array.isArray(c.lengths) ? c.lengths : [];
    }
    setColorLengths(cl);

    const sv: Record<string, SimpleColorVariant> = {};
    for (const c of rawColors) {
      const taxId = c.tax_id || c.id;
      if (!taxId) continue;
      const invRow = inventory.find((i: any) => i.variation_key === `color:${taxId}`);
      sv[taxId] = { colorId: taxId, price: String(c.price ?? ""), stock: String(invRow?.stock_quantity ?? "0") };
    }
    setSimpleVariants(sv);

    const cs: Record<string, string> = {};
    for (const inv_row of inventory) {
      const key = inv_row.variation_key || "";
      if (key.startsWith("combo:")) {
        cs[key.replace("combo:", "")] = String(inv_row.stock_quantity ?? "0");
      }
    }
    setComboStock(cs);

    // Load combo prices from colors JSON
    const cp: Record<string, string> = {};
    for (const c of rawColors) {
      const taxId = c.tax_id || c.id;
      if (!taxId || !c.combo_prices) continue;
      for (const [lengthId, price] of Object.entries(c.combo_prices as Record<string, number>)) {
        cp[`${taxId}|${lengthId}`] = String(price);
      }
    }
    setComboPrice(cp);
  }, [productData]);

  /* ── Derived ── */
  const currentTrans = locale === "he" ? transHe : transAr;
  const setCurrentTrans = locale === "he" ? setTransHe : setTransAr;
  const isRtl = locale === "ar";
  const selectedColors = allColors.filter(c => selectedColorIds.includes(c.id));

  const toggleColor = (id: string) => {
    const wasSelected = selectedColorIds.includes(id);
    setSelectedColorIds(prev => wasSelected ? prev.filter(x => x !== id) : [...prev, id]);
    if (!wasSelected) {
      setSimpleVariants(prev => ({ ...prev, [id]: { colorId: id, price: "", stock: "0" } }));
      setColorLengths(prev => ({ ...prev, [id]: [] }));
    }
  };

  const toggleColorLength = (colorId: string, lengthId: string) => {
    setColorLengths(prev => {
      const cur = prev[colorId] || [];
      return { ...prev, [colorId]: cur.includes(lengthId) ? cur.filter(x => x !== lengthId) : [...cur, lengthId] };
    });
  };

  const setStock = (colorId: string, lengthId: string, val: string) => {
    setComboStock(prev => ({ ...prev, [`${colorId}|${lengthId}`]: val }));
  };

  /* ── Image upload ── */
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `products/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from("site-media").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("site-media").getPublicUrl(path);
      setBase((p: any) => ({ ...p, images: [...(p.images || []), publicUrl] }));
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  /* ── Duplicate ── */
  const duplicate = useMutation({
    mutationFn: async () => {
      if (!base.id) return;
      const [{ data: trans }, { data: inv }] = await Promise.all([
        db.from("product_translations").select("*").eq("product_id", base.id),
        db.from("inventory").select("*").eq("product_id", base.id),
      ]);
      const { id, created_at, updated_at, ...fields } = base;
      const { data: newProduct, error } = await db.from("products")
        .insert({ ...fields, name: fields.name || "Untitled", slug: `${fields.slug}-copy`, status: "draft", is_featured: false })
        .select("id").single();
      if (error) throw error;
      for (const t of (trans || [])) {
        const { id: _tid, created_at: _tca, product_id: _pid, ...tFields } = t;
        await db.from("product_translations").insert({ ...tFields, name: tFields.name ? `${tFields.name} - Copy` : tFields.name, product_id: newProduct.id });
      }
      for (const i of (inv || [])) {
        const { id: _iid, created_at: _ica, ...iFields } = i;
        await db.from("inventory").insert({ ...iFields, product_id: newProduct.id });
      }
      return newProduct.id;
    },
    onSuccess: (newId) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Duplicated — saved as draft" });
      navigate(`/admin/products/edit/${newId}`);
    },
    onError: (e: any) => toast({ title: "Duplicate failed", description: e.message, variant: "destructive" }),
  });

  /* ── Save ── */
  const save = useMutation({
    mutationFn: async (statusOverride?: "published" | "draft") => {
      const effectiveStatus = statusOverride ?? base.status ?? "published";
      const colorsJson = selectedColors.map(c => {
        const sv = simpleVariants[c.id];
        const stock = Number(sv?.stock ?? 0);
        const lengths = colorLengths[c.id] || [];
        const comboPrices = variantType === "variable"
          ? Object.fromEntries(lengths.map(lid => [lid, Number(comboPrice[`${c.id}|${lid}`] || 0)]))
          : undefined;
        return {
          tax_id: c.id,
          label_he: c.label_he,
          label_ar: c.label_ar,
          hex: c.hex,
          price: variantType === "simple" && sv?.price ? Number(sv.price) : undefined,
          in_stock: variantType === "simple" ? stock > 0 : true,
          lengths: variantType === "variable" ? lengths : undefined,
          combo_prices: comboPrices,
        };
      });

      // sizes = union of all selected lengths across all colors
      const allSelectedLengthIds = [...new Set(Object.values(colorLengths).flat())];
      const sizesJson = variantType === "variable"
        ? allLengths.filter(l => allSelectedLengthIds.includes(l.id))
            .map(l => ({ tax_id: l.id, label_he: l.label_he, label_ar: l.label_ar, value: l.value }))
        : [];

      const { id, created_at, updated_at, ...baseFields } = base;
      const payload = {
        ...baseFields,
        status: effectiveStatus,
        category_id: baseFields.category_id || null,
        sub_category_id: baseFields.sub_category_id || null,
        name: transHe.name || base.slug,
        colors: colorsJson,
        sizes: sizesJson,
        use_color_groups: false,
        product_details: productDetails,
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

      for (const [loc, trans] of [["he", transHe], ["ar", transAr]] as const) {
        await db.from("product_translations").upsert(
          { product_id: pid, locale: loc, ...trans },
          { onConflict: "product_id,locale" }
        );
      }

      if (variantType === "simple") {
        for (const c of selectedColors) {
          const sv = simpleVariants[c.id];
          await db.from("inventory").upsert(
            { product_id: pid, variation_key: `color:${c.id}`, stock_quantity: Number(sv?.stock ?? 0) },
            { onConflict: "product_id,variation_key" }
          );
        }
      } else {
        for (const c of selectedColors) {
          const lengths = (colorLengths[c.id] || []).map(lid => allLengths.find(l => l.id === lid)).filter(Boolean) as TaxLength[];
          for (const l of lengths) {
            const stock = Number(comboStock[`${c.id}|${l.id}`] ?? 0);
            await db.from("inventory").upsert(
              { product_id: pid, variation_key: `combo:${c.id}|${l.id}`, stock_quantity: stock },
              { onConflict: "product_id,variation_key" }
            );
          }
        }
      }
      return pid;
    },
    onSuccess: (pid) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin_product_edit", productId] });
      toast({ title: "Saved", description: "Product saved successfully" });
      // For new products, navigate to the real edit URL
      if (isNew && pid) navigate(`/admin/products/edit/${pid}`, { replace: true });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filteredSubs = subCategories.filter((s: any) => s.category_id === base.category_id);

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );

  const productName = locale === "he" ? transHe.name : transAr.name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate("/admin/products")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Products
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">
          {isNew ? "New Product" : (productName || base.slug || "Edit Product")}
        </h1>
        {/* Draft badge */}
        {base.status === "draft" && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">Draft</span>
        )}
        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
          {locale === "he" ? "Hebrew 🇮🇱" : "Arabic 🇸🇦"}
        </span>
        {/* Preview */}
        {!isNew && base.slug && (
          <Button variant="outline" size="sm" onClick={() => window.open(`/he/product/${base.slug}`, "_blank")}>
            <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
          </Button>
        )}
        {/* Duplicate */}
        {!isNew && (
          <Button variant="outline" size="sm" onClick={() => duplicate.mutate()} disabled={duplicate.isPending}>
            <Copy className="w-3.5 h-3.5 mr-1.5" /> Duplicate
          </Button>
        )}
      </div>

      {/* Content */}
      <Section title={`Content — ${locale === "he" ? "Hebrew" : "Arabic"}`}>
        <div className="space-y-3" dir={isRtl ? "rtl" : "ltr"}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={locale === "he" ? "שם מוצר" : "اسم المنتج"}>
              <Input value={currentTrans.name} onChange={(e) => setCurrentTrans(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Slug (URL)">
              <Input value={base.slug} onChange={(e) => setBase((p: any) => ({ ...p, slug: e.target.value }))} placeholder="product-slug" dir="ltr" />
            </Field>
          </div>
          <Field label={locale === "he" ? "תיאור קצר" : "وصف قصير"}>
            <Textarea value={currentTrans.description} onChange={(e) => setCurrentTrans(p => ({ ...p, description: e.target.value }))} rows={2} />
          </Field>
          <Field label={locale === "he" ? "תיאור מורחב" : "وصف مفصل"}>
            <Textarea value={currentTrans.long_description} onChange={(e) => setCurrentTrans(p => ({ ...p, long_description: e.target.value }))} rows={4} />
          </Field>
          <Field label={locale === "he" ? "תוכן ויזואלי (HTML)" : "محتوى مرئي (HTML)"}>
            <HtmlEditor
              value={currentTrans.content_html}
              onChange={(v) => setCurrentTrans(p => ({ ...p, content_html: v }))}
              placeholder={locale === "he" ? "הכנס טקסט, תמונות, סרטונים..." : "أدخل نصاً، صوراً، مقاطع فيديو..."}
            />
          </Field>
        </div>
      </Section>

      {/* Product Info */}
      <Section title="Product Info">
        <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-2 gap-4">
          <Field label="SKU">
            <Input value={base.sku} onChange={(e) => setBase((p: any) => ({ ...p, sku: e.target.value }))} />
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

      {/* Product Details Repeater */}
      <Section title="Product Details (פרטי המוצר)">
        <div className="space-y-2">
          {productDetails.map((detail, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center">
              <Input
                value={detail.label_he}
                onChange={(e) => setProductDetails(prev => prev.map((d, i) => i === idx ? { ...d, label_he: e.target.value } : d))}
                placeholder="Label (HE) e.g. חומר"
                className="h-8 text-sm"
                dir="rtl"
              />
              <Input
                value={detail.value_he}
                onChange={(e) => setProductDetails(prev => prev.map((d, i) => i === idx ? { ...d, value_he: e.target.value } : d))}
                placeholder="Value (HE) e.g. אלומיניום"
                className="h-8 text-sm"
                dir="rtl"
              />
              <Input
                value={detail.label_ar}
                onChange={(e) => setProductDetails(prev => prev.map((d, i) => i === idx ? { ...d, label_ar: e.target.value } : d))}
                placeholder="Label (AR) e.g. مادة"
                className="h-8 text-sm"
                dir="rtl"
              />
              <Input
                value={detail.value_ar}
                onChange={(e) => setProductDetails(prev => prev.map((d, i) => i === idx ? { ...d, value_ar: e.target.value } : d))}
                placeholder="Value (AR) e.g. ألومنيوم"
                className="h-8 text-sm"
                dir="rtl"
              />
              <button
                onClick={() => setProductDetails(prev => prev.filter((_, i) => i !== idx))}
                className="text-red-400 hover:text-red-600 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {productDetails.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">No product details yet. Add rows below.</p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setProductDetails(prev => [...prev, { label_he: "", label_ar: "", value_he: "", value_ar: "" }])}
            className="w-full border-dashed"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Detail Row
          </Button>
        </div>
        <p className="text-xs text-gray-400">Fill HE + AR columns. Leave blank fields empty — blank rows won't show on front-end.</p>
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
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full border-dashed h-10 text-gray-500">
            <Upload className="w-4 h-4 mr-2" />{uploading ? "Uploading..." : "Upload image"}
          </Button>
          <div className="flex gap-2">
            <Input placeholder="Or paste image URL..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && imageUrl.trim()) { setBase((p: any) => ({ ...p, images: [...(p.images || []), imageUrl.trim()] })); setImageUrl(""); } }} />
            <Button type="button" variant="outline" onClick={() => { if (imageUrl.trim()) { setBase((p: any) => ({ ...p, images: [...(p.images || []), imageUrl.trim()] })); setImageUrl(""); } }}>
              <ImageIcon className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </Section>

      {/* Variant Type */}
      <Section title="Product Variants">
        <div className="flex gap-3">
          {(["simple", "variable"] as const).map(t => (
            <button key={t} onClick={() => setVariantType(t)}
              className={`px-5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                variantType === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}>
              {t === "simple" ? "Simple (Colors only)" : "Variable (Colors × Lengths)"}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          {variantType === "simple" ? "Each color has its own price and stock." : "Each color can have different lengths with individual stock."}
        </p>
      </Section>

      {/* Colors */}
      <Section
        title="Colors"
        action={<Link to="/admin/attributes" className="text-xs text-blue-600 hover:underline">Manage attributes →</Link>}
      >
        <div className="space-y-4">
          {/* Color pills */}
          <div className="flex flex-wrap gap-2">
            {allColors.map(c => {
              const selected = selectedColorIds.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggleColor(c.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    selected ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}>
                  <span className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0" style={{ background: c.hex }} />
                  {locale === "he" ? c.label_he : c.label_ar}
                  {selected && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>

          <QuickAddColor
            locale={locale}
            onAdded={(c) => {
              setSelectedColorIds(prev => [...prev, c.id]);
              setSimpleVariants(prev => ({ ...prev, [c.id]: { colorId: c.id, price: "", stock: "0" } }));
              setColorLengths(prev => ({ ...prev, [c.id]: [] }));
            }}
          />

          {/* Simple: per-color price + stock */}
          {variantType === "simple" && selectedColors.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Price & Stock per color</p>
              {selectedColors.map(c => {
                const sv = simpleVariants[c.id] ?? { colorId: c.id, price: "", stock: "0" };
                const inStock = Number(sv.stock) > 0;
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Stock</span>
                      <Input type="number" min="0" placeholder="0" value={sv.stock}
                        onChange={(e) => setSimpleVariants(p => ({ ...p, [c.id]: { ...sv, stock: e.target.value } }))}
                        className="h-8 text-sm w-20" />
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Variable: per-color length + stock cards */}
          {variantType === "variable" && selectedColors.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Lengths & Stock per color</p>
              {selectedColors.map(c => (
                <ColorVariantCard
                  key={c.id}
                  color={c}
                  locale={locale}
                  allLengths={allLengths}
                  selectedLengthIds={colorLengths[c.id] || []}
                  onToggleLength={(lid) => toggleColorLength(c.id, lid)}
                  comboStock={comboStock}
                  onStockChange={(lid, val) => setStock(c.id, lid, val)}
                  comboPrice={comboPrice}
                  onPriceChange={(lid, val) => setComboPrice(prev => ({ ...prev, [`${c.id}|${lid}`]: val }))}
                  onAddLength={(l) => {
                    setColorLengths(prev => ({ ...prev, [c.id]: [...(prev[c.id] || []), l.id] }));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8 flex-wrap">
        <Button
          onClick={() => save.mutate("published")}
          disabled={save.isPending}
          className="bg-gray-900 hover:bg-gray-800 text-white h-11 px-8"
        >
          {save.isPending ? "Saving..." : "Save & Publish"}
        </Button>
        <Button
          variant="outline"
          onClick={() => save.mutate("draft")}
          disabled={save.isPending}
          className="h-11 border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          Save as Draft
        </Button>
        <Button variant="outline" onClick={() => navigate("/admin/products")} className="h-11">Cancel</Button>
      </div>
    </div>
  );
};

export default ProductEdit;
