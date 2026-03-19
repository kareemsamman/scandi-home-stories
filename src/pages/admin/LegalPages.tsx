import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLanguage } from "@/contexts/AdminLanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, FileText } from "lucide-react";

const db = supabase as any;

const PAGES = [
  { key: "legal_returns",  labelHe: "מדיניות החזרות",  labelAr: "سياسة الإرجاع" },
  { key: "legal_shipping", labelHe: "מדיניות משלוחים", labelAr: "سياسة الشحن" },
  { key: "legal_privacy",  labelHe: "מדיניות פרטיות",  labelAr: "سياسة الخصوصية" },
  { key: "legal_terms",    labelHe: "תנאי שימוש",       labelAr: "شروط الاستخدام" },
];

const DEFAULT_CONTENT: Record<string, { he: { title: string; content: string }; ar: { title: string; content: string } }> = {
  legal_returns: {
    he: {
      title: "מדיניות החזרות",
      content: `ניתן להחזיר מוצרים תוך 14 ימים מיום קבלת ההזמנה, בתנאי שהמוצר נמצא במצבו המקורי, ללא שימוש, ובאריזתו המקורית.

**תנאי ההחזרה**
• המוצר חייב להיות במצב חדש ולא פגום
• יש לשמור על האריזה המקורית
• נדרש קבלה או אישור רכישה
• מוצרים שהותקנו אינם ניתנים להחזרה`,
    },
    ar: {
      title: "سياسة الإرجاع",
      content: `يمكن إرجاع المنتجات خلال 14 يومًا من تاريخ استلام الطلب، بشرط أن يكون المنتج في حالته الأصلية.

**شروط الإرجاع**
• يجب أن يكون المنتج في حالة جديدة وغير تالف
• يجب الحفاظ على العبوة الأصلية
• مطلوب إيصال أو تأكيد الشراء
• المنتجات المركبة غير قابلة للإرجاع`,
    },
  },
  legal_shipping: {
    he: {
      title: "מדיניות משלוחים",
      content: `**אזורי משלוח**
אנו מספקים משלוחים לכל רחבי ישראל.

**זמני אספקה**
• מוצרים מהמלאי: 5-10 ימי עסקים
• מוצרים בהזמנה מיוחדת: 3-6 שבועות`,
    },
    ar: {
      title: "سياسة الشحن",
      content: `**مناطق الشحن**
نقدم خدمات الشحن في جميع أنحاء إسرائيل.

**أوقات التسليم**
• المنتجات من المخزون: 5-10 أيام عمل
• المنتجات بطلب خاص: 3-6 أسابيع`,
    },
  },
  legal_privacy: {
    he: {
      title: "מדיניות פרטיות",
      content: `AMG פרגולה מחויבת להגן על פרטיותכם. מדיניות זו מסבירה כיצד אנו אוספים ומשתמשים במידע שלכם.

**המידע שאנו אוספים**
• פרטים אישיים: שם, אימייל, טלפון, כתובת
• פרטי רכישה והיסטוריית הזמנות`,
    },
    ar: {
      title: "سياسة الخصوصية",
      content: `تلتزم AMG Pergola بحماية خصوصيتكم. توضح هذه السياسة كيفية جمعنا لمعلوماتكم واستخدامها.

**المعلومات التي نجمعها**
• البيانات الشخصية: الاسم، البريد الإلكتروني، الهاتف، العنوان
• تفاصيل الشراء وسجل الطلبات`,
    },
  },
  legal_terms: {
    he: {
      title: "תנאי שימוש",
      content: `השימוש באתר AMG פרגולה מהווה הסכמה לתנאי שימוש אלו.

**שימוש באתר**
• האתר מיועד לשימוש אישי ולא מסחרי
• אסור להעתיק תוכן ללא אישור מפורש`,
    },
    ar: {
      title: "شروط الاستخدام",
      content: `يُعدّ استخدام موقع AMG Pergola موافقةً على شروط الاستخدام هذه.

**استخدام الموقع**
• الموقع مخصص للاستخدام الشخصي وليس التجاري
• يُحظر نسخ المحتوى دون إذن صريح`,
    },
  },
};

function usePageContent(sectionKey: string, locale: string) {
  return useQuery({
    queryKey: ["home_content", sectionKey, locale],
    queryFn: async () => {
      const { data } = await db
        .from("home_content")
        .select("data")
        .eq("section", sectionKey)
        .eq("locale", locale)
        .maybeSingle();
      return (data?.data as { title?: string; content?: string }) || null;
    },
  });
}

interface PageEditorProps {
  page: { key: string; labelHe: string; labelAr: string };
}

const PageEditor = ({ page }: PageEditorProps) => {
  const { locale } = useAdminLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dbData } = usePageContent(page.key, locale);
  const defaults = DEFAULT_CONTENT[page.key]?.[locale as "he" | "ar"] || DEFAULT_CONTENT[page.key]?.["he"];

  const [title, setTitle] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);

  const displayTitle   = title   ?? dbData?.title   ?? defaults?.title   ?? "";
  const displayContent = content ?? dbData?.content ?? defaults?.content ?? "";

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { title: displayTitle, content: displayContent };
      const { error } = await db
        .from("home_content")
        .upsert({ section: page.key, locale, data: payload }, { onConflict: "section,locale" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home_content", page.key, locale] });
      setTitle(null);
      setContent(null);
      toast({ title: "נשמר בהצלחה" });
    },
    onError: () => toast({ title: "שגיאה בשמירה", variant: "destructive" }),
  });

  const isDirty = title !== null || content !== null;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {locale === "ar" ? "العنوان" : "כותרת"}
        </label>
        <Input
          value={displayTitle}
          onChange={(e) => setTitle(e.target.value)}
          dir={locale === "ar" ? "rtl" : "rtl"}
          className="h-10"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {locale === "ar" ? "المحتوى" : "תוכן"}
        </label>
        <p className="text-[11px] text-muted-foreground">
          {locale === "ar"
            ? "استخدم **نص** للعناوين الفرعية و• للنقاط"
            : "השתמש ב-**טקסט** לכותרות משנה ו-• לנקודות"}
        </p>
        <Textarea
          value={displayContent}
          onChange={(e) => setContent(e.target.value)}
          dir="rtl"
          rows={20}
          className="font-mono text-xs resize-y"
        />
      </div>
      <Button
        onClick={() => saveMutation.mutate()}
        disabled={!isDirty || saveMutation.isPending}
        className="gap-2"
      >
        <Save className="w-4 h-4" />
        {locale === "ar" ? "حفظ" : "שמור"}
      </Button>
    </div>
  );
};

const AdminLegalPages = () => {
  const { locale } = useAdminLanguage();
  const [activePage, setActivePage] = useState(PAGES[0].key);

  const currentPage = PAGES.find((p) => p.key === activePage)!;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {locale === "ar" ? "صفحات قانونية" : "דפי מדיניות"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {locale === "ar"
            ? "قم بتحرير محتوى الصفحات القانونية بالعبرية والعربية"
            : "ערוך את תוכן דפי המדיניות בעברית ובערבית"}
        </p>
      </div>

      {/* Page tabs */}
      <div className="flex gap-2 flex-wrap">
        {PAGES.map((p) => (
          <button
            key={p.key}
            onClick={() => setActivePage(p.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePage === p.key
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {locale === "ar" ? p.labelAr : p.labelHe}
          </button>
        ))}
      </div>

      {/* Editor card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-5 pb-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {locale === "ar" ? currentPage.labelAr : currentPage.labelHe}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "ar" ? "تحرير بالعربية (AR)" : "עריכה בעברית (HE)"}
            {" · "}
            {locale === "ar" ? "قم بالتبديل إلى HE لتحرير بالعبرية" : "עבור ל-AR לעריכה בערבית"}
          </p>
        </div>
        <PageEditor key={`${activePage}-${locale}`} page={currentPage} />
      </div>
    </div>
  );
};

export default AdminLegalPages;
