import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, GripVertical, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type DbHeroSlide } from "@/hooks/useDbData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const emptySlide = (): Partial<DbHeroSlide> => ({
  title_he: "", title_ar: "", subtitle_he: "", subtitle_ar: "",
  cta_he: "", cta_ar: "", image: "", link: "/shop", sort_order: 0, is_active: true,
});

const SlideForm = ({
  initial, onSave, onCancel, isNew,
}: {
  initial: Partial<DbHeroSlide>; onSave: (d: Partial<DbHeroSlide>) => void;
  onCancel: () => void; isNew: boolean;
}) => {
  const [form, setForm] = useState(initial);
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white">{isNew ? "New Slide" : "Edit Slide"}</h3>
      <div className="grid grid-cols-2 gap-4">
        <Textarea placeholder="Title (Hebrew)" value={form.title_he || ""} onChange={(e) => set("title_he", e.target.value)} className="bg-white/5 border-white/10 text-white" rows={2} />
        <Textarea placeholder="Title (Arabic)" value={form.title_ar || ""} onChange={(e) => set("title_ar", e.target.value)} className="bg-white/5 border-white/10 text-white" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input placeholder="Subtitle (Hebrew)" value={form.subtitle_he || ""} onChange={(e) => set("subtitle_he", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        <Input placeholder="Subtitle (Arabic)" value={form.subtitle_ar || ""} onChange={(e) => set("subtitle_ar", e.target.value)} className="bg-white/5 border-white/10 text-white" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input placeholder="CTA text (Hebrew)" value={form.cta_he || ""} onChange={(e) => set("cta_he", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        <Input placeholder="CTA text (Arabic)" value={form.cta_ar || ""} onChange={(e) => set("cta_ar", e.target.value)} className="bg-white/5 border-white/10 text-white" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input placeholder="Image URL" value={form.image || ""} onChange={(e) => set("image", e.target.value)} className="bg-white/5 border-white/10 text-white col-span-2" />
        <Input placeholder="Link (e.g. /shop)" value={form.link || ""} onChange={(e) => set("link", e.target.value)} className="bg-white/5 border-white/10 text-white" />
      </div>
      <label className="flex items-center gap-2 text-white/70 text-sm">
        <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => set("is_active", e.target.checked)} />
        Active
      </label>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel} className="text-white/60">Cancel</Button>
        <Button onClick={() => onSave(form)} className="bg-blue-600 hover:bg-blue-700">Save</Button>
      </div>
    </div>
  );
};

const AdminHeroSlides = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["hero_slides_admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hero_slides").select("*").order("sort_order");
      if (error) throw error;
      return data as DbHeroSlide[];
    },
  });
  const [editing, setEditing] = useState<Partial<DbHeroSlide> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const save = useMutation({
    mutationFn: async (data: Partial<DbHeroSlide>) => {
      if (data.id) {
        const { error } = await supabase.from("hero_slides").update(data).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hero_slides").insert(data as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hero_slides_admin"] });
      qc.invalidateQueries({ queryKey: ["hero_slides"] });
      setEditing(null);
      setIsNew(false);
      toast({ title: "Saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hero_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hero_slides_admin"] });
      qc.invalidateQueries({ queryKey: ["hero_slides"] });
      toast({ title: "Deleted" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hero Slides</h1>
          <p className="text-white/50 text-sm mt-1">Manage homepage hero slider</p>
        </div>
        <Button onClick={() => { setEditing(emptySlide()); setIsNew(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Slide
        </Button>
      </div>

      {isNew && editing && (
        <SlideForm initial={editing} isNew onSave={(d) => save.mutate({ ...d, sort_order: slides.length + 1 })} onCancel={() => { setEditing(null); setIsNew(false); }} />
      )}

      {isLoading ? <div className="text-white/50">Loading...</div> : (
        <div className="space-y-3">
          {slides.map((slide) => (
            editing?.id === slide.id && !isNew ? (
              <SlideForm key={slide.id} initial={editing} isNew={false} onSave={(d) => save.mutate(d)} onCancel={() => setEditing(null)} />
            ) : (
              <div key={slide.id} className="flex items-center gap-4 p-4 bg-[#1a1a2e] border border-white/10 rounded-xl">
                <GripVertical className="w-4 h-4 text-white/30" />
                {slide.image ? (
                  <img src={slide.image} alt="" className="w-20 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-12 rounded-lg bg-white/5 flex items-center justify-center"><Image className="w-5 h-5 text-white/20" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm truncate">{slide.title_he.split("\n")[0]}</h3>
                  <p className="text-white/40 text-xs">{slide.subtitle_he}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!slide.is_active && <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400">Inactive</span>}
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(slide); setIsNew(false); }} className="text-white/60 hover:text-white">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) del.mutate(slide.id); }} className="text-red-400/60 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminHeroSlides;
