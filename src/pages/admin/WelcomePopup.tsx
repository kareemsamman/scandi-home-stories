import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Plus, Trash2, Upload } from "lucide-react";

const db = supabase as any;

interface PopupCard {
  title_he: string;
  title_ar: string;
  button_he: string;
  button_ar: string;
  image: string;
  link: string;
}

interface PopupSettings {
  enabled: boolean;
  title_he: string;
  title_ar: string;
  subtitle_he: string;
  subtitle_ar: string;
  cards: PopupCard[];
  delay_seconds: number;
  show_once: boolean;
}

const DEFAULT: PopupSettings = {
  enabled: true,
  title_he: "ברוכים הבאים ל-AMG Pergola",
  title_ar: "مرحباً بكم في AMG Pergola",
  subtitle_he: "מה תרצו לראות?",
  subtitle_ar: "ماذا تريد أن ترى؟",
  cards: [
    { title_he: "קניית פרגולות", title_ar: "شراء عرائش", button_he: "צפו בקולקציה", button_ar: "تصفح المجموعة", image: "", link: "/shop" },
    { title_he: "קניית פרופילים", title_ar: "شراء بروفيلات", button_he: "לפרופילים", button_ar: "تصفح البروفيلات", image: "", link: "/shop" },
    { title_he: "קניית סנטף", title_ar: "شراء سنطاف", button_he: "לסנטף", button_ar: "تصفح السنطاف", image: "", link: "/shop" },
  ],
  delay_seconds: 2,
  show_once: true,
};

const AdminWelcomePopup = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: dbSettings } = useQuery<PopupSettings>({
    queryKey: ["app_settings", "welcome_popup"],
    queryFn: async () => {
      const { data } = await db.from("app_settings").select("value").eq("key", "welcome_popup").single();
      return (data?.value as PopupSettings) ?? DEFAULT;
    },
  });

  const [settings, setSettings] = useState<PopupSettings>(DEFAULT);
  useEffect(() => { if (dbSettings) setSettings(dbSettings); }, [dbSettings]);

  const saveMutation = useMutation({
    mutationFn: async (value: PopupSettings) => {
      const { error } = await db.from("app_settings").upsert({ key: "welcome_popup", value, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app_settings", "welcome_popup"] });
      toast({ title: "تم الحفظ بنجاح" });
    },
    onError: () => toast({ title: "فشل الحفظ", variant: "destructive" }),
  });

  const updateCard = (index: number, field: keyof PopupCard, value: string) => {
    setSettings(prev => {
      const cards = [...prev.cards];
      cards[index] = { ...cards[index], [field]: value };
      return { ...prev, cards };
    });
  };

  const addCard = () => {
    if (settings.cards.length >= 4) return;
    setSettings(prev => ({
      ...prev,
      cards: [...prev.cards, { title_he: "", title_ar: "", button_he: "לפרטים", button_ar: "للتفاصيل", image: "", link: "/shop" }],
    }));
  };

  const removeCard = (index: number) => {
    setSettings(prev => ({ ...prev, cards: prev.cards.filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">نافذة الترحيب</h1>
          <p className="text-gray-400 text-xs mt-0.5">إدارة النافذة المنبثقة التي تظهر عند دخول الموقع</p>
        </div>
        <button
          onClick={() => saveMutation.mutate(settings)}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ
        </button>
      </div>

      {/* Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">تفعيل النافذة</p>
            <p className="text-xs text-gray-400 mt-0.5">عرض نافذة الترحيب عند دخول الموقع</p>
          </div>
          <button
            onClick={() => setSettings(p => ({ ...p, enabled: !p.enabled }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${settings.enabled ? "bg-gray-900" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings.enabled ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">تأخير الظهور (ثوانٍ)</label>
            <input type="number" min={0} max={30} value={settings.delay_seconds}
              onChange={e => setSettings(p => ({ ...p, delay_seconds: Number(e.target.value) }))}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={settings.show_once}
                onChange={e => setSettings(p => ({ ...p, show_once: e.target.checked }))}
                className="w-4 h-4 rounded accent-gray-900" />
              عرض مرة واحدة فقط لكل زيارة
            </label>
          </div>
        </div>
      </div>

      {/* Title / Subtitle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">العنوان والنص الفرعي</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="عنوان (عبري)">
            <input value={settings.title_he} onChange={e => setSettings(p => ({ ...p, title_he: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" dir="rtl" />
          </Field>
          <Field label="عنوان (عربي)">
            <input value={settings.title_ar} onChange={e => setSettings(p => ({ ...p, title_ar: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" dir="rtl" />
          </Field>
          <Field label="نص فرعي (عبري)">
            <input value={settings.subtitle_he} onChange={e => setSettings(p => ({ ...p, subtitle_he: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" dir="rtl" />
          </Field>
          <Field label="نص فرعي (عربي)">
            <input value={settings.subtitle_ar} onChange={e => setSettings(p => ({ ...p, subtitle_ar: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" dir="rtl" />
          </Field>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">البطاقات ({settings.cards.length})</h3>
          {settings.cards.length < 4 && (
            <button onClick={addCard} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">
              <Plus className="w-3.5 h-3.5" /> إضافة بطاقة
            </button>
          )}
        </div>

        {settings.cards.map((card, i) => (
          <CardEditor
            key={i}
            card={card}
            index={i}
            total={settings.cards.length}
            onUpdate={updateCard}
            onRemove={removeCard}
          />
        ))}
      </div>
    </div>
  );
};

/* ── Card Editor with image upload ── */

function CardEditor({
  card, index, total, onUpdate, onRemove,
}: {
  card: PopupCard;
  index: number;
  total: number;
  onUpdate: (i: number, field: keyof PopupCard, value: string) => void;
  onRemove: (i: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `popup/card-${index}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("site-media").getPublicUrl(path);
      onUpdate(index, "image", urlData.publicUrl);
      toast({ title: "تم رفع الصورة" });
    } catch {
      toast({ title: "فشل رفع الصورة", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">بطاقة {index + 1}</span>
        {total > 1 && (
          <button onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="عنوان (عبري)">
          <input value={card.title_he} onChange={e => onUpdate(index, "title_he", e.target.value)}
            className="w-full h-8 px-3 rounded-lg border border-gray-200 text-xs" dir="rtl" />
        </Field>
        <Field label="عنوان (عربي)">
          <input value={card.title_ar} onChange={e => onUpdate(index, "title_ar", e.target.value)}
            className="w-full h-8 px-3 rounded-lg border border-gray-200 text-xs" dir="rtl" />
        </Field>
        <Field label="نص الزر (عبري)">
          <input value={card.button_he} onChange={e => onUpdate(index, "button_he", e.target.value)}
            className="w-full h-8 px-3 rounded-lg border border-gray-200 text-xs" dir="rtl" />
        </Field>
        <Field label="نص الزر (عربي)">
          <input value={card.button_ar} onChange={e => onUpdate(index, "button_ar", e.target.value)}
            className="w-full h-8 px-3 rounded-lg border border-gray-200 text-xs" dir="rtl" />
        </Field>
      </div>

      <Field label="رابط الصفحة (مثال: /shop أو /shop?collection=fixed)">
        <input value={card.link} onChange={e => onUpdate(index, "link", e.target.value)}
          className="w-full h-8 px-3 rounded-lg border border-gray-200 text-xs font-mono" dir="ltr" />
      </Field>

      <Field label="صورة البطاقة">
        <div className="flex gap-2 items-center">
          <input value={card.image} onChange={e => onUpdate(index, "image", e.target.value)}
            className="flex-1 h-8 px-3 rounded-lg border border-gray-200 text-xs font-mono" dir="ltr"
            placeholder="https://... أو ارفع صورة" />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            رفع
          </button>
          {card.image && (
            <img src={card.image} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0" />
          )}
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-gray-400 block mb-1">{label}</label>
      {children}
    </div>
  );
}

export default AdminWelcomePopup;
