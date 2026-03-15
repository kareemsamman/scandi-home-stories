import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, useCategories, useSubCategories, type DbProduct } from "@/hooks/useDbData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const emptyProduct = (): Partial<DbProduct> => ({
  slug: "", name: "", type: "retail", price: 0, sku: "",
  description_he: "", description_ar: "", long_description_he: "", long_description_ar: "",
  materials: "", dimensions: "", length_he: "", length_ar: "",
  is_featured: false, is_new: false, sort_order: 0, images: [], colors: [], sizes: [], use_color_groups: false,
});

const ProductForm = ({
  initial, onSave, onCancel, isNew, categories, subCategories,
}: {
  initial: Partial<DbProduct>; onSave: (d: Partial<DbProduct>) => void;
  onCancel: () => void; isNew: boolean;
  categories: { id: string; name_he: string }[];
  subCategories: { id: string; name_he: string; category_id: string }[];
}) => {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const filteredSubs = subCategories.filter((s) => s.category_id === form.category_id);

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white">{isNew ? "New Product" : "Edit Product"}</h3>

      <div className="grid grid-cols-3 gap-4">
        <Input placeholder="Product name" value={form.name || ""} onChange={(e) => set("name", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        <Input placeholder="Slug" value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        <Select value={form.type || "retail"} onValueChange={(v) => set("type", v)}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="contractor">Contractor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input placeholder="Price" type="number" value={form.price || 0} onChange={(e) => set("price", +e.target.value)} className="bg-white/5 border-white/10 text-white" />
        <Input placeholder="SKU" value={form.sku || ""} onChange={(e) => set("sku", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        <Input placeholder="Sort order" type="number" value={form.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} className="bg-white/5 border-white/10 text-white" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select value={form.category_id || ""} onValueChange={(v) => set("category_id", v)}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_he}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={form.sub_category_id || "none"} onValueChange={(v) => set("sub_category_id", v === "none" ? null : v)}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Subcategory" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {filteredSubs.map((s) => <SelectItem key={s.id} value={s.id}>{s.name_he}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Textarea placeholder="Description (Hebrew)" value={form.description_he || ""} onChange={(e) => set("description_he", e.target.value)} className="bg-white/5 border-white/10 text-white" rows={2} />
        <Textarea placeholder="Description (Arabic)" value={form.description_ar || ""} onChange={(e) => set("description_ar", e.target.value)} className="bg-white/5 border-white/10 text-white" rows={2} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Textarea placeholder="Long description (Hebrew)" value={form.long_description_he || ""} onChange={(e) => set("long_description_he", e.target.value)} className="bg-white/5 border-white/10 text-white" rows={3} />
        <Textarea placeholder="Long description (Arabic)" value={form.long_description_ar || ""} onChange={(e) => set("long_description_ar", e.target.value)} className="bg-white/5 border-white/10 text-white" rows={3} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input placeholder="Materials" value={form.materials || ""} onChange={(e) => set("materials", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        <Input placeholder="Dimensions" value={form.dimensions || ""} onChange={(e) => set("dimensions", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        <Input placeholder="Images (comma-separated URLs)" value={(form.images || []).join(", ")} onChange={(e) => set("images", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} className="bg-white/5 border-white/10 text-white" />
      </div>

      {form.type === "contractor" && (
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="Length (Hebrew)" value={form.length_he || ""} onChange={(e) => set("length_he", e.target.value)} className="bg-white/5 border-white/10 text-white" />
          <Input placeholder="Length (Arabic)" value={form.length_ar || ""} onChange={(e) => set("length_ar", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        </div>
      )}

      {form.type === "contractor" && (
        <div>
          <label className="text-white/60 text-xs block mb-1">Sizes (JSON array: [{`{"id":"3m","label":"3m","price":80}`}])</label>
          <Textarea value={JSON.stringify(form.sizes || [], null, 2)} onChange={(e) => { try { set("sizes", JSON.parse(e.target.value)); } catch {} }} className="bg-white/5 border-white/10 text-white font-mono text-xs" rows={3} />
        </div>
      )}

      {form.type === "retail" && (
        <div>
          <label className="text-white/60 text-xs block mb-1">Colors (JSON array)</label>
          <Textarea value={JSON.stringify(form.colors || [], null, 2)} onChange={(e) => { try { set("colors", JSON.parse(e.target.value)); } catch {} }} className="bg-white/5 border-white/10 text-white font-mono text-xs" rows={3} />
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-white/70 text-sm">
          <input type="checkbox" checked={form.is_featured || false} onChange={(e) => set("is_featured", e.target.checked)} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-white/70 text-sm">
          <input type="checkbox" checked={form.is_new || false} onChange={(e) => set("is_new", e.target.checked)} />
          New
        </label>
        {form.type === "contractor" && (
          <label className="flex items-center gap-2 text-white/70 text-sm">
            <input type="checkbox" checked={form.use_color_groups || false} onChange={(e) => set("use_color_groups", e.target.checked)} />
            Use shared color groups
          </label>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel} className="text-white/60">Cancel</Button>
        <Button onClick={() => onSave(form)} className="bg-blue-600 hover:bg-blue-700">Save</Button>
      </div>
    </div>
  );
};

const AdminProducts = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: subCategories = [] } = useSubCategories();
  const [editingProduct, setEditingProduct] = useState<Partial<DbProduct> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const save = useMutation({
    mutationFn: async (data: Partial<DbProduct>) => {
      if (data.id) {
        const { error } = await supabase.from("products").update(data).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(data as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setEditingProduct(null);
      setIsNew(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Deleted" });
    },
  });

  const filtered = products.filter((p) => {
    if (filterCat !== "all" && p.category_id !== filterCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.sku || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-white/50 text-sm mt-1">{products.length} products total</p>
        </div>
        <Button onClick={() => { setEditingProduct(emptyProduct()); setIsNew(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white/5 border-white/10 text-white pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_he}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isNew && editingProduct && (
        <ProductForm
          initial={editingProduct}
          isNew
          categories={categories}
          subCategories={subCategories}
          onSave={(d) => save.mutate({ ...d, sort_order: products.length + 1 })}
          onCancel={() => { setEditingProduct(null); setIsNew(false); }}
        />
      )}

      {isLoading ? (
        <div className="text-white/50">Loading...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((product) => {
            const cat = categories.find((c) => c.id === product.category_id);
            const isEditing = editingProduct?.id === product.id && !isNew;

            if (isEditing) {
              return (
                <ProductForm
                  key={product.id}
                  initial={editingProduct!}
                  isNew={false}
                  categories={categories}
                  subCategories={subCategories}
                  onSave={(d) => save.mutate(d)}
                  onCancel={() => setEditingProduct(null)}
                />
              );
            }

            return (
              <div key={product.id} className="flex items-center gap-4 p-4 bg-[#1a1a2e] border border-white/10 rounded-xl">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                    <Package className="w-5 h-5 text-white/20" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm">{product.name}</h3>
                  <p className="text-white/40 text-xs">
                    {cat?.name_he || "—"} · {product.type} · ₪{product.price}
                    {product.sku && ` · ${product.sku}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {product.is_featured && <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Featured</span>}
                  {product.is_new && <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400">New</span>}
                  <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setIsNew(false); }} className="text-white/60 hover:text-white">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) del.mutate(product.id); }} className="text-red-400/60 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-white/30 text-center py-8">No products found</p>}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
