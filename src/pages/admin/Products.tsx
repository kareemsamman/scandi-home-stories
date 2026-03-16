import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, useCategories, useSubCategories, type DbProduct } from "@/hooks/useDbData";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const emptyBase = (): any => ({
  slug: "", type: "retail", price: 0, sku: "", materials: "", dimensions: "",
  is_featured: false, is_new: false, sort_order: 0, images: [], colors: [], sizes: [], use_color_groups: false,
});
const emptyTrans = () => ({ name: "", description: "", long_description: "", length: "" });

const ProductForm = ({
  initialBase, initialTrans, onSave, onCancel, isNew, categories, subCategories, locale,
}: {
  initialBase: any; initialTrans: any; onSave: (base: any, trans: any) => void;
  onCancel: () => void; isNew: boolean; categories: any[]; subCategories: any[]; locale: string;
}) => {
  const [form, setForm] = useState(initialBase);
  const [trans, setTrans] = useState(initialTrans);
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const setT = (k: string, v: any) => setTrans((p: any) => ({ ...p, [k]: v }));
  const filteredSubs = subCategories.filter((s: any) => s.category_id === form.category_id);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{isNew ? "New Product" : "Edit Product"}</h3>
        <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium">
          Editing: {locale === "he" ? "Hebrew" : "Arabic"}
        </span>
      </div>

      {/* Translation fields */}
      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Translatable Fields ({locale.toUpperCase()})</p>
        <Input placeholder="Product name" value={trans.name || ""} onChange={(e) => setT("name", e.target.value)} />
        <Textarea placeholder="Description" value={trans.description || ""} onChange={(e) => setT("description", e.target.value)} rows={2} />
        <Textarea placeholder="Long description" value={trans.long_description || ""} onChange={(e) => setT("long_description", e.target.value)} rows={3} />
        {form.type === "contractor" && (
          <Input placeholder="Length" value={trans.length || ""} onChange={(e) => setT("length", e.target.value)} />
        )}
      </div>

      {/* Base fields */}
      <div className="grid grid-cols-3 gap-4">
        <Input placeholder="Slug" value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} />
        <Select value={form.type || "retail"} onValueChange={(v) => set("type", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="contractor">Contractor</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Price" type="number" value={form.price || 0} onChange={(e) => set("price", +e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input placeholder="SKU" value={form.sku || ""} onChange={(e) => set("sku", e.target.value)} />
        <Input placeholder="Sort order" type="number" value={form.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} />
        <Input placeholder="Materials" value={form.materials || ""} onChange={(e) => set("materials", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select value={form.category_id || ""} onValueChange={(v) => set("category_id", v)}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{locale === "ar" ? c.name_ar : c.name_he}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={form.sub_category_id || "none"} onValueChange={(v) => set("sub_category_id", v === "none" ? null : v)}>
          <SelectTrigger><SelectValue placeholder="Subcategory" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {filteredSubs.map((s: any) => <SelectItem key={s.id} value={s.id}>{locale === "ar" ? s.name_ar : s.name_he}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Input placeholder="Images (comma-separated URLs)" value={(form.images || []).join(", ")} onChange={(e) => set("images", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} />
      {form.type === "contractor" && (
        <div>
          <label className="text-gray-500 text-xs block mb-1">Sizes JSON</label>
          <Textarea value={JSON.stringify(form.sizes || [], null, 2)} onChange={(e) => { try { set("sizes", JSON.parse(e.target.value)); } catch {} }} className="font-mono text-xs" rows={3} />
        </div>
      )}
      {form.type === "retail" && (
        <div>
          <label className="text-gray-500 text-xs block mb-1">Colors JSON</label>
          <Textarea value={JSON.stringify(form.colors || [], null, 2)} onChange={(e) => { try { set("colors", JSON.parse(e.target.value)); } catch {} }} className="font-mono text-xs" rows={3} />
        </div>
      )}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-gray-600 text-sm">
          <input type="checkbox" checked={form.is_featured || false} onChange={(e) => set("is_featured", e.target.checked)} /> Featured
        </label>
        <label className="flex items-center gap-2 text-gray-600 text-sm">
          <input type="checkbox" checked={form.is_new || false} onChange={(e) => set("is_new", e.target.checked)} /> New
        </label>
        {form.type === "contractor" && (
          <label className="flex items-center gap-2 text-gray-600 text-sm">
            <input type="checkbox" checked={form.use_color_groups || false} onChange={(e) => set("use_color_groups", e.target.checked)} /> Shared color groups
          </label>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form, trans)} className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
      </div>
    </div>
  );
};

const AdminProducts = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: subCategories = [] } = useSubCategories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const { data: transMap = new Map() } = useQuery({
    queryKey: ["admin_product_trans", locale],
    queryFn: async () => {
      const { data } = await db.from("product_translations").select("*").eq("locale", locale);
      return new Map((data || []).map((t: any) => [t.product_id, t]));
    },
  });

  const save = useMutation({
    mutationFn: async ({ base, trans }: { base: any; trans: any }) => {
      let productId = base.id;
      const { id, created_at, updated_at, ...baseData } = base;
      if (productId) {
        const { error } = await supabase.from("products").update(baseData).eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(baseData).select("id").single();
        if (error) throw error;
        productId = data.id;
      }
      const { error: tErr } = await db.from("product_translations").upsert({
        product_id: productId, locale, ...trans,
      }, { onConflict: "product_id,locale" });
      if (tErr) throw tErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin_product_trans"] });
      setEditingId(null); setIsNew(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast({ title: "Deleted" }); },
  });

  const filtered = products.filter((p) => {
    if (filterCat !== "all" && p.category_id !== filterCat) return false;
    const pName = transMap.get(p.id)?.name || p.name || "";
    if (search && !pName.toLowerCase().includes(search.toLowerCase()) && !(p.sku || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} products total</p>
        </div>
        <Button onClick={() => { setEditingId("new"); setIsNew(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{locale === "ar" ? c.name_ar : c.name_he}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isNew && editingId === "new" && (
        <ProductForm
          initialBase={emptyBase()} initialTrans={emptyTrans()} isNew locale={locale}
          categories={categories} subCategories={subCategories}
          onSave={(b, t) => save.mutate({ base: { ...b, sort_order: products.length + 1 }, trans: t })}
          onCancel={() => { setEditingId(null); setIsNew(false); }}
        />
      )}

      {isLoading ? <p className="text-gray-400">Loading...</p> : (
        <div className="space-y-2">
          {filtered.map((product) => {
            const cat = categories.find((c) => c.id === product.category_id);
            const pTrans = transMap.get(product.id);
            const displayName = pTrans?.name || product.name;

            if (editingId === product.id && !isNew) {
              const { id, created_at, updated_at, name, description_he, description_ar, long_description_he, long_description_ar, length_he, length_ar, ...baseFields } = product as any;
              return (
                <ProductForm
                  key={product.id}
                  initialBase={{ id, ...baseFields }}
                  initialTrans={pTrans ? { name: pTrans.name, description: pTrans.description, long_description: pTrans.long_description, length: pTrans.length } : emptyTrans()}
                  isNew={false} locale={locale} categories={categories} subCategories={subCategories}
                  onSave={(b, t) => save.mutate({ base: b, trans: t })}
                  onCancel={() => setEditingId(null)}
                />
              );
            }

            return (
              <div key={product.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-medium text-sm">{displayName}</h3>
                  <p className="text-gray-400 text-xs">
                    {cat ? (locale === "ar" ? cat.name_ar : cat.name_he) : "—"} · {product.type} · ₪{product.price}
                    {product.sku && ` · ${product.sku}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {product.is_featured && <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Featured</span>}
                  {product.is_new && <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700">New</span>}
                  <Button variant="ghost" size="icon" onClick={() => { setEditingId(product.id); setIsNew(false); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) del.mutate(product.id); }} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-gray-400 text-center py-8">No products found</p>}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
