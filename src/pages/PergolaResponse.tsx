import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { supabase } from "@/integrations/supabase/client";
import { mmToCm } from "@/types/pergola";
import { Loader2, CheckCircle2, FileText, Phone, ArrowLeft } from "lucide-react";

interface PergolaResponseData {
  id: string;
  customer_name: string;
  width: number;
  length: number;
  height: number | null;
  pergola_type: string;
  mount_type: string;
  installation: boolean;
  lighting: string;
  santaf_roofing: boolean;
  frame_color: string;
  roof_color: string;
  notes: string | null;
  admin_notes: string | null;
  quoted_price: number | null;
  status: string;
  created_at: string;
  admin_response_sent_at: string | null;
  module_classification: string;
  carrier_count: number;
  front_post_count: number;
  back_post_count: number;
}

const PergolaResponse = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { t, locale, localePath } = useLocale();

  const [data, setData] = useState<PergolaResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!requestId || !token) { setError(true); setLoading(false); return; }

    const fetchData = async () => {
      const { data: result, error: err } = await (supabase as any).rpc("get_pergola_response", {
        p_request_id: requestId,
        p_token: token,
      });
      if (err || !result) { setError(true); } else { setData(result); }
      setLoading(false);
    };
    fetchData();
  }, [requestId, token]);

  const typeLabels: Record<string, Record<string, string>> = {
    fixed: { he: "פרגולה קבועה", ar: "برجولة ثابتة" },
    pvc: { he: "פרגולה PVC", ar: "برجولة PVC" },
  };
  const mountLabels: Record<string, Record<string, string>> = {
    wall: { he: "צמוד קיר", ar: "مثبت على الجدار" },
    freestanding: { he: "עצמאי", ar: "مستقل" },
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="text-center py-20 space-y-4">
          <p className="text-muted-foreground text-lg">
            {locale === "ar" ? "الرابط غير صالح أو منتهي الصلاحية" : "הקישור אינו תקף או שפג תוקפו"}
          </p>
          <a href={localePath("/")} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {locale === "ar" ? "العودة للرئيسية" : "חזרה לדף הבית"}
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {locale === "ar" ? `مرحباً ${data.customer_name}` : `שלום ${data.customer_name}`}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar" ? "إليك تفاصيل عرض الأسعار لطلب البرجولة الخاص بك" : "להלן פרטי הצעת המחיר לבקשת הפרגולה שלך"}
          </p>
        </div>

        {/* Price card */}
        {data.quoted_price != null && (
          <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-gray-900 p-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground font-medium">
              {locale === "ar" ? "السعر المعروض" : "מחיר מוצע"}
            </p>
            <p className="text-4xl font-bold text-foreground">
              ₪{data.quoted_price.toLocaleString()}
            </p>
          </div>
        )}

        {/* Admin notes */}
        {data.admin_notes && (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-foreground">
                {locale === "ar" ? "ملاحظات من الفريق" : "הערות מהצוות"}
              </h3>
            </div>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{data.admin_notes}</p>
          </div>
        )}

        {/* Request summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            {locale === "ar" ? "تفاصيل الطلب" : "פרטי הבקשה"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <InfoRow label={locale === "ar" ? "نوع البرجولة" : "סוג פרגולה"} value={typeLabels[data.pergola_type]?.[locale] || data.pergola_type} />
            <InfoRow label={locale === "ar" ? "نوع التركيب" : "סוג התקנה"} value={mountLabels[data.mount_type]?.[locale] || data.mount_type} />
            <InfoRow label={locale === "ar" ? "العرض" : "רוחב"} value={`${mmToCm(data.width)} cm`} />
            <InfoRow label={locale === "ar" ? "الطول" : "עומק"} value={`${mmToCm(data.length)} cm`} />
            {data.height && <InfoRow label={locale === "ar" ? "الارتفاع" : "גובה"} value={`${mmToCm(data.height)} cm`} />}
            <InfoRow label={locale === "ar" ? "تركيب احترافي" : "התקנה מקצועית"} value={data.installation ? (locale === "ar" ? "نعم" : "כן") : (locale === "ar" ? "لا" : "לא")} />
            <InfoRow label={locale === "ar" ? "عدد الحوامل" : "נשאים"} value={String(data.carrier_count)} />
            <InfoRow label={locale === "ar" ? "أعمدة أمامية" : "עמודים קדמיים"} value={String(data.front_post_count)} />
            {data.back_post_count > 0 && <InfoRow label={locale === "ar" ? "أعمدة خلفية" : "עמודים אחוריים"} value={String(data.back_post_count)} />}
            <InfoRow label={locale === "ar" ? "لون الإطار" : "צבע מסגרת"} value={data.frame_color} color={data.frame_color} />
            <InfoRow label={locale === "ar" ? "لون السقف" : "צבע גג"} value={data.roof_color} color={data.roof_color} />
          </div>
        </div>

        {/* Contact CTA */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {locale === "ar" ? "لأي استفسار أو للمتابعة، تواصل معنا" : "לכל שאלה או להמשך, צרו קשר"}
          </p>
          <a
            href={localePath("/contact")}
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <Phone className="w-5 h-5" />
            {locale === "ar" ? "تواصل معنا" : "צור קשר"}
          </a>
        </div>
      </div>
    </Layout>
  );
};

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-2">
        {color && <span className="w-4 h-4 rounded border border-gray-200 shrink-0" style={{ backgroundColor: color }} />}
        {!color && value}
      </p>
    </div>
  );
}

export default PergolaResponse;
