import { useState, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronRight, Upload, X, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, useSubCategories, type DbCategory, type DbSubCategory } from "@/hooks/useDbData";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ── Sortable category row wrapper ── */
const SortableCatRow = ({ id, children }: { id: string; children: (handleProps: any) => React.ReactNode }) => {
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

const db = supabase as any;

// ─── ImageUpload ──────────────────────────────────────────────────────────────

const ImageUpload = ({
  value, onChange, label, small = false,
}: {
  value: string; onChange: (url: string) => void; label: string; small?: boolean;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `categories/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
      />

      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt=""
            className={`w-full object-cover rounded-lg border border-gray-200 ${small ? "h-24" : "h-36"}`}
          />
          <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-1.5 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1.5 bg-white rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-gray-400 hover:text-blue-500 ${small ? "h-24" : "h-36"}`}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ImageIcon className="w-5 h-5" />
          )}
          <span className="text-xs">{uploading ? "Uploading..." : "Click to upload"}</span>
        </button>
      )}
    </div>
  );
};

// ─── CategoryForm ─────────────────────────────────────────────────────────────

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

      {/* Translatable fields */}
      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Translatable ({locale.toUpperCase()})</p>
        <Input placeholder="Category name" value={trans.name} onChange={(e) => setTrans({ ...trans, name: e.target.value })} />
        <Textarea placeholder="Description" value={trans.description} onChange={(e) => setTrans({ ...trans, description: e.target.value })} rows={2} />
      </div>

      {/* Slug + Sort */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Slug</label>
          <Input placeholder="e.g. pergolas" value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Sort Order</label>
          <Input type="number" value={form.sort_order || 0} onChange={(e) => set("sort_order", +e.target.value)} />
        </div>
      </div>

      {/* Images */}
      <div className="grid grid-cols-2 gap-4">
        <ImageUpload label="Category Image" value={form.image || ""} onChange={(url) => set("image", url)} />
        <ImageUpload label="Hero Image" value={form.hero_image || ""} onChange={(url) => set("hero_image", url)} />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form, trans)} className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
      </div>
    </div>
  );
};

// ─── SubCategoryForm ──────────────────────────────────────────────────────────

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
        <Input
          placeholder={`Name (${locale.toUpperCase()})`}
          value={trans.name}
          onChange={(e) => setTrans({ name: e.target.value })}
          className="text-sm"
        />
      </div>
      <Input
        placeholder="Slug"
        value={form.slug || ""}
        onChange={(e) => setForm({ ...form, slug: e.target.value })}
        className="text-sm"
      />
      <ImageUpload
        label="Subcategory Image"
        value={form.image || ""}
        onChange={(url) => setForm({ ...form, image: url })}
        small
      />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">Cancel</Button>
        <Button size="sm" onClick={() => onSave(form, trans)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">Save</Button>
      </div>
    </div>
  );
};

// ─── AdminCategories ──────────────────────────────────────────────────────────

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
  const [orderedCatIds, setOrderedCatIds] = useState<string[] | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const allCats: any[] = orderedCatIds
    ? orderedCatIds.map(id => (categories as any[]).find((c: any) => c.id === id)).filter(Boolean)
    : (categories as any[]);

  const saveCatOrder = useMutation({
    mutationFn: async (ids: string[]) => {
      for (let i = 0; i < ids.length; i++) {
        await db.from("categories").update({ sort_order: i }).eq("id", ids[i]);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Order saved" });
    },
    onError: (e: any) => toast({ title: "Failed to save order", description: e.message, variant: "destructive" }),
  });

  const handleCatDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = orderedCatIds ?? allCats.map((c: any) => c.id);
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    const newIds = arrayMove(ids, oldIdx, newIdx);
    setOrderedCatIds(newIds);
    saveCatOrder.mutate(newIds);
  };

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCatDragEnd}>
          <SortableContext items={allCats.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {allCats.map((cat: any) => {
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
              <SortableCatRow key={cat.id} id={cat.id}>
                {(dragHandleProps) => (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <button {...dragHandleProps} className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 p-1">
                    <GripVertical className="w-4 h-4" />
                  </button>
                  {cat.image ? (
                    <img src={cat.image} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-semibold">{displayName}</h3>
                    <p className="text-gray-400 text-xs">{cat.slug}</p>
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
                        initialBase={{ slug: "", sort_order: subs.length + 1, category_id: cat.id, image: "" }}
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
                          {(sub as any).image ? (
                            <img src={(sub as any).image} alt="" className="w-8 h-8 rounded object-cover border border-gray-100" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="w-3.5 h-3.5 text-gray-300" />
                            </div>
                          )}
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
                )}
              </SortableCatRow>
            );
          })}
        </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default AdminCategories;
