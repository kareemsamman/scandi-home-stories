import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package, Receipt, Search, ArrowUpDown, X, ChevronLeft,
} from "lucide-react";
import { useOrders } from "@/hooks/useDbData";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ── Status config ── */
const STATUSES = [
  { value: "waiting_approval", label: "بانتظار الموافقة", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  { value: "in_process",       label: "قيد المعالجة",     color: "bg-blue-100 text-blue-800 border-blue-200",   dot: "bg-blue-500" },
  { value: "in_delivery",      label: "خرج للتوصيل", color: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500" },
  { value: "not_approved",     label: "لم تتم الموافقة",   color: "bg-red-100 text-red-800 border-red-200",     dot: "bg-red-500" },
  { value: "cancelled",        label: "ملغاة",      color: "bg-gray-100 text-gray-600 border-gray-200",  dot: "bg-gray-400" },
];

const getStatus = (s: string) =>
  STATUSES.find(x => x.value === s) ?? {
    label: s === "pending" ? "معلّق" : s === "confirmed" ? "مؤكد" : s === "shipped" ? "تم الشحن" : s === "delivered" ? "تم التسليم" : s,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    value: s,
  };

const parseReceipts = (url: string | null): number =>
  url ? url.split("|").filter(Boolean).length : 0;

const AdminOrders = () => {
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useOrders();
  const { isAdmin } = useAuth();

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "total_desc" | "total_asc">("newest");

  const q = searchQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = orders.filter(o => filterStatus === "all" || o.status === filterStatus);
    if (filterPayment !== "all") {
      list = list.filter(o => (o.payment_status || "paid") === filterPayment);
    }
    if (q) {
      list = list.filter(o => {
        const fullName = `${o.first_name} ${o.last_name}`.toLowerCase();
        return (
          fullName.includes(q) ||
          (o.phone || "").toLowerCase().includes(q) ||
          (o.email || "").toLowerCase().includes(q) ||
          (o.order_number || "").toLowerCase().includes(q)
        );
      });
    }
    return [...list].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "total_desc") return Number(b.total) - Number(a.total);
      if (sortBy === "total_asc") return Number(a.total) - Number(b.total);
      return 0;
    });
  }, [orders, filterStatus, q, sortBy]);

  const waitingCount = orders.filter(o => o.status === "waiting_approval").length;
  const unpaidCount = orders.filter(o => (o.payment_status || "paid") === "unpaid").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الطلبات</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {filtered.length !== orders.length ? `${filtered.length} من ${orders.length}` : `${orders.length}`} طلب
              {waitingCount > 0 && (
                <span className="ms-2 inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {waitingCount} بانتظار الموافقة
                </span>
              )}
              {unpaidCount > 0 && (
                <span className="ms-2 inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unpaidCount} لم يتم الدفع
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-44 border-gray-200 text-sm h-9"><SelectValue placeholder="تصفية حسب الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطلبات</SelectItem>
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
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="w-full sm:w-36 border-gray-200 text-sm h-9"><SelectValue placeholder="الدفع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المدفوعات</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
                <SelectItem value="unpaid">لم يُدفع</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex items-center">
              <ArrowUpDown className="absolute right-3 w-3.5 h-3.5 text-gray-400 pointer-events-none z-10" />
              <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-full sm:w-48 border-gray-200 text-sm h-9 pr-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">الأحدث أولاً</SelectItem>
                  <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                  <SelectItem value="total_desc">المبلغ — الأعلى</SelectItem>
                  <SelectItem value="total_asc">المبلغ — الأقل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث حسب الاسم، الهاتف، البريد، رقم الطلب..."
            className="w-full h-10 pr-9 pl-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-400"
            dir="rtl"
          />
          {searchQuery && (
            <button className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setSearchQuery("")}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">{q ? "لم يتم العثور على طلبات" : "لا توجد طلبات"}</p>
          {q && <button className="text-sm text-blue-500 hover:underline mt-1" onClick={() => setSearchQuery("")}>مسح البحث</button>}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(order => {
            const st = getStatus(order.status);
            const receiptCount = parseReceipts(order.receipt_url);

            return (
              <button
                key={order.id}
                onClick={() => navigate(`/admin/orders/${order.id}`)}
                className="w-full text-start bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all px-5 py-4 flex items-center gap-3 group"
              >
                {/* Order number + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{order.order_number}</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                    {isAdmin && (order.payment_status || "paid") === "unpaid" && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold">
                        💳 لم يُدفع
                      </span>
                    )}
                    {isAdmin && (order.payment_status || "paid") === "paid" && receiptCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold">
                        <Receipt className="w-3 h-3" />
                        {receiptCount > 1 ? `${receiptCount} إيصالات` : "إيصال"}
                      </span>
                    )}
                    {isAdmin && (order.payment_status || "paid") === "paid" && receiptCount === 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-semibold">
                        بدون إيصال
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {order.first_name} {order.last_name} · {order.phone} · {(() => { const d = new Date(order.created_at); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; })()}
                  </p>
                </div>

                {/* Total + items count */}
                <div className="text-end shrink-0">
                  <p className="font-bold text-gray-900 text-sm">₪{Number(order.total).toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">{order.order_items?.length || 0} قطعة</p>
                </div>

                {/* Arrow */}
                <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
