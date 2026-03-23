import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Image, LayoutGrid, Type, Play, ArrowLeftRight, HelpCircle,
  ChevronDown, ChevronUp, Plus, Trash2, X, Save, Loader2, Layers,
  Check, GripVertical, Eye, EyeOff, Users, FileText, Star,
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

// ─── Section types ────────────────────────────────────────────────────────────

import { DEFAULT_SECTIONS_ORDER, type SectionItem } from "@/data/homeSections";
export { DEFAULT_SECTIONS_ORDER };
export type { SectionItem };

const SECTION_META: Record<string, { label: string; icon: React.ElementType }> = {
  hero_slider:        { label: "Hero Slider",              icon: Image },
  category_scroller:  { label: "Category Scroller",        icon: LayoutGrid },
  featured_slider:    { label: "Featured Product Slider",  icon: Layers },
  feature_overlay:    { label: "Feature Overlay",          icon: Image },
  promo_grid:         { label: "Promo Card Grid",          icon: LayoutGrid },
  brand_intro:        { label: "Brand Intro",              icon: Type },
  lifestyle_media:    { label: "Lifestyle Media",          icon: Play },
  before_after:       { label: "Before / After",           icon: ArrowLeftRight },
  faq:                { label: "FAQ",                      icon: HelpCircle },
};

const ADDABLE_SECTIONS = [
  { type: "featured_slider",  label: "Featured Product Slider", icon: Layers },
  { type: "feature_overlay",  label: "Feature Overlay",         icon: Image },
  { type: "promo_grid",       label: "Promo Card Grid",         icon: LayoutGrid },
  { type: "brand_intro",      label: "Brand Intro",             icon: Type },
  { type: "lifestyle_media",  label: "Lifestyle Media",         icon: Play },
  { type: "before_after",     label: "Before / After",          icon: ArrowLeftRight },
  { type: "faq",              label: "FAQ",                     icon: HelpCircle },
  // About page sections
  { type: "about_mission",    label: "Mission & Stats",         icon: Star },
  { type: "about_story",      label: "Our Story",               icon: FileText },
  { type: "about_values",     label: "Values",                  icon: Users },
  { type: "about_cta",        label: "About CTA",               icon: ArrowLeftRight },
];

const NON_REMOVABLE = new Set(["hero_slider", "category_scroller"]);

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
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1 rounded touch-none shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Icon + title — click to expand */}
        <button
          type="button"
          onClick={() => children && setOpen(v => !v)}
          className={`flex items-center gap-3 flex-1 text-start min-w-0 ${children ? "" : "cursor-default"}`}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-gray-800 truncate">{title}</span>
        </button>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleVisible}
            title={visible ? "Hide section" : "Show section"}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              title="Remove section"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {children && (
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
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

// ─── ImageUpload ──────────────────────────────────────────────────────────────

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
      const path = `home/${Date.now()}.${ext}`;
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

// ─── Repeater ─────────────────────────────────────────────────────────────────

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
      {items.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No items yet. Click Add to create one.</p>}
    </div>
  );
};

// ─── Field helper ─────────────────────────────────────────────────────────────

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    {children}
  </div>
);

// ─── FeaturedSliderContent ────────────────────────────────────────────────────

const FeaturedSliderContent = ({ data, onChange, locale }: { data: any; onChange: (v: any) => void; locale: string }) => {
  const [productSearch, setProductSearch] = useState("");

  const { data: allProducts = [] } = useQuery({
    queryKey: ["admin_all_products_slider"],
    queryFn: async () => {
      const { data: prods } = await db.from("products").select("id, name, images, sku, type, status").order("sort_order");
      const { data: trans } = await db.from("product_translations").select("product_id, name").eq("locale", locale);
      const transMap = new Map((trans || []).map((t: any) => [t.product_id, t.name]));
      return (prods || []).map((p: any) => ({ ...p, displayName: transMap.get(p.id) || p.name }));
    },
  });

  const { data: catData = { cats: [], subs: [] } } = useQuery({
    queryKey: ["home_cats_filter"],
    queryFn: async () => {
      const [{ data: cats }, { data: subs }] = await Promise.all([
        db.from("categories").select("*").order("sort_order"),
        db.from("sub_categories").select("*").order("sort_order"),
      ]);
      return { cats: cats || [], subs: subs || [] };
    },
  });
  const parentCats = catData.cats;
  const subCats = (pid: string) => catData.subs.filter((s: any) => s.category_id === pid);

  const selectedIds: string[] = Array.isArray(data.product_ids) ? data.product_ids : [];
  const toggleProduct = (id: string) => {
    const next = selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id];
    onChange({ ...data, product_ids: next });
  };
  const moveProduct = (id: string, dir: -1 | 1) => {
    const arr = [...selectedIds];
    const idx = arr.indexOf(id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    onChange({ ...data, product_ids: arr });
  };
  const filteredProducts = allProducts.filter((p: any) =>
    !productSearch || (p.displayName || "").toLowerCase().includes(productSearch.toLowerCase()) || (p.sku || "").toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Title">
          <Input value={data.title || ""} onChange={e => onChange({ ...data, title: e.target.value })} placeholder="FEATURED PERGOLAS" />
        </Field>
        <Field label="Button Text">
          <Input value={data.button_text || ""} onChange={e => onChange({ ...data, button_text: e.target.value })} placeholder="View all" />
        </Field>
        <Field label="Button Link">
          <Input value={data.button_link || ""} onChange={e => onChange({ ...data, button_link: e.target.value })} placeholder="/shop" />
        </Field>
      </div>

      <Field label="Source">
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          <button type="button" onClick={() => onChange({ ...data, mode: "products" })}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${data.mode !== "category" ? "bg-foreground text-background" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
            מוצרים ספציפיים
          </button>
          <button type="button" onClick={() => onChange({ ...data, mode: "category" })}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${data.mode === "category" ? "bg-foreground text-background" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
            לפי קטגוריה
          </button>
        </div>
      </Field>

      <Field label="Compact Images (תמונות קטנות יותר)">
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          <button type="button" onClick={() => onChange({ ...data, compact_images: false })}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${!data.compact_images ? "bg-foreground text-background" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
            רגיל
          </button>
          <button type="button" onClick={() => onChange({ ...data, compact_images: true })}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${data.compact_images ? "bg-foreground text-background" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
            קטן
          </button>
        </div>
      </Field>

      {data.mode === "category" && (
        <Field label="Category">
          <select value={data.category_id || ""} onChange={e => onChange({ ...data, category_id: e.target.value })} className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-white">
            <option value="">בחר קטגוריה...</option>
            {parentCats.map((cat: any) => (
              <>
                <option key={cat.id} value={cat.id} className="font-bold">▸ {cat.name_he || cat.name_ar || cat.id}</option>
                {subCats(cat.id).map((sub: any) => (
                  <option key={sub.id} value={sub.id}>&nbsp;&nbsp;{sub.name_he || sub.name_ar || sub.id}</option>
                ))}
              </>
            ))}
          </select>
        </Field>
      )}

      {data.mode !== "category" && (
        <div className="space-y-3">
          <label className="text-xs font-medium text-gray-600">מוצרים נבחרים ({selectedIds.length})</label>
          {selectedIds.length > 0 && (
            <div className="space-y-1.5 p-3 bg-blue-50 rounded-xl border border-blue-100">
              {selectedIds.map((id, idx) => {
                const p = allProducts.find((x: any) => x.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-blue-100">
                    {p.images?.[0] && <img src={p.images[0]} className="w-8 h-8 rounded object-cover shrink-0" />}
                    <span className="text-xs font-medium flex-1 truncate">{p.displayName}</span>
                    <div className="flex gap-0.5 shrink-0">
                      <button type="button" onClick={() => moveProduct(id, -1)} disabled={idx === 0} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs">↑</button>
                      <button type="button" onClick={() => moveProduct(id, 1)} disabled={idx === selectedIds.length - 1} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs">↓</button>
                      <button type="button" onClick={() => toggleProduct(id)} className="w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="space-y-2">
            <Input placeholder="חיפוש מוצרים..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="h-8 text-xs" />
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
              {filteredProducts.map((p: any) => {
                const selected = selectedIds.includes(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-start ${selected ? "bg-blue-50/60" : ""}`}>
                    {p.images?.[0] && <img src={p.images[0]} className="w-8 h-8 rounded object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{p.displayName}</p>
                      {p.sku && <p className="text-[10px] text-gray-400 font-mono">{p.sku}</p>}
                    </div>
                    {selected && <Check className="w-4 h-4 text-blue-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── SEED_CONTENT ─────────────────────────────────────────────────────────────

const SEED_CONTENT: Record<string, Record<string, any>> = {
  he: {
    feature_overlay: {
      bg_image: "", title: "למה AMG?", description: "הנדסה גרמנית, ייצור ישראלי, התקנה מקצועית",
      items: [
        { icon: "shield", title: "אלומיניום פרימיום", description: "חומרים עמידים לכל מזג אוויר" },
        { icon: "droplets", title: "ניקוז מובנה", description: "מערכת ניקוז גשם משולבת" },
        { icon: "zap", title: "שליטה חכמה", description: "מנוע חשמלי או ידני" },
        { icon: "award", title: "אחריות מורחבת", description: "10 שנות אחריות מלאה" },
      ],
    },
    promo_grid: { items: [
      { title: "הדגמים הפופולריים", subtitle: "הנמכרים ביותר שלנו", image: "", link: "/shop" },
      { title: "עמידות מקסימלית", subtitle: "מערכות לכל מזג אוויר", image: "", link: "/shop" },
      { title: "ייעוץ אישי", subtitle: "מצאו את הפרגולה המושלמת", image: "", link: "/shop" },
    ]},
    brand_intro: { title: "חיי חוץ. ללא פשרות.", description: "AMG Pergola מתכננת, מייצרת ומתקינה פרגולות ומערכות הצללה מתקדמות. אנחנו מאמינים שהמרחב החיצוני שלכם ראוי לאותה רמת איכות, עיצוב והנדסה כמו הבית עצמו." },
    lifestyle_media: { image: "", title: "חוויית חיים בחוץ", description: "מרחב שמשלב נוחות, עיצוב ועמידות — להנאה בכל עונה.", cta: "ראו פרויקטים", cta_link: "/shop" },
    before_after: { title: "לפני ואחרי", subtitle: "גררו את הסליידר כדי לראות את ההבדל", before_label: "לפני", after_label: "אחרי", before_image: "", after_image: "" },
    faq: {
      title: "שאלות נפוצות", subtitle: "יש שאלה? אנחנו כאן לעזור.", contact_text: "לא מצאתם תשובה? צרו קשר ונשמח לסייע.",
      items: [
        { question: "כמה זמן לוקחת ההתקנה?", answer: "התקנה סטנדרטית לוקחת בין יום אחד לשלושה ימים, בהתאם לגודל ולמורכבות הפרויקט." },
        { question: "מאילו חומרים הפרגולות עשויות?", answer: "אלומיניום פרימיום בציפוי אלקטרוסטטי, עמיד לקורוזיה, UV ומזג אוויר קיצוני." },
        { question: "האם הפרגולות עמידות בגשם?", answer: "בהחלט. פרגולות הלמלות המוטוריות כוללות מערכת ניקוז מובנית ואטימה מלאה." },
        { question: "מה כוללת האחריות?", answer: "10 שנות אחריות על המבנה ו-5 שנים על המנועים והמערכות החשמליות." },
        { question: "האם אתם מבצעים התקנה בכל הארץ?", answer: "כן, אנו מבצעים התקנות בכל רחבי ישראל עם צוות מקצועי." },
      ],
    },
  },
  ar: {
    feature_overlay: {
      bg_image: "", title: "لماذا AMG؟", description: "هندسة ألمانية، تصنيع إسرائيلي، تركيب احترافي",
      items: [
        { icon: "shield", title: "ألمنيوم فاخر", description: "مواد متينة لجميع الأحوال الجوية" },
        { icon: "droplets", title: "تصريف مدمج", description: "نظام تصريف مياه الأمطار متكامل" },
        { icon: "zap", title: "تحكم ذكي", description: "محرك كهربائي أو يدوي" },
        { icon: "award", title: "ضمان ممتد", description: "10 سنوات ضمان شامل" },
      ],
    },
    promo_grid: { items: [
      { title: "النماذج الأكثر شعبية", subtitle: "الأكثر مبيعاً لدينا", image: "", link: "/shop" },
      { title: "متانة قصوى", subtitle: "أنظمة لجميع الأحوال الجوية", image: "", link: "/shop" },
      { title: "استشارة شخصية", subtitle: "اعثر على البرجولة المثالية", image: "", link: "/shop" },
    ]},
    brand_intro: { title: "حياة في الهواء الطلق. بدون تنازلات.", description: "AMG Pergola تصمم وتصنع وتركب برجولات وأنظمة تظليل متقدمة. نؤمن بأن مساحتكم الخارجية تستحق نفس مستوى الجودة والتصميم." },
    lifestyle_media: { image: "", title: "تجربة الحياة في الهواء الطلق", description: "مساحة تجمع بين الراحة والتصميم والمتانة.", cta: "شاهد المشاريع", cta_link: "/shop" },
    before_after: { title: "قبل وبعد", subtitle: "اسحب المقبض لرؤية الفرق", before_label: "قبل", after_label: "بعد", before_image: "", after_image: "" },
    faq: {
      title: "الأسئلة الشائعة", subtitle: "لديك سؤال؟ نحن هنا للمساعدة.", contact_text: "لم تجد إجابة؟ تواصل معنا.",
      items: [
        { question: "كم يستغرق التركيب؟", answer: "التركيب القياسي يستغرق من يوم إلى ثلاثة أيام، حسب الحجم والتعقيد." },
        { question: "من أي مواد تصنع البرجولات؟", answer: "ألمنيوم فاخر بطلاء إلكتروستاتيكي، مقاوم للتآكل والأشعة فوق البنفسجية." },
        { question: "هل البرجولات مقاومة للمطر؟", answer: "بالتأكيد. تشمل نظام تصريف مدمج وعزل كامل." },
        { question: "ماذا يشمل الضمان؟", answer: "10 سنوات على الهيكل و5 سنوات على المحركات والأنظمة الكهربائية." },
        { question: "هل تقومون بالتركيب في جميع أنحاء البلاد؟", answer: "نعم، في جميع أنحاء إسرائيل مع فريق متخصص." },
      ],
    },
  },
};

const getSeed = (locale: string, section: string) =>
  SEED_CONTENT[locale]?.[section] ?? SEED_CONTENT.he[section];

const getDefaultSectionData = (type: string, locale: string): any => {
  if (type === "featured_slider") return { title: "", button_text: "", button_link: "/shop", mode: "products", product_ids: [], category_id: "" };
  return getSeed(locale, type) ?? {};
};

// ─── AdminHomePage ────────────────────────────────────────────────────────────

const AdminHomePage = () => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [initialized, setInitialized] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);

  const [sectionsOrder, setSectionsOrder] = useState<SectionItem[]>(DEFAULT_SECTIONS_ORDER);
  const [sectionsData, setSectionsData] = useState<Record<string, any>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Close "Add Section" picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) setShowAddSection(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: allContent, isLoading } = useQuery({
    queryKey: ["home_content_all", locale],
    queryFn: async () => {
      const [{ data: localeRows }, { data: globalRow }] = await Promise.all([
        db.from("home_content").select("section, data").eq("locale", locale),
        db.from("home_content").select("data").eq("locale", "global").eq("section", "sections_config").maybeSingle(),
      ]);
      const map: Record<string, any> = {};
      (localeRows || []).forEach((row: any) => { map[row.section] = row.data; });
      if (globalRow?.data) map["sections_config"] = globalRow.data;
      return map;
    },
  });

  useEffect(() => {
    if (!allContent) return;

    // Load sections order (migrate old format without `type`)
    const rawOrder = allContent["sections_config"] ?? DEFAULT_SECTIONS_ORDER;
    const order: SectionItem[] = rawOrder.map((s: any) => ({
      id: s.id,
      type: s.type || s.id,
      visible: s.visible ?? true,
    }));
    setSectionsOrder(order);

    // Populate sectionsData
    const newData: Record<string, any> = {};
    order.forEach((s: SectionItem) => {
      newData[s.id] = allContent[s.id] ?? getDefaultSectionData(s.type, locale);
    });
    setSectionsData(newData);
    setInitialized(true);
  }, [allContent, locale]);

  const updateSection = (id: string, data: any) =>
    setSectionsData(prev => ({ ...prev, [id]: data }));

  const toggleVisible = (id: string) =>
    setSectionsOrder(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));

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
        { locale: "global", section: "sections_config", data: sectionsOrder },
        { onConflict: "locale,section" }
      );
      if (orderErr) throw orderErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home_content_all", locale] });
      queryClient.invalidateQueries({ queryKey: ["home_content"] });
      queryClient.invalidateQueries({ queryKey: ["home_sections_config"] });
      toast({ title: "Saved", description: "Home page content updated successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const renderEditorContent = (s: SectionItem) => {
    const data = sectionsData[s.id] || {};
    const onChange = (newData: any) => updateSection(s.id, newData);
    const patch = (partial: any) => onChange({ ...data, ...partial });

    switch (s.type) {
      case "hero_slider":
      case "category_scroller":
        return (
          <p className="text-sm text-gray-400 italic py-2">
            This section has no editable content here — manage it from its own admin page.
          </p>
        );

      case "featured_slider":
        return <FeaturedSliderContent data={data} onChange={onChange} locale={locale} />;

      case "feature_overlay":
        return (
          <div className="space-y-4">
            <ImageUpload label="Background Image" value={data.bg_image || ""} onChange={(url) => patch({ bg_image: url })} />
            <Field label="Title"><Input value={data.title || ""} onChange={(e) => patch({ title: e.target.value })} placeholder="Section title" /></Field>
            <Field label="Description"><Input value={data.description || ""} onChange={(e) => patch({ description: e.target.value })} placeholder="Section description" /></Field>
            <Repeater label="Feature Items" value={data.items || []} onChange={(items) => patch({ items })}
              defaultItem={() => ({ icon: "shield", title: "", description: "" })}
              renderItem={(item, _idx, update) => (
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">Icon</label>
                    <select value={item.icon || "shield"} onChange={(e) => update("icon", e.target.value)} className="w-full h-9 px-3 rounded-lg border border-input text-sm bg-white">
                      <option value="shield">Shield</option><option value="droplets">Droplets</option>
                      <option value="zap">Zap</option><option value="award">Award</option>
                      <option value="star">Star</option><option value="check">Check</option>
                    </select>
                  </div>
                  <Field label="Title"><Input value={item.title || ""} onChange={(e) => update("title", e.target.value)} placeholder="Feature title" /></Field>
                  <Field label="Description"><Input value={item.description || ""} onChange={(e) => update("description", e.target.value)} placeholder="Feature description" /></Field>
                </div>
              )}
            />
          </div>
        );

      case "promo_grid":
        return (
          <Repeater label="Promo Cards" value={data.items || []} onChange={(items) => onChange({ ...data, items })}
            defaultItem={() => ({ title: "", subtitle: "", image: "", link: "/shop" })}
            renderItem={(item, _idx, update) => (
              <div className="space-y-2">
                <ImageUpload label="Card Image" value={item.image || ""} onChange={(url) => update("image", url)} />
                <Field label="Title"><Input value={item.title || ""} onChange={(e) => update("title", e.target.value)} placeholder="Card title" /></Field>
                <Field label="Subtitle"><Input value={item.subtitle || ""} onChange={(e) => update("subtitle", e.target.value)} placeholder="Card subtitle" /></Field>
                <Field label="Link"><Input value={item.link || ""} onChange={(e) => update("link", e.target.value)} placeholder="/shop" /></Field>
              </div>
            )}
          />
        );

      case "brand_intro":
        return (
          <div className="space-y-4">
            <Field label="Title"><Input value={data.title || ""} onChange={(e) => patch({ title: e.target.value })} placeholder="Brand title" /></Field>
            <Field label="Description"><Textarea value={data.description || ""} onChange={(e) => patch({ description: e.target.value })} placeholder="Brand description" rows={4} /></Field>
          </div>
        );

      case "lifestyle_media":
        return (
          <div className="space-y-4">
            <ImageUpload label="Section Image" value={data.image || ""} onChange={(url) => patch({ image: url })} />
            <Field label="Title"><Input value={data.title || ""} onChange={(e) => patch({ title: e.target.value })} placeholder="Section title" /></Field>
            <Field label="Description"><Textarea value={data.description || ""} onChange={(e) => patch({ description: e.target.value })} placeholder="Section description" rows={3} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CTA Button Text"><Input value={data.cta || ""} onChange={(e) => patch({ cta: e.target.value })} placeholder="Shop Now" /></Field>
              <Field label="CTA Link"><Input value={data.cta_link || ""} onChange={(e) => patch({ cta_link: e.target.value })} placeholder="/shop" /></Field>
            </div>
          </div>
        );

      case "before_after":
        return (
          <div className="space-y-4">
            <Field label="Title"><Input value={data.title || ""} onChange={(e) => patch({ title: e.target.value })} placeholder="Section title" /></Field>
            <Field label="Subtitle"><Input value={data.subtitle || ""} onChange={(e) => patch({ subtitle: e.target.value })} placeholder="Section subtitle" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Before Label"><Input value={data.before_label || ""} onChange={(e) => patch({ before_label: e.target.value })} placeholder="Before" /></Field>
              <Field label="After Label"><Input value={data.after_label || ""} onChange={(e) => patch({ after_label: e.target.value })} placeholder="After" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ImageUpload label="Before Image" value={data.before_image || ""} onChange={(url) => patch({ before_image: url })} />
              <ImageUpload label="After Image" value={data.after_image || ""} onChange={(url) => patch({ after_image: url })} />
            </div>
          </div>
        );

      case "faq":
        return (
          <div className="space-y-4">
            <Field label="Title"><Input value={data.title || ""} onChange={(e) => patch({ title: e.target.value })} placeholder="FAQ title" /></Field>
            <Field label="Subtitle"><Input value={data.subtitle || ""} onChange={(e) => patch({ subtitle: e.target.value })} placeholder="FAQ subtitle" /></Field>
            <Field label="Contact Text"><Input value={data.contact_text || ""} onChange={(e) => patch({ contact_text: e.target.value })} placeholder="Contact text" /></Field>
            <Repeater label="FAQ Items" value={data.items || []} onChange={(items) => patch({ items })}
              defaultItem={() => ({ question: "", answer: "" })}
              renderItem={(item, _idx, update) => (
                <div className="space-y-2">
                  <Field label="Question"><Input value={item.question || ""} onChange={(e) => update("question", e.target.value)} placeholder="Question" /></Field>
                  <Field label="Answer"><Textarea value={item.answer || ""} onChange={(e) => update("answer", e.target.value)} placeholder="Answer" rows={2} /></Field>
                </div>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Page</h1>
          <p className="text-sm text-gray-500 mt-1">Drag sections to reorder · eye to show/hide · + to add more</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide">{locale}</span>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All
          </Button>
        </div>
      </div>

      {/* Section cards — draggable */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionsOrder.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {sectionsOrder.map(s => {
              const meta = SECTION_META[s.type] ?? { label: s.type, icon: Layers };
              const content = renderEditorContent(s);
              return (
                <SortableSectionCard
                  key={s.id}
                  id={s.id}
                  icon={meta.icon}
                  title={meta.label}
                  visible={s.visible}
                  onToggleVisible={() => toggleVisible(s.id)}
                  onRemove={() => removeSection(s.id)}
                  canRemove={!NON_REMOVABLE.has(s.type)}
                >
                  {content}
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
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-primary transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>

        {showAddSection && (
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Choose a section to add</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ADDABLE_SECTIONS.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addSection(type)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors text-start"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHomePage;
