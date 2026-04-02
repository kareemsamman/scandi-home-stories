import { usePergolaConfigurator } from "@/stores/usePergolaConfigurator";
import { useLocale } from "@/i18n/useLocale";
import { Package } from "lucide-react";

interface PartInfo {
  key: string;
  name_he: string;
  name_ar: string;
  description_he: string;
  description_ar: string;
  icon: string;
  showFor: ("fixed" | "pvc")[];
}

const PARTS: PartInfo[] = [
  { key: "rafter", name_he: "פרופיל רפטר", name_ar: "بروفيل رافتر", description_he: "קורת גג ראשית לתמיכה מבנית", description_ar: "عارضة سقف رئيسية للدعم الهيكلي", icon: "━", showFor: ["fixed", "pvc"] },
  { key: "gutter", name_he: "פרופיל מרזב", name_ar: "بروفيل مزراب", description_he: "מערכת ניקוז מים מובנית", description_ar: "نظام تصريف مياه مدمج", icon: "⌒", showFor: ["fixed", "pvc"] },
  { key: "carrier_post", name_he: "פרופיל עמוד נשא", name_ar: "بروفيل عمود حامل", description_he: "עמודי תמיכה אנכיים", description_ar: "أعمدة دعم عمودية", icon: "┃", showFor: ["fixed", "pvc"] },
  { key: "fabric_master", name_he: "פרופיל בד ראשי", name_ar: "بروفيل قماش رئيسي", description_he: "מסילה ראשית למערכת הבד", description_ar: "سكة رئيسية لنظام القماش", icon: "▬", showFor: ["fixed", "pvc"] },
  { key: "fabric_carrier", name_he: "פרופיל בד נשא", name_ar: "بروفيل قماش حامل", description_he: "מסילת הובלה לפריסת הבד", description_ar: "سكة توجيه لفرد القماش", icon: "▭", showFor: ["fixed", "pvc"] },
  { key: "motor_box", name_he: "פרופיל תיבת מנוע", name_ar: "بروفيل صندوق المحرك", description_he: "מעטפת למנוע ההפעלה", description_ar: "غلاف لمحرك التشغيل", icon: "⊞", showFor: ["fixed", "pvc"] },
  { key: "roof_sash", name_he: "פרופיל אגף גג", name_ar: "بروفيل جناح السقف", description_he: "מסגרת עליונה לגג", description_ar: "إطار علوي للسقف", icon: "⌐", showFor: ["fixed", "pvc"] },
  { key: "motor_shaft_thick", name_he: "צינור ציר מנוע עבה", name_ar: "أنبوب محور المحرك سميك", description_he: "ציר הנעה ראשי", description_ar: "محور قيادة رئيسي", icon: "◉", showFor: ["fixed", "pvc"] },
  { key: "motor_shaft_thin", name_he: "צינור ציר מנוע דק", name_ar: "أنبوب محور المحرك رفيع", description_he: "ציר הנעה משני", description_ar: "محور قيادة ثانوي", icon: "○", showFor: ["fixed", "pvc"] },
];

export const PergolaPartsSection = () => {
  const { config, specs } = usePergolaConfigurator();
  const { t, locale } = useLocale();

  if (!specs) return null;

  const pergolaType = config.pergolaType || "fixed";
  const visibleParts = pergolaType === "fixed" ? PARTS_FIXED : PARTS_PVC;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-bold text-gray-900">{t("pergolaRequest.partsTitle")}</h3>
      </div>
      <p className="text-sm text-gray-500">{t("pergolaRequest.partsSubtitle")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleParts.map((part) => (
          <div
            key={part.key}
            className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">
                {part.icon}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-gray-800 leading-tight">
                  {locale === "ar" ? part.name_ar : part.name_he}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                  {locale === "ar" ? part.description_ar : part.description_he}
                </p>
                {specs.profiles && specs.profiles[part.key as keyof typeof specs.profiles] && (
                  <p className="text-[10px] text-gray-300 mt-1 font-mono">
                    {specs.profiles[part.key as keyof typeof specs.profiles]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
