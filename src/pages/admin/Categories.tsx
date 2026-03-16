import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, useSubCategories, type DbCategory, type DbSubCategory } from "@/hooks/useDbData";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const CategoryForm = ({
  initialBase, initialTrans, onSave, onCancel, isNew, locale,
}: {
  initialBase: any; initialTrans: { name: string; description: string };
  onSave: (base: any, trans: any) => void; onCancel: () => void; isNew: boolean; locale: string;
}) => {
  const [form, setForm] = useState(initialBase);
  const [trans, setTrans] = useState(initialTrans);
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{isNew ? "New Category" : "Edit Category"}</h3>
        <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium">
          Editing: {locale === "he" ? "Hebrew" : "Arabic"}
        </span>
      </div>
      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Translatable ({locale.toUpperCase()})</p>
        <Input placeholder="Category name" value={trans.name} onChange={(e) => setTrans({ ...trans, name: e.target.value })} />
        <Textarea placeholder="Description" value={trans.description} onChange={(e) => setTrans({ ...trans, description: e.target.value })} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input placeholder="Slug" value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} />
        <Input placeholder="Sort order" type="number" value={form.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input placeholder="Image URL" value={form.image || ""} onChange={(e) => set("image", e.target.value)} />
        <Input placeholder="Hero Image URL" value={form.hero_image || ""} onChange={(e) => set("hero_image", e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form, trans)} className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
      </div>
    </div>
  );
};

const SubCategoryForm = ({
  initialBase, initialTrans, onSave, onCancel, isNew, locale,
}: {
  initialBase: any; initialTrans: { name: string };
  onSave: (base: any, trans: any) => void; onCancel: () => void; isNew: boolean; locale: string;
}) => {
  const [form, setForm] = useState(initialBase);
  const [trans, setTrans] = useState(initialTrans);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">{isNew ? "New Subcategory" : "Edit Subcategory"}</h4>
      <div className="p-3 bg-blue-50/50 rounded border border-blue-100 space-y-2">
        <Input placeholder={`Name (${locale.toUpperCase()})`} value={trans.name} onChange={(e) => setTrans({ name: e.target.value })} className="text-sm" />
      </div>
      <Input placeholder="Slug" value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="text-sm" />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">Cancel</Button>
        <Button size="sm" onClick={() => onSave(form, trans)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">Save</Button>
      </div>
    </div>
  );
};

const AdminCategories = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useCategories();
  const { data: allSubs = [] } = useSubCategories();
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [isNewCat, setIsNewCat] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [isNewSub, setIsNewSub] = useState(false);
  const [newSubCatId, setNewSubCatId] = useState<string | null>(null);

  const { data: catTransMap = new Map() } = useQuery({
    queryKey: ["admin_cat_trans", locale],
    queryFn: async () => {
      const { data } = await db.from("category_translations").select("*").eq("locale", locale);
      return new Map((data || []).map((t: any) => [t.category_id, t]));
    },
  });

  const { data: subTransMap = new Map() } = useQuery({
    queryKey: ["admin_sub_trans", locale],
    queryFn: async () => {
      const { data } = await db.from("sub_category_translations").select("*").eq("locale", locale);
      return new Map((data || []).map((t: any) => [t.sub_category_id, t]));
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["sub_categories"] });
    qc.invalidateQueries({ queryKey: ["admin_cat_trans"] });
    qc.invalidateQueries({ queryKey: ["admin_sub_trans"] });
  };

  const saveCat = useMutation({
    mutationFn: async ({ base, trans }: { base: any; trans: any }) => {
      let catId = base.id;
      const { id, created_at, updated_at, name_he, name_ar, description_he, description_ar, ...baseData } = base;
      if (catId) {
        const { error } = await supabase.from("categories").update(baseData).eq("id", catId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("categories").insert({ ...baseData, name_he: trans.name, name_ar: trans.name }).select("id").single();
        if (error) throw error;
        catId = data.id;
      }
      await db.from("category_translations").upsert({ category_id: catId, locale, ...trans }, { onConflict: "category_id,locale" });
    },
    onSuccess: () => { invalidate(); setEditingCatId(null); setIsNewCat(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCat = useMutation({
    mutationFn: async (id: string) => { await supabase.from("categories").delete().eq("id", id); },
    onSuccess: () => { invalidate(); toast({ title: "Deleted" }); },
  });

  const saveSub = useMutation({
    mutationFn: async ({ base, trans }: { base: any; trans: any }) => {
      let subId = base.id;
      const { id, created_at, name_he, name_ar, ...baseData } = base;
      if (subId) {
        const { error } = await supabase.from("sub_categories").update(baseData).eq("id", subId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("sub_categories").insert({ ...baseData, name_he: trans.name, name_ar: trans.name }).select("id").single();
        if (error) throw error;
        subId = data.id;
      }
      await db.from("sub_category_translations").upsert({ sub_category_id: subId, locale, ...trans }, { onConflict: "sub_category_id,locale" });
    },
    onSuccess: () => { invalidate(); setEditingSubId(null); setIsNewSub(false); setNewSubCatId(null); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSub = useMutation({
    mutationFn: async (id: string) => { await supabase.from("sub_categories").delete().eq("id", id); },
    onSuccess: () => { invalidate(); toast({ title: "Deleted" }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Manage product categories and subcategories</p>
        </div>
        <Button onClick={() => { setEditingCatId("new"); setIsNewCat(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      {isNewCat && editingCatId === "new" && (
        <CategoryForm
          initialBase={{ slug: "", sort_order: categories.length + 1, image: "", hero_image: "" }}
          initialTrans={{ name: "", description: "" }} isNew locale={locale}
          onSave={(b, t) => saveCat.mutate({ base: b, trans: t })}
          onCancel={() => { setEditingCatId(null); setIsNewCat(false); }}
        />
      )}

      {isLoading ? <p className="text-gray-400">Loading...</p> : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const subs = allSubs.filter((s) => s.category_id === cat.id);
            const isExpanded = expandedCat === cat.id;
            const catTrans = catTransMap.get(cat.id);
            const displayName = catTrans?.name || (locale === "ar" ? cat.name_ar : cat.name_he);

            if (editingCatId === cat.id && !isNewCat) {
              return (
                <CategoryForm
                  key={cat.id}
                  initialBase={cat}
                  initialTrans={{ name: catTrans?.name || "", description: catTrans?.description || "" }}
                  isNew={false} locale={locale}
                  onSave={(b, t) => saveCat.mutate({ base: b, trans: t })}
                  onCancel={() => setEditingCatId(null)}
                />
              );
            }

            return (
              <div key={cat.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                  {cat.image && <img src={cat.image} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-semibold">{displayName}</h3>
                    <p className="text-gray-400 text-xs">{cat.slug} · #{cat.sort_order}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {subs.length > 0 && <span className="text-xs text-gray-400 mr-2">{subs.length} subs</span>}
                    <Button variant="ghost" size="icon" onClick={() => setExpandedCat(isExpanded ? null : cat.id)}>
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCatId(cat.id); setIsNewCat(false); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteCat.mutate(cat.id); }} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-600">Subcategories</h4>
                      <Button size="sm" variant="ghost" onClick={() => { setNewSubCatId(cat.id); setIsNewSub(true); setEditingSubId("new"); }} className="text-blue-600 text-xs">
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>

                    {isNewSub && newSubCatId === cat.id && (
                      <SubCategoryForm
                        initialBase={{ slug: "", sort_order: subs.length + 1, category_id: cat.id }}
                        initialTrans={{ name: "" }} isNew locale={locale}
                        onSave={(b, t) => saveSub.mutate({ base: b, trans: t })}
                        onCancel={() => { setEditingSubId(null); setIsNewSub(false); setNewSubCatId(null); }}
                      />
                    )}

                    {subs.length === 0 && !isNewSub && <p className="text-gray-400 text-xs">No subcategories yet</p>}

                    {subs.map((sub) => {
                      const subTrans = subTransMap.get(sub.id);
                      const subName = subTrans?.name || (locale === "ar" ? sub.name_ar : sub.name_he);

                      if (editingSubId === sub.id && !isNewSub) {
                        return (
                          <SubCategoryForm
                            key={sub.id}
                            initialBase={sub}
                            initialTrans={{ name: subTrans?.name || "" }}
                            isNew={false} locale={locale}
                            onSave={(b, t) => saveSub.mutate({ base: b, trans: t })}
                            onCancel={() => setEditingSubId(null)}
                          />
                        );
                      }

                      return (
                        <div key={sub.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white border border-gray-100">
                          <GripVertical className="w-3 h-3 text-gray-300" />
                          <span className="text-sm text-gray-900 flex-1">{subName}</span>
                          <span className="text-xs text-gray-400">{sub.slug}</span>
                          <Button variant="ghost" size="icon" onClick={() => { setEditingSubId(sub.id); setIsNewSub(false); }} className="w-7 h-7">
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteSub.mutate(sub.id); }} className="text-red-500 hover:text-red-700 w-7 h-7">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
