import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Package, ChevronDown, ChevronRight, Image, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrders, type DbOrderItem } from "@/hooks/useDbData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSmsSettings, useSmsMessages, sendSms, formatSms } from "@/hooks/useAppSettings";
import { adjustInventory } from "@/hooks/useOrders";

/* ── Status config ── */
const STATUSES = [
  { value: "waiting_approval", label: "מחכה אישור", color: "bg-amber-100 text-amber-700" },
  { value: "in_process",       label: "בתהליך",     color: "bg-blue-100 text-blue-700" },
  { value: "in_delivery",      label: "יצא למשלוח", color: "bg-purple-100 text-purple-700" },
  { value: "not_approved",     label: "לא אושרה",   color: "bg-red-100 text-red-700" },
  { value: "cancelled",        label: "בוטלה",      color: "bg-gray-100 text-gray-500" },
];

const getStatusColor = (s: string) =>
  STATUSES.find(x => x.value === s)?.color ??
  (s === "pending" ? "bg-amber-100 text-amber-700"
    : s === "confirmed" ? "bg-blue-100 text-blue-700"
    : s === "shipped"   ? "bg-purple-100 text-purple-700"
    : s === "delivered" ? "bg-green-100 text-green-700"
    : "bg-gray-100 text-gray-600");

const getStatusLabel = (s: string) =>
  STATUSES.find(x => x.value === s)?.label ??
  (s === "pending" ? "ממתין" : s === "confirmed" ? "אושרה" : s === "shipped" ? "נשלחה" : s === "delivered" ? "נמסרה" : s);

const AdminOrders = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useOrders();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [receiptModal, setReceiptModal] = useState<string | null>(null);
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
      toast({ title: "Status updated" });
    },
  });

  const handleStatusChange = async (order: any, newStatus: string) => {
    const prevStatus = order.status;
    await updateStatus.mutateAsync({ id: order.id, status: newStatus });

    // Inventory adjustments
    const cancelStatuses = ["not_approved", "cancelled"];
    const orderItems = (order.order_items || []).map((i: any) => ({
      productId: i.product_id || undefined,
      quantity: i.quantity,
      color: i.color_name || undefined,
      size: i.size || undefined,
    }));
    if (cancelStatuses.includes(newStatus) && !cancelStatuses.includes(prevStatus)) {
      // Order being cancelled/rejected → restore stock
      await adjustInventory(orderItems, 1);
      qc.invalidateQueries({ queryKey: ["admin_inventory"] });
    } else if (!cancelStatuses.includes(newStatus) && cancelStatuses.includes(prevStatus)) {
      // Order being un-cancelled → deduct stock again
      await adjustInventory(orderItems, -1);
      qc.invalidateQueries({ queryKey: ["admin_inventory"] });
    }

    // Auto-send SMS on status change if SMS is enabled
    if (!smsSettings?.enabled || !smsMessages) return;
    const msgTemplate = (smsMessages as any)[newStatus];
    if (!msgTemplate) return;

    const locale = order.locale || "he";
    const message = formatSms(
      typeof msgTemplate === "object" ? (msgTemplate[locale] || msgTemplate.he) : msgTemplate,
      {
        name: order.first_name || "",
        order_number: order.order_number || "",
        phone: order.phone || "",
        total: Number(order.total || 0).toLocaleString(),
      }
    );

    setSendingSms(order.id);
    const ok = await sendSms(order.phone, message);
    setSendingSms(null);
    toast({
      title: ok ? `SMS sent to ${order.phone}` : "SMS failed (status saved)",
      variant: ok ? "default" : "destructive",
    });
  };

  const filtered = orders.filter(o => filterStatus === "all" || o.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} orders total</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <p className="text-gray-400">Loading...</p> : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const isExpanded = expanded === order.id;
            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Summary row */}
                <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : order.id)}>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-gray-900 font-semibold">{order.order_number}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      {order.receipt_url && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">קבלה ✓</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {order.first_name} {order.last_name} · {order.phone} · {new Date(order.created_at).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-gray-900 font-semibold">₪{Number(order.total).toLocaleString()}</p>
                    <p className="text-gray-400 text-xs">{order.order_items?.length || 0} items</p>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">
                    {/* Customer + Shipping */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-[10px] mb-1 font-bold uppercase tracking-wide">Customer</p>
                        <p className="font-medium text-gray-900">{order.first_name} {order.last_name}</p>
                        <p className="text-gray-500">{order.email}</p>
                        <p className="text-gray-500">{order.phone}</p>
                        {order.locale && <p className="text-[10px] text-gray-400 mt-1">Lang: {order.locale?.toUpperCase()}</p>}
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] mb-1 font-bold uppercase tracking-wide">Shipping</p>
                        <p className="text-gray-900">{order.city}</p>
                        <p className="text-gray-500">{order.address}</p>
                        {order.apartment && <p className="text-gray-500">{order.apartment}</p>}
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm text-amber-800">
                        <span className="font-semibold">Note: </span>{order.notes}
                      </div>
                    )}

                    {/* Receipt */}
                    {order.receipt_url && (
                      <div>
                        <p className="text-gray-400 text-[10px] mb-2 font-bold uppercase tracking-wide">Receipt</p>
                        <button
                          onClick={() => setReceiptModal(order.receipt_url)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Image className="w-4 h-4" />
                          View Receipt
                        </button>
                      </div>
                    )}

                    {/* Items */}
                    <div>
                      <p className="text-gray-400 text-[10px] mb-2 font-bold uppercase tracking-wide">Items</p>
                      <div className="space-y-2">
                        {(order.order_items || []).map((item: DbOrderItem) => (
                          <div key={item.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white border border-gray-100">
                            {item.product_image && <img src={item.product_image} alt="" className="w-10 h-10 rounded object-cover" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 text-sm font-medium">{item.product_name}</p>
                              <p className="text-gray-400 text-xs">
                                {[item.size && `Size: ${item.size}`, item.color_name && `Color: ${item.color_name}`].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                            <p className="text-gray-500 text-sm">×{item.quantity}</p>
                            <p className="text-gray-900 font-semibold text-sm">₪{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status change + coupon */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">Status:</span>
                        <Select value={order.status} onValueChange={v => handleStatusChange(order, v)}>
                          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {sendingSms === order.id && (
                          <span className="flex items-center gap-1 text-xs text-blue-500 animate-pulse">
                            <MessageSquare className="w-3 h-3" /> Sending SMS…
                          </span>
                        )}
                      </div>
                      {order.discount_code && (
                        <p className="text-gray-400 text-xs">
                          Discount: <span className="font-mono font-semibold text-gray-700">{order.discount_code}</span>
                          {" "}-₪{Number(order.discount_amount || 0).toLocaleString()}
                        </p>
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
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setReceiptModal(null)}>
          <div className="max-w-2xl max-h-[90vh] overflow-auto rounded-xl" onClick={e => e.stopPropagation()}>
            {receiptModal.toLowerCase().includes(".pdf") ? (
              <iframe src={receiptModal} className="w-full h-[80vh] rounded-xl" title="Receipt" />
            ) : (
              <img src={receiptModal} alt="Receipt" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
