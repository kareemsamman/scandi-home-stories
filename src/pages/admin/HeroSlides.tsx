import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, GripVertical, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type DbHeroSlide } from "@/hooks/useDbData";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

const SlideForm = ({
  initialBase, initialTrans, onSave, onCancel, isNew, locale,
}: {
  initialBase: any; initialTrans: { title: string; subtitle: string; cta: string };
  onSave: (base: any, trans: any) => void; onCancel: () => void; isNew: boolean; locale: string;
}) => {
  const [form, setForm] = useState(initialBase);
  const [trans, setTrans] = useState(initialTrans);
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{isNew ? "New Slide" : "Edit Slide"}</h3>
        <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium">
          Editing: {locale === "he" ? "Hebrew" : "Arabic"}
        </span>
      </div>
      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Translatable ({locale.toUpperCase()})</p>
        <Textarea placeholder="Title" value={trans.title} onChange={(e) => setTrans({ ...trans, title: e.target.value })} rows={2} />
        <Input placeholder="Subtitle" value={trans.subtitle} onChange={(e) => setTrans({ ...trans, subtitle: e.target.value })} />
        <Input placeholder="CTA text" value={trans.cta} onChange={(e) => setTrans({ ...trans, cta: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input placeholder="Image URL" value={form.image || ""} onChange={(e) => set("image", e.target.value)} className="col-span-2" />
        <Input placeholder="Link (e.g. /shop)" value={form.link || ""} onChange={(e) => set("link", e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-gray-600 text-sm">
        <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => set("is_active", e.target.checked)} /> Active
      </label>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form, trans)} className="bg-blue-600 hover:bg-blue-700 text-white">Save</Button>
      </div>
    </div>
  );
};

const AdminHeroSlides = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["hero_slides_admin"],
    queryFn: async () => {
      const { data } = await supabase.from("hero_slides").select("*").order("sort_order");
      return (data || []) as DbHeroSlide[];
    },
  });

  const { data: transMap = new Map() } = useQuery({
    queryKey: ["admin_hero_trans", locale],
    queryFn: async () => {
      const { data } = await db.from("hero_slide_translations").select("*").eq("locale", locale);
      return new Map((data || []).map((t: any) => [t.hero_slide_id, t]));
    },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["hero_slides_admin"] });
    qc.invalidateQueries({ queryKey: ["hero_slides"] });
    qc.invalidateQueries({ queryKey: ["admin_hero_trans"] });
  };

  const save = useMutation({
    mutationFn: async ({ base, trans }: { base: any; trans: any }) => {
      let slideId = base.id;
      const { id, created_at, title_he, title_ar, subtitle_he, subtitle_ar, cta_he, cta_ar, ...baseData } = base;
      if (slideId) {
        await supabase.from("hero_slides").update(baseData).eq("id", slideId);
      } else {
        const { data } = await supabase.from("hero_slides").insert({ ...baseData, title_he: trans.title, title_ar: trans.title }).select("id").single();
        slideId = data!.id;
      }
      await db.from("hero_slide_translations").upsert({ hero_slide_id: slideId, locale, ...trans }, { onConflict: "hero_slide_id,locale" });
    },
    onSuccess: () => { invalidate(); setEditingId(null); setIsNew(false); toast({ title: "Saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("hero_slides").delete().eq("id", id); },
    onSuccess: () => { invalidate(); toast({ title: "Deleted" }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Slides</h1>
          <p className="text-gray-500 text-sm mt-1">Manage homepage hero slider</p>
        </div>
        <Button onClick={() => { setEditingId("new"); setIsNew(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Slide
        </Button>
      </div>

      {isNew && editingId === "new" && (
        <SlideForm
          initialBase={{ image: "", link: "/shop", sort_order: slides.length + 1, is_active: true }}
          initialTrans={{ title: "", subtitle: "", cta: "" }} isNew locale={locale}
          onSave={(b, t) => save.mutate({ base: b, trans: t })}
          onCancel={() => { setEditingId(null); setIsNew(false); }}
        />
      )}

      {isLoading ? <p className="text-gray-400">Loading...</p> : (
        <div className="space-y-3">
          {slides.map((slide) => {
            const sTrans = transMap.get(slide.id);
            const displayTitle = sTrans?.title || (locale === "ar" ? slide.title_ar : slide.title_he);

            if (editingId === slide.id && !isNew) {
              return (
                <SlideForm
                  key={slide.id}
                  initialBase={slide}
                  initialTrans={{ title: sTrans?.title || "", subtitle: sTrans?.subtitle || "", cta: sTrans?.cta || "" }}
                  isNew={false} locale={locale}
                  onSave={(b, t) => save.mutate({ base: b, trans: t })}
                  onCancel={() => setEditingId(null)}
                />
              );
            }

            return (
              <div key={slide.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                <GripVertical className="w-4 h-4 text-gray-300" />
                {slide.image ? (
                  <img src={slide.image} alt="" className="w-20 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-12 rounded-lg bg-gray-100 flex items-center justify-center"><Image className="w-5 h-5 text-gray-300" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-medium text-sm truncate">{displayTitle?.split("\n")[0] || "Untitled"}</h3>
                  <p className="text-gray-400 text-xs">{sTrans?.subtitle || ""}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!slide.is_active && <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700">Inactive</span>}
                  <Button variant="ghost" size="icon" onClick={() => { setEditingId(slide.id); setIsNew(false); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) del.mutate(slide.id); }} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminHeroSlides;
