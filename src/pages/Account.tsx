import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Package, MapPin, User, LogOut, Plus, Pencil, Trash2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useOrders } from "@/hooks/useOrders";
import { useAddresses, SavedAddress } from "@/hooks/useAddresses";
import { useProfile } from "@/hooks/useProfile";

/* ---------- Israeli streets API ---------- */
const GOV_IL_API_URL = "https://data.gov.il/api/3/action/datastore_search";
const GOV_IL_STREETS_RESOURCE_ID = "bf185c7f-1a4e-4662-88c5-fa118a244bda";

interface CityStreetResult {
  city: string;
  street: string;
  display: string;
}

const fetchCityStreets = async (query: string): Promise<CityStreetResult[]> => {
  try {
    const url = `${GOV_IL_API_URL}?resource_id=${GOV_IL_STREETS_RESOURCE_ID}&limit=20&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const records = data?.result?.records ?? [];
    const seen = new Set<string>();
    return records
      .map((r: Record<string, unknown>) => {
        const city = ((r["city_name"] as string) || "").trim();
        const street = ((r["street_name"] as string) || "").trim();
        if (!city) return null;
        const display = street ? `${city} – ${street}` : city;
        if (seen.has(display)) return null;
        seen.add(display);
        return { city, street, display };
      })
      .filter(Boolean) as CityStreetResult[];
  } catch {
    return [];
  }
};

/* ---------- Floating Label Input ---------- */
const FloatingInput = ({
  name, label, value, onChange, onBlur, onFocus, error, type = "text", inputMode, inputRef,
}: {
  name: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void; onFocus?: () => void; error?: string; type?: string;
  inputMode?: "text" | "numeric" | "email" | "tel"; inputRef?: React.Ref<HTMLInputElement>;
}) => {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;
  return (
    <div>
      <div className="relative">
        <input ref={inputRef} name={name} type={type} inputMode={inputMode} value={value} onChange={onChange}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          className={`peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 transition-colors ${
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

type Tab = "orders" | "addresses" | "profile";

const Account = () => {
  const { t, localePath } = useLocale();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  const orders = useOrders((s) => s.orders);
  const addresses = useAddresses((s) => s.addresses);
  const addAddress = useAddresses((s) => s.addAddress);
  const updateAddress = useAddresses((s) => s.updateAddress);
  const removeAddress = useAddresses((s) => s.removeAddress);
  const profile = useProfile((s) => s.profile);
  const updateProfile = useProfile((s) => s.updateProfile);

  const handleLogout = () => {
    navigate(localePath("/"));
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "orders", label: t("account.orders") },
    { id: "addresses", label: t("account.addresses") },
    { id: "profile", label: t("account.profile") },
  ];

  return (
    <Layout>
      <section className="mt-14 md:mt-20 py-8 md:py-12">
        <div className="w-full max-w-[1000px] mx-auto px-6">
          {/* Tab navigation */}
          <div className="flex items-center justify-between border-b border-border mb-8">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-semibold transition-colors relative ${
                    activeTab === tab.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="account-tab-underline"
                      className="absolute bottom-0 inset-x-0 h-0.5 bg-foreground"
                    />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 pb-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t("auth.logout")}
            </button>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "orders" && <OrdersTab />}
              {activeTab === "addresses" && (
                <AddressesTab
                  addresses={addresses}
                  onAdd={addAddress}
                  onUpdate={updateAddress}
                  onRemove={removeAddress}
                />
              )}
              {activeTab === "profile" && (
                <ProfileTab profile={profile} onUpdate={updateProfile} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </Layout>
  );
};

/* ============ ORDERS TAB ============ */
const OrdersTab = () => {
  const { t, localePath } = useLocale();
  const orders = useOrders((s) => s.orders);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold text-foreground mb-2">{t("account.noOrders")}</p>
        <p className="text-sm text-muted-foreground mb-6">{t("account.noOrdersText")}</p>
        <Link
          to={localePath("/shop")}
          className="h-12 px-8 flex items-center justify-center text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors"
        >
          {t("cart.startShopping")}
        </Link>
      </div>
    );
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "pending": return t("account.statusPending");
      case "confirmed": return t("account.statusConfirmed");
      case "shipped": return t("account.statusShipped");
      case "delivered": return t("account.statusDelivered");
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-amber-600 bg-amber-50";
      case "confirmed": return "text-blue-600 bg-blue-50";
      case "shipped": return "text-purple-600 bg-purple-50";
      case "delivered": return "text-green-600 bg-green-50";
      default: return "text-muted-foreground bg-muted/20";
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-foreground">{t("account.orderNumber")} {order.orderNumber}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{order.date}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(order.status)}`}>
              {statusLabel(order.status)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-sm text-muted-foreground">{t("cart.total")}</span>
            <span className="text-sm font-bold">{t("common.currency")}{order.total.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============ ADDRESSES TAB ============ */
interface AddressesTabProps {
  addresses: SavedAddress[];
  onAdd: (address: Omit<SavedAddress, "id">) => void;
  onUpdate: (id: string, data: Partial<SavedAddress>) => void;
  onRemove: (id: string) => void;
}

const AddressesTab = ({ addresses, onAdd, onUpdate, onRemove }: AddressesTabProps) => {
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
          <button
            onClick={() => { setEditingId(null); setShowForm(true); }}
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("account.addAddress")}
          </button>
        )}
      </div>

      {showForm && (
        <AddressForm
          initial={editingAddress}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingId(null); }}
        />
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
            <div key={addr.id} className="bg-white rounded-xl border border-border p-5 relative">
              {addr.isDefault && (
                <span className="absolute top-3 end-3 text-[10px] font-semibold text-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                  {t("account.defaultAddress")}
                </span>
              )}
              <p className="text-sm font-semibold">{addr.firstName} {addr.lastName}</p>
              <p className="text-sm text-muted-foreground mt-1">{addr.city}</p>
              <p className="text-sm text-muted-foreground">{addr.street} {addr.houseNumber}{addr.apartment ? `, ${addr.apartment}` : ""}</p>
              <p className="text-sm text-muted-foreground">{addr.phone}</p>
              <div className="flex gap-3 mt-4 pt-3 border-t border-border">
                <button onClick={() => handleEdit(addr)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> {t("account.edit")}
                </button>
                <button onClick={() => onRemove(addr.id)} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> {t("account.delete")}
                </button>
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
    city: initial?.city || "",
    street: initial?.street || "",
    houseNumber: initial?.houseNumber || "",
    apartment: initial?.apartment || "",
  });
  const [cityQuery, setCityQuery] = useState(initial?.city || "");
  const [citySuggestions, setCitySuggestions] = useState<CityStreetResult[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [citySelected, setCitySelected] = useState(!!initial?.city);
  const cityRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCitySuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (citySelected) return;
    if (cityQuery.trim().length < 2) { setCitySuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchCityStreets(cityQuery.trim());
      setCitySuggestions(results);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [cityQuery, citySelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setForm((p) => ({ ...p, phone: value.replace(/\D/g, "").slice(0, 10) }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone || !form.city || !form.street || !form.houseNumber) return;
    onSave({ ...form, isDefault: initial?.isDefault ?? false });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 mb-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FloatingInput name="firstName" label={t("checkout.firstName")} value={form.firstName} onChange={handleChange} />
        <FloatingInput name="lastName" label={t("checkout.lastName")} value={form.lastName} onChange={handleChange} />
      </div>
      <FloatingInput name="phone" label={t("checkout.phone")} value={form.phone} onChange={handleChange} type="tel" inputMode="numeric" />
      <div ref={cityRef} className="relative">
        <FloatingInput
          name="city"
          label={t("checkout.city")}
          value={cityQuery || form.city}
          onChange={(e) => { setCityQuery(e.target.value); setForm((p) => ({ ...p, city: e.target.value })); setCitySelected(false); setShowCitySuggestions(true); }}
          onFocus={() => setShowCitySuggestions(true)}
        />
        {showCitySuggestions && citySuggestions.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {citySuggestions.map((result, idx) => (
              <button key={`${result.display}-${idx}`} type="button" className="w-full text-start px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                onMouseDown={(e) => { e.preventDefault(); setForm((p) => ({ ...p, city: result.city })); setCityQuery(result.display); setCitySelected(true); setShowCitySuggestions(false); }}>
                {result.display}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FloatingInput name="street" label={t("account.street")} value={form.street} onChange={handleChange} />
        <FloatingInput name="houseNumber" label={t("account.houseNumber")} value={form.houseNumber} onChange={handleChange} />
      </div>
      <FloatingInput name="apartment" label={t("checkout.apartment")} value={form.apartment} onChange={handleChange} />
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
interface ProfileTabProps {
  profile: { firstName: string; lastName: string; email: string; phone: string };
  onUpdate: (data: Partial<{ firstName: string; lastName: string; email: string; phone: string }>) => void;
}

const ProfileTab = ({ profile, onUpdate }: ProfileTabProps) => {
  const { t } = useLocale();
  const [form, setForm] = useState({ ...profile });
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setForm((p) => ({ ...p, phone: value.replace(/\D/g, "").slice(0, 10) }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 max-w-lg space-y-4">
      <h2 className="text-lg font-bold mb-2">{t("account.personalInfo")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FloatingInput name="firstName" label={t("checkout.firstName")} value={form.firstName} onChange={handleChange} />
        <FloatingInput name="lastName" label={t("checkout.lastName")} value={form.lastName} onChange={handleChange} />
      </div>
      <FloatingInput name="email" label={t("checkout.email")} value={form.email} onChange={handleChange} type="email" inputMode="email" />
      <FloatingInput name="phone" label={t("checkout.phone")} value={form.phone} onChange={handleChange} type="tel" inputMode="numeric" />
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" className="h-12 px-8 text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors">
          {t("account.saveChanges")}
        </button>
        {saved && (
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-sm text-green-600 font-medium"
          >
            ✓ {t("account.saved")}
          </motion.span>
        )}
      </div>
    </form>
  );
};

export default Account;
