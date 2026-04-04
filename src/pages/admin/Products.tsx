import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Package, Copy, GripVertical, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProducts, useCategories, useSubCategories } from "@/hooks/useDbData";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const db = supabase as any;

/* ── Sortable row wrapper ── */
const SortableRow = ({ id, children }: { id: string; children: (handleProps: any) => React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-50 z-50" : ""}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  );
};

const AdminProducts = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const [search, setSearch] = useState(() => sessionStorage.getItem("admin_prod_search") || "");
  const [filterCat, setFilterCat] = useState(() => sessionStorage.getItem("admin_prod_cat") || "all");
  const [filterSubCat, setFilterSubCat] = useState(() => sessionStorage.getItem("admin_prod_subcat") || "all");
  const [filterStatus, setFilterStatus] = useState(() => sessionStorage.getItem("admin_prod_status") || "all");

  // Persist filters to sessionStorage
  useEffect(() => { sessionStorage.setItem("admin_prod_search", search); }, [search]);
  useEffect(() => { sessionStorage.setItem("admin_prod_cat", filterCat); }, [filterCat]);
  useEffect(() => { sessionStorage.setItem("admin_prod_subcat", filterSubCat); }, [filterSubCat]);
  useEffect(() => { sessionStorage.setItem("admin_prod_status", filterStatus); }, [filterStatus]);
  const { data: subCategories = [] } = useSubCategories(filterCat !== "all" ? filterCat : undefined);
  // Local order for drag (all products, unfiltered)
  const [orderedIds, setOrderedIds] = useState<string[] | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: transMap = new Map() } = useQuery({
    queryKey: ["admin_product_trans", locale],
    queryFn: async () => {
      const { data } = await db.from("product_translations").select("*").eq("locale", locale);
      return new Map((data || []).map((t: any) => [t.product_id, t]));
    },
  });

  // Use local order if dragging, otherwise server order
  const allProducts: any[] = orderedIds
    ? orderedIds.map(id => (products as any[]).find((p: any) => p.id === id)).filter(Boolean)
    : (products as any[]);

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
      // Only pick known DB columns to avoid schema cache errors
      const validKeys = [
        'name','slug','type','sku','price','category_id','sub_category_id',
        'description_he','description_ar','long_description_he','long_description_ar',
        'length_he','length_ar','materials','dimensions','images','colors','sizes',
        'is_featured','is_new','sort_order','status','max_quantity',
        'use_color_groups','custom_colors_enabled','custom_color_groups','custom_color_prices','product_details',
      ];
      const cleanFields: Record<string, any> = {};
      for (const k of validKeys) {
        if (k in product) cleanFields[k] = product[k];
      }
      const dupSlug = (cleanFields.slug || "product") + "-copy-" + Date.now();
      const { data: newProduct, error } = await db.from("products")
        .insert({ ...cleanFields, name: cleanFields.name || "Untitled", slug: dupSlug, status: "draft", is_featured: false })
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
      toast({ title: "Product duplicated — saved as draft" });
      navigate(`/admin/products/edit/${newId}`);
    },
    onError: (e: any) => toast({ title: "Duplicate failed", description: e.message, variant: "destructive" }),
  });

  const saveOrder = useMutation({
    mutationFn: async (ids: string[]) => {
      for (let i = 0; i < ids.length; i++) {
        await db.from("products").update({ sort_order: i }).eq("id", ids[i]);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Order saved" });
    },
    onError: (e: any) => toast({ title: "Failed to save order", description: e.message, variant: "destructive" }),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // Work with the full product list to preserve relative order
    const fullIds = orderedIds ?? allProducts.map((p: any) => p.id);
    const filteredIds = filtered.map((p: any) => p.id);
    
    const oldFilteredIdx = filteredIds.indexOf(active.id as string);
    const newFilteredIdx = filteredIds.indexOf(over.id as string);
    if (oldFilteredIdx === -1 || newFilteredIdx === -1) return;
    
    // Reorder within filtered list
    const newFilteredIds = arrayMove(filteredIds, oldFilteredIdx, newFilteredIdx);
    
    // Rebuild full list: replace filtered items in their positions with new order
    const newFullIds = [...fullIds];
    let filterIdx = 0;
    for (let i = 0; i < newFullIds.length; i++) {
      if (filteredIds.includes(newFullIds[i])) {
        newFullIds[i] = newFilteredIds[filterIdx++];
      }
    }
    
    setOrderedIds(newFullIds);
    saveOrder.mutate(newFullIds);
  };

  const filtered = allProducts.filter((p: any) => {
    if (filterCat !== "all" && p.category_id !== filterCat) return false;
    if (filterSubCat !== "all" && p.sub_category_id !== filterSubCat) return false;
    if (filterStatus !== "all" && (p.status || "published") !== filterStatus) return false;
    const pName = transMap.get(p.id)?.name || p.name || "";
    if (search && !pName.toLowerCase().includes(search.toLowerCase()) && !(p.sku || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isDragEnabled = true;

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} products total</p>
        </div>
        <Button onClick={() => navigate("/admin/products/edit/new")} className="bg-gray-900 hover:bg-gray-800 text-white shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={v => { setFilterCat(v); setFilterSubCat("all"); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{locale === "ar" ? c.name_ar : c.name_he}</SelectItem>)}
          </SelectContent>
        </Select>
        {filterCat !== "all" && subCategories.length > 0 && (
          <Select value={filterSubCat} onValueChange={setFilterSubCat}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Subcategories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              {subCategories.map((s) => <SelectItem key={s.id} value={s.id}>{locale === "ar" ? s.name_ar : s.name_he}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>


      {isLoading ? <p className="text-gray-400">Loading...</p> : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map((p: any) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filtered.map((product: any) => {
                const cat = categories.find((c) => c.id === product.category_id);
                const pTrans = transMap.get(product.id);
                const displayName = pTrans?.name || product.name;
                const colorsCount = Array.isArray(product.colors) ? product.colors.length : 0;
                const sizesCount = Array.isArray(product.sizes) ? product.sizes.length : 0;
                const isDraft = (product.status || "published") === "draft";

                const rowContent = (dragHandleProps?: any) => (
                  <div className={`flex items-center gap-3 p-4 bg-white border rounded-xl hover:border-gray-300 transition-colors ${isDraft ? "border-amber-200 bg-amber-50/30" : "border-gray-200"}`}>
                    {isDragEnabled && (
                      <button {...dragHandleProps} className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 p-1">
                        <GripVertical className="w-4 h-4" />
                      </button>
                    )}
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
                    <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
                      {isDraft && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Draft</span>}
                      {product.is_featured && <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Featured</span>}
                      {product.is_new && <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700">New</span>}
                      {product.slug && (
                        <Button variant="ghost" size="icon" title="Preview" onClick={() => window.open(`/he/product/${product.slug}`, "_blank")}>
                          <Eye className="w-4 h-4 text-gray-400" />
                        </Button>
                      )}
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

                return isDragEnabled ? (
                  <SortableRow key={product.id} id={product.id}>
                    {(handleProps) => rowContent(handleProps)}
                  </SortableRow>
                ) : (
                  <div key={product.id}>{rowContent()}</div>
                );
              })}
              {filtered.length === 0 && <p className="text-gray-400 text-center py-8">No products found</p>}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default AdminProducts;
