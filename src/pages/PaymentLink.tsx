import { useState, useRef, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2, Building2, Upload, X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBankSettings } from "@/hooks/useAppSettings";
import logoWhite from "@/assets/logo-white.png";

const db = supabase as any;

interface OrderData {
  id: string;
  order_number: string;
  first_name: string;
  last_name: string;
  phone: string;
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
      const { data, error } = await db
        .from("orders")
        .select("id, order_number, first_name, last_name, phone, total, payment_status, payment_token, order_items(*)")
        .eq("id", orderId)
        .maybeSingle();
      if (error || !data) { setInvalid(true); setLoading(false); return; }
      if (data.payment_token !== token) { setInvalid(true); setLoading(false); return; }
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
      const paths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i].file);
        const ext = compressed.type === "image/jpeg" ? "jpg" : (files[i].file.name.split(".").pop() || "jpg");
        const path = `receipts/${order.order_number}_pay_${Date.now()}_${i + 1}.${ext}`;
        const { error } = await supabase.storage.from("receipts").upload(path, compressed, { upsert: false });
        if (error) throw new Error(`שגיאה בהעלאת קובץ: ${error.message}`);
        paths.push(`receipts:${path}`);
      }

      // Use edge function to update order (bypasses RLS for anonymous users)
      const { data, error: fnErr } = await supabase.functions.invoke("submit-payment", {
        body: { orderId: order.id, token, receiptPaths: paths },
      });
      if (fnErr || data?.error) throw new Error(data?.error || fnErr?.message || "שגיאה בשמירת הנתונים");

      setDone(true);
    } catch (e: any) {
      console.error(e);
      setUploadError(e?.message || "אירעה שגיאה, נסה שוב");
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
      <p className="text-2xl font-bold text-gray-900 mb-2">קישור לא תקין</p>
      <p className="text-gray-400 text-sm">הקישור פג תוקף או שגוי. פנה לבית העסק לקבלת קישור חדש.</p>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: "rgb(242,242,242)" }}>
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-2">תודה! הקבלה התקבלה</p>
      <p className="text-gray-400 text-sm">הזמנה #{order?.order_number}</p>
    </div>
  );

  if (alreadyPaid) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: "rgb(242,242,242)" }}>
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-amber-500" />
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-2">אישור התשלום כבר הועלה</p>
      <p className="text-gray-500 text-sm mb-1">הזמנה #{order?.order_number}</p>
      <p className="text-gray-400 text-xs">אם יש בעיה, פנה לבית העסק.</p>
    </div>
  );

  const bankFields = bankSettings ? [
    { label: "בנק", value: bankSettings.bank_name },
    { label: "שם חשבון", value: bankSettings.account_name },
    { label: "מספר חשבון", value: bankSettings.account_number },
    { label: "סניף", value: bankSettings.branch_number },
    { label: "קוד בנק", value: bankSettings.bank_code },
  ] : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "rgb(242,242,242)" }}>
      <header className="sticky top-0 z-30 bg-gray-900" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="max-w-lg mx-auto flex items-center px-6" style={{ height: 64 }}>
          <img src={logoWhite} alt="AMG Pergola" className="h-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8 space-y-6">
        {/* Order summary */}
        <div className="bg-white rounded-xl border border-border p-5 space-y-3">
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">פרטי הזמנה</p>
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
            <span>סה"כ לתשלום</span>
            <span>₪{Number(order!.total).toLocaleString()}</span>
          </div>
        </div>

        {/* Bank details */}
        {bankSettings && (
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">העבר לחשבון הבנק</p>
                <p className="text-xs text-gray-400">יש לציין מספר הזמנה בהעברה</p>
              </div>
            </div>
            <div className="space-y-2">
              {bankFields.filter(f => f.value).map(f => (
                <div key={f.label} className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-gray-400">{f.label}</span>
                  <span className="font-semibold text-gray-900">{f.value}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-1">
                <span className="text-gray-400">מספר הזמנה</span>
                <span className="font-bold text-gray-900">#{order!.order_number}</span>
              </div>
            </div>
          </div>
        )}

        {/* Receipt upload */}
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <p className="text-sm font-bold text-gray-900">העלה אישור העברה</p>
          <p className="text-xs text-gray-400">לאחר ביצוע ההעברה, העלה צילום מסך או קובץ PDF של האישור</p>

          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">לחץ להעלאת קובץ או גרור לכאן</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF · עד 10MB</p>
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                  {f.preview ? <img src={f.preview} className="w-10 h-10 rounded object-cover" alt="" /> : <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">PDF</div>}
                  <span className="flex-1 text-xs text-gray-600 truncate">{f.file.name}</span>
                  <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadError && (
            <p className="text-sm text-red-600 text-center font-medium">{uploadError}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={files.length === 0 || uploading}
            className="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold bg-gray-900 text-white rounded-[1.875rem] hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "✅ שלח אישור תשלום"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default PaymentLink;
