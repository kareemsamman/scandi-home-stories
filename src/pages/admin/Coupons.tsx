import { useState, useMemo } from "react";
import {
  Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight,
  Tag, Calendar, Users, Package, Percent, DollarSign, ChevronDown, ChevronUp, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCoupons, useSaveCoupon, useDeleteCoupon, useToggleCoupon, useCouponUsage, type Coupon } from "@/hooks/useCoupons";
import { useCategories } from "@/hooks/useDbData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseCouponDescription, stringifyCouponDescription, getLocalizedCouponDescription } from "@/lib/couponDescription";

const db = supabase as any;

const EMPTY_COUPON: Partial<Coupon> = {
  code: "", description: "", type: "percentage", value: 0,
  min_order_amount: 0, max_discount_amount: null, max_uses: null,
  max_uses_per_user: 1, valid_from: null, valid_until: null,
  product_ids: [], category_ids: [], is_active: true,
  admin_only: false, auto_apply: false, allowed_phones: [],
};

const statusBadge = (c: Coupon) => {
  if (!c.is_active) return { label: "Inactive", cls: "bg-gray-100 text-gray-500" };
  const now = new Date();
  if (c.valid_until && new Date(c.valid_until) < now) return { label: "Expired", cls: "bg-red-100 text-red-600" };
  if (c.valid_from && new Date(c.valid_from) > now) return { label: "Scheduled", cls: "bg-blue-100 text-blue-600" };
  if (c.max_uses !== null && c.uses >= c.max_uses) return { label: "Exhausted", cls: "bg-amber-100 text-amber-700" };
  return { label: "Active", cls: "bg-green-100 text-green-700" };
};

/* ── Usage detail panel ── */
const UsagePanel = ({ couponId }: { couponId: string }) => {
  const { data: uses = [] } = useCouponUsage(couponId);
  if (uses.length === 0) return <p className="text-xs text-gray-400 py-2">No uses yet.</p>;
  return (
    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
      {uses.map((u: any) => (
        <div key={u.id} className="flex items-center justify-between text-xs bg-gray-50 px-3 py-1.5 rounded-lg">
          <span className="text-gray-500">{u.order_number || "—"}</span>
          <span className="text-gray-700 font-medium">-₪{u.discount_amount}</span>
          <span className="text-gray-400">{new Date(u.used_at).toLocaleDateString("he-IL")}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Coupon Form Modal ── */
const CouponModal = ({
  coupon, onClose, categories, products,
}: {
  coupon: Partial<Coupon>;
  onClose: () => void;
  categories: any[];
  products: any[];
}) => {
  const [form, setForm] = useState<Partial<Coupon>>({ ...EMPTY_COUPON, ...coupon });
  const [productSearch, setProductSearch] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const save = useSaveCoupon();
  const { toast } = useToast();

  const set = (k: keyof Coupon, v: any) => setForm(p => ({ ...p, [k]: v }));

  const toggleId = (field: "product_ids" | "category_ids", id: string) => {
    setForm(p => {
      const arr = (p[field] as string[]) || [];
      return { ...p, [field]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
    });
  };

  const handleSave = async () => {
    if (!form.code?.trim()) return toast({ title: "Code is required", variant: "destructive" });
    if (form.type !== "free_shipping" && (!form.value || Number(form.value) <= 0)) return toast({ title: "Value must be > 0", variant: "destructive" });
    try {
      await save.mutateAsync(form as Coupon);
      toast({ title: (coupon as any).id ? "Coupon updated" : "Coupon created" });
      onClose();
    } catch (err: any) {
      toast({ title: "Error saving coupon", description: err?.message || String(err), variant: "destructive" });
    }
  };

  const filteredProducts = useMemo(() =>
    products.filter(p => !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku || "").toLowerCase().includes(productSearch.toLowerCase())),
    [products, productSearch]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">{(coupon as any).id ? "Edit Coupon" : "New Coupon"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Code + Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Code *</label>
            <Input value={form.code || ""} onChange={e => set("code", e.target.value.toUpperCase())} placeholder="SUMMER20" className="font-mono" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Description (Hebrew)</label>
              <Input
                dir="auto"
                value={parseCouponDescription(form.description).he}
                onChange={e => {
                  const cur = parseCouponDescription(form.description);
                  set("description", stringifyCouponDescription({ ...cur, he: e.target.value }));
                }}
                placeholder="הנחה 10% על כל המוצרים"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Description (Arabic)</label>
              <Input
                dir="auto"
                value={parseCouponDescription(form.description).ar}
                onChange={e => {
                  const cur = parseCouponDescription(form.description);
                  set("description", stringifyCouponDescription({ ...cur, ar: e.target.value }));
                }}
                placeholder="خصم 10% على كل المنتجات"
              />
            </div>
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {(["percentage", "fixed", "free_shipping"] as const).map(t => (
                  <button key={t} type="button" onClick={() => set("type", t)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${form.type === t ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                    {t === "percentage" ? "% Percent" : t === "fixed" ? "₪ Fixed" : "🚚 Free Ship"}
                  </button>
                ))}
              </div>
            </div>
            {form.type !== "free_shipping" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Discount Value {form.type === "percentage" ? "(%)" : "(₪)"}
              </label>
              <Input type="number" min={0} value={form.value || ""} onChange={e => set("value", +e.target.value)} />
            </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Max Discount (₪) <span className="text-gray-400 font-normal">optional cap</span></label>
              <Input type="number" min={0} placeholder="No cap" value={form.max_discount_amount ?? ""} onChange={e => set("max_discount_amount", e.target.value ? +e.target.value : null)} />
            </div>
          </div>

          {/* Min order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Minimum Order Amount (₪)</label>
              <Input type="number" min={0} value={form.min_order_amount || ""} onChange={e => set("min_order_amount", +e.target.value)} placeholder="0 = no minimum" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
              <button type="button" onClick={() => set("is_active", !form.is_active)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${form.is_active ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 text-gray-400"}`}>
                {form.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {form.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Valid From</label>
              <Input type="datetime-local" value={form.valid_from ? form.valid_from.slice(0, 16) : ""} onChange={e => set("valid_from", e.target.value ? new Date(e.target.value).toISOString() : null)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Valid Until</label>
              <Input type="datetime-local" value={form.valid_until ? form.valid_until.slice(0, 16) : ""} onChange={e => set("valid_until", e.target.value ? new Date(e.target.value).toISOString() : null)} />
            </div>
          </div>

          {/* Usage limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Total Usage Limit <span className="text-gray-400 font-normal">leave blank = unlimited</span></label>
              <Input type="number" min={1} placeholder="Unlimited" value={form.max_uses ?? ""} onChange={e => set("max_uses", e.target.value ? +e.target.value : null)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Uses Per User</label>
              <Input type="number" min={1} value={form.max_uses_per_user || 1} onChange={e => set("max_uses_per_user", +e.target.value)} />
            </div>
          </div>

          {/* Admin-only toggle */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <button type="button" onClick={() => set("admin_only", !form.admin_only)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${form.admin_only ? "text-purple-700" : "text-gray-500"}`}>
              {form.admin_only ? <ToggleRight className="w-5 h-5 text-purple-600" /> : <ToggleLeft className="w-5 h-5" />}
              Admin Only
            </button>
            <span className="text-xs text-gray-400">Only admin accounts can apply this coupon (e.g. free shipping for in-store orders)</span>
          </div>

          {/* Auto-apply toggle */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
            <button type="button" onClick={() => set("auto_apply", !form.auto_apply)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${form.auto_apply ? "text-amber-700" : "text-gray-500"}`}>
              {form.auto_apply ? <ToggleRight className="w-5 h-5 text-amber-600" /> : <ToggleLeft className="w-5 h-5" />}
              Auto-Apply (Site-wide Sale)
            </button>
            <span className="text-xs text-gray-500">Applied automatically to every cart during the date range — no code needed. Disable Admin-Only and phone restrictions for this to work.</span>
          </div>

          {/* Phone restriction */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              Phone Restriction <span className="text-gray-400 font-normal">(leave empty = all customers)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="05X-XXXXXXX"
                className="h-8 text-sm flex-1"
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const p = phoneInput.trim();
                    if (p && !(form.allowed_phones || []).includes(p)) {
                      setForm(prev => ({ ...prev, allowed_phones: [...(prev.allowed_phones || []), p] }));
                    }
                    setPhoneInput("");
                  }
                }}
              />
              <button type="button" className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700"
                onClick={() => {
                  const p = phoneInput.trim();
                  if (p && !(form.allowed_phones || []).includes(p)) {
                    setForm(prev => ({ ...prev, allowed_phones: [...(prev.allowed_phones || []), p] }));
                  }
                  setPhoneInput("");
                }}>Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.allowed_phones || []).map(phone => (
                <span key={phone} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium">
                  {phone}
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, allowed_phones: (prev.allowed_phones || []).filter(p => p !== phone) }))}>
                    <X className="w-3 h-3 text-blue-400 hover:text-blue-700" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Category restriction */}
          {categories.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">
                Category Restriction <span className="text-gray-400 font-normal">(leave empty = all categories)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat: any) => {
                  const sel = (form.category_ids || []).includes(cat.id);
                  return (
                    <button key={cat.id} type="button" onClick={() => toggleId("category_ids", cat.id)}
                      className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${sel ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                      {cat.name_he}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product restriction */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              Product Restriction <span className="text-gray-400 font-normal">(leave empty = all products)</span>
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products..." className="pl-8 h-8 text-sm" />
            </div>
            <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No products</p>
              ) : filteredProducts.slice(0, 50).map((p: any) => {
                const sel = (form.product_ids || []).includes(p.id);
                return (
                  <label key={p.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${sel ? "bg-blue-50" : ""}`}>
                    <input type="checkbox" checked={sel} onChange={() => toggleId("product_ids", p.id)} className="w-3.5 h-3.5 rounded" />
                    {p.images?.[0] && <img src={p.images[0]} alt="" className="w-7 h-7 rounded object-cover" />}
                    <span className="text-xs text-gray-700 flex-1 truncate">{p.name}</span>
                    {p.sku && <span className="text-[10px] text-gray-400">{p.sku}</span>}
                  </label>
                );
              })}
            </div>
            {(form.product_ids || []).length > 0 && (
              <p className="text-xs text-blue-600 mt-1">{form.product_ids!.length} product(s) selected</p>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <Button onClick={handleSave} disabled={save.isPending} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white">
            {save.isPending ? "Saving…" : (coupon as any).id ? "Save Changes" : "Create Coupon"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};

/* ── Main admin page ── */
const AdminCoupons = () => {
  const { data: coupons = [], isLoading } = useCoupons();
  const { data: categories = [] } = useCategories();
  const { data: allProducts = [] } = useQuery({
    queryKey: ["all_products_for_coupon"],
    queryFn: async () => {
      const { data } = await db.from("products").select("id, name, sku, images").order("name");
      return data || [];
    },
  });
  const del = useDeleteCoupon();
  const toggle = useToggleCoupon();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);
  const [expandedUsage, setExpandedUsage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    return coupons.filter(c => {
      if (search && !c.code.toLowerCase().includes(search.toLowerCase()) && !c.description?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus === "active" && (!c.is_active || (c.valid_until && new Date(c.valid_until) < now) || (c.max_uses !== null && c.uses >= c.max_uses))) return false;
      if (filterStatus === "inactive" && c.is_active) return false;
      if (filterStatus === "expired" && !(c.valid_until && new Date(c.valid_until) < now)) return false;
      return true;
    });
  }, [coupons, search, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
          <p className="text-gray-500 text-sm mt-1">{coupons.length} coupon codes</p>
        </div>
        <Button onClick={() => setEditing(EMPTY_COUPON)} className="bg-gray-900 hover:bg-gray-800 text-white">
          <Plus className="w-4 h-4 mr-2" /> New Coupon
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by code or note…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[["all", "All"], ["active", "Active"], ["inactive", "Inactive"], ["expired", "Expired"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === v ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-gray-400 text-center py-12">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No coupons found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(coupon => {
            const badge = statusBadge(coupon);
            const showUsage = expandedUsage === coupon.id;
            return (
              <div key={coupon.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Code + type icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${coupon.type === "percentage" ? "bg-purple-100" : coupon.type === "free_shipping" ? "bg-blue-100" : "bg-emerald-100"}`}>
                    {coupon.type === "percentage" ? <Percent className="w-5 h-5 text-purple-600" /> : coupon.type === "free_shipping" ? <span className="text-base">🚚</span> : <DollarSign className="w-5 h-5 text-emerald-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-base font-bold text-gray-900 tracking-wider">{coupon.code}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${badge.cls}`}>{badge.label}</span>
                      {coupon.description && <span className="text-xs text-gray-400 truncate max-w-xs">{coupon.description}</span>}
                    </div>

                    {/* Stats row */}
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                      <span className="font-semibold text-gray-800">
                        {coupon.type === "percentage" ? `${coupon.value}% off` : coupon.type === "free_shipping" ? "Free shipping" : `₪${coupon.value} off`}
                        {coupon.max_discount_amount ? ` (max ₪${coupon.max_discount_amount})` : ""}
                      </span>
                      {coupon.min_order_amount > 0 && <span>Min order: ₪{coupon.min_order_amount}</span>}
                      {coupon.valid_from && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(coupon.valid_from).toLocaleDateString("he-IL")}</span>}
                      {coupon.valid_until && <span className="flex items-center gap-1">→ {new Date(coupon.valid_until).toLocaleDateString("he-IL")}</span>}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {coupon.uses}{coupon.max_uses !== null ? `/${coupon.max_uses}` : ""} uses
                      </span>
                      {coupon.max_uses_per_user > 0 && <span>{coupon.max_uses_per_user}×/user</span>}
                      {coupon.product_ids?.length > 0 && <span className="flex items-center gap-1"><Package className="w-3 h-3" />{coupon.product_ids.length} products</span>}
                      {coupon.category_ids?.length > 0 && <span>{coupon.category_ids.length} categories</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggle.mutate({ id: coupon.id, is_active: !coupon.is_active })}
                      className={`p-2 rounded-lg transition-colors ${coupon.is_active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                      title={coupon.is_active ? "Deactivate" : "Activate"}
                    >
                      {coupon.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setEditing(coupon)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete ${coupon.code}?`)) del.mutate(coupon.id, { onSuccess: () => toast({ title: "Deleted" }) }); }}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {coupon.uses > 0 && (
                      <button onClick={() => setExpandedUsage(showUsage ? null : coupon.id)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                        {showUsage ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Usage log */}
                {showUsage && <UsagePanel couponId={coupon.id} />}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <CouponModal
          coupon={editing}
          onClose={() => setEditing(null)}
          categories={categories as any[]}
          products={allProducts}
        />
      )}
    </div>
  );
};

export default AdminCoupons;
