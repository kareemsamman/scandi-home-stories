import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronRight, Download, Loader2 } from "lucide-react";
import { usePergolaRequestById, useUpdatePergolaRequest } from "@/hooks/usePergolaRequests";
import { useToast } from "@/hooks/use-toast";
import { computeSpecs } from "@/lib/pergolaRules";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PergolaTopView } from "@/components/pergola/PergolaTopView";
import { PergolaFrontView } from "@/components/pergola/PergolaFrontView";
import { PergolaIsometricView } from "@/components/pergola/PergolaIsometricView";
import type { DrawingConfig, PergolaRequestStatus, MountType, LightingType } from "@/types/pergola";

const STATUSES: { value: PergolaRequestStatus; label: string }[] = [
  { value: "new", label: "חדשה" },
  { value: "in_review", label: "בבדיקה" },
  { value: "ready_for_quote", label: "מוכנה להצעה" },
  { value: "quoted", label: "הוצעה" },
  { value: "closed", label: "סגורה" },
];

const MOUNT_LABELS: Record<string, string> = { wall: "צמוד קיר", freestanding: "עצמאי" };
const LIGHTING_LABELS: Record<string, string> = { none: "ללא", white: "לבנה", rgb: "RGB" };
const PERGOLA_LABELS: Record<string, string> = {
  bioclimatic: "ביוקלימטית", motorized: "למלות מוטורית", fixed: "קבועה", retractable: "נפתחת",
};
const MODULE_LABELS: Record<string, string> = { single: "יחיד", double: "כפול", triple: "משולש", custom: "דורש בדיקה" };

const AdminPergolaRequestDetail = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: req, isLoading } = usePergolaRequestById(requestId!);
  const updateRequest = useUpdatePergolaRequest();

  const [status, setStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");
  const [activeView, setActiveView] = useState<"top" | "front" | "isometric">("top");
  const [editingSpecs, setEditingSpecs] = useState(false);
  const [editedFrontPosts, setEditedFrontPosts] = useState<number>(0);
  const [editedBackPosts, setEditedBackPosts] = useState<number>(0);

  // Sync state when data loads
  if (req && !status) {
    setStatus(req.status);
    setAdminNotes(req.admin_notes || "");
    setEditedFrontPosts(req.front_post_count);
    setEditedBackPosts(req.back_post_count);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!req) {
    return <div className="text-center py-20 text-gray-400">הבקשה לא נמצאה</div>;
  }

  const specs = computeSpecs({ width: req.width, length: req.length, mountType: req.mount_type });
  const displaySpecs = {
    ...specs,
    frontPostCount: editingSpecs ? editedFrontPosts : req.front_post_count,
    backPostCount: editingSpecs ? editedBackPosts : req.back_post_count,
  };

  const drawingConfig: DrawingConfig = {
    width: req.width,
    length: req.length,
    height: req.height || 2500,
    mountType: req.mount_type as MountType,
    lighting: req.lighting as LightingType,
    specs: displaySpecs,
    frameColor: req.frame_color || "#333333",
    roofColor: req.roof_color || "#CCCCCC",
  };

  const handleSave = async () => {
    const updates: Record<string, any> = {
      id: req.id,
      status,
      admin_notes: adminNotes,
    };
    if (editingSpecs) {
      updates.admin_modified_config = {
        front_post_count: editedFrontPosts,
        back_post_count: editedBackPosts,
      };
      updates.front_post_count = editedFrontPosts;
      updates.back_post_count = editedBackPosts;
    }
    try {
      await updateRequest.mutateAsync(updates);
      toast({ title: "הבקשה עודכנה" });
      setEditingSpecs(false);
    } catch {
      toast({ title: "שגיאה", description: "לא ניתן לעדכן", variant: "destructive" });
    }
  };

  const handleDownloadPdf = () => {
    if (!req.pdf_url) return;
    const link = document.createElement("a");
    link.href = req.pdf_url;
    link.download = `pergola-request-${req.id.slice(0, 8)}.pdf`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => navigate("/admin/pergola-requests")}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
      >
        <ChevronRight className="w-4 h-4" />
        חזרה לרשימה
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{req.customer_name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date(req.created_at).toLocaleDateString("he-IL")} &middot; {req.customer_phone}
          </p>
        </div>
        {req.pdf_url && (
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Download className="w-4 h-4" />
            הורד PDF
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column: Details */}
        <div className="space-y-6">
          {/* Customer info */}
          <Card title="פרטי לקוח">
            <Row label="שם" value={req.customer_name} />
            <Row label="טלפון" value={req.customer_phone} dir="ltr" />
            {req.customer_email && <Row label="אימייל" value={req.customer_email} dir="ltr" />}
          </Card>

          {/* Dimensions */}
          <Card title="מידות">
            <Row label="רוחב" value={`${req.width} mm`} />
            <Row label="עומק / הטלה" value={`${req.length} mm`} />
            {req.height && <Row label="גובה" value={`${req.height} mm`} />}
          </Card>

          {/* Configuration */}
          <Card title="תצורה">
            <Row label="סוג פרגולה" value={PERGOLA_LABELS[req.pergola_type] || req.pergola_type} />
            <Row label="סוג התקנה" value={MOUNT_LABELS[req.mount_type] || req.mount_type} />
            <Row label="התקנה מקצועית" value={req.installation ? "כן" : "לא"} />
            <Row label="תאורה" value={LIGHTING_LABELS[req.lighting] || req.lighting} />
            <Row label="גג סנטף" value={req.santaf_roofing ? "כן" : "לא"} />
            <Row label="צבע מסגרת" value={req.frame_color} color={req.frame_color} />
            <Row label="צבע גג" value={req.roof_color} color={req.roof_color} />
          </Card>

          {/* Technical specs */}
          <Card title="מפרט טכני">
            <Row label="מודול" value={MODULE_LABELS[req.module_classification] || req.module_classification} />
            <Row label="נשאים" value={String(req.carrier_count)} />
            {editingSpecs ? (
              <>
                <div className="flex items-center gap-3 py-1">
                  <span className="text-xs text-gray-400 w-28">עמודים קדמיים</span>
                  <Input
                    type="number" min={2} max={10}
                    value={editedFrontPosts}
                    onChange={(e) => setEditedFrontPosts(Number(e.target.value))}
                    className="w-20 h-8 text-sm"
                  />
                </div>
                {req.mount_type === "freestanding" && (
                  <div className="flex items-center gap-3 py-1">
                    <span className="text-xs text-gray-400 w-28">עמודים אחוריים</span>
                    <Input
                      type="number" min={2} max={10}
                      value={editedBackPosts}
                      onChange={(e) => setEditedBackPosts(Number(e.target.value))}
                      className="w-20 h-8 text-sm"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <Row label="עמודים קדמיים" value={String(req.front_post_count)} />
                {req.back_post_count > 0 && <Row label="עמודים אחוריים" value={String(req.back_post_count)} />}
              </>
            )}
            <button
              onClick={() => setEditingSpecs(!editingSpecs)}
              className="text-xs text-blue-500 hover:underline mt-1"
            >
              {editingSpecs ? "סגור עריכה" : "ערוך עמודים"}
            </button>
          </Card>

          {/* Notes from customer */}
          {req.notes && (
            <Card title="הערות הלקוח">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{req.notes}</p>
            </Card>
          )}
        </div>

        {/* Right column: Preview + Admin */}
        <div className="space-y-6">
          {/* Visual preview */}
          <Card title="תצוגה מקדימה">
            <div className="flex border-b border-gray-100 mb-3">
              {(["top", "front", "isometric"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveView(v)}
                  className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                    activeView === v ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"
                  }`}
                >
                  {v === "top" ? "מבט עליון" : v === "front" ? "מבט קדמי" : "תלת מימד"}
                </button>
              ))}
            </div>
            <div className="bg-gray-50 rounded-lg border border-gray-100 p-3 min-h-[250px] flex items-center justify-center">
              {activeView === "top" && <PergolaTopView config={drawingConfig} />}
              {activeView === "front" && <PergolaFrontView config={drawingConfig} />}
              {activeView === "isometric" && <PergolaIsometricView config={drawingConfig} />}
            </div>
          </Card>

          {/* Admin controls */}
          <Card title="ניהול בקשה">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600">סטטוס</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-gray-600">הערות פנימיות</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  placeholder="הערות לשימוש פנימי בלבד..."
                />
              </div>

              <button
                onClick={handleSave}
                disabled={updateRequest.isPending}
                className="w-full bg-gray-900 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {updateRequest.isPending ? "שומר..." : "שמור שינויים"}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value, dir, color }: { label: string; value: string; dir?: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm text-gray-700 flex items-center gap-2" dir={dir}>
        {color && (
          <span className="w-4 h-4 rounded border border-gray-200 shrink-0" style={{ backgroundColor: color }} />
        )}
        {value}
      </span>
    </div>
  );
}

export default AdminPergolaRequestDetail;
