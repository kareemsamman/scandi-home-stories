import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Package, ChevronDown, ChevronRight, ChevronLeft, MessageSquare, X,
  MapPin, User, FileText, ImageIcon, Phone, Mail, Receipt, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrders, type DbOrderItem } from "@/hooks/useDbData";
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

/* ── Receipt URLs helper ── */
const parseReceipts = (url: string | null): string[] => {
  if (!url) return [];
  return url.split("|").map(u => u.trim()).filter(Boolean);
};

/* ── Resolve receipt URL: generate signed URL for private bucket, pass through legacy public URLs ── */
const resolveReceiptUrl = async (raw: string): Promise<string> => {
  if (raw.startsWith("receipts:")) {
    const path = raw.slice("receipts:".length);
    const { data, error } = await supabase.storage.from("receipts").createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) {
      console.error("[receipt] signed URL error:", error?.message);
      return "";
    }
    return data.signedUrl;
  }
  // Legacy public URL — pass through
  return raw;
};

/* ── Compute shipping cost from order ── */
const calcShipping = (order: any): number => {
  const itemsTotal = (order.order_items || []).reduce(
    (s: number, i: DbOrderItem) => s + i.price * i.quantity, 0
  );
  return Math.max(0, Number(order.total) - itemsTotal + Number(order.discount_amount || 0));
};

const AdminOrders = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useOrders();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [receiptModal, setReceiptModal] = useState<{ urls: string[]; idx: number } | null>(null);
  const [resolvedReceipts, setResolvedReceipts] = useState<Record<string, string[]>>({});
  const [sendingSms, setSendingSms] = useState<string | null>(null);

  const { data: smsSettings } = useSmsSettings();
  const { data: smsMessages } = useSmsMessages();

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "סטטוס עודכן" });
    },
  });

  const handleStatusChange = async (order: any, newStatus: string) => {
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

    setSendingSms(order.id);
    const ok = await sendSms(order.phone, message);
    setSendingSms(null);
    toast({
      title: ok ? `SMS נשלח ל-${order.phone}` : "SMS נכשל (סטטוס נשמר)",
      variant: ok ? "default" : "destructive",
    });
  };

  const handleExpand = async (order: any) => {
    const isOpen = expanded === order.id;
    setExpanded(isOpen ? null : order.id);
    if (!isOpen && !resolvedReceipts[order.id]) {
      const rawUrls = parseReceipts(order.receipt_url);
      const resolved = await Promise.all(rawUrls.map(resolveReceiptUrl));
      setResolvedReceipts(prev => ({ ...prev, [order.id]: resolved.filter(Boolean) }));
    }
  };

  const filtered = orders.filter(o => filterStatus === "all" || o.status === filterStatus);
  const waitingCount = orders.filter(o => o.status === "waiting_approval").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הזמנות</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {orders.length} הזמנות
            {waitingCount > 0 && (
              <span className="ms-2 inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {waitingCount} ממתינות לאישור
              </span>
            )}
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48 border-gray-200 text-sm"><SelectValue placeholder="סנן לפי סטטוס" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל ההזמנות</SelectItem>
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
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">אין הזמנות</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => {
            const isExpanded = expanded === order.id;
            const st = getStatus(order.status);
            const receipts = parseReceipts(order.receipt_url);
            const shippingCost = calcShipping(order);
            const itemsTotal = (order.order_items || []).reduce(
              (s: number, i: DbOrderItem) => s + i.price * i.quantity, 0
            );

            return (
              <div key={order.id} className={`bg-white rounded-2xl border transition-shadow ${isExpanded ? "border-gray-300 shadow-md" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}>

                {/* ── Collapsed row ── */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
                  onClick={() => handleExpand(order)}
                >
                  {/* Chevron */}
                  <div className="w-5 shrink-0 text-gray-300">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>

                  {/* Order number + customer */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{order.order_number}</span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                      {receipts.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold">
                          <Receipt className="w-3 h-3" />
                          {receipts.length > 1 ? `${receipts.length} קבלות` : "קבלה"}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {order.first_name} {order.last_name} · {order.phone} · {new Date(order.created_at).toLocaleDateString("he-IL")}
                    </p>
                  </div>

                  {/* Totals */}
                  <div className="text-end shrink-0">
                    <p className="font-bold text-gray-900 text-sm">₪{Number(order.total).toLocaleString()}</p>
                    <p className="text-gray-400 text-xs">{order.order_items?.length || 0} פריטים</p>
                  </div>
                </div>

                {/* ── Expanded detail ── */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-5 space-y-5">

                    {/* Customer + Shipping address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <User className="w-3 h-3" /> לקוח
                        </p>
                        <p className="font-semibold text-gray-900 text-sm">{order.first_name} {order.last_name}</p>
                        <p className="text-gray-500 text-xs flex items-center gap-1.5"><Mail className="w-3 h-3" />{order.email}</p>
                        <p className="text-gray-500 text-xs flex items-center gap-1.5"><Phone className="w-3 h-3" />{order.phone}</p>
                        {order.locale && <p className="text-gray-400 text-[10px] pt-1">שפה: {order.locale.toUpperCase()}</p>}
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" /> כתובת למשלוח
                        </p>
                        <p className="font-semibold text-gray-900 text-sm">{order.city}</p>
                        <p className="text-gray-500 text-xs">{order.address}{order.apartment ? `, ${order.apartment}` : ""}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
                        <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                        <p><span className="font-bold">הערה: </span>{order.notes}</p>
                      </div>
                    )}

                    {/* Receipts — always shown */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                        <Receipt className="w-3 h-3" /> קבלות {receipts.length > 0 && `(${receipts.length})`}
                      </p>
                      {receipts.length === 0 ? (
                        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800">לא הועלתה קבלה</p>
                            <p className="text-xs text-amber-600 mt-0.5">הלקוח לא העלה קבלה — אנא צור קשר לקבלת אישור תשלום</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {(resolvedReceipts[order.id] ?? receipts).map((url, idx) => (
                            <button
                              key={idx}
                              onClick={() => setReceiptModal({ urls: resolvedReceipts[order.id] ?? receipts, idx })}
                              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-gray-400 transition-colors"
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
                                <span className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                                  {receipts.length > 1 ? `קבלה ${idx + 1}` : "פתח"}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Items table */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                        <Package className="w-3 h-3" /> פריטים
                      </p>
                      <div className="rounded-xl border border-gray-100 overflow-hidden">
                        {(order.order_items || []).map((item: DbOrderItem, idx: number) => (
                          <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? "border-t border-gray-100" : ""} hover:bg-gray-50/50 transition-colors`}>
                            {item.product_image ? (
                              <img src={item.product_image} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm leading-snug">{item.product_name}</p>
                              <div className="mt-1 space-y-0.5">
                                {item.color_name && (() => {
                                  const isCustom = !item.color_hex;
                                  return (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-gray-400">צבע:</span>
                                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-700 font-medium">
                                        {item.color_hex && (
                                          <span className="w-3 h-3 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: item.color_hex }} />
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
                                    <span className="text-[10px] text-gray-400">אורך:</span>
                                    <span className="text-[11px] text-gray-700 font-medium">{item.size}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-end shrink-0 space-y-0.5">
                              <p className="text-xs text-gray-400">×{item.quantity}</p>
                              <p className="font-bold text-gray-900 text-sm">₪{(item.price * item.quantity).toLocaleString()}</p>
                              <p className="text-[10px] text-gray-400">₪{item.price.toLocaleString()} ליח'</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial summary */}
                    <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
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
                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200">
                        <span className="text-gray-900">סה"כ</span>
                        <span className="text-gray-900 text-base">₪{Number(order.total).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Status change */}
                    <div className="flex items-center gap-3 pt-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-700">סטטוס:</span>
                      <Select value={order.status} onValueChange={v => handleStatusChange(order, v)}>
                        <SelectTrigger className="w-48 h-9 text-xs border-gray-200">
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
                      {sendingSms === order.id && (
                        <span className="flex items-center gap-1.5 text-xs text-blue-500 animate-pulse font-medium">
                          <MessageSquare className="w-3.5 h-3.5" /> שולח SMS…
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt lightbox */}
      {receiptModal && (() => {
        const { urls, idx } = receiptModal;
        const currentUrl = urls[idx];
        const hasPrev = idx > 0;
        const hasNext = idx < urls.length - 1;
        return (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setReceiptModal(null)}>
            {/* Close */}
            <button className="absolute top-4 end-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white z-10" onClick={() => setReceiptModal(null)}>
              <X className="w-5 h-5" />
            </button>
            {/* Counter */}
            {urls.length > 1 && (
              <div className="absolute top-4 start-1/2 -translate-x-1/2 text-white text-sm font-semibold bg-black/40 px-3 py-1 rounded-full">
                {idx + 1} / {urls.length}
              </div>
            )}
            {/* Prev */}
            {hasPrev && (
              <button
                className="absolute start-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors text-white z-10"
                onClick={e => { e.stopPropagation(); setReceiptModal({ urls, idx: idx - 1 }); }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            {/* Next */}
            {hasNext && (
              <button
                className="absolute end-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors text-white z-10"
                onClick={e => { e.stopPropagation(); setReceiptModal({ urls, idx: idx + 1 }); }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {/* Image / PDF */}
            <div className="max-w-2xl max-h-[90vh] overflow-auto rounded-2xl" onClick={e => e.stopPropagation()}>
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

export default AdminOrders;
