import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Image, Type, HelpCircle, ArrowLeftRight, Layers, Play,
  ChevronDown, ChevronUp, Plus, Trash2, X, Save, Loader2,
  GripVertical, Eye, EyeOff, Users, FileText, Star,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const db = supabase as any;

// ─── Types ────────────────────────────────────────────────────────────────────

export type SectionItem = { id: string; type: string; visible: boolean };

export const DEFAULT_ABOUT_SECTIONS_ORDER: SectionItem[] = [
  { id: "about_hero",    type: "about_hero",    visible: true },
  { id: "about_mission", type: "about_mission", visible: true },
  { id: "about_story",   type: "about_story",   visible: true },
  { id: "about_values",  type: "about_values",  visible: true },
  { id: "about_cta",     type: "about_cta",     visible: true },
];

const SECTION_META: Record<string, { label: string; icon: React.ElementType }> = {
  about_hero:     { label: "Hero Banner",          icon: Image },
  about_mission:  { label: "Mission & Stats",      icon: Star },
  about_story:    { label: "Our Story",            icon: FileText },
  about_values:   { label: "Values",               icon: Users },
  about_cta:      { label: "Call To Action",       icon: ArrowLeftRight },
  // shared home sections
  featured_slider:  { label: "Featured Products Slider", icon: Layers },
  feature_overlay:  { label: "Feature Overlay",          icon: Image },
  brand_intro:      { label: "Brand Intro",              icon: Type },
  lifestyle_media:  { label: "Lifestyle Media",          icon: Play },
  before_after:     { label: "Before / After",           icon: ArrowLeftRight },
  faq:              { label: "FAQ",                      icon: HelpCircle },
};

const ADDABLE_SECTIONS = [
  { type: "about_mission",  label: "Mission & Stats",      icon: Star },
  { type: "about_story",    label: "Our Story",            icon: FileText },
  { type: "about_values",   label: "Values",               icon: Users },
  { type: "about_cta",      label: "Call To Action",       icon: ArrowLeftRight },
  { type: "featured_slider", label: "Featured Products",   icon: Layers },
  { type: "feature_overlay", label: "Feature Overlay",     icon: Image },
  { type: "brand_intro",    label: "Brand Intro",          icon: Type },
  { type: "lifestyle_media", label: "Lifestyle Media",     icon: Play },
  { type: "before_after",   label: "Before / After",       icon: ArrowLeftRight },
  { type: "faq",            label: "FAQ",                  icon: HelpCircle },
];

const NON_REMOVABLE = new Set(["about_hero"]);

// ─── SortableSectionCard ──────────────────────────────────────────────────────

const SortableSectionCard = ({
  id, icon: Icon, title, visible, onToggleVisible, onRemove, canRemove, children,
}: {
  id: string; icon: React.ElementType; title: string;
  visible: boolean; onToggleVisible: () => void;
  onRemove: () => void; canRemove: boolean;
  children?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-white rounded-xl border overflow-hidden transition-shadow ${
        isDragging ? "shadow-xl border-blue-300 z-50" : "border-gray-200 shadow-sm"
      } ${!visible ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <button {...attributes} {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1 rounded touch-none shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <button type="button" onClick={() => children && setOpen(v => !v)}
          className={`flex items-center gap-3 flex-1 text-start min-w-0 ${children ? "" : "cursor-default"}`}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-gray-800 truncate">{title}</span>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={onToggleVisible} title={visible ? "Hide" : "Show"}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          {canRemove && (
            <button type="button" onClick={onRemove} title="Remove"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {children && (
            <button type="button" onClick={() => setOpen(v => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            >
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {open && children && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    {children}
  </div>
);

interface ImageUploadProps { value: string; onChange: (url: string) => void; label: string; }
const ImageUpload = ({ value, onChange, label }: ImageUploadProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `about/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {value ? (
        <div className="relative">
          <img src={value} alt="" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
          <button type="button" onClick={() => onChange("")} className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">
            <X className="w-3 h-3" />
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="mt-2 w-full text-xs py-1.5 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-50">
            {uploading ? "Uploading..." : "Change Image"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:bg-gray-50 text-gray-500 disabled:opacity-50">
            <Image className="w-5 h-5" />
            <span className="text-xs">{uploading ? "Uploading..." : "Upload Image"}</span>
          </button>
          <Input placeholder="Or paste URL..." value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)}
            onBlur={() => { if (pasteUrl.trim()) { onChange(pasteUrl.trim()); setPasteUrl(""); } }}
            className="text-xs h-8"
          />
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = ""; }}
      />
    </div>
  );
};

interface RepeaterProps {
  label: string; value: any[]; onChange: (v: any[]) => void;
  renderItem: (item: any, idx: number, update: (key: string, val: any) => void) => React.ReactNode;
  defaultItem: () => any;
}
const Repeater = ({ label, value, onChange, renderItem, defaultItem }: RepeaterProps) => {
  const items = Array.isArray(value) ? value : [];
  const update = (idx: number, key: string, val: any) => onChange(items.map((item, i) => i === idx ? { ...item, [key]: val } : item));
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, defaultItem()]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <button type="button" onClick={add} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-primary text-white hover:bg-primary/90">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">#{idx + 1}</span>
            <button type="button" onClick={() => remove(idx)} className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {renderItem(item, idx, (key, val) => update(idx, key, val))}
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No items yet.</p>}
    </div>
  );
};

// ─── Section editor content renderers ────────────────────────────────────────

const renderAboutEditor = (s: SectionItem, data: any, patch: (p: any) => void, onChange: (v: any) => void, locale: string) => {
  switch (s.type) {
    case "about_hero":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ImageUpload label="Image — Desktop" value={data.image || ""} onChange={(url) => patch({ image: url })} />
            <ImageUpload label="Image — Mobile" value={data.image_mobile || ""} onChange={(url) => patch({ image_mobile: url })} />
          </div>
          <Field label="Subtitle (small tag above title)"><Input value={data.subtitle || ""} onChange={e => patch({ subtitle: e.target.value })} placeholder="e.g. About Us" /></Field>
          <Field label="Title"><Input value={data.title || ""} onChange={e => patch({ title: e.target.value })} placeholder="Main heading" /></Field>
          <Field label="Description"><Textarea value={data.description || ""} onChange={e => patch({ description: e.target.value })} placeholder="Hero description text" className="text-sm" rows={3} /></Field>
        </div>
      );

    case "about_mission":
      return (
        <div className="space-y-4">
          <Field label="Mission Statement"><Textarea value={data.title || ""} onChange={e => patch({ title: e.target.value })} placeholder="Our mission statement..." className="text-sm" rows={3} /></Field>
          <div className="grid grid-cols-3 gap-3">
            {[
              { valueKey: "stat1_value", labelKey: "stat1_label", placeholder: "15+" },
              { valueKey: "stat2_value", labelKey: "stat2_label", placeholder: "2,000+" },
              { valueKey: "stat3_value", labelKey: "stat3_label", placeholder: "98%" },
            ].map((s, i) => (
              <div key={i} className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Field label="Value"><Input value={data[s.valueKey] || ""} onChange={e => patch({ [s.valueKey]: e.target.value })} placeholder={s.placeholder} className="text-center font-bold" /></Field>
                <Field label="Label"><Input value={data[s.labelKey] || ""} onChange={e => patch({ [s.labelKey]: e.target.value })} placeholder="Label..." className="text-xs" /></Field>
              </div>
            ))}
          </div>
        </div>
      );

    case "about_story":
      return (
        <div className="space-y-4">
          <Field label="Section Tag"><Input value={data.tag || ""} onChange={e => patch({ tag: e.target.value })} placeholder="e.g. Our Story" /></Field>
          <Field label="Title"><Input value={data.title || ""} onChange={e => patch({ title: e.target.value })} placeholder="Story section heading" /></Field>
          <Field label="Paragraph 1"><Textarea value={data.text1 || ""} onChange={e => patch({ text1: e.target.value })} placeholder="First paragraph..." className="text-sm" rows={3} /></Field>
          <Field label="Paragraph 2"><Textarea value={data.text2 || ""} onChange={e => patch({ text2: e.target.value })} placeholder="Second paragraph (optional)..." className="text-sm" rows={3} /></Field>
          <ImageUpload label="Side Image" value={data.image || ""} onChange={(url) => patch({ image: url })} />
        </div>
      );

    case "about_values":
      return (
        <div className="space-y-4">
          <Field label="Section Title"><Input value={data.title || ""} onChange={e => patch({ title: e.target.value })} placeholder="Our Values" /></Field>
          <Repeater label="Values" value={data.items || []} onChange={(items) => patch({ items })}
            defaultItem={() => ({ title: "", description: "" })}
            renderItem={(item, _idx, update) => (
              <div className="space-y-2">
                <Field label="Title"><Input value={item.title || ""} onChange={e => update("title", e.target.value)} placeholder="Value name" /></Field>
                <Field label="Description"><Textarea value={item.description || ""} onChange={e => update("description", e.target.value)} placeholder="Value description" className="text-sm" rows={2} /></Field>
              </div>
            )}
          />
        </div>
      );

    case "about_cta":
      return (
        <div className="space-y-4">
          <ImageUpload label="Background Image" value={data.image || ""} onChange={(url) => patch({ image: url })} />
          <Field label="Title"><Input value={data.title || ""} onChange={e => patch({ title: e.target.value })} placeholder="CTA heading" /></Field>
          <Field label="Subtitle"><Input value={data.text || ""} onChange={e => patch({ text: e.target.value })} placeholder="CTA subtitle" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button Text"><Input value={data.button || ""} onChange={e => patch({ button: e.target.value })} placeholder="Contact Us" /></Field>
            <Field label="Button Link"><Input value={data.link || ""} onChange={e => patch({ link: e.target.value })} placeholder="/contact" /></Field>
          </div>
        </div>
      );

    case "featured_slider":
      return (
        <div className="space-y-3">
          <Field label="Title"><Input value={data.title || ""} onChange={e => patch({ title: e.target.value })} placeholder="Featured Products" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button Text"><Input value={data.button_text || ""} onChange={e => patch({ button_text: e.target.value })} placeholder="View All" /></Field>
            <Field label="Button Link"><Input value={data.button_link || ""} onChange={e => patch({ button_link: e.target.value })} placeholder="/shop" /></Field>
          </div>
        </div>
      );

    case "feature_overlay":
      return (
        <div className="space-y-4">
          <ImageUpload label="Background Image" value={data.bg_image || ""} onChange={(url) => patch({ bg_image: url })} />
          <Field label="Title"><Input value={data.title || ""} onChange={e => patch({ title: e.target.value })} /></Field>
          <Field label="Description"><Input value={data.description || ""} onChange={e => patch({ description: e.target.value })} /></Field>
          <Repeater label="Feature Items" value={data.items || []} onChange={(items) => patch({ items })}
            defaultItem={() => ({ icon: "shield", title: "", description: "" })}
            renderItem={(item, _idx, update) => (
              <div className="space-y-2">
                <Field label="Title"><Input value={item.title || ""} onChange={e => update("title", e.target.value)} /></Field>
                <Field label="Description"><Input value={item.description || ""} onChange={e => update("description", e.target.value)} /></Field>
              </div>
            )}
          />
        </div>
      );

    case "brand_intro":
      return (
        <div className="space-y-4">
          <Field label="Title"><Input value={data.title || ""} onChange={e => patch({ title: e.target.value })} /></Field>
          <Field label="Description"><Textarea value={data.description || ""} onChange={e => patch({ description: e.target.value })} className="text-sm" rows={3} /></Field>
        </div>
      );

    case "lifestyle_media":
      return (
        <div className="space-y-4">
          <ImageUpload label="Image / Video Thumbnail" value={data.image || ""} onChange={(url) => patch({ image: url })} />
          <Field label="Title"><Input value={data.title || ""} onChange={e => patch({ title: e.target.value })} /></Field>
          <Field label="Description"><Textarea value={data.description || ""} onChange={e => patch({ description: e.target.value })} className="text-sm" rows={2} /></Field>
        </div>
      );

    case "before_after":
      return (
        <div className="space-y-4">
          <Field label="Title"><Input value={data.title || ""} onChange={e => patch({ title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <ImageUpload label="Before Image" value={data.before_image || ""} onChange={(url) => patch({ before_image: url })} />
            <ImageUpload label="After Image" value={data.after_image || ""} onChange={(url) => patch({ after_image: url })} />
          </div>
        </div>
      );

    case "faq":
      return (
        <div className="space-y-4">
          <Field label="Title"><Input value={data.title || ""} onChange={e => patch({ title: e.target.value })} /></Field>
          <Repeater label="Questions" value={data.items || []} onChange={(items) => patch({ items })}
            defaultItem={() => ({ question: "", answer: "" })}
            renderItem={(item, _idx, update) => (
              <div className="space-y-2">
                <Field label="Question"><Input value={item.question || ""} onChange={e => update("question", e.target.value)} /></Field>
                <Field label="Answer"><Textarea value={item.answer || ""} onChange={e => update("answer", e.target.value)} className="text-sm" rows={2} /></Field>
              </div>
            )}
          />
        </div>
      );

    default:
      return <p className="text-xs text-gray-400 italic py-2">No editor available for this section type.</p>;
  }
};

// ─── Default section data seeds ───────────────────────────────────────────────

const getDefaultSectionData = (type: string, locale: string): any => {
  const isAr = locale === "ar";
  switch (type) {
    case "about_hero":    return { subtitle: isAr ? "معلومات عنا" : "אודותינו", title: isAr ? "AMG Pergola" : "AMG Pergola", description: "", image: "" };
    case "about_mission": return { title: isAr ? "مهمتنا" : "המשימה שלנו", stat1_value: "15+", stat1_label: isAr ? "سنة خبرة" : "שנות ניסיון", stat2_value: "2,000+", stat2_label: isAr ? "مشروع" : "פרויקטים", stat3_value: "98%", stat3_label: isAr ? "رضا العملاء" : "שביעות רצון" };
    case "about_story":   return { tag: isAr ? "قصتنا" : "הסיפור שלנו", title: isAr ? "من نحن" : "מי אנחנו", text1: "", text2: "", image: "" };
    case "about_values":  return { title: isAr ? "قيمنا" : "הערכים שלנו", items: [{ title: "", description: "" }] };
    case "about_cta":     return { title: isAr ? "مستعدون للبدء؟" : "מוכנים להתחיל?", text: "", button: isAr ? "تواصل معنا" : "דברו איתנו", link: "/contact", image: "" };
    case "featured_slider": return { title: "", button_text: "", button_link: "/shop", mode: "products", product_ids: [], category_id: "" };
    case "feature_overlay": return { bg_image: "", title: "", description: "", items: [] };
    case "brand_intro":   return { title: "", description: "" };
    case "lifestyle_media": return { image: "", title: "", description: "", cta: "", cta_link: "" };
    case "before_after":  return { title: "", before_image: "", after_image: "" };
    case "faq":           return { title: isAr ? "الأسئلة الشائعة" : "שאלות נפוצות", items: [] };
    default:              return {};
  }
};

// ─── AdminAboutPage ───────────────────────────────────────────────────────────

const AdminAboutPage = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hasInitialized = useRef(false);
  const prevLocale = useRef(locale);
  const [showAddSection, setShowAddSection] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);

  const [sectionsOrder, setSectionsOrder] = useState<SectionItem[]>(DEFAULT_ABOUT_SECTIONS_ORDER);
  const [sectionsData, setSectionsData] = useState<Record<string, any>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) setShowAddSection(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: allContent, isLoading } = useQuery({
    queryKey: ["about_content_all", locale],
    queryFn: async () => {
      const [{ data: localeRows }, { data: globalRow }] = await Promise.all([
        db.from("home_content").select("section, data").eq("locale", locale),
        db.from("home_content").select("data").eq("locale", "global").eq("section", "about_sections_config").maybeSingle(),
      ]);
      const map: Record<string, any> = {};
      (localeRows || []).forEach((row: any) => { map[row.section] = row.data; });
      if (globalRow?.data) map["about_sections_config"] = globalRow.data;
      return map;
    },
  });

  // Reset guard when locale changes
  useEffect(() => {
    if (prevLocale.current !== locale) {
      hasInitialized.current = false;
      prevLocale.current = locale;
    }
  }, [locale]);

  useEffect(() => {
    if (!allContent || hasInitialized.current) return;
    hasInitialized.current = true;
    const rawOrder = allContent["about_sections_config"] ?? DEFAULT_ABOUT_SECTIONS_ORDER;
    const order: SectionItem[] = rawOrder.map((s: any) => ({
      id: s.id, type: s.type || s.id, visible: s.visible ?? true,
    }));
    setSectionsOrder(order);
    const newData: Record<string, any> = {};
    order.forEach((s: SectionItem) => {
      newData[s.id] = allContent[s.id] ?? getDefaultSectionData(s.type, locale);
    });
    setSectionsData(newData);
  }, [allContent, locale]);

  const updateSection = (id: string, data: any) => setSectionsData(prev => ({ ...prev, [id]: data }));
  const toggleVisible = (id: string) => setSectionsOrder(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  const removeSection = (id: string) => {
    setSectionsOrder(prev => prev.filter(s => s.id !== id));
    setSectionsData(prev => { const next = { ...prev }; delete next[id]; return next; });
  };
  const addSection = (type: string) => {
    const id = `${type}_${Date.now()}`;
    setSectionsOrder(prev => [...prev, { id, type, visible: true }]);
    setSectionsData(prev => ({ ...prev, [id]: getDefaultSectionData(type, locale) }));
    setShowAddSection(false);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sectionsOrder.findIndex(s => s.id === active.id);
    const newIdx = sectionsOrder.findIndex(s => s.id === over.id);
    setSectionsOrder(arrayMove(sectionsOrder, oldIdx, newIdx));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const [sectionId, data] of Object.entries(sectionsData)) {
        if (!data) continue;
        const { error } = await db.from("home_content").upsert(
          { locale, section: sectionId, data },
          { onConflict: "locale,section" }
        );
        if (error) throw error;
      }
      const { error: orderErr } = await db.from("home_content").upsert(
        { locale: "global", section: "about_sections_config", data: sectionsOrder },
        { onConflict: "locale,section" }
      );
      if (orderErr) throw orderErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about_content_all", locale] });
      queryClient.invalidateQueries({ queryKey: ["home_content"] });
      queryClient.invalidateQueries({ queryKey: ["about_sections_config"] });
      toast({ title: "Saved", description: "About page updated." });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading || !initialized) {
    return <div className="flex items-center justify-center h-64 text-gray-400 gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">About Page</h1>
          <p className="text-sm text-gray-500 mt-1">Drag sections to reorder · toggle eye to show/hide · click to edit content</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
          {saveMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save</>}
        </Button>
      </div>

      {/* Sections list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionsOrder.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {sectionsOrder.map((s) => {
              const meta = SECTION_META[s.type] || { label: s.type, icon: FileText };
              const data = sectionsData[s.id] || {};
              const onChange = (newData: any) => updateSection(s.id, newData);
              const patch = (partial: any) => onChange({ ...data, ...partial });
              const canRemove = !NON_REMOVABLE.has(s.type);

              return (
                <SortableSectionCard
                  key={s.id}
                  id={s.id}
                  icon={meta.icon}
                  title={meta.label}
                  visible={s.visible}
                  onToggleVisible={() => toggleVisible(s.id)}
                  onRemove={() => removeSection(s.id)}
                  canRemove={canRemove}
                >
                  {renderAboutEditor(s, data, patch, onChange, locale)}
                </SortableSectionCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Section */}
      <div ref={addRef} className="relative">
        <button
          type="button"
          onClick={() => setShowAddSection(v => !v)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Section
        </button>

        {showAddSection && (
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-xl p-4 z-50">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Choose a section</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ADDABLE_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.type}
                    type="button"
                    onClick={() => addSection(sec.type)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors text-start"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 leading-tight">{sec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAboutPage;
