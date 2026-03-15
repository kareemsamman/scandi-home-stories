import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2, Search } from "lucide-react";
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

/* ---------- Israeli cities ---------- */
const ISRAELI_CITIES_HE = [
  "תל אביב", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה",
  "נתניה", "אשדוד", "באר שבע", "חולון", "בת ים",
  "בני ברק", "רמת גן", "אשקלון", "הרצליה", "כפר סבא",
  "רעננה", "מודיעין", "לוד", "רמלה", "נצרת",
  "עכו", "קריית גת", "אילת", "טבריה", "צפת",
  "כרמיאל", "עפולה", "יבנה", "אור יהודה", "גבעתיים",
];

const ISRAELI_CITIES_AR = [
  "تل أبيب", "القدس", "حيفا", "ريشون لتسيون", "بيتح تكفا",
  "نتانيا", "أشدود", "بئر السبع", "حولون", "بات يام",
  "بني براك", "رمات غان", "عسقلان", "هرتسليا", "كفار سابا",
  "رعنانا", "موديعين", "اللد", "الرملة", "الناصرة",
  "عكا", "كريات غات", "إيلات", "طبريا", "صفد",
  "كرميئيل", "العفولة", "يبنة", "أور يهودا", "جفعاتايم",
];

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

/* ---------- input style ---------- */
const baseInputClass =
  "w-full h-12 px-4 rounded-lg border text-sm bg-muted/30 placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors";
const focusRing = "focus:ring-[#4f6df5]/30 focus:border-[#4f6df5]";
const errorBorder = "border-red-400";
const normalBorder = "border-border";

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

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

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  /* close city dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const cities = locale === "ar" ? ISRAELI_CITIES_AR : ISRAELI_CITIES_HE;

  const filteredCities = useMemo(() => {
    if (!cityQuery.trim()) return cities.slice(0, 8);
    const q = cityQuery.trim().toLowerCase();
    return cities.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [cityQuery, cities]);

  /* validation */
  const validate = useCallback((): FormErrors => {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = t("checkout.required");
    if (!form.lastName.trim()) e.lastName = t("checkout.required");
    if (!form.email.trim()) e.email = t("checkout.required");
    else if (!validateEmail(form.email)) e.email = t("checkout.invalidEmail");
    if (!form.phone.trim()) e.phone = t("checkout.required");
    else if (!validatePhone(form.phone)) e.phone = t("checkout.invalidPhone");
    if (!form.city.trim()) e.city = t("checkout.required");
    if (!form.address.trim()) e.address = t("checkout.required");
    return e;
  }, [form, t]);

  const isValid = Object.keys(validate()).length === 0;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setTouched({ firstName: true, lastName: true, email: true, phone: true, city: true, address: true });

    if (Object.keys(errs).length > 0) {
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
  if (items.length === 0) {
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

  const fieldError = (name: keyof FormErrors) => touched[name] && errors[name];

  const inputCls = (name: keyof FormErrors) =>
    `${baseInputClass} ${focusRing} ${fieldError(name) ? errorBorder : normalBorder}`;

  /* ---------- Order summary content (shared mobile/desktop) ---------- */
  const OrderSummaryContent = ({ showDiscount = true }: { showDiscount?: boolean }) => (
    <>
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={getItemKey(item)} className="flex gap-4">
            <div className="relative w-16 h-16 md:w-[72px] md:h-[72px] rounded-lg overflow-hidden border border-border bg-white flex-shrink-0">
              <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
              <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-foreground/80 text-background text-[10px] font-bold flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{item.product.name}</p>
              {item.options?.color && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.options.color.name}</p>
              )}
              {item.options?.size && (
                <p className="text-xs text-muted-foreground">{item.options.size}</p>
              )}
            </div>
            <span className="text-sm font-semibold whitespace-nowrap">{t("common.currency")}{(item.product.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("cart.subtotal")}</span>
          <span className="font-medium">{t("common.currency")}{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("cart.shipping")}</span>
          <span className="font-medium">{t("cart.complimentary")}</span>
        </div>
      </div>

      <div className="border-t border-border mt-4 pt-4">
        <div className="flex justify-between text-lg font-bold">
          <span>{t("cart.total")}</span>
          <span>{t("common.currency")}{subtotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Discount code */}
      {showDiscount && (
        <div className="border-t border-border mt-6 pt-6">
          <div className="flex gap-2">
            <input
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder={t("checkout.discountPlaceholder")}
              className={`flex-1 h-11 px-4 rounded-lg border ${normalBorder} text-sm bg-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${focusRing} transition-colors`}
            />
            <button
              type="button"
              className="h-11 px-5 rounded-lg bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
            >
              {t("checkout.applyDiscount")}
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "rgb(242,242,242)" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 px-6 md:px-10" style={{ backgroundColor: "rgb(242,242,242)" }}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between h-16">
          <Link to={localePath("/")} className="flex items-center">
            <img src={logoWhite} alt="AMG Pergola" className="h-8 invert" />
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

      {/* Main content — no horizontal padding on container */}
      <main className="max-w-[1200px] mx-auto pb-16">
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
            <span className="text-sm font-bold">{t("common.currency")}{subtotal.toLocaleString()}</span>
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
                  <OrderSummaryContent showDiscount />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop two-column grid */}
        <div className="grid md:grid-cols-[1fr_1px_1fr] gap-0">

          {/* LEFT: Checkout Form */}
          <div className="px-6 md:px-10">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Info */}
              <div>
                <h2 className="text-lg font-bold mb-4">{t("checkout.contactInfo")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      ref={firstInputRef}
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      onBlur={() => handleBlur("firstName")}
                      placeholder={t("checkout.firstName")}
                      className={inputCls("firstName")}
                    />
                    {fieldError("firstName") && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      onBlur={() => handleBlur("lastName")}
                      placeholder={t("checkout.lastName")}
                      className={inputCls("lastName")}
                    />
                    {fieldError("lastName") && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                  </div>
                  <div>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur("email")}
                      placeholder={t("checkout.email")}
                      className={inputCls("email")}
                    />
                    {fieldError("email") && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <input
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={handleChange}
                      onBlur={() => handleBlur("phone")}
                      placeholder={t("checkout.phone")}
                      className={inputCls("phone")}
                    />
                    {fieldError("phone") && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h2 className="text-lg font-bold mb-4">{t("checkout.shippingAddress")}</h2>
                <div className="space-y-3">
                  {/* City with autocomplete */}
                  <div ref={cityRef} className="relative">
                    <input
                      name="city"
                      value={cityQuery || form.city}
                      onChange={(e) => {
                        setCityQuery(e.target.value);
                        setForm((p) => ({ ...p, city: e.target.value }));
                        setShowCitySuggestions(true);
                      }}
                      onFocus={() => setShowCitySuggestions(true)}
                      onBlur={() => {
                        // delay to allow click on suggestion
                        setTimeout(() => handleBlur("city"), 150);
                      }}
                      placeholder={t("checkout.city")}
                      className={inputCls("city")}
                      autoComplete="off"
                    />
                    {fieldError("city") && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}

                    {/* City suggestions dropdown */}
                    {showCitySuggestions && filteredCities.length > 0 && (
                      <div className="absolute z-20 top-full mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredCities.map((city) => (
                          <button
                            key={city}
                            type="button"
                            className="w-full text-start px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setForm((p) => ({ ...p, city }));
                              setCityQuery(city);
                              setShowCitySuggestions(false);
                            }}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      onBlur={() => handleBlur("address")}
                      placeholder={t("checkout.address")}
                      className={inputCls("address")}
                    />
                    {fieldError("address") && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                  </div>
                  <div>
                    <input
                      name="apartment"
                      value={form.apartment}
                      onChange={handleChange}
                      placeholder={t("checkout.apartment")}
                      className={`${baseInputClass} ${focusRing} ${normalBorder}`}
                    />
                  </div>
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
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 pb-4">
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

          {/* Vertical divider */}
          <div className="hidden md:block bg-border" />

          {/* RIGHT: Order Summary (desktop only) */}
          <div className="hidden md:block">
            <div className="sticky top-20 bg-white p-8" style={{ maxHeight: "calc(100vh - 6rem)", overflowY: "auto" }}>
              <h2 className="text-lg font-bold mb-6">{t("cart.orderSummary")}</h2>
              <OrderSummaryContent showDiscount />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
