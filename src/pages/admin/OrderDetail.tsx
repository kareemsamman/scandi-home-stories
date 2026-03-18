import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  ArrowRight, Package, MapPin, User, FileText, ImageIcon,
  Phone, Mail, Receipt, AlertTriangle, X, ChevronLeft, ChevronRight,
  MessageSquare, Hash, ExternalLink, Calendar, Tag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrderById, useProducts, type DbOrderItem } from "@/hooks/useDbData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSmsSettings, useSmsMessages, sendSms, formatSms } from "@/hooks/useAppSettings";
import { adjustInventory } from "@/hooks/useOrders";

/* ── Status config ── */
const STATUSES = [
  { value: "waiting_approval", label: "מחכה אישור", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  { value: "in_process",       label: "בתהליך",     color: "bg-blue-100 text-blue-800 border-blue-200",   dot: "bg-blue-500" },
  { value: "in_delivery",      label: "יצא למשלוח", color: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500" },
  { value: "not_approved",     label: "לא אושרה",   color: "bg-red-100 text-red-800 border-red-200",     dot: "bg-red-500" },
  { value: "cancelled",        label: "בוטלה",      color: "bg-gray-100 text-gray-600 border-gray-200",  dot: "bg-gray-400" },
];

const getStatus = (s: string) =>
  STATUSES.find(x => x.value === s) ?? {
    label: s === "pending" ? "ממתין" : s === "confirmed" ? "אושרה" : s === "shipped" ? "נשלחה" : s === "delivered" ? "נמסרה" : s,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    value: s,
  };

const parseReceipts = (url: string | null): string[] =>
  url ? url.split("|").map(u => u.trim()).filter(Boolean) : [];

const resolveReceiptUrl = async (raw: string): Promise<string> => {
  if (raw.startsWith("receipts:")) {
    const path = raw.slice("receipts:".length);
    const { data, error } = await supabase.storage.from("receipts").createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return "";
    return data.signedUrl;
  }
  return raw;
};

const calcShipping = (order: any): number => {
  const itemsTotal = (order.order_items || []).reduce(
    (s: number, i: DbOrderItem) => s + i.price * i.quantity, 0
  );
  return Math.max(0, Number(order.total) - itemsTotal + Number(order.discount_amount || 0));
};

/* ── Section card ── */
const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-400" />
      <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{title}</h3>
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

const AdminOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: order, isLoading } = useOrderById(orderId!);
  const { data: products = [] } = useProducts();
  const { data: smsSettings } = useSmsSettings();
  const { data: smsMessages } = useSmsMessages();

  const [resolvedUrls, setResolvedUrls] = useState<string[]>([]);
  const [receiptModal, setReceiptModal] = useState<{ idx: number } | null>(null);
  const [sendingSms, setSendingSms] = useState(false);

  /* Build SKU map */
  const skuMap = new Map<string, string | null>();
  products.forEach((p: any) => skuMap.set(p.id, p.sku));

  /* Resolve signed URLs on mount */
  useEffect(() => {
    if (!order?.receipt_url) return;
    const raw = parseReceipts(order.receipt_url);
    Promise.all(raw.map(resolveReceiptUrl)).then(urls => setResolvedUrls(urls.filter(Boolean)));
  }, [order?.receipt_url]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      toast({ title: "סטטוס עודכן" });
    },
  });

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    const prevStatus = order.status;
    await updateStatus.mutateAsync({ id: order.id, status: newStatus });

    const cancelStatuses = ["not_approved", "cancelled"];
    const orderItems = (order.order_items || []).map((i: any) => ({
      productId: i.product_id || undefined,
      quantity: i.quantity,
      color: i.color_name || undefined,
      size: i.size || undefined,
    }));
    if (cancelStatuses.includes(newStatus) && !cancelStatuses.includes(prevStatus)) {
      await adjustInventory(orderItems, 1);
      qc.invalidateQueries({ queryKey: ["admin_inventory"] });
    } else if (!cancelStatuses.includes(newStatus) && cancelStatuses.includes(prevStatus)) {
      await adjustInventory(orderItems, -1);
      qc.invalidateQueries({ queryKey: ["admin_inventory"] });
    }

    if (!smsSettings?.enabled || !smsMessages) return;
    const msgTemplate = (smsMessages as any)[newStatus];
    if (!msgTemplate) return;

    const locale = order.locale || "he";
    const shippingCost = calcShipping(order);
    const message = formatSms(
      typeof msgTemplate === "object" ? (msgTemplate[locale] || msgTemplate.he) : msgTemplate,
      {
        name: order.first_name || "",
        order_number: order.order_number || "",
        phone: order.phone || "",
        total: Number(order.total || 0).toLocaleString(),
        shipping: shippingCost > 0 ? `₪${shippingCost.toLocaleString()}` : "חינם",
      }
    );

    setSendingSms(true);
    const ok = await sendSms(order.phone, message);
    setSendingSms(false);
    toast({
      title: ok ? `SMS נשלח ל-${order.phone}` : "SMS נכשל (סטטוס נשמר)",
      variant: ok ? "default" : "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">הזמנה לא נמצאה</p>
        <button onClick={() => navigate("/admin/orders")} className="mt-3 text-sm text-blue-500 hover:underline">
          חזרה להזמנות
        </button>
      </div>
    );
  }

  const st = getStatus(order.status);
  const receipts = parseReceipts(order.receipt_url);
  const shippingCost = calcShipping(order);
  const itemsTotal = (order.order_items || []).reduce(
    (s: number, i: DbOrderItem) => s + i.price * i.quantity, 0
  );

  return (
    <div className="space-y-5 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/orders")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors bg-white border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-300 hover:shadow-sm"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה להזמנות
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${st.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>
            <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(order.created_at).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {/* Status change */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={order.status} onValueChange={handleStatusChange} disabled={updateStatus.isPending}>
            <SelectTrigger className="w-48 h-9 text-sm border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sendingSms && (
            <span className="flex items-center gap-1.5 text-xs text-blue-500 animate-pulse font-medium">
              <MessageSquare className="w-3.5 h-3.5" /> שולח SMS…
            </span>
          )}
        </div>
      </div>

      {/* ── Customer + Address ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section title="לקוח" icon={User}>
          <div className="space-y-2">
            <p className="font-semibold text-gray-900">{order.first_name} {order.last_name}</p>
            <p className="text-gray-500 text-sm flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" />{order.email}</p>
            <p className="text-gray-500 text-sm flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" />{order.phone}</p>
            {order.locale && <p className="text-gray-400 text-xs pt-1">שפה: {order.locale.toUpperCase()}</p>}
          </div>
        </Section>

        <Section title="כתובת למשלוח" icon={MapPin}>
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">{order.city}</p>
            <p className="text-gray-500 text-sm">{order.address}{order.apartment ? `, ${order.apartment}` : ""}</p>
          </div>
        </Section>
      </div>

      {/* ── Notes ── */}
      {order.notes && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 text-sm text-amber-800">
          <FileText className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <p><span className="font-bold">הערה: </span>{order.notes}</p>
        </div>
      )}

      {/* ── Receipts ── */}
      <Section title={`קבלות${receipts.length > 0 ? ` (${receipts.length})` : ""}`} icon={Receipt}>
        {receipts.length === 0 ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">לא הועלתה קבלה</p>
              <p className="text-xs text-amber-600 mt-0.5">הלקוח לא העלה קבלה — אנא צור קשר לקבלת אישור תשלום</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {(resolvedUrls.length > 0 ? resolvedUrls : receipts).map((url, idx) => (
              <button
                key={idx}
                onClick={() => setReceiptModal({ idx })}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors"
              >
                {url.toLowerCase().includes(".pdf") ? (
                  <div className="w-20 h-20 flex flex-col items-center justify-center gap-1 bg-red-50">
                    <ImageIcon className="w-6 h-6 text-red-400" />
                    <span className="text-[9px] font-bold text-red-500">PDF</span>
                  </div>
                ) : (
                  <img src={url} alt={`קבלה ${idx + 1}`} className="w-20 h-20 object-cover" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 drop-shadow">
                    {receipts.length > 1 ? `קבלה ${idx + 1}` : "הגדל"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* ── Items ── */}
      <Section title="פריטים" icon={Package}>
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          {(order.order_items || []).map((item: DbOrderItem, idx: number) => (
            <div key={item.id} className={`flex items-center gap-4 px-4 py-4 ${idx > 0 ? "border-t border-gray-100" : ""}`}>
              {item.product_image ? (
                <img src={item.product_image} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-base">{item.product_name}</p>
                {item.product_id && (
                  <button
                    onClick={() => navigate(`/admin/products/edit/${item.product_id}`)}
                    className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-blue-500 hover:text-blue-700 hover:underline font-mono"
                  >
                    <Hash className="w-2.5 h-2.5" />
                    {skuMap.get(item.product_id) || item.product_id.slice(0, 8)}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
                <div className="mt-1.5 space-y-0.5">
                  {item.color_name && (() => {
                    const isCustom = !item.color_hex;
                    return (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">צבע:</span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-700 font-medium">
                          {item.color_hex && (
                            <span className="w-3.5 h-3.5 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: item.color_hex }} />
                          )}
                          {item.color_name}
                          {isCustom && (
                            <span className="text-[9px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">מותאם</span>
                          )}
                        </span>
                      </div>
                    );
                  })()}
                  {item.size && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">אורך:</span>
                      <span className="text-xs text-gray-700 font-medium">{item.size}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-end shrink-0 space-y-0.5">
                <p className="text-sm text-gray-400">×{item.quantity}</p>
                <p className="font-bold text-gray-900 text-base">₪{(item.price * item.quantity).toLocaleString()}</p>
                <p className="text-xs text-gray-400">₪{item.price.toLocaleString()} ליח'</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Financial summary ── */}
      <Section title="סיכום פיננסי" icon={Tag}>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">סכום ביניים</span>
            <span className="font-medium text-gray-900">₪{itemsTotal.toLocaleString()}</span>
          </div>
          {order.discount_code && (
            <div className="flex justify-between text-sm">
              <span className="text-green-700">קוד הנחה ({order.discount_code})</span>
              <span className="font-semibold text-green-700">-₪{Number(order.discount_amount || 0).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">משלוח</span>
            {shippingCost === 0
              ? <span className="font-medium text-green-600">חינם</span>
              : <span className="font-medium text-gray-900">₪{shippingCost.toLocaleString()}</span>
            }
          </div>
          <div className="flex justify-between font-bold pt-2.5 border-t border-gray-100">
            <span className="text-gray-900">סה"כ</span>
            <span className="text-gray-900 text-lg">₪{Number(order.total).toLocaleString()}</span>
          </div>
        </div>
      </Section>

      {/* ── Receipt lightbox ── */}
      {receiptModal && (() => {
        const urls = resolvedUrls.length > 0 ? resolvedUrls : receipts;
        const { idx } = receiptModal;
        const currentUrl = urls[idx];
        return (
          <div className="fixed inset-0 z-[300] bg-white flex items-center justify-center" onClick={() => setReceiptModal(null)}>
            <button className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 z-10" onClick={() => setReceiptModal(null)}>
              <X className="w-5 h-5" />
            </button>
            {urls.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-gray-700 text-sm font-semibold bg-gray-100 px-3 py-1 rounded-full">
                {idx + 1} / {urls.length}
              </div>
            )}
            {idx > 0 && (
              <button className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors text-gray-700 shadow-sm z-10"
                onClick={e => { e.stopPropagation(); setReceiptModal({ idx: idx - 1 }); }}>
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {idx < urls.length - 1 && (
              <button className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors text-gray-700 shadow-sm z-10"
                onClick={e => { e.stopPropagation(); setReceiptModal({ idx: idx + 1 }); }}>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <div className="max-w-3xl max-h-[90vh] overflow-auto rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
              {currentUrl.toLowerCase().includes(".pdf") ? (
                <iframe src={currentUrl} className="w-[70vw] h-[80vh] rounded-2xl" title="Receipt" />
              ) : (
                <img src={currentUrl} alt={`קבלה ${idx + 1}`} className="max-w-full max-h-[88vh] rounded-2xl object-contain" />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminOrderDetail;
