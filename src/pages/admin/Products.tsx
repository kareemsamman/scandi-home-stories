import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Package, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, useCategories } from "@/hooks/useDbData";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const AdminProducts = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: transMap = new Map() } = useQuery({
    queryKey: ["admin_product_trans", locale],
    queryFn: async () => {
      const { data } = await db.from("product_translations").select("*").eq("locale", locale);
      return new Map((data || []).map((t: any) => [t.product_id, t]));
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast({ title: "Deleted" }); },
  });

  const duplicate = useMutation({
    mutationFn: async (product: any) => {
      const [{ data: trans }, { data: inv }] = await Promise.all([
        db.from("product_translations").select("*").eq("product_id", product.id),
        db.from("inventory").select("*").eq("product_id", product.id),
      ]);

      const { id, created_at, updated_at, ...fields } = product;
      const newSlug = `${fields.slug}-copy`;
      const { data: newProduct, error } = await db.from("products")
        .insert({ ...fields, slug: newSlug, status: "draft", is_featured: false })
        .select("id").single();
      if (error) throw error;

      for (const t of (trans || [])) {
        const { id: _tid, created_at: _tca, product_id: _pid, ...tFields } = t;
        await db.from("product_translations").insert({ ...tFields, product_id: newProduct.id });
      }
      for (const i of (inv || [])) {
        const { id: _iid, created_at: _ica, ...iFields } = i;
        await db.from("inventory").insert({ ...iFields, product_id: newProduct.id });
      }
      return newProduct.id;
    },
    onSuccess: (newId) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product duplicated — saved as draft" });
      navigate(`/admin/products/edit/${newId}`);
    },
    onError: (e: any) => toast({ title: "Duplicate failed", description: e.message, variant: "destructive" }),
  });

  const filtered = products.filter((p: any) => {
    if (filterCat !== "all" && p.category_id !== filterCat) return false;
    if (filterStatus !== "all" && (p.status || "published") !== filterStatus) return false;
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
        <Button onClick={() => navigate("/admin/products/edit/new")} className="bg-gray-900 hover:bg-gray-800 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{locale === "ar" ? c.name_ar : c.name_he}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <p className="text-gray-400">Loading...</p> : (
        <div className="space-y-2">
          {filtered.map((product: any) => {
            const cat = categories.find((c) => c.id === product.category_id);
            const pTrans = transMap.get(product.id);
            const displayName = pTrans?.name || product.name;
            const colorsCount = Array.isArray(product.colors) ? product.colors.length : 0;
            const sizesCount = Array.isArray(product.sizes) ? product.sizes.length : 0;
            const isDraft = (product.status || "published") === "draft";

            return (
              <div key={product.id} className={`flex items-center gap-4 p-4 bg-white border rounded-xl hover:border-gray-300 transition-colors ${isDraft ? "border-amber-200 bg-amber-50/30" : "border-gray-200"}`}>
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-medium text-sm">{displayName}</h3>
                  <p className="text-gray-400 text-xs">
                    {cat ? (locale === "ar" ? cat.name_ar : cat.name_he) : "—"} · {product.type} · ₪{product.price}
                    {product.sku && ` · ${product.sku}`}
                    {colorsCount > 0 && ` · ${colorsCount} colors`}
                    {sizesCount > 0 && ` · ${sizesCount} lengths`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {isDraft && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Draft</span>}
                  {product.is_featured && <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Featured</span>}
                  {product.is_new && <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700">New</span>}
                  <Button variant="ghost" size="icon" title="Duplicate" onClick={() => duplicate.mutate(product)} disabled={duplicate.isPending}>
                    <Copy className="w-4 h-4 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/products/edit/${product.id}`)}>
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
