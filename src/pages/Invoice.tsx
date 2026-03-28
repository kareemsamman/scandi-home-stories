import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Printer, Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { DbOrderItem } from "@/hooks/useDbData";
import logoWhite from "@/assets/logo-white.png";
import { SEOHead } from '@/components/SEOHead';

const calcShipping = (order: any): number => {
  const itemsTotal = (order.order_items || []).reduce(
    (s: number, i: DbOrderItem) => s + i.price * i.quantity, 0
  );
  return Math.max(0, Number(order.total) - itemsTotal + Number(order.discount_amount || 0));
};

const InvoicePage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [productNames, setProductNames] = useState<Map<string, { he: string; ar: string }>>(new Map());

  useEffect(() => {
    if (!orderId) return;
    const fetchInvoice = async () => {
      // Try RPC first (works for authenticated users with RLS)
      let orderData: any = null;
      const { data } = await (supabase as any).rpc("get_invoice_order", { order_id: orderId });
      if (data) {
        orderData = data;
      } else {
        // Fallback: direct query (for public invoice links)
        const { data: fallback } = await (supabase as any)
          .from("orders")
          .select("*, order_items(*)")
          .eq("id", orderId)
          .single();
        orderData = fallback;
      }
      if (orderData) {
        setOrder(orderData);
        // Fetch translated product names
        const productIds = (orderData.order_items || [])
          .map((i: any) => i.product_id).filter(Boolean);
        if (productIds.length > 0) {
          const [{ data: products }, { data: trans }] = await Promise.all([
            supabase.from("products").select("id, name").in("id", productIds),
            (supabase as any).from("product_translations").select("product_id, name, locale").in("product_id", productIds),
          ]);
          const nameMap = new Map<string, { he: string; ar: string }>();
          (products || []).forEach((p: any) => nameMap.set(p.id, { he: p.name, ar: p.name }));
          (trans || []).forEach((t: any) => {
            const existing = nameMap.get(t.product_id);
            if (existing && t.name) existing[t.locale as "he" | "ar"] = t.name;
          });
          setProductNames(nameMap);
        }
      }
      setLoading(false);
    };
    fetchInvoice();
  }, [orderId]);

  const isAr = order?.locale === "ar";

  const t = isAr ? {
    invoice: "فاتورة", order: "طلب", date: "التاريخ", customer: "العميل",
    shipping: "عنوان الشحن", phone: "هاتف", email: "بريد إلكتروني",
    items: "المنتجات", product: "المنتج", color: "اللون", size: "الحجم",
    qty: "الكمية", unitPrice: "سعر الوحدة", total: "الإجمالي",
    subtotal: "المجموع الفرعي", shippingLabel: "الشحن", free: "مجاني",
    discount: "خصم", grandTotal: "المجموع الكلي", notes: "ملاحظات",
    custom: "مخصص", print: "طباعة", notFound: "الفاتورة غير موجودة",
    loginRequired: "يجب تسجيل الدخول لعرض الفاتورة", loginBtn: "تسجيل الدخول",
  } : {
    invoice: "חשבונית", order: "הזמנה", date: "תאריך", customer: "לקוח",
    shipping: "כתובת למשלוח", phone: "טלפון", email: "אימייל",
    items: "פריטים", product: "מוצר", color: "צבע", size: "אורך",
    qty: "כמות", unitPrice: "מחיר ליחידה", total: "סה\"כ",
    subtotal: "סכום ביניים", shippingLabel: "משלוח", free: "חינם",
    discount: "הנחה", grandTotal: "סה\"כ לתשלום", notes: "הערות",
    custom: "מותאם", print: "הדפסה", notFound: "חשבונית לא נמצאה",
    loginRequired: "יש להתחבר כדי לצפות בחשבונית", loginBtn: "התחברות",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-gray-400">
        <Package className="w-12 h-12" />
        <p className="font-medium">{t.notFound}</p>
      </div>
    );
  }

  const shippingCost = calcShipping(order);
  const itemsTotal = (order.order_items || []).reduce(
    (s: number, i: DbOrderItem) => s + i.price * i.quantity, 0
  );
  const dateLocale = order.locale === "ar" ? "ar-SA" : "he-IL";

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <SEOHead noIndex={true} title="חשבונית | AMG Pergola" description="" />
      {/* Toolbar — hidden on print */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end sticky top-0 z-10">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <Printer className="w-4 h-4" />
          {t.print}
        </button>
      </div>

      {/* Invoice sheet */}
      <div className="max-w-3xl mx-auto my-8 print:my-0 bg-white shadow-xl print:shadow-none rounded-2xl print:rounded-none overflow-hidden">

        {/* Header */}
        <div className="bg-gray-900 text-white px-8 py-7 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">{t.invoice}</p>
            <h1 className="text-2xl font-black">{order.order_number}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {t.date}: {new Date(order.created_at).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <img src={logoWhite} alt="AMG Pergola" className="h-12 object-contain opacity-90" />
        </div>

        <div className="px-8 py-7 space-y-7">
          {/* Customer + Shipping */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t.customer}</p>
              <p className="font-bold text-gray-900">{order.first_name} {order.last_name}</p>
              <p className="text-gray-500 text-sm">{t.phone}: {order.phone}</p>
              <p className="text-gray-500 text-sm">{t.email}: {order.email}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t.shipping}</p>
              <p className="font-bold text-gray-900">{order.city}</p>
              <p className="text-gray-500 text-sm">{order.address}{order.house_number ? ` ${order.house_number}` : ""}{order.apartment ? `, ${order.apartment}` : ""}</p>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
              <span className="font-bold">{t.notes}: </span>{order.notes}
            </div>
          )}

          {/* Items table */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t.items}</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-start px-4 py-2.5 text-xs font-semibold text-gray-500">{t.product}</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">{t.qty}</th>
                    <th className="text-end px-4 py-2.5 text-xs font-semibold text-gray-500">{t.unitPrice}</th>
                    <th className="text-end px-4 py-2.5 text-xs font-semibold text-gray-500">{t.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.order_items || []).map((item: DbOrderItem, idx: number) => {
                    const isCustom = item.color_name && !item.color_hex;
                    return (
                      <tr key={item.id ?? idx} className={idx > 0 ? "border-t border-gray-100" : ""}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{(item.product_id && productNames.get(item.product_id)?.[isAr ? "ar" : "he"]) || item.product_name}</p>
                          {item.color_name && (
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              {item.color_hex && <span className="w-3 h-3 rounded-full border border-gray-200 inline-block" style={{ backgroundColor: item.color_hex }} />}
                              {t.color}: {item.color_name}
                              {isCustom && <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 rounded-full">{t.custom}</span>}
                            </p>
                          )}
                          {item.size && <p className="text-xs text-gray-500">{t.size}: {item.size}</p>}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">×{item.quantity}</td>
                        <td className="px-4 py-3 text-end text-gray-500">₪{Number(item.price).toLocaleString()}</td>
                        <td className="px-4 py-3 text-end font-bold text-gray-900">₪{(Number(item.price) * item.quantity).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.subtotal}</span>
                <span className="font-medium">₪{itemsTotal.toLocaleString()}</span>
              </div>
              {order.discount_code && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">{t.discount} ({order.discount_code})</span>
                  <span className="font-semibold text-green-700">-₪{Number(order.discount_amount || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t.shippingLabel}</span>
                {shippingCost === 0
                  ? <span className="text-green-600 font-medium">{t.free}</span>
                  : <span className="font-medium">₪{shippingCost.toLocaleString()}</span>}
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span>{t.grandTotal}</span>
                <span>₪{Number(order.total).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-8 py-5 text-center text-xs text-gray-400">
          <p className="font-semibold text-gray-600 mb-1">{isAr ? "شكراً لطلبك" : "תודה על הזמנתך"}</p>
          <p>AMG Pergola · amgpergola.com</p>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:my-0 { margin: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default InvoicePage;
