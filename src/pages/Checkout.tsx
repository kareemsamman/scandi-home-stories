import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useLocale } from "@/i18n/useLocale";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import logoWhite from "@/assets/logo-white.png";

/* ---------- icons ---------- */
const CartBagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" focusable="false" aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1">
    <path d="m2.007 10.156.387-4.983a1 1 0 0 1 .997-.923h7.218a1 1 0 0 1 .997.923l.387 4.983c.11 1.403-1.16 2.594-2.764 2.594H4.771c-1.605 0-2.873-1.19-2.764-2.594" />
    <path d="M5 3.5c0-1.243.895-2.25 2-2.25S9 2.257 9 3.5V5c0 1.243-.895 2.25-2 2.25S5 6.243 5 5z" />
  </svg>
);

const LockIcon = () => (
  <svg role="presentation" fill="none" focusable="false" strokeWidth="2" width="18" height="18" viewBox="0 0 24 24">
    <path d="M3.236 18.182a5.071 5.071 0 0 0 4.831 4.465 114.098 114.098 0 0 0 7.865-.001 5.07 5.07 0 0 0 4.831-4.464 23.03 23.03 0 0 0 .165-2.611c0-.881-.067-1.752-.165-2.61a5.07 5.07 0 0 0-4.83-4.465c-1.311-.046-2.622-.07-3.933-.069a109.9 109.9 0 0 0-3.933.069 5.07 5.07 0 0 0-4.83 4.466 23.158 23.158 0 0 0-.165 2.609c0 .883.067 1.754.164 2.61Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" />
    <path d="M17 8.43V6.285A5 5 0 0 0 7 6.286V8.43" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 17.714a2.143 2.143 0 1 0 0-4.286 2.143 2.143 0 0 0 0 4.286Z" stroke="currentColor" />
  </svg>
);

/* ---------- Israeli streets API (includes city + street) ---------- */
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

/* ---------- validation ---------- */
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
}

const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validatePhone = (v: string) => /^\d{10}$/.test(v.replace(/\s/g, ""));

/* ---------- Floating Label Input ---------- */
const FloatingInput = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  type = "text",
  inputMode,
  inputRef,
  autoComplete = "off",
}: {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  type?: string;
  inputMode?: "text" | "numeric" | "email" | "tel";
  inputRef?: React.Ref<HTMLInputElement>;
  autoComplete?: string;
}) => {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;

  return (
    <div>
      <div className="relative">
        <input
          ref={inputRef}
          name={name}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={onChange}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          autoComplete={autoComplete}
          className={`peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 transition-colors ${
            error
              ? "border-red-400 focus:ring-red-200 focus:border-red-400"
              : "border-border focus:ring-[#4f6df5]/30 focus:border-[#4f6df5]"
          }`}
          placeholder=" "
        />
        <label
          className={`absolute start-4 transition-all duration-200 pointer-events-none ${
            isActive
              ? "top-1.5 text-[10px] text-muted-foreground"
              : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
          }`}
        >
          {label}
        </label>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

/* ---------- Skeleton ---------- */
const CheckoutSkeleton = () => (
  <div className="min-h-screen" style={{ backgroundColor: "rgb(242,242,242)" }}>
    <header className="sticky top-0 z-30" style={{ backgroundColor: "rgb(242,242,242)", borderBottom: "1px solid rgb(210,210,210)" }}>
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 md:px-10" style={{ height: 76 }}>
        <div className="h-12 w-28 bg-muted/40 rounded animate-pulse" />
        <div className="h-8 w-8 bg-muted/40 rounded-full animate-pulse" />
      </div>
    </header>
    <main className="w-full">
      <div className="grid md:grid-cols-[1fr_1px_1fr] gap-0">
        <div className="flex justify-end">
          <div className="w-full max-w-[600px] px-6 md:px-10 py-6 space-y-8">
            {/* Contact section skeleton */}
            <div className="space-y-4">
              <div className="h-6 w-32 bg-muted/40 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-[48px] bg-white rounded-lg border border-border animate-pulse" />
                ))}
              </div>
            </div>
            {/* Shipping section skeleton */}
            <div className="space-y-4">
              <div className="h-6 w-40 bg-muted/40 rounded animate-pulse" />
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-[48px] bg-white rounded-lg border border-border animate-pulse" />
                ))}
              </div>
            </div>
            {/* Payment skeleton */}
            <div className="space-y-4">
              <div className="h-6 w-36 bg-muted/40 rounded animate-pulse" />
              <div className="h-20 bg-white rounded-lg border border-border animate-pulse" />
            </div>
            {/* Button skeleton */}
            <div className="h-14 bg-muted/30 rounded-[1.875rem] animate-pulse" />
          </div>
        </div>
        <div className="hidden md:block" style={{ backgroundColor: "rgb(210,210,210)" }} />
        <div className="hidden md:block bg-white">
          <div className="p-8 max-w-[600px] space-y-4">
            <div className="h-6 w-32 bg-muted/40 rounded animate-pulse" />
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-4">
                <div className="w-[72px] h-[72px] bg-muted/30 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted/30 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted/20 rounded animate-pulse" />
                </div>
                <div className="h-4 w-12 bg-muted/30 rounded animate-pulse" />
              </div>
            ))}
            <div className="h-[48px] bg-muted/20 rounded-lg animate-pulse mt-6" />
            <div className="space-y-3 mt-4">
              <div className="h-4 w-full bg-muted/20 rounded animate-pulse" />
              <div className="h-4 w-full bg-muted/20 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);

/* ---------- component ---------- */
const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t, locale, localePath } = useLocale();
  const items = useCart((s) => s.items);
  const getSubtotal = useCart((s) => s.getSubtotal);
  const getItemCount = useCart((s) => s.getItemCount);
  const getItemKey = useCart((s) => s.getItemKey);
  const clearCart = useCart((s) => s.clearCart);

  const subtotal = getSubtotal();
  const itemCount = getItemCount();

  const [showSkeleton, setShowSkeleton] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<CityStreetResult[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [citySelected, setCitySelected] = useState(false);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    apartment: "",
  });

  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);

  const discountAmount = discountApplied ? 10 : 0;
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

  // Skeleton loading
  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSkeleton) firstInputRef.current?.focus();
  }, [showSkeleton]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced city fetch from gov.il API
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (citySelected) return;
    if (cityQuery.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCityLoading(true);
      const results = await fetchCityStreets(cityQuery.trim());
      setCitySuggestions(results);
      setCityLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [cityQuery, citySelected]);

  const validate = useCallback((): FormErrors => {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = t("checkout.required");
    if (!form.lastName.trim()) e.lastName = t("checkout.required");
    if (!form.email.trim()) e.email = t("checkout.required");
    else if (!validateEmail(form.email)) e.email = t("checkout.invalidEmail");
    if (!form.phone.trim()) e.phone = t("checkout.required");
    else if (!validatePhone(form.phone)) e.phone = t("checkout.invalidPhone");
    if (!form.city.trim() || !citySelected) e.city = t("checkout.selectCity");
    if (!form.address.trim()) e.address = t("checkout.required");
    return e;
  }, [form, t, citySelected]);

  const isValid = Object.keys(validate()).length === 0 && acceptPrivacy;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setForm((p) => ({ ...p, phone: cleaned }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors(validate());
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim() || discountLoading) return;
    setDiscountLoading(true);
    setDiscountError("");
    await new Promise((r) => setTimeout(r, 1000));
    if (discountCode.trim().toLowerCase() === "code10") {
      setDiscountApplied(true);
      setDiscountError("");
    } else {
      setDiscountApplied(false);
      setDiscountError(t("checkout.invalidDiscount"));
    }
    setDiscountLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setTouched({ firstName: true, lastName: true, email: true, phone: true, city: true, address: true });

    if (Object.keys(errs).length > 0 || !acceptPrivacy) {
      const firstErrorField = Object.keys(errs)[0];
      const el = formRef.current?.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));
    toast({ title: t("checkout.successTitle"), description: t("checkout.successText") });
    clearCart();
    setIsSubmitting(false);
    navigate(localePath("/"));
  };

  /* empty cart */
  if (items.length === 0 && !showSkeleton) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ backgroundColor: "rgb(242,242,242)" }}>
        <h1 className="text-2xl font-bold text-foreground">{t("checkout.emptyTitle")}</h1>
        <p className="text-muted-foreground">{t("checkout.emptyText")}</p>
        <Link to={localePath("/shop")} className="text-sm font-semibold underline underline-offset-4 text-foreground hover:text-foreground/80 transition-colors">
          {t("cart.startShopping")}
        </Link>
      </div>
    );
  }

  if (showSkeleton) {
    return <CheckoutSkeleton />;
  }

  const fieldError = (name: keyof FormErrors) => touched[name] ? errors[name] : undefined;

  /* ---------- inline discount block JSX ---------- */
  const discountBlockJSX = (
    <div className="py-4">
      <div className="flex gap-2">
        <input
          ref={discountInputRef}
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyDiscount(); } }}
          placeholder={t("checkout.discountPlaceholder")}
          className="flex-1 h-[48px] px-4 rounded-lg border border-border text-sm bg-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4f6df5]/30 focus:border-[#4f6df5] transition-colors"
        />
        <button
          type="button"
          onClick={handleApplyDiscount}
          disabled={discountLoading || !discountCode.trim()}
          className="h-[48px] px-5 rounded-lg bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50 min-w-[70px] flex items-center justify-center"
        >
          {discountLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t("checkout.applyDiscount")
          )}
        </button>
      </div>
      {discountError && <p className="text-xs text-red-500 mt-1.5">{discountError}</p>}
      {discountApplied && <p className="text-xs text-green-600 mt-1.5">{t("checkout.discountAppliedLabel")} -{t("common.currency")}10</p>}
    </div>
  );

  /* ---------- inline order summary JSX ---------- */
  const orderSummaryJSX = (
    <>
      {/* Product list */}
      <div className="space-y-4 mb-4">
        {items.map((item) => (
          <div key={getItemKey(item)} className="flex gap-4">
            <div className="relative w-16 h-16 md:w-[72px] md:h-[72px] rounded-lg border border-border bg-white flex-shrink-0">
              <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
              <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-foreground/80 text-background text-[10px] font-bold flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{item.product.name}</p>
              {item.options?.size && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("contractor.length")}: {item.options.size}
                </p>
              )}
              {item.options?.color && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  {t("contractor.color")}: {item.options.color.name}
                  <span
                    className="inline-block w-3 h-3 rounded-full border border-border"
                    style={{ backgroundColor: item.options.color.hex }}
                  />
                </p>
              )}
            </div>
            <span className="text-sm font-semibold whitespace-nowrap">{t("common.currency")}{(item.product.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Discount code */}
      {discountBlockJSX}

      {/* Pricing — no top border */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("cart.subtotal")}</span>
          <span className="font-medium">{t("common.currency")}{subtotal.toLocaleString()}</span>
        </div>
        {discountApplied && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("checkout.discountAppliedLabel")}</span>
            <span className="font-medium text-green-600">-{t("common.currency")}10</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("cart.shipping")}</span>
          <span className="font-medium">{t("cart.complimentary")}</span>
        </div>
      </div>

      <div className="border-t border-border mt-4 pt-4">
        <div className="flex justify-between text-lg font-bold">
          <span>{t("cart.total")}</span>
          <span>{t("common.currency")}{totalAfterDiscount.toLocaleString()}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "rgb(242,242,242)" }}>
      {/* Header — taller with bottom border */}
      <header className="sticky top-0 z-30" style={{ backgroundColor: "rgb(242,242,242)", borderBottom: "1px solid rgb(210,210,210)" }}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 md:px-10" style={{ height: 76 }}>
          <Link to={localePath("/")} className="flex items-center">
            <img src={logoWhite} alt="AMG Pergola" className="h-12 md:h-14 invert" />
          </Link>
          <Link to={localePath("/cart")} className="relative flex items-center justify-center w-10 h-10 text-foreground">
            <CartBagIcon />
            {itemCount > 0 && (
              <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main */}
      <motion.main
        className="w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* Mobile: collapsible order summary */}
        <div className="md:hidden mb-6 px-6">
          <button
            onClick={() => setSummaryOpen(!summaryOpen)}
            className="w-full flex items-center justify-between py-4 border-b border-border"
          >
            <div className="flex items-center gap-2">
              <CartBagIcon />
              <span className="text-sm font-medium">{t("checkout.showSummary")}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
            </div>
            <span className="text-sm font-bold">{t("common.currency")}{totalAfterDiscount.toLocaleString()}</span>
          </button>

          <AnimatePresence>
            {summaryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="py-4">
                  {orderSummaryJSX}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop two-column grid */}
        <div className="grid md:grid-cols-[1fr_1px_1fr] gap-0">

          {/* LEFT: Checkout Form */}
          <div className="flex justify-end">
            <div className="w-full max-w-[600px] px-6 md:px-10 py-6">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                {/* Contact Info */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">{t("checkout.contactInfo")}</h2>
                    <Link
                      to={localePath("/login")}
                      className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                    >
                      {t("checkout.loginLink")}
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FloatingInput
                      inputRef={firstInputRef}
                      name="firstName"
                      label={t("checkout.firstName")}
                      value={form.firstName}
                      onChange={handleChange}
                      onBlur={() => handleBlur("firstName")}
                      error={fieldError("firstName")}
                    />
                    <FloatingInput
                      name="lastName"
                      label={t("checkout.lastName")}
                      value={form.lastName}
                      onChange={handleChange}
                      onBlur={() => handleBlur("lastName")}
                      error={fieldError("lastName")}
                    />
                    <FloatingInput
                      name="email"
                      label={t("checkout.email")}
                      value={form.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur("email")}
                      error={fieldError("email")}
                      type="email"
                      inputMode="email"
                    />
                    <FloatingInput
                      name="phone"
                      label={t("checkout.phone")}
                      value={form.phone}
                      onChange={handleChange}
                      onBlur={() => handleBlur("phone")}
                      error={fieldError("phone")}
                      type="tel"
                      inputMode="numeric"
                    />
                  </div>
                  {/* Email marketing checkbox */}
                  <label className="flex items-start gap-2.5 mt-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={emailMarketing}
                      onChange={(e) => setEmailMarketing(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-border accent-foreground flex-shrink-0"
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {t("checkout.emailMarketing")}
                    </span>
                  </label>
                </div>

                {/* Shipping Address */}
                <div>
                  <h2 className="text-lg font-bold mb-4">{t("checkout.shippingAddress")}</h2>
                  <div className="space-y-3">
                    {/* City with autocomplete */}
                    <div ref={cityRef} className="relative">
                      <FloatingInput
                        name="city"
                        label={t("checkout.city")}
                        value={cityQuery || form.city}
                        onChange={(e) => {
                          setCityQuery(e.target.value);
                          setForm((p) => ({ ...p, city: e.target.value }));
                          setCitySelected(false);
                          setShowCitySuggestions(true);
                        }}
                        onFocus={() => setShowCitySuggestions(true)}
                        onBlur={() => setTimeout(() => handleBlur("city"), 150)}
                        error={fieldError("city")}
                      />

                      {showCitySuggestions && citySuggestions.length > 0 && (
                        <div className="absolute z-20 top-full mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {citySuggestions.map((result, idx) => (
                            <button
                              key={`${result.display}-${idx}`}
                              type="button"
                              className="w-full text-start px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setForm((p) => ({ ...p, city: result.city }));
                                setCityQuery(result.display);
                                setCitySelected(true);
                                setShowCitySuggestions(false);
                              }}
                            >
                              {result.display}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <FloatingInput
                      name="address"
                      label={t("checkout.address")}
                      value={form.address}
                      onChange={handleChange}
                      onBlur={() => handleBlur("address")}
                      error={fieldError("address")}
                    />
                    <FloatingInput
                      name="apartment"
                      label={t("checkout.apartment")}
                      value={form.apartment}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Shipping Method */}
                <div>
                  <h2 className="text-lg font-bold mb-4">{t("checkout.shippingMethod")}</h2>
                  <div className="rounded-lg border border-border bg-white p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{t("checkout.freeDelivery")}</p>
                      <p className="text-xs text-muted-foreground">{t("checkout.deliveryTime")}</p>
                    </div>
                    <span className="text-sm font-semibold">{t("cart.complimentary")}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h2 className="text-lg font-bold mb-4">{t("checkout.paymentMethod")}</h2>
                  <div className="rounded-lg border border-border bg-white p-4">
                    <p className="text-sm font-semibold mb-2">{t("checkout.bankTransfer")}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t("checkout.bankTransferNote")}</p>
                  </div>
                </div>

                {/* Privacy policy acceptance */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border accent-foreground flex-shrink-0"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {t("checkout.acceptPrivacy")}{" "}
                    <Link
                      to={localePath("/privacy-policy")}
                      className="underline underline-offset-2 text-foreground hover:text-foreground/80 transition-colors"
                    >
                      {t("checkout.privacyPolicy")}
                    </Link>
                  </span>
                </label>

                {/* Place Order */}
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="w-full h-14 flex items-center justify-center gap-2 text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LockIcon />
                      {t("checkout.placeOrder")}
                    </>
                  )}
                </button>

                {/* Bottom links */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 pb-8">
                  <Link to={localePath("/refund-policy")} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                    {t("checkout.refundPolicy")}
                  </Link>
                  <Link to={localePath("/shipping-policy")} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                    {t("checkout.shippingPolicy")}
                  </Link>
                  <Link to={localePath("/privacy-policy")} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                    {t("checkout.privacyPolicy")}
                  </Link>
                  <Link to={localePath("/terms")} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                    {t("checkout.termsOfService")}
                  </Link>
                  <Link to={localePath("/contact")} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                    {t("nav.contact")}
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Vertical divider */}
          <div className="hidden md:block" style={{ backgroundColor: "rgb(210,210,210)" }} />

          {/* RIGHT: Order Summary (desktop) — full-width white bg, no border-inline-start */}
          <div className="hidden md:block bg-white">
            <div className="sticky top-20 p-8 max-w-[600px]" style={{ maxHeight: "calc(100vh - 5rem)", overflowY: "auto" }}>
              <h2 className="text-lg font-bold mb-6">{t("cart.orderSummary")}</h2>
              {orderSummaryJSX}
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default Checkout;
