import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, useSubCategories, type DbCategory, type DbSubCategory } from "@/hooks/useDbData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const emptyCategory = (): Partial<DbCategory> => ({
  slug: "", name_he: "", name_ar: "", description_he: "", description_ar: "",
  image: "", hero_image: "", sort_order: 0,
});

const emptySub = (): Partial<DbSubCategory> => ({
  slug: "", name_he: "", name_ar: "", sort_order: 0, category_id: "",
});

const CategoryForm = ({
  initial, onSave, onCancel, isNew,
}: {
  initial: Partial<DbCategory>; onSave: (data: Partial<DbCategory>) => void;
  onCancel: () => void; isNew: boolean;
}) => {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white">{isNew ? "New Category" : "Edit Category"}</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input placeholder="Slug (e.g. bioclimatic)" value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        <Input placeholder="Sort order" type="number" value={form.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} className="bg-white/5 border-white/10 text-white" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input placeholder="Name (Hebrew)" value={form.name_he || ""} onChange={(e) => set("name_he", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        <Input placeholder="Name (Arabic)" value={form.name_ar || ""} onChange={(e) => set("name_ar", e.target.value)} className="bg-white/5 border-white/10 text-white" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Textarea placeholder="Description (Hebrew)" value={form.description_he || ""} onChange={(e) => set("description_he", e.target.value)} className="bg-white/5 border-white/10 text-white" rows={2} />
        <Textarea placeholder="Description (Arabic)" value={form.description_ar || ""} onChange={(e) => set("description_ar", e.target.value)} className="bg-white/5 border-white/10 text-white" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input placeholder="Image URL" value={form.image || ""} onChange={(e) => set("image", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        <Input placeholder="Hero Image URL" value={form.hero_image || ""} onChange={(e) => set("hero_image", e.target.value)} className="bg-white/5 border-white/10 text-white" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel} className="text-white/60">Cancel</Button>
        <Button onClick={() => onSave(form)} className="bg-blue-600 hover:bg-blue-700">Save</Button>
      </div>
    </div>
  );
};

const SubCategoryForm = ({
  initial, onSave, onCancel, isNew,
}: {
  initial: Partial<DbSubCategory>; onSave: (data: Partial<DbSubCategory>) => void;
  onCancel: () => void; isNew: boolean;
}) => {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-semibold text-white">{isNew ? "New Subcategory" : "Edit Subcategory"}</h4>
      <div className="grid grid-cols-3 gap-3">
        <Input placeholder="Slug" value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} className="bg-white/5 border-white/10 text-white text-sm" />
        <Input placeholder="Name (Hebrew)" value={form.name_he || ""} onChange={(e) => set("name_he", e.target.value)} className="bg-white/5 border-white/10 text-white text-sm" />
        <Input placeholder="Name (Arabic)" value={form.name_ar || ""} onChange={(e) => set("name_ar", e.target.value)} className="bg-white/5 border-white/10 text-white text-sm" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-white/60 text-xs">Cancel</Button>
        <Button size="sm" onClick={() => onSave(form)} className="bg-blue-600 hover:bg-blue-700 text-xs">Save</Button>
      </div>
    </div>
  );
};

const AdminCategories = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useCategories();
  const { data: allSubs = [] } = useSubCategories();
  const [editingCat, setEditingCat] = useState<Partial<DbCategory> | null>(null);
  const [isNewCat, setIsNewCat] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<Partial<DbSubCategory> | null>(null);
  const [isNewSub, setIsNewSub] = useState(false);

  const saveCat = useMutation({
    mutationFn: async (data: Partial<DbCategory>) => {
      if (data.id) {
        const { error } = await supabase.from("categories").update(data).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(data as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setEditingCat(null);
      setIsNewCat(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCat = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Deleted" });
    },
  });

  const saveSub = useMutation({
    mutationFn: async (data: Partial<DbSubCategory>) => {
      if (data.id) {
        const { error } = await supabase.from("sub_categories").update(data).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sub_categories").insert(data as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sub_categories"] });
      setEditingSub(null);
      setIsNewSub(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSub = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sub_categories"] });
      toast({ title: "Deleted" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-white/50 text-sm mt-1">Manage product categories and subcategories</p>
        </div>
        <Button onClick={() => { setEditingCat(emptyCategory()); setIsNewCat(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      {isNewCat && editingCat && (
        <CategoryForm
          initial={editingCat}
          isNew
          onSave={(d) => saveCat.mutate({ ...d, sort_order: categories.length + 1 })}
          onCancel={() => { setEditingCat(null); setIsNewCat(false); }}
        />
      )}

      {isLoading ? (
        <div className="text-white/50">Loading...</div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const subs = allSubs.filter((s) => s.category_id === cat.id);
            const isExpanded = expandedCat === cat.id;
            const isEditing = editingCat?.id === cat.id && !isNewCat;

            return (
              <div key={cat.id} className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden">
                {isEditing ? (
                  <CategoryForm
                    initial={editingCat!}
                    isNew={false}
                    onSave={(d) => saveCat.mutate(d)}
                    onCancel={() => setEditingCat(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-4 p-4">
                      <GripVertical className="w-4 h-4 text-white/30 cursor-grab" />
                      {cat.image && (
                        <img src={cat.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{cat.name_he}</h3>
                          <span className="text-white/40 text-xs">/ {cat.name_ar}</span>
                        </div>
                        <p className="text-white/40 text-xs">{cat.slug} · #{cat.sort_order}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {subs.length > 0 && (
                          <span className="text-xs text-white/40 mr-2">{subs.length} subs</span>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setExpandedCat(isExpanded ? null : cat.id)} className="text-white/60 hover:text-white">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCat(cat); setIsNewCat(false); }} className="text-white/60 hover:text-white">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteCat.mutate(cat.id); }} className="text-red-400/60 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-white/10 p-4 space-y-3 bg-white/[0.02]">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-white/70">Subcategories</h4>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingSub({ ...emptySub(), category_id: cat.id }); setIsNewSub(true); }} className="text-blue-400 text-xs">
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        </div>

                        {isNewSub && editingSub?.category_id === cat.id && (
                          <SubCategoryForm
                            initial={editingSub}
                            isNew
                            onSave={(d) => saveSub.mutate({ ...d, category_id: cat.id, sort_order: subs.length + 1 })}
                            onCancel={() => { setEditingSub(null); setIsNewSub(false); }}
                          />
                        )}

                        {subs.length === 0 && !isNewSub && (
                          <p className="text-white/30 text-xs">No subcategories yet</p>
                        )}

                        {subs.map((sub) => (
                          editingSub?.id === sub.id && !isNewSub ? (
                            <SubCategoryForm
                              key={sub.id}
                              initial={editingSub}
                              isNew={false}
                              onSave={(d) => saveSub.mutate(d)}
                              onCancel={() => setEditingSub(null)}
                            />
                          ) : (
                            <div key={sub.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/5">
                              <GripVertical className="w-3 h-3 text-white/20" />
                              <span className="text-sm text-white flex-1">{sub.name_he} <span className="text-white/40">/ {sub.name_ar}</span></span>
                              <span className="text-xs text-white/30">{sub.slug}</span>
                              <Button variant="ghost" size="icon" onClick={() => { setEditingSub(sub); setIsNewSub(false); }} className="text-white/60 hover:text-white w-7 h-7">
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteSub.mutate(sub.id); }} className="text-red-400/60 hover:text-red-400 w-7 h-7">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </>
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
