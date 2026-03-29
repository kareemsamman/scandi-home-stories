import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, PencilRuler } from "lucide-react";
import { usePergolaRequests } from "@/hooks/usePergolaRequests";
import { mmToCm } from "@/types/pergola";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PergolaRequestStatus } from "@/types/pergola";

const STATUSES: { value: PergolaRequestStatus; label: string; color: string; dot: string }[] = [
  { value: "new", label: "חדשה", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  { value: "in_review", label: "בבדיקה", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  { value: "needs_inspection", label: "דורש ביקור", color: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500" },
  { value: "ready_for_quote", label: "מוכנה להצעה", color: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500" },
  { value: "quoted", label: "הוצעה", color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
  { value: "closed", label: "סגורה", color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
];

const getStatus = (s: string) =>
  STATUSES.find((x) => x.value === s) ?? { label: s, color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400", value: s };

const AdminPergolaRequests = () => {
  const navigate = useNavigate();
  const { data: requests = [], isLoading } = usePergolaRequests();

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const q = searchQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = requests.filter((r) => filterStatus === "all" || r.status === filterStatus);
    if (q) {
      list = list.filter((r) =>
        r.customer_name.toLowerCase().includes(q) ||
        r.customer_phone.includes(q) ||
        (r.customer_email || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [requests, filterStatus, q, sortBy]);

  const newCount = requests.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">בקשות פרגולה</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {filtered.length !== requests.length ? `${filtered.length} מתוך ${requests.length}` : `${requests.length}`} בקשות
              {newCount > 0 && (
                <span className="ms-2 inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {newCount} חדשות
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-44 border-gray-200 text-sm h-9"><SelectValue placeholder="סנן לפי סטטוס" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הבקשות</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-full sm:w-36 border-gray-200 text-sm h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">חדש לישן</SelectItem>
                <SelectItem value="oldest">ישן לחדש</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש לפי שם, טלפון, אימייל…"
            className="w-full h-10 pr-9 pl-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-400" dir="rtl" />
          {searchQuery && (
            <button className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setSearchQuery("")}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <PencilRuler className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">{q ? "לא נמצאו בקשות תואמות" : "אין בקשות"}</p>
          {q && <button className="text-sm text-blue-500 hover:underline mt-1" onClick={() => setSearchQuery("")}>נקה חיפוש</button>}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((req) => {
            const st = getStatus(req.status);
            return (
              <button key={req.id} onClick={() => navigate(`/admin/pergola-requests/${req.id}`)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors text-start">
                <div className="shrink-0 text-center w-14">
                  <div className="text-xs font-bold text-gray-900">{new Date(req.created_at).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}</div>
                  <div className="text-[10px] text-gray-400">{new Date(req.created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{req.customer_name}</p>
                  <p className="text-xs text-gray-400 truncate" dir="ltr">{req.customer_phone}</p>
                </div>
                <div className="hidden sm:block text-xs text-gray-500 shrink-0">
                  {mmToCm(req.width)} x {mmToCm(req.length)} cm
                </div>
                <div className="hidden md:block text-xs text-gray-400 shrink-0">
                  {req.pergola_type === "pvc" ? "PVC" : "קבועה"}
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${st.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPergolaRequests;
