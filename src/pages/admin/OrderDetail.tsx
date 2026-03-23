import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, Package, MapPin, User, FileText, ImageIcon,
  Phone, Mail, Receipt, AlertTriangle, X, ChevronLeft, ChevronRight,
  MessageSquare, Hash, ExternalLink, Calendar, Tag, Trash2, Printer, Pencil, Check, Send, Loader2,
} from "lucide-react";
import logoWhite from "@/assets/logo-white.png";
import { supabase } from "@/integrations/supabase/client";
import { useOrderById, useProducts, type DbOrderItem } from "@/hooks/useDbData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSmsSettings, useSmsMessages, sendSms, formatSms } from "@/hooks/useAppSettings";
import { adjustInventory } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { AddressFields, AddressState } from "@/components/AddressFields";

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
  // Use stored shipping_cost if available, otherwise derive from total
  if (order.shipping_cost != null) return Number(order.shipping_cost);
  const itemsTotal = (order.order_items || []).reduce(
    (s: number, i: DbOrderItem) => s + i.price * i.quantity, 0
  );
  return Math.max(0, Number(order.total) - itemsTotal + Number(order.discount_amount || 0));
};

/* ── Section card ── */
const Section = ({ title, icon: Icon, children, actions }: { title: string; icon: any; children: React.ReactNode; actions?: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-400" />
      <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{title}</h3>
      {actions && <div className="ms-auto">{actions}</div>}
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
  const { isAdmin, isWorker } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data: smsSettings } = useSmsSettings();
  const { data: smsMessages } = useSmsMessages();

  const [resolvedUrls, setResolvedUrls] = useState<string[]>([]);
  const [resolvingUrls, setResolvingUrls] = useState(false);
  const [receiptModal, setReceiptModal] = useState<{ idx: number } | null>(null);
  const [sendingSms, setSendingSms] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressState>({ city: "", street: "", houseNumber: "", apartment: "", citySelected: true, streetSelected: true });
  const [paymentLinkCopied, setPaymentLinkCopied] = useState(false);

  /* Build SKU map */
  const skuMap = new Map<string, string | null>();
  products.forEach((p: any) => skuMap.set(p.id, p.sku));

  /* Resolve signed URLs on mount */
  useEffect(() => {
    if (!order?.receipt_url) return;
    const raw = parseReceipts(order.receipt_url);
    setResolvingUrls(true);
    Promise.all(raw.map(resolveReceiptUrl)).then(urls => {
      setResolvedUrls(urls.filter(Boolean));
      setResolvingUrls(false);
    });
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

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      // Restore stock unless order was already cancelled/not_approved
      if (order) {
        const cancelStatuses = ["not_approved", "cancelled"];
        if (!cancelStatuses.includes(order.status)) {
          const orderItems = (order.order_items || []).map((i: any) => ({
            productId: i.product_id || undefined,
            quantity: i.quantity,
          }));
          await adjustInventory(orderItems, 1);
        }
      }
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["admin_inventory"] });
      toast({ title: "ההזמנה נמחקה והמלאי שוחזר" });
      navigate("/admin/orders");
    },
    onError: () => toast({ title: "מחיקה נכשלה", variant: "destructive" }),
  });

  const markAsPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("orders").update({ payment_status: "paid" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      toast({ title: "✅ ההזמנה סומנה כשולמה" });
    },
    onError: () => toast({ title: "עדכון נכשל", variant: "destructive" }),
  });

  const sendPaymentLink = useMutation({
    mutationFn: async ({ id, phone }: { id: string; phone: string }) => {
      // Generate or reuse token
      const token = crypto.randomUUID().replace(/-/g, "");
      const { error } = await (supabase as any).from("orders").update({ payment_token: token }).eq("id", id);
      if (error) throw error;
      const link = `${window.location.origin}/he/pay/${id}?token=${token}`;
      // Send SMS
      const msg = `שלום 👋\nלהשלמת תשלום עבור הזמנתך לחץ על הקישור:\n${link}\n\n🏗 AMG PERGOLA`;
      await (await import("@/hooks/useAppSettings")).sendSms(phone, msg);
      return { link, token };
    },
    onSuccess: ({ link }) => {
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      navigator.clipboard.writeText(link).catch(() => {});
      setPaymentLinkCopied(true);
      setTimeout(() => setPaymentLinkCopied(false), 3000);
      toast({ title: "קישור נשלח ב-SMS ✅", description: "הקישור הועתק ללוח" });
    },
    onError: () => toast({ title: "שליחה נכשלה", variant: "destructive" }),
  });

  const copyPaymentLink = () => {
    if (!order?.payment_token) return;
    const link = `${window.location.origin}/he/pay/${order.id}?token=${order.payment_token}`;
    navigator.clipboard.writeText(link);
    setPaymentLinkCopied(true);
    setTimeout(() => setPaymentLinkCopied(false), 3000);
    toast({ title: "הקישור הועתק ✅" });
  };

  const updateAddress = useMutation({
    mutationFn: async (data: { city: string; address: string; house_number: string; apartment: string }) => {
      const { error } = await supabase.from("orders").update(data).eq("id", order!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      setEditingAddress(false);
      toast({ title: "כתובת עודכנה" });
    },
    onError: () => toast({ title: "עדכון נכשל", variant: "destructive" }),
  });

  const handlePrint = () => {
    if (!order) return;
    const isAr = order.locale === "ar";
    const dir = "rtl";
    const locale = isAr ? "ar" : "he";
    const shippingCost = calcShipping(order);
    const itemsTotal = (order.order_items || []).reduce(
      (s: number, i: DbOrderItem) => s + i.price * i.quantity, 0
    );
    const logoUrl = window.location.origin + logoWhite;

    const labels = isAr ? {
      order: "طلب", date: "التاريخ", customer: "العميل", shipping: "عنوان الشحن",
      phone: "هاتف", email: "بريد إلكتروني", items: "المنتجات", product: "المنتج",
      color: "اللون", size: "الحجم", qty: "الكمية", price: "السعر", total: "الإجمالي",
      subtotal: "المجموع الفرعي", shippingCost: "الشحن", free: "مجاني",
      discount: "خصم", grandTotal: "المجموع الكلي", notes: "ملاحظات",
      custom: "مخصص", thankYou: "شكراً لطلبك",
    } : {
      order: "הזמנה", date: "תאריך", customer: "לקוח", shipping: "כתובת למשלוח",
      phone: "טלפון", email: "אימייל", items: "פריטים", product: "מוצר",
      color: "צבע", size: "אורך", qty: "כמות", price: "מחיר", total: "סה\"כ",
      subtotal: "סכום ביניים", shippingCost: "משלוח", free: "חינם",
      discount: "הנחה", grandTotal: "סה\"כ לתשלום", notes: "הערות",
      custom: "מותאם", thankYou: "תודה על הזמנתך",
    };

    const font = isAr
      ? "font-family: 'Segoe UI', Tahoma, Arial, sans-serif;"
      : "font-family: 'Segoe UI', Tahoma, Arial, sans-serif;";

    // HTML-escape helper to prevent XSS in print template
    const esc = (s: string | null | undefined) =>
      (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

    const itemsHtml = (order.order_items || []).map((item: DbOrderItem) => {
      const sku = item.product_id ? (skuMap.get(item.product_id) || "") : "";
      const isCustom = item.color_name && !item.color_hex;
      return `
        <tr>
          <td style="padding:10px 12px; border-bottom:1px solid #f0f0f0;">
            <div style="font-weight:600; font-size:13px;">${esc(item.product_name)}</div>
            ${sku ? `<div style="font-size:11px; color:#9ca3af; font-family:monospace;">#${esc(sku)}</div>` : ""}
            ${item.color_name ? `<div style="font-size:11px; color:#6b7280; margin-top:2px;">${labels.color}: ${esc(item.color_name)}${isCustom ? ` <span style="background:#f3e8ff;color:#7e22ce;padding:1px 5px;border-radius:4px;font-size:10px;">${labels.custom}</span>` : ""}</div>` : ""}
            ${item.size ? `<div style="font-size:11px; color:#6b7280;">${labels.size}: ${esc(item.size)}</div>` : ""}
          </td>
          <td style="padding:10px 12px; border-bottom:1px solid #f0f0f0; text-align:center; font-size:13px;">×${item.quantity}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #f0f0f0; text-align:${isAr ? "left" : "right"}; font-size:13px; color:#6b7280;">₪${item.price.toLocaleString()}</td>
          <td style="padding:10px 12px; border-bottom:1px solid #f0f0f0; text-align:${isAr ? "left" : "right"}; font-weight:700; font-size:13px;">₪${(item.price * item.quantity).toLocaleString()}</td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${labels.order} ${order.order_number}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { ${font} background:#fff; color:#1a1a1a; font-size:13px; direction:${dir}; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .header { background:#111827; color:#fff; padding:28px 36px; display:flex; align-items:center; justify-content:space-between; }
    .header img { height:40px; object-fit:contain; }
    .header-info { text-align:${isAr ? "left" : "right"}; }
    .header-info h1 { font-size:20px; font-weight:800; letter-spacing:-0.5px; }
    .header-info p { font-size:12px; color:#9ca3af; margin-top:2px; }
    .body { padding:28px 36px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px; }
    .info-card { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:16px; }
    .info-card h3 { font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; }
    .info-card p { font-size:13px; color:#374151; margin-bottom:4px; }
    .info-card .name { font-weight:700; font-size:14px; color:#111827; }
    .notes-box { background:#fffbeb; border:1px solid #fcd34d; border-radius:10px; padding:14px 16px; margin-bottom:24px; font-size:13px; color:#92400e; }
    .section-title { font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; }
    table { width:100%; border-collapse:collapse; margin-bottom:24px; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden; }
    thead { background:#f3f4f6; }
    th { padding:10px 12px; font-size:11px; font-weight:700; color:#6b7280; text-align:${isAr ? "left" : "right"}; }
    th:first-child { text-align:${isAr ? "right" : "left"}; }
    .totals { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:16px; max-width:320px; margin-${isAr ? "right" : "left"}:auto; }
    .totals-row { display:flex; justify-content:space-between; padding:5px 0; font-size:13px; }
    .totals-row.grand { border-top:2px solid #e5e7eb; margin-top:8px; padding-top:10px; font-weight:800; font-size:15px; }
    .footer { margin-top:32px; padding:20px 36px; border-top:1px solid #e5e7eb; text-align:center; font-size:11px; color:#9ca3af; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoUrl}" alt="AMG PERGOLA" style="height:40px; object-fit:contain;" onerror="this.outerHTML='<span style=\\'font-size:20px;font-weight:900;color:#fff;letter-spacing:1px;\\'>AMG PERGOLA</span>'">
    <div class="header-info">
      <h1>${labels.order} ${esc(order.order_number)}</h1>
      <p>${labels.date}: ${new Date(order.created_at).toLocaleDateString(isAr ? "ar-SA" : "he-IL", { year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
  </div>

  <div class="body">
    <div class="info-grid">
      <div class="info-card">
        <h3>${labels.customer}</h3>
        <p class="name">${esc(order.first_name)} ${esc(order.last_name)}</p>
        <p>${labels.phone}: ${esc(order.phone)}</p>
        <p>${labels.email}: ${esc(order.email)}</p>
      </div>
      <div class="info-card">
        <h3>${labels.shipping}</h3>
        <p class="name">${esc(order.city)}</p>
        <p>${esc(order.address)}${(order as any).house_number ? ` ${esc((order as any).house_number)}` : ""}${order.apartment ? `, ${esc(order.apartment)}` : ""}</p>
      </div>
    </div>

    ${order.notes ? `<div class="notes-box"><strong>${labels.notes}:</strong> ${esc(order.notes)}</div>` : ""}

    <p class="section-title">${labels.items}</p>
    <table>
      <thead>
        <tr>
          <th style="text-align:${isAr ? "right" : "left"}">${labels.product}</th>
          <th style="text-align:center">${labels.qty}</th>
          <th>${labels.price}</th>
          <th>${labels.total}</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>${labels.subtotal}</span><span>₪${itemsTotal.toLocaleString()}</span></div>
      ${order.discount_code ? `<div class="totals-row" style="color:#15803d;"><span>${labels.discount} (${order.discount_code})</span><span>-₪${Number(order.discount_amount || 0).toLocaleString()}</span></div>` : ""}
      <div class="totals-row"><span>${labels.shippingCost}</span><span>${shippingCost === 0 ? `<span style="color:#15803d;">${labels.free}</span>` : `₪${shippingCost.toLocaleString()}`}</span></div>
      <div class="totals-row grand"><span>${labels.grandTotal}</span><span>₪${Number(order.total).toLocaleString()}</span></div>
    </div>
  </div>

  <div class="footer">
    <p style="font-size:13px; font-weight:600; color:#374151; margin-bottom:4px;">${labels.thankYou}</p>
    <p>AMG Pergola · amgpergola.com</p>
  </div>

  <script>window.onafterprint = function(){ window.close(); }; window.onload = function(){ setTimeout(function(){ window.print(); }, 400); }</script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { toast({ title: "אנא אפשר חלונות קופצים", variant: "destructive" }); return; }
    win.document.write(html);
    win.document.close();
  };

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
    const invoiceLink = `${window.location.origin}/invoice/${order.id}`;
    const message = formatSms(
      typeof msgTemplate === "object" ? (msgTemplate[locale] || msgTemplate.he) : msgTemplate,
      {
        name: order.first_name || "",
        order_number: order.order_number || "",
        phone: order.phone || "",
        total: Number(order.total || 0).toLocaleString(),
        shipping: shippingCost > 0 ? `₪${shippingCost.toLocaleString()}` : "חינם",
        invoice_link: invoiceLink,
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

      {/* ── Header card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Top bar: back + order number + date */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <button
            onClick={() => navigate("/admin/orders")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-300 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            חזרה
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{order.order_number}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${st.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              {/* Payment badge */}
              {isAdmin && (order.payment_status || "paid") === "unpaid" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                  💳 טרם שולם
                </span>
              )}
              {isAdmin && (order.payment_status || "paid") === "paid" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                  ✅ שולם
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(order.created_at).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {/* Status selector */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">סטטוס הזמנה</span>
          <Select value={order.status} onValueChange={handleStatusChange} disabled={updateStatus.isPending}>
            <SelectTrigger className={`h-9 px-3 text-sm font-semibold border rounded-xl gap-2 w-auto min-w-[160px] ${st.color}`}>
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => {
                const workerBlocked = isWorker && !isAdmin && (order.status !== "in_process" || s.value !== "in_delivery");
                return (
                  <SelectItem key={s.value} value={s.value} disabled={workerBlocked}>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                      {s.label}
                      {workerBlocked && <span className="text-[10px] text-gray-400 ms-1">— אדמין בלבד</span>}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {isWorker && !isAdmin && (
            <p className="text-[10px] text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {order.status === "in_process" ? 'ניתן לשנות רק ל"יצא למשלוח"' : 'שינוי זמין רק כשהסטטוס "בתהליך"'}
            </p>
          )}
          {sendingSms && (
            <span className="flex items-center gap-1.5 text-xs text-blue-500 animate-pulse font-medium ms-auto">
              <MessageSquare className="w-3.5 h-3.5" /> שולח SMS…
            </span>
          )}
        </div>

        {/* Actions grid */}
        <div className="px-5 py-3 flex flex-wrap gap-2">

          {/* Payment actions — unpaid only */}
          {(order.payment_status || "paid") === "unpaid" && isAdmin && (
            <>
              <button
                onClick={() => markAsPaid.mutate(order.id)}
                disabled={markAsPaid.isPending}
                className="flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors disabled:opacity-50"
              >
                {markAsPaid.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                סמן כשולם
              </button>
              <button
                onClick={() => sendPaymentLink.mutate({ id: order.id, phone: order.phone })}
                disabled={sendPaymentLink.isPending}
                className="flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors disabled:opacity-50"
              >
                {sendPaymentLink.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                שלח קישור תשלום ב-SMS
              </button>
              {order.payment_token && (
                <button
                  onClick={copyPaymentLink}
                  className="flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
                >
                  {paymentLinkCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  {paymentLinkCopied ? "הועתק!" : "העתק קישור תשלום"}
                </button>
              )}
            </>
          )}

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            הדפסה
          </button>

          {/* Send invoice */}
          <button
            onClick={async () => {
              const locale = order.locale || "he";
              const invoiceLink = `${window.location.origin}/invoice/${order.id}`;
              const msg = locale === "ar"
                ? `مرحباً ${order.first_name} 👋\n🧾 الفاتورة لطلبك #${order.order_number}:\n${invoiceLink}\n\n🏗 AMG PERGOLA`
                : `שלום ${order.first_name} 👋\n🧾 החשבונית להזמנה #${order.order_number}:\n${invoiceLink}\n\n🏗 AMG PERGOLA`;
              setSendingSms(true);
              const ok = await sendSms(order.phone, msg);
              setSendingSms(false);
              toast({ title: ok ? `חשבונית נשלחה ב-SMS ל-${order.phone}` : "שליחה נכשלה", variant: ok ? "default" : "destructive" });
            }}
            disabled={sendingSms}
            className="flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            שלח חשבונית ב-SMS
          </button>

          {/* Delete — admin only, pushed to end */}
          {isAdmin && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors ms-auto"
            >
              <Trash2 className="w-4 h-4" />
              מחק הזמנה
            </button>
          )}
        </div>
      </div>

      {/* ── Delete confirmation dialog ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900">מחיקת הזמנה</p>
                <p className="text-xs text-gray-500">הזמנה {order.order_number}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">פעולה זו תמחק את ההזמנה לצמיתות ולא ניתן לשחזר אותה. האם אתה בטוח?</p>
            <div className="flex gap-2">
              <button
                onClick={() => deleteOrder.mutate(order.id)}
                disabled={deleteOrder.isPending}
                className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {deleteOrder.isPending ? "מוחק…" : "כן, מחק"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Customer + Address ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section title="לקוח" icon={User}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900">{order.first_name} {order.last_name}</p>
              {order.user_id ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                  ✓ משויך לחשבון
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                  אורח
                </span>
              )}
            </div>
            <a href={`mailto:${order.email}`} className="text-gray-500 text-sm flex items-center gap-2 hover:text-blue-600 transition-colors"><Mail className="w-3.5 h-3.5 text-gray-400" />{order.email}</a>
            <a href={`tel:${order.phone}`} className="text-gray-500 text-sm flex items-center gap-2 hover:text-blue-600 transition-colors"><Phone className="w-3.5 h-3.5 text-gray-400" />{order.phone}</a>
            {order.locale && <p className="text-gray-400 text-xs pt-1">שפה: {order.locale.toUpperCase()}</p>}
          </div>
        </Section>

        <Section
          title="כתובת למשלוח"
          icon={MapPin}
          actions={
            editingAddress ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateAddress.mutate({ city: addressForm.city, address: addressForm.street, house_number: addressForm.houseNumber, apartment: addressForm.apartment })}
                  disabled={updateAddress.isPending}
                  className="flex items-center gap-1 h-7 px-2.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Check className="w-3 h-3" /> שמור
                </button>
                <button
                  onClick={() => setEditingAddress(false)}
                  className="flex items-center h-7 w-7 justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAddressForm({ city: order.city || "", street: order.address || "", houseNumber: (order as any).house_number || "", apartment: order.apartment || "", citySelected: true, streetSelected: true });
                  setEditingAddress(true);
                }}
                className="flex items-center gap-1 h-7 px-2.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
              >
                <Pencil className="w-3 h-3" /> ערוך
              </button>
            )
          }
        >
          {editingAddress ? (
            <AddressFields
              value={addressForm}
              onChange={setAddressForm}
              isStaff={true}
            />
          ) : (
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">{order.city}</p>
              <p className="text-gray-500 text-sm">
                {order.address}{(order as any).house_number ? ` ${(order as any).house_number}` : ""}{order.apartment ? `, ${order.apartment}` : ""}
              </p>
            </div>
          )}
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
      {!isWorker && (
        <Section title={`קבלות${receipts.length > 0 ? ` (${receipts.length})` : ""}`} icon={Receipt}>
          {receipts.length === 0 ? (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">לא הועלתה קבלה</p>
                <p className="text-xs text-amber-600 mt-0.5">הלקוח לא העלה קבלה — אנא צור קשר לקבלת אישור תשלום</p>
              </div>
            </div>
          ) : resolvingUrls ? (
            <div className="flex flex-wrap gap-3">
              {receipts.map((_, idx) => (
                <div key={idx} className="w-20 h-20 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {resolvedUrls.map((url, idx) => (
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
      )}

      {/* ── Items ── */}
      <Section title="פריטים" icon={Package}>
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          {(order.order_items || []).map((item: DbOrderItem, idx: number) => (
            <div key={item.id} className={`flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-4 ${idx > 0 ? "border-t border-gray-100" : ""}`}>
              {item.product_image ? (
                <img src={item.product_image} alt="" className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover border border-gray-100 shrink-0" />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-base">{item.product_name}</p>
                {item.product_id && (
                  isAdmin ? (
                    <button
                      onClick={() => navigate(`/admin/products/edit/${item.product_id}`)}
                      className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-blue-500 hover:text-blue-700 hover:underline font-mono"
                    >
                      <Hash className="w-2.5 h-2.5" />
                      {skuMap.get(item.product_id) || item.product_id.slice(0, 8)}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-gray-400 font-mono">
                      <Hash className="w-2.5 h-2.5" />
                      {skuMap.get(item.product_id) || item.product_id.slice(0, 8)}
                    </span>
                  )
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
              <span className="font-semibold text-green-700">
                {Number(order.discount_amount || 0) === 0 ? "שילוח חינם" : `-₪${Number(order.discount_amount || 0).toLocaleString()}`}
              </span>
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
            {/* Close */}
            <button className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors text-gray-700 z-10" onClick={() => setReceiptModal(null)}>
              <X className="w-5 h-5" />
            </button>
            {/* Counter */}
            {urls.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-gray-700 text-sm font-semibold bg-black/10 px-3 py-1 rounded-full z-10">
                {idx + 1} / {urls.length}
              </div>
            )}
            {/* Prev */}
            {idx > 0 && (
              <button className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors text-gray-700 z-10"
                onClick={e => { e.stopPropagation(); setReceiptModal({ idx: idx - 1 }); }}>
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {/* Next */}
            {idx < urls.length - 1 && (
              <button className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors text-gray-700 z-10"
                onClick={e => { e.stopPropagation(); setReceiptModal({ idx: idx + 1 }); }}>
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            {/* Image */}
            <div className="w-full h-full flex items-center justify-center p-6" onClick={e => e.stopPropagation()}>
              {currentUrl.toLowerCase().includes(".pdf") ? (
                <iframe src={currentUrl} className="w-full h-full border border-gray-200 rounded-lg" title="Receipt" />
              ) : (
                <img src={currentUrl} alt={`קבלה ${idx + 1}`} className="max-w-full max-h-full object-contain border border-gray-200 rounded-lg shadow-sm" />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminOrderDetail;
