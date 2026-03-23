import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Package, MapPin, LogOut, Plus, Pencil, Trash2, Star, ChevronLeft, ChevronRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useOrders } from "@/hooks/useOrders";
import { useAddresses, useAddAddress, useUpdateAddress, useRemoveAddress, useSetDefaultAddress, SavedAddress } from "@/hooks/useAddresses";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AddressFields, AddressState, emptyAddress } from "@/components/AddressFields";
import { loadAllRecords } from "@/utils/cityStreetApi";
import { SEOHead } from '@/components/SEOHead';

/* ---------- Address fields: see top-of-file imports ---------- */

/* ---------- validation helpers ---------- */
const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validatePhone = (v: string) => /^0(5[0-9]|[2-4]|[7-9])\d{7}$/.test(v.replace(/[\s\-]/g, ""));

/* ---------- Floating Label Input ---------- */
const FloatingInput = ({
  name, label, value, onChange, onBlur, onFocus, error, type = "text", inputMode, inputRef, disabled,
}: {
  name: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void; onFocus?: () => void; error?: string; type?: string;
  inputMode?: "text" | "numeric" | "email" | "tel"; inputRef?: React.Ref<HTMLInputElement>;
  disabled?: boolean;
}) => {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;
  return (
    <div>
      <div className="relative">
        <input ref={inputRef} name={name} type={type} inputMode={inputMode} value={value} onChange={onChange}
          disabled={disabled}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          className={`peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 transition-colors ${
            disabled ? "bg-muted/30 text-muted-foreground cursor-not-allowed" :
            error ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-border focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))]"
          }`}
          placeholder=" "
        />
        <label className={`absolute start-4 transition-all duration-200 pointer-events-none ${
          isActive ? "top-1.5 text-[10px] text-muted-foreground" : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        }`}>{label}</label>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

/* ---------- Password Field with eye toggle ---------- */
const PasswordField = ({
  label, value, onChange, show, onToggle, error,
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; error?: string;
}) => {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;
  return (
    <div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=" "
          className={`w-full h-[48px] px-4 pt-4 pb-1 pe-11 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 transition-colors ${
            error ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-border focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))]"
          }`}
        />
        <label className={`absolute start-4 transition-all duration-200 pointer-events-none ${
          isActive ? "top-1.5 text-[10px] text-muted-foreground" : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        }`}>{label}</label>
        <button
          type="button"
          onClick={onToggle}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

type Tab = "orders" | "addresses" | "profile";

const Account = () => {
  const { t, localePath, locale } = useLocale();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const { user, loading, signOut, profile: authProfile } = useAuth();

  const { data: addresses = [], isLoading: addrLoading } = useAddresses();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const removeAddress = useRemoveAddress();
  const setDefault = useSetDefaultAddress();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate(localePath("/login"), { replace: true });
    }
  }, [loading, user, navigate, localePath]);

  const handleLogout = async () => {
    await signOut();
    navigate(localePath("/login"));
  };

  // Build profile object from Supabase auth data
  const profile = {
    firstName: authProfile?.first_name || "",
    lastName: authProfile?.last_name || "",
    email: user?.email || "",
    phone: authProfile?.phone || (user as any)?.user_metadata?.phone || "",
  };

  if (loading) {
    return (
      <Layout>
      <SEOHead noIndex={true} title="החשבון שלי | AMG Pergola" description="" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "orders", label: t("account.orders") },
    { id: "addresses", label: t("account.addresses") },
    { id: "profile", label: t("account.profile") },
  ];

  return (
    <Layout>
      <section className="mt-4 pb-8 md:pb-12">
        <div className="w-full max-w-[1000px] mx-auto px-6">
          <div className="flex items-center justify-between border-b border-border mb-8">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-semibold transition-colors relative ${
                    activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="account-tab-underline" className="absolute bottom-0 inset-x-0 h-0.5 bg-foreground" />
                  )}
                </button>
              ))}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 pb-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-4 h-4" />
              {t("auth.logout")}
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {activeTab === "orders" && <OrdersTab />}
              {activeTab === "addresses" && (
                <AddressesTab
                  addresses={addresses}
                  isLoading={addrLoading}
                  onAdd={(a) => addAddress.mutate(a)}
                  onUpdate={(id, u) => updateAddress.mutate({ id, updates: u })}
                  onRemove={(id) => removeAddress.mutate(id)}
                  onSetDefault={(id) => setDefault.mutate(id)}
                />
              )}
              {activeTab === "profile" && <ProfileTab profile={profile} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </Layout>
  );
};

/* ============ ORDERS TAB ============ */
const OrdersTab = () => {
  const { t, localePath, locale } = useLocale();
  const { data: orders = [], isLoading } = useOrders();
  const { isAdmin } = useAuth();

  const ArrowIcon = locale === "he" || locale === "ar" ? ChevronLeft : ChevronRight;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold text-foreground mb-2">{t("account.noOrders")}</p>
        <p className="text-sm text-muted-foreground mb-6">{t("account.noOrdersText")}</p>
        <Link to={localePath("/shop")} className="h-12 px-8 flex items-center justify-center text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors">
          {t("cart.startShopping")}
        </Link>
      </div>
    );
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "waiting_approval": return t("account.statusWaitingApproval");
      case "in_process":       return t("account.statusInProcess");
      case "in_delivery":      return t("account.statusInDelivery");
      case "not_approved":     return t("account.statusNotApproved");
      case "cancelled":        return t("account.statusCancelled");
      // legacy
      case "pending":   return t("account.statusPending");
      case "confirmed": return t("account.statusConfirmed");
      case "shipped":   return t("account.statusShipped");
      case "delivered": return t("account.statusDelivered");
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "waiting_approval":
      case "pending":   return "text-amber-700 bg-amber-50";
      case "in_process":
      case "confirmed": return "text-blue-700 bg-blue-50";
      case "in_delivery":
      case "shipped":   return "text-purple-700 bg-purple-50";
      case "delivered": return "text-green-700 bg-green-50";
      case "not_approved": return "text-red-700 bg-red-50";
      case "cancelled": return "text-gray-500 bg-gray-100";
      default: return "text-muted-foreground bg-muted/20";
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const itemsSum = (order.items || []).reduce((s, i) => s + i.price * i.quantity, 0);
        const shippingDisplay = order.shippingCost > 0
          ? order.shippingCost
          : Math.max(0, order.total - itemsSum - (order.discountAmount || 0));
        return (
        <Link
          key={order.id}
          to={localePath(`/account/order/${order.id}`)}
          className="block bg-white rounded-2xl border border-border hover:shadow-md hover:border-foreground/20 transition-all group overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
            <div>
              <p className="text-sm font-bold text-foreground">{t("account.orderNumber")} {order.orderNumber}</p>
              {isAdmin && order.firstName && (
                <p className="text-sm font-semibold text-blue-600 mt-0.5">{order.firstName} {order.lastName || ""}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{order.date}</p>
            </div>
            <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${statusColor(order.status)}`}>
              {statusLabel(order.status)}
            </span>
          </div>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div className="divide-y divide-border/50">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-border shrink-0 bg-muted/20">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground leading-snug">{item.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {item.color && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                          {t("contractor.color")}: {item.color}
                        </span>
                      )}
                      {item.size && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                          {locale === "ar" ? "الطول" : "אורך"}: {item.size}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{t("common.currency")}{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delivery row */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/60">
            <span className="text-xs text-muted-foreground">{locale === "ar" ? "توصيل" : "משלוח"}</span>
            <span className="text-xs font-medium text-foreground">
              {shippingDisplay > 0 ? `${t("common.currency")}${shippingDisplay.toLocaleString()}` : "חינם"}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 bg-muted/20 border-t border-border/60">
            <span className="text-xs text-muted-foreground">{t("cart.total")}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground">{t("common.currency")}{order.total.toLocaleString()}</span>
              <ArrowIcon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </div>
        </Link>
        );
      })}
    </div>
  );
};

/* ============ ADDRESSES TAB ============ */
interface AddressesTabProps {
  addresses: SavedAddress[];
  isLoading: boolean;
  onAdd: (address: Omit<SavedAddress, "id">) => void;
  onUpdate: (id: string, data: Partial<SavedAddress>) => void;
  onRemove: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const AddressesTab = ({ addresses, isLoading, onAdd, onUpdate, onRemove, onSetDefault }: AddressesTabProps) => {
  const { t } = useLocale();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = (data: Omit<SavedAddress, "id">) => {
    if (editingId) {
      onUpdate(editingId, data);
      setEditingId(null);
    } else {
      onAdd(data);
    }
    setShowForm(false);
  };

  const handleEdit = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setShowForm(true);
  };

  const editingAddress = editingId ? addresses.find((a) => a.id === editingId) : undefined;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">{t("account.savedAddresses")}</h2>
        {!showForm && (
          <button onClick={() => { setEditingId(null); setShowForm(true); }} className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors">
            <Plus className="w-4 h-4" />
            {t("account.addAddress")}
          </button>
        )}
      </div>

      {showForm && (
        <AddressForm initial={editingAddress} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingId(null); }} />
      )}

      {!showForm && addresses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t("account.noAddresses")}</p>
        </div>
      )}

      {!showForm && addresses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className={`bg-white rounded-xl border p-5 relative transition-colors ${addr.isDefault ? "border-foreground/30" : "border-border"}`}>
              {addr.isDefault && (
                <span className="absolute top-3 end-3 text-[10px] font-semibold text-foreground bg-accent/30 px-2 py-0.5 rounded-full">
                  {t("account.defaultAddress")}
                </span>
              )}
              <p className="text-sm font-semibold">{addr.firstName} {addr.lastName}</p>
              <p className="text-sm text-muted-foreground mt-1">{addr.city}</p>
              <p className="text-sm text-muted-foreground">{addr.street} {addr.houseNumber}{addr.apartment ? `, ${addr.apartment}` : ""}</p>
              <p className="text-sm text-muted-foreground">{addr.phone}</p>
              <div className="flex gap-3 mt-4 pt-3 border-t border-border flex-wrap">
                <button onClick={() => handleEdit(addr)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> {t("account.edit")}
                </button>
                <button onClick={() => onRemove(addr.id)} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> {t("account.delete")}
                </button>
                {!addr.isDefault && (
                  <button onClick={() => onSetDefault(addr.id)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ms-auto">
                    <Star className="w-3.5 h-3.5" /> {t("account.setDefault")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============ ADDRESS FORM ============ */
interface AddressFormProps {
  initial?: SavedAddress;
  onSave: (data: Omit<SavedAddress, "id">) => void;
  onCancel: () => void;
}

const AddressForm = ({ initial, onSave, onCancel }: AddressFormProps) => {
  const { t } = useLocale();
  const [form, setForm] = useState({
    firstName: initial?.firstName || "",
    lastName: initial?.lastName || "",
    phone: initial?.phone || "",
  });
  const [addressState, setAddressState] = useState<AddressState>({
    city: initial?.city || "",
    street: initial?.street || "",
    houseNumber: initial?.houseNumber || "",
    apartment: initial?.apartment || "",
    citySelected: !!initial?.city,
    streetSelected: !!initial?.street,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addrTouched, setAddrTouched] = useState<Partial<Record<"city"|"street"|"houseNumber", boolean>>>({});

  useEffect(() => { loadAllRecords(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setForm((p) => ({ ...p, phone: value.replace(/\D/g, "").slice(0, 10) }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = t("checkout.firstNameRequired");
    if (!form.lastName.trim()) errs.lastName = t("checkout.lastNameRequired");
    if (!form.phone.trim()) errs.phone = t("checkout.phoneRequired");
    else if (!validatePhone(form.phone)) errs.phone = t("checkout.invalidPhone");
    if (!addressState.city.trim()) errs.city = t("account.cityRequired");
    if (!addressState.street.trim()) errs.street = t("account.streetRequired");
    if (!addressState.houseNumber.trim()) errs.houseNumber = t("account.houseNumberRequired");
    setErrors(errs);
    setAddrTouched({ city: true, street: true, houseNumber: true });
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      city: addressState.city,
      street: addressState.street,
      houseNumber: addressState.houseNumber,
      apartment: addressState.apartment,
      isDefault: initial?.isDefault ?? false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 mb-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FloatingInput name="firstName" label={t("checkout.firstName")} value={form.firstName} onChange={handleChange} error={errors.firstName} />
        <FloatingInput name="lastName" label={t("checkout.lastName")} value={form.lastName} onChange={handleChange} error={errors.lastName} />
      </div>
      <FloatingInput name="phone" label={t("checkout.phone")} value={form.phone} onChange={handleChange} type="tel" inputMode="numeric" error={errors.phone} />
      <AddressFields
        value={addressState}
        onChange={setAddressState}
        errors={{ city: errors.city, street: errors.street, houseNumber: errors.houseNumber }}
        touched={addrTouched}
        onBlur={(field) => setAddrTouched(p => ({ ...p, [field]: true }))}
      />
      <div className="flex gap-3 pt-2">
        <button type="submit" className="h-12 px-8 text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors">
          {t("account.saveAddress")}
        </button>
        <button type="button" onClick={onCancel} className="h-12 px-6 text-sm font-semibold border border-border text-foreground rounded-[1.875rem] hover:bg-muted/50 transition-colors">
          {t("account.cancel")}
        </button>
      </div>
    </form>
  );
};

/* ============ PROFILE TAB ============ */
const ProfileTab = ({ profile }: { profile: { firstName: string; lastName: string; email: string; phone: string } }) => {
  const { t } = useLocale();
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({ ...profile });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Password change
  const [pwForm, setPwForm] = useState({ newPassword: "", confirmPassword: "" });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    setForm({ ...profile });
  }, [profile.firstName, profile.lastName, profile.email, profile.phone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setForm((p) => ({ ...p, phone: value.replace(/\D/g, "").slice(0, 10) }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = t("checkout.firstNameRequired");
    if (!form.lastName.trim()) errs.lastName = t("checkout.lastNameRequired");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;
    setSaving(true);
    setSaveError("");
    try {
      const { error } = await supabase.from("profiles").update({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
      }).eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError(t("account.saveError") || "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const validatePw = (): boolean => {
    const errs: Record<string, string> = {};
    if (!pwForm.newPassword) errs.newPassword = t("account.passwordRequired") || "נדרשת סיסמה";
    else if (pwForm.newPassword.length < 6) errs.newPassword = t("account.passwordTooShort") || "לפחות 6 תווים";
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = t("account.passwordMismatch") || "הסיסמאות אינן תואמות";
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePw()) return;
    setPwSaving(true);
    setPwError("");
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword });
      if (error) throw error;
      setPwSaved(true);
      setPwForm({ newPassword: "", confirmPassword: "" });
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err: unknown) {
      setPwError((err as { message?: string })?.message || t("account.saveError") || "שגיאה בשמירה");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      {/* Personal info */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-bold">{t("account.personalInfo")}</h2>
        <FloatingInput name="email" label={t("account.username")} value={form.email} onChange={() => {}} type="email" disabled />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FloatingInput name="firstName" label={t("checkout.firstName")} value={form.firstName} onChange={handleChange} error={errors.firstName} />
          <FloatingInput name="lastName" label={t("checkout.lastName")} value={form.lastName} onChange={handleChange} error={errors.lastName} />
        </div>
        <FloatingInput name="phone" label={t("checkout.phone")} value={form.phone} onChange={() => {}} type="tel" inputMode="numeric" disabled />
        {saveError && <p className="text-xs text-red-500">{saveError}</p>}
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={saving} className="h-12 px-8 text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("account.saveChanges")}
          </button>
          {saved && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-green-600 font-medium">
              ✓ {t("account.saved")}
            </motion.span>
          )}
        </div>
      </form>

      {/* Password change */}
      <form onSubmit={handlePwSubmit} className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-bold">{t("account.changePassword") || "שינוי סיסמה"}</h2>
        <PasswordField
          label={t("account.newPassword") || "סיסמה חדשה"}
          value={pwForm.newPassword}
          onChange={(v) => { setPwForm((p) => ({ ...p, newPassword: v })); if (pwErrors.newPassword) setPwErrors((p) => ({ ...p, newPassword: "" })); }}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
          error={pwErrors.newPassword}
        />
        <PasswordField
          label={t("account.confirmPassword") || "אימות סיסמה"}
          value={pwForm.confirmPassword}
          onChange={(v) => { setPwForm((p) => ({ ...p, confirmPassword: v })); if (pwErrors.confirmPassword) setPwErrors((p) => ({ ...p, confirmPassword: "" })); }}
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          error={pwErrors.confirmPassword}
        />
        {pwError && <p className="text-xs text-red-500">{pwError}</p>}
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={pwSaving} className="h-12 px-8 text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors disabled:opacity-60">
            {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("account.updatePassword") || "עדכן סיסמה"}
          </button>
          {pwSaved && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-green-600 font-medium">
              ✓ {t("account.saved")}
            </motion.span>
          )}
        </div>
      </form>
    </div>
  );
};

export default Account;
