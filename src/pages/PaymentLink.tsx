import { useState, useRef, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, Building2, Upload, X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBankSettings } from "@/hooks/useAppSettings";
import { useLocale } from "@/i18n/useLocale";
import { SEOHead } from "@/components/SEOHead";
import logoWhite from "@/assets/logo-white.png";
import { TranzilaPayment } from "@/components/TranzilaPayment";

const db = supabase as any;

interface OrderData {
  id: string;
  order_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  total: number;
  payment_status: string;
  payment_token: string | null;
  order_items: { product_name: string; quantity: number; price: number }[];
}

const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/") || file.size < 300 * 1024) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX) { h = (h * MAX) / w; w = MAX; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file), "image/jpeg", 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
};

const PaymentLink = () => {
  const { locale } = useLocale();
  const ar = locale === "ar";
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { data: bankSettings } = useBankSettings();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [alreadyPaid, setAlreadyPaid] = useState(false);

  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!orderId || !token) { setInvalid(true); setLoading(false); return; }
    (async () => {
      const { data, error } = await db.rpc("get_order_by_token", {
        p_order_id: orderId,
        p_token: token,
      });
      if (error || !data) { setInvalid(true); setLoading(false); return; }
      if (data.payment_status === "paid") { setAlreadyPaid(true); setOrder(data); setLoading(false); return; }
      setOrder(data);
      setLoading(false);
    })();
  }, [orderId, token]);

  const handleFiles = (fl: FileList | null) => {
    if (!fl) return;
    const added: { file: File; preview: string }[] = [];
    for (let i = 0; i < fl.length; i++) {
      const f = fl[i];
      if (!["image/jpeg", "image/png", "application/pdf"].includes(f.type)) continue;
      if (f.size > 10 * 1024 * 1024) continue;
      added.push({ file: f, preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : "" });
    }
    setFiles(p => [...p, ...added]);
  };

  const handleSubmit = async () => {
    if (!order || files.length === 0) return;
    setUploading(true);
    setUploadError("");
    try {
      // Upload files via server-side edge function
      const formData = new FormData();
      formData.append("orderId", order.id);
      formData.append("token", token || "");
      formData.append("orderNumber", order.order_number);
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i].file);
        formData.append(`file${i}`, compressed, files[i].file.name);
      }
      const uploadRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-receipt`,
        {
          method: "POST",
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: formData,
        }
      );
      const uploadResult = await uploadRes.json();
      if (!uploadRes.ok || !uploadResult.paths) {
        throw new Error(uploadResult?.error || (ar ? "خطأ في رفع الملف" : "שגיאה בהעלאת קובץ"));
      }

      // Use edge function to update order (bypasses RLS for anonymous users)
      const { data, error: fnErr } = await supabase.functions.invoke("submit-payment", {
        body: { orderId: order.id, token, receiptPaths: uploadResult.paths },
      });
      if (fnErr || data?.error) throw new Error(data?.error || fnErr?.message || (ar ? "خطأ في حفظ البيانات" : "שגיאה בשמירת הנתונים"));

      setDone(true);
    } catch (e: any) {
      console.error(e);
      setUploadError(e?.message || (ar ? "حدث خطأ، حاول مرة أخرى" : "אירעה שגיאה, נסה שוב"));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "rgb(242,242,242)" }}>
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );

  if (invalid) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: "rgb(242,242,242)" }}>
      <p className="text-2xl font-bold text-gray-900 mb-2">{ar ? "رابط غير صالح" : "קישור לא תקין"}</p>
      <p className="text-gray-400 text-sm">{ar ? "انتهت صلاحية الرابط أو أنه غير صحيح. تواصل مع المتجر للحصول على رابط جديد." : "הקישור פג תוקף או שגוי. פנה לבית העסק לקבלת קישור חדש."}</p>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: "rgb(242,242,242)" }}>
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-2">{ar ? "شكراً! تم استلام الإيصال" : "תודה! הקבלה התקבלה"}</p>
      <p className="text-gray-400 text-sm">{ar ? "طلب رقم" : "הזמנה"} #{order?.order_number}</p>
    </div>
  );

  if (alreadyPaid) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: "rgb(242,242,242)" }}>
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-amber-500" />
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-2">{ar ? "تم رفع إيصال الدفع بالفعل" : "אישור התשלום כבר הועלה"}</p>
      <p className="text-gray-500 text-sm mb-1">{ar ? "طلب رقم" : "הזמנה"} #{order?.order_number}</p>
      <p className="text-gray-400 text-xs">{ar ? "إذا كانت هناك مشكلة، تواصل مع المتجر." : "אם יש בעיה, פנה לבית העסק."}</p>
    </div>
  );

  const bankFields = bankSettings ? [
    { label: ar ? "البنك" : "בנק", value: bankSettings.bank_name },
    { label: ar ? "اسم الحساب" : "שם חשבון", value: bankSettings.account_name },
    { label: ar ? "رقم الحساب" : "מספר חשבון", value: bankSettings.account_number },
    { label: ar ? "رقم الفرع" : "סניף", value: bankSettings.branch_number },
    { label: ar ? "رمز البنك" : "קוד בנק", value: bankSettings.bank_code },
  ] : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "rgb(242,242,242)" }}>
      <SEOHead noIndex={true} title={ar ? "الدفع | AMG Pergola" : "תשלום הזמנה | AMG Pergola"} description="" />
      <header className="sticky top-0 z-30 bg-gray-900" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="max-w-lg mx-auto flex items-center px-6" style={{ height: 64 }}>
          <img src={logoWhite} alt="AMG Pergola" className="h-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8 space-y-6">
        {/* Order summary */}
        <div className="bg-white rounded-xl border border-border p-5 space-y-3">
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">{ar ? "تفاصيل الطلب" : "פרטי הזמנה"}</p>
          <p className="text-base font-bold text-gray-900">#{order!.order_number}</p>
          <p className="text-sm text-gray-500">{order!.first_name} {order!.last_name}</p>
          <div className="divide-y divide-gray-100">
            {(order!.order_items || []).map((item: any, i: number) => (
              <div key={i} className="flex justify-between py-2 text-sm">
                <span className="text-gray-700">{item.product_name} ×{item.quantity}</span>
                <span className="font-semibold">₪{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100 text-base font-bold">
            <span>{ar ? "الإجمالي المطلوب" : "סה\"כ לתשלום"}</span>
            <span>₪{Number(order!.total).toLocaleString()}</span>
          </div>
        </div>

        {/* Tranzila Payment */}
        <TranzilaPayment
          amount={Number(order!.total)}
          orderNumber={order!.order_number}
          customerEmail={order!.email}
          customerPhone={order!.phone}
          onSuccess={async (result) => {
            try {
              // Update order payment status
              const { error } = await (supabase as any)
                .from("orders")
                .update({ payment_status: "paid", transaction_id: result.transactionId })
                .eq("id", order!.id);
              if (error) throw error;
              // Show success state
              window.location.reload();
            } catch (err) {
              console.error("Payment update failed:", err);
            }
          }}
          onError={(error) => {
            setUploadError(error);
          }}
        />
        {uploadError && (
          <p className="text-sm text-red-600 text-center font-medium">{uploadError}</p>
        )}
      </main>
    </div>
  );
};

export default PaymentLink;
