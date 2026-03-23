import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2, Upload, X, Building2, CheckCircle2, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import type { ContractorProduct } from "@/data/products";
import { useLocale } from "@/i18n/useLocale";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAddresses, useAddAddress } from "@/hooks/useAddresses";
import { useAddOrder } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { useShippingSettings, detectZoneFromCity, DEFAULT_SHIPPING } from "@/hooks/useShippingSettings";
import type { ShippingSettings } from "@/hooks/useShippingSettings";
import { useCouponStore, recordCouponUse, validateCoupon } from "@/hooks/useCoupons";
import { CouponInput } from "@/components/CouponInput";
import { SendCartModal } from "@/components/SendCartModal";
import { AddressFields, AddressState, emptyAddress } from "@/components/AddressFields";
import { loadAllRecords } from "@/utils/cityStreetApi";
import { useBankSettings, useSmsSettings, useAdminOrderSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
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

/* ---------- City/street API is in src/utils/cityStreetApi.ts ---------- */

/* ---------- validation ---------- */
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  street?: string;
  houseNumber?: string;
}

const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validatePhone = (v: string) => /^0(5[0-9]|[2-4]|[7-9])\d{7}$/.test(v.replace(/[\s\-]/g, ""));

/* ---------- Floating Label Input ---------- */
const FloatingInput = ({
  name, label, value, onChange, onBlur, onFocus, error, type = "text", inputMode, inputRef, autoComplete = "off",
}: {
  name: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void; onFocus?: () => void; error?: string; type?: string;
  inputMode?: "text" | "numeric" | "email" | "tel"; inputRef?: React.Ref<HTMLInputElement>; autoComplete?: string;
}) => {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;
  return (
    <div>
      <div className="relative">
        <input ref={inputRef} name={name} type={type} inputMode={inputMode} value={value} onChange={onChange}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          autoComplete={autoComplete}
          className={`peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 transition-colors ${
            error ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-border focus:ring-[#4f6df5]/30 focus:border-[#4f6df5]"
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
            <div className="space-y-4">
              <div className="h-6 w-32 bg-muted/40 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-[48px] bg-white rounded-lg border border-border animate-pulse" />)}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-6 w-40 bg-muted/40 rounded animate-pulse" />
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-[48px] bg-white rounded-lg border border-border animate-pulse" />)}</div>
            </div>
            <div className="space-y-4">
              <div className="h-6 w-36 bg-muted/40 rounded animate-pulse" />
              <div className="h-20 bg-white rounded-lg border border-border animate-pulse" />
            </div>
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
          </div>
        </div>
      </div>
    </main>
  </div>
);

/* ---------- generate order number ---------- */
const generateOrderNumber = () => `#${Math.floor(10000 + Math.random() * 90000)}`;

/* ---------- Image compression helper ---------- */
const compressImage = (file: File, maxPx = 900, quality = 0.6): Promise<File> =>
  new Promise((resolve) => {
    if (!file.type.startsWith("image/")) { resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });

/* ---------- Upload receipt types ---------- */
interface UploadedFile {
  file: File;
  preview: string;
}

/* ---------- Payment step loader ---------- */
const PaymentStepLoader = ({ skeleton, children }: { skeleton: ReactNode; children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 1000); return () => clearTimeout(t); }, []);
  return <>{ready ? children : skeleton}</>;
};

/* ---------- component ---------- */
const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t, locale, localePath } = useLocale();
  const items = useCart((s) => s.items);
  const getSubtotal = useCart((s) => s.getSubtotal);
  const getItemCount = useCart((s) => s.getItemCount);
  const getItemKey = useCart((s) => s.getItemKey);
  const clearCart = useCart((s) => s.clearCart);
  const setItems = useCart((s) => s.setItems);
  const { data: savedAddresses = [] } = useAddresses();
  const addAddressMutation = useAddAddress();
  const { user, profile: authProfile, signOut, isAdmin, isWorker } = useAuth();
  const isStaff = isAdmin || isWorker;
  const addOrderMutation = useAddOrder();

  const { data: shippingSettings } = useShippingSettings();
  const shipping: ShippingSettings = shippingSettings ?? DEFAULT_SHIPPING;
  const { data: bankSettings } = useBankSettings();
  const { data: smsSettings } = useSmsSettings();
  const { data: adminOrderSettings } = useAdminOrderSettings();
  const adminOrderEnabled = isAdmin && adminOrderSettings?.enabled === true;


  const subtotal = getSubtotal();
  const { applied: appliedCoupon, remove: removeCoupon } = useCouponStore();
  const itemCount = getItemCount();

  const [showSendCartModal, setShowSendCartModal] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [loadingSharedCart, setLoadingSharedCart] = useState(() => !!new URLSearchParams(window.location.search).get("cart"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(!isMobile);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const [addressState, setAddressState] = useState<AddressState>(emptyAddress());
  const [addrTouched, setAddrTouched] = useState<Partial<Record<"city"|"street"|"houseNumber", boolean>>>({});
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "">("");
  const [selectedZone, setSelectedZone] = useState<keyof ShippingSettings["zones"] | "">("");

  // Payment step state
  const [step, setStep] = useState<"form" | "payment">("form");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [isPayLater, setIsPayLater] = useState(false);
  const [receiptDetected, setReceiptDetected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start empty — useEffect fills fields once auth loads
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    note: "",
  });

  const firstInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Admin order creation ignores the auto-free threshold — only explicit free shipping coupon applies
  const isFreeShipping = !adminOrderEnabled && (subtotal - discountAmount >= shipping.threshold);
  const hasFreeShippingCoupon = appliedCoupon?.coupon.type === "free_shipping";
  const shippingCost = isFreeShipping || !selectedZone || hasFreeShippingCoupon ? 0 : shipping.zones[selectedZone];
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount) + shippingCost;

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // When user logs out → clear all contact + address fields
  useEffect(() => {
    if (!user) {
      setForm({ firstName: "", lastName: "", email: "", phone: "", note: "" });
      setAddressState(emptyAddress());
      setSelectedZone("");
      setSelectedAddressId("");
    }
  }, [user]);

  // When auth profile loads → fill contact fields only (address left empty for user to pick)
  // Skip prefill when admin order creation is enabled so fields start empty for customer data
  useEffect(() => {
    if (user && authProfile && !adminOrderEnabled) {
      setForm((prev) => ({
        ...prev,
        firstName: authProfile.first_name || prev.firstName,
        lastName: authProfile.last_name || prev.lastName,
        email: user.email || prev.email,
        phone: authProfile.phone || prev.phone,
      }));
    }
  }, [user, authProfile, adminOrderEnabled]);

  // When adminOrderEnabled turns on (settings loaded after profile fill), wipe contact fields
  useEffect(() => {
    if (adminOrderEnabled) {
      setForm({ firstName: "", lastName: "", email: "", phone: "", note: "" });
    }
  }, [adminOrderEnabled]);

  useEffect(() => {
    if (!showSkeleton && step === "form") firstInputRef.current?.focus();
  }, [showSkeleton, step]);


  // Auto-accept privacy for admin order creation
  useEffect(() => { if (adminOrderEnabled) setAcceptPrivacy(true); }, [adminOrderEnabled]);

  // Preload all cities+streets as soon as the form mounts
  useEffect(() => { loadAllRecords(); }, []);

  // Load shared cart from ?cart=TOKEN (admin sent cart to customer)
  const { apply: applyCoupon } = useCouponStore();
  useEffect(() => {
    const token = searchParams.get("cart");
    if (!token) return;
    (async () => {
      try {
        const { data } = await (supabase as any)
          .rpc("get_shared_cart_by_token", { p_token: token });
        if (!data) return;
        if (Array.isArray(data.cart_items) && data.cart_items.length > 0) {
          setItems(data.cart_items);
        }
        if (data.coupon_code) {
          const cartForValidation = (data.cart_items as any[]).map((i: any) => ({
            product: { id: i.product.id, price: i.product.price, collection: i.product.collection },
            quantity: i.quantity,
          }));
          const subtotalVal = (data.cart_items as any[]).reduce(
            (t: number, i: any) => t + i.product.price * i.quantity, 0
          );
          const result = await validateCoupon(data.coupon_code, cartForValidation, subtotalVal);
          if (result.coupon && result.discountAmount !== undefined) {
            applyCoupon(result.coupon, result.discountAmount);
          }
        }
      } finally {
        setLoadingSharedCart(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const validate = useCallback((): FormErrors => {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = t("checkout.firstNameRequired");
    if (!form.lastName.trim()) e.lastName = t("checkout.lastNameRequired");
    if (!adminOrderEnabled) {
      if (!form.email.trim()) e.email = t("checkout.emailRequired");
      else if (!validateEmail(form.email)) e.email = t("checkout.invalidEmail");
    } else if (form.email.trim() && !validateEmail(form.email)) {
      e.email = t("checkout.invalidEmail");
    }
    if (!form.phone.trim()) e.phone = t("checkout.phoneRequired");
    else if (!validatePhone(form.phone)) e.phone = t("checkout.invalidPhone");
    if (!addressState.city.trim() || (!addressState.citySelected && !isStaff)) e.city = t("checkout.selectCity");
    if (!addressState.street.trim() || (!addressState.streetSelected && !isStaff)) e.street = "יש לבחור רחוב";
    if (!addressState.houseNumber.trim()) e.houseNumber = "יש להזין מספר בית";
    return e;
  }, [form, t, addressState, isStaff, adminOrderEnabled]);

  const isValid = Object.keys(validate()).length === 0 && (acceptPrivacy || isStaff);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setForm((p) => ({ ...p, phone: value.replace(/\D/g, "").slice(0, 10) }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched((p) => ({ ...p, [name]: true }));
    setErrors(validate());
  };


  // Step 1: validate form → move to payment step
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setTouched({ firstName: true, lastName: true, email: true, phone: true });
    setAddrTouched({ city: true, street: true, houseNumber: true });
    if (Object.keys(errs).length > 0 || !acceptPrivacy) {
      const firstErrorField = Object.keys(errs)[0];
      const el = formRef.current?.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSubmitting(false);
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Pay Later: admin creates order with payment_status='unpaid', skips receipt step
  const handlePayLater = async () => {
    const errs = validate();
    setErrors(errs);
    setTouched({ firstName: true, lastName: true, email: true, phone: true });
    setAddrTouched({ city: true, street: true, houseNumber: true });
    if (Object.keys(errs).length > 0) return;
    setIsPayLater(true);
    const orderNumber = generateOrderNumber();
    const orderDate = new Date().toLocaleDateString(locale === "he" ? "he-IL" : "ar-SA");
    try {
      const { data: orderResult, error: orderFnErr } = await supabase.functions.invoke("create-order", {
        body: {
          orderNumber,
          notes: form.note || undefined,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || undefined,
          phone: form.phone,
          city: addressState.city,
          address: addressState.street,
          house_number: addressState.houseNumber,
          apartment: addressState.apartment || undefined,
          locale,
          origin: window.location.origin,
          shippingCost,
          discountCode: appliedCoupon?.coupon.code,
          payment_status: "unpaid",
          items: items.map((item) => {
            const colorId = item.options?.color?.id;
            const sizeLabel = item.options?.size;
            const sizeId = item.product.type === "contractor"
              ? (item.product as ContractorProduct).sizes?.find(s => s.label === sizeLabel)?.id
              : undefined;
            return { productId: item.product.id, quantity: item.quantity, size: sizeLabel, color: item.options?.color?.name, colorId, sizeId };
          }),
        },
      });
      if (orderFnErr) throw orderFnErr;
      if (appliedCoupon) removeCoupon();
      clearCart();
      navigate(localePath("/checkout/thank-you"), {
        state: { orderNumber, total: orderResult?.total ?? totalAfterDiscount, date: orderDate, orderId: orderResult?.orderId, payLater: true, phone: form.phone, isGuest: !user, firstName: form.firstName, lastName: form.lastName, email: form.email },
      });
    } catch (e: any) {
      console.error("[pay-later] error:", e);
      const msg = e?.message || e?.error_description || JSON.stringify(e) || "נסה שוב";
      toast({ title: "שגיאה", description: msg, variant: "destructive" });
    } finally {
      setIsPayLater(false);
    }
  };

  // File upload handlers
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ACCEPTED_TYPES: Record<string, string[]> = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "application/pdf": [".pdf"],
  };

  const validateFile = (file: File): string | null => {
    // Check MIME type
    if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
      return locale === "ar"
        ? "نوع الملف غير مدعوم. يُسمح فقط بـ JPG, PNG, PDF"
        : "סוג קובץ לא נתמך. מותרים רק JPG, PNG, PDF";
    }
    // Check extension matches MIME
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    const allowedExts = Object.values(ACCEPTED_TYPES).flat();
    if (!allowedExts.includes(ext)) {
      return locale === "ar"
        ? "امتداد الملف غير مطابق. يُسمح فقط بـ JPG, PNG, PDF"
        : "סיומת קובץ לא תקינה. מותרים רק JPG, PNG, PDF";
    }
    // Check size
    if (file.size > MAX_FILE_SIZE) {
      return locale === "ar"
        ? "حجم الملف يتجاوز 10MB"
        : "גודל הקובץ חורג מ-10MB";
    }
    // Check file name for suspicious patterns
    const nameLC = file.name.toLowerCase();
    if (/\.(exe|bat|cmd|sh|js|ts|html|htm|php|py|rb|pl|cgi|asp|jsp|svg)/.test(nameLC)) {
      return locale === "ar"
        ? "نوع الملف غير مسموح به"
        : "סוג קובץ לא מורשה";
    }
    return null;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadedFile[] = [];
    const errors: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
      newFiles.push({ file, preview });
    }
    if (errors.length > 0) {
      toast({
        title: locale === "ar" ? "ملفات مرفوضة" : "קבצים נדחו",
        description: errors.join("\n"),
        variant: "destructive",
      });
    }
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    if (newFiles.length > 0) setReceiptDetected(true);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const copy = [...prev];
      if (copy[index]?.preview) URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  // Step 2: submit receipt → upload files → save order → send SMS → navigate
  const handleSubmitReceipt = async () => {
    if (uploadedFiles.length === 0) return;
    setIsSubmittingReceipt(true);

    const orderNumber = generateOrderNumber();
    const orderDate = new Date().toLocaleDateString(locale === "he" ? "he-IL" : "ar-SA");

    // Upload receipt files via server-side edge function
    let receiptUrl: string | undefined;
    let receiptUploadFailed = false;
    try {
      const formData = new FormData();
      formData.append("orderId", "pending"); // Will be set after order creation
      formData.append("token", "pending");
      formData.append("orderNumber", orderNumber);
      for (let i = 0; i < uploadedFiles.length; i++) {
        const compressed = await compressImage(uploadedFiles[i].file);
        formData.append(`file${i}`, compressed, uploadedFiles[i].file.name);
      }
      const uploadRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-receipt`,
        {
          method: "POST",
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: formData,
        }
      );
      const uploadResult = await uploadRes.json();
      if (!uploadRes.ok || !uploadResult.paths) {
        console.error("[receipt upload] server error:", uploadResult);
        receiptUploadFailed = true;
      } else {
        receiptUrl = uploadResult.paths.join("|");
      }
    } catch (e) {
      console.error("[receipt upload] unexpected error:", e);
      receiptUploadFailed = true;
    }
    if (receiptUploadFailed && !receiptUrl) {
      toast({
        title: locale === "ar" ? "تعذّر رفع الإيصال" : "העלאת הקבלה נכשלה",
        description: locale === "ar"
          ? "يرجى المحاولة مرة أخرى أو التواصل معنا وإرسال الإيصال مباشرةً"
          : "אנא נסה/י שוב או שלח/י את הקבלה ישירות אלינו",
        variant: "destructive",
      });
      setIsSubmittingReceipt(false);
      return;
    }

    // Save marketing opt-in subscriber
    if (emailMarketing) {
      try {
        await (supabase as any).from("marketing_subscribers").insert({
          email: form.email,
          phone: form.phone,
          first_name: form.firstName,
          last_name: form.lastName,
          locale,
        });
      } catch { /* non-blocking */ }
    }

    // If guest (not logged in), check if email matches an existing account's past order
    const db = supabase as any;
    let resolvedUserId: string | null = user?.id || null;
    if (!resolvedUserId && form.email) {
      const { data: existingOrder } = await db
        .from("orders").select("user_id").eq("email", form.email).not("user_id", "is", null).limit(1).maybeSingle();
      if (existingOrder?.user_id) resolvedUserId = existingOrder.user_id;
    }

    // Save order via server-side edge function (validates prices & coupons)
    let savedOrderId: string | undefined;
    let serverTotal: number | undefined;
    let serverDiscount: number | undefined;
    try {
      const { data: orderResult, error: orderFnErr } = await supabase.functions.invoke("create-order", {
        body: {
          orderNumber,
          notes: form.note || undefined,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          city: addressState.city,
          address: addressState.street,
          house_number: addressState.houseNumber,
          apartment: addressState.apartment || undefined,
          receiptUrl,
          locale,
          origin: window.location.origin,
          shippingCost,
          marketingOptIn: emailMarketing,
          discountCode: appliedCoupon?.coupon.code,
          items: items.map((item) => {
            const colorId = item.options?.color?.id;
            const sizeLabel = item.options?.size;
            const sizeId = item.product.type === "contractor"
              ? (item.product as ContractorProduct).sizes?.find(s => s.label === sizeLabel)?.id
              : undefined;
            return {
              productId: item.product.id,
              quantity: item.quantity,
              size: sizeLabel,
              color: item.options?.color?.name,
              colorId,
              sizeId,
            };
          }),
        },
      });
      if (orderFnErr) throw orderFnErr;
      savedOrderId = orderResult?.orderId;
      serverTotal = orderResult?.total;
      serverDiscount = orderResult?.discountAmount;
    } catch (e: any) {
      console.error("[create-order] error:", e);
      const msg = e?.message || e?.error_description || JSON.stringify(e) || "";
      toast({ title: "שגיאה ביצירת הזמנה", description: msg, variant: "destructive" });
      setIsSubmittingReceipt(false);
      return;
    }

    // Save address to profile if checkbox checked
    if (user && saveAddress && addressState.city && addressState.street) {
      addAddressMutation.mutate({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        city: addressState.city,
        street: addressState.street,
        houseNumber: addressState.houseNumber,
        apartment: addressState.apartment,
        isDefault: savedAddresses.length === 0,
      });
    }

    // Coupon use is now recorded server-side in create-order edge function
    if (appliedCoupon) {
      removeCoupon();
    }

    // SMS for new orders is sent server-side in create-order edge function
    clearCart();
    setIsSubmittingReceipt(false);
    navigate(localePath("/checkout/thank-you"), {
      state: { orderNumber, total: serverTotal ?? totalAfterDiscount, date: orderDate, orderId: savedOrderId, phone: form.phone, isGuest: !user, firstName: form.firstName, lastName: form.lastName, email: form.email },
    });
  };

  /* empty cart */
  if (items.length === 0 && !showSkeleton && !loadingSharedCart && step === "form") {
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

  if (showSkeleton) return <CheckoutSkeleton />;

  const fieldError = (name: keyof FormErrors) => touched[name] ? errors[name] : undefined;

  /* ---------- discount block ---------- */
  const discountBlockJSX = (
    <div className="py-4">
      <CouponInput />
    </div>
  );

  /* ---------- order summary ---------- */
  const orderSummaryJSX = (
    <>
      <div className="space-y-4 mb-4">
        {items.map((item) => (
          <div key={getItemKey(item)} className="flex gap-4">
            <div className="relative w-16 h-16 md:w-[72px] md:h-[72px] rounded-lg border border-border bg-white flex-shrink-0">
              <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
              <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-foreground/80 text-background text-[10px] font-bold flex items-center justify-center">{item.quantity}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{item.product.name}</p>
              {item.options?.size && <p className="text-xs text-muted-foreground mt-0.5">{t("contractor.length")}: {item.options.size}</p>}
              {item.options?.color && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  {t("contractor.color")}: {item.options.color.name}
                  <span className="inline-block w-3 h-3 rounded-full border border-border" style={{ backgroundColor: item.options.color.hex }} />
                </p>
              )}
            </div>
            <span className="text-sm font-semibold whitespace-nowrap">{t("common.currency")}{(item.product.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>
      {discountBlockJSX}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("cart.subtotal")}</span>
          <span className="font-medium">{t("common.currency")}{subtotal.toLocaleString()}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-700 font-medium">{t("checkout.discountAppliedLabel")} ({appliedCoupon?.coupon.code})</span>
            <span className="font-semibold text-green-700">-{t("common.currency")}{discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("cart.shipping")}</span>
          <span className={`font-medium ${shippingCost === 0 && selectedZone ? "text-green-600" : ""}`}>
            {!selectedZone && !isFreeShipping
              ? "—"
              : shippingCost === 0
              ? t("cart.complimentary")
              : `${t("common.currency")}${shippingCost.toLocaleString()}`}
          </span>
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

  /* ---------- PAYMENT STEP ---------- */
  if (step === "payment") {
    const PaymentSkeleton = () => (
      <div className="w-full max-w-2xl mx-auto px-6 py-10 space-y-4 animate-pulse">
        {/* header bar */}
        <div className="h-6 w-40 rounded-full bg-white/80 mx-auto mb-6" />
        {/* bank card skeleton */}
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <div className="h-4 w-24 rounded-full bg-muted mx-auto" />
          {[90, 70, 80, 60, 50].map((w, i) => (
            <div key={i} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="h-3 rounded-full bg-muted" style={{ width: `${w * 0.5}%` }} />
              <div className="h-3 rounded-full bg-muted" style={{ width: `${w * 0.35}%` }} />
            </div>
          ))}
          <div className="flex justify-between items-center pt-1">
            <div className="h-4 w-24 rounded-full bg-muted" />
            <div className="h-4 w-16 rounded-full bg-muted" />
          </div>
        </div>
        {/* upload card skeleton */}
        <div className="bg-white rounded-2xl p-6 space-y-3">
          <div className="h-4 w-32 rounded-full bg-muted mx-auto" />
          <div className="h-28 rounded-xl bg-muted/50" />
        </div>
      </div>
    );

    return (
      <div className="min-h-screen" style={{ backgroundColor: "rgb(242,242,242)" }}>
        <header className="sticky top-0 z-30" style={{ backgroundColor: "rgb(242,242,242)", borderBottom: "1px solid rgb(210,210,210)" }}>
          <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 md:px-10" style={{ height: 76 }}>
            <Link to={localePath("/")} className="flex items-center">
              <img src={logoWhite} alt="AMG Pergola" className="h-12 md:h-14 invert" />
            </Link>
            <button
              onClick={() => setStep("form")}
              className="flex items-center gap-1.5 text-sm font-medium text-foreground border border-border rounded-full px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              {t("payment.backToForm")}
            </button>
          </div>
        </header>

        <PaymentStepLoader skeleton={<PaymentSkeleton />}>
        <motion.main
          className="w-full max-w-2xl mx-auto px-6 py-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Back button */}
          <button
            onClick={() => setStep("form")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowRight className="w-4 h-4" />
            {t("payment.backToForm")}
          </button>

          {/* Payment instructions */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-foreground mb-3">{t("payment.title")}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {t("payment.instructions")}
            </p>
          </div>

          {/* Bank details card */}
          <div className="bg-white rounded-xl border border-border p-6 mb-8">
            <div className="flex flex-col items-center mb-5">
              <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                <Building2 className="w-7 h-7 text-foreground" />
              </div>
              <h2 className="text-base font-bold text-foreground">{t("payment.bankDetailsTitle")}</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: t("payment.bankName"), value: bankSettings?.bank_name || "בנק הפועלים" },
                { label: t("payment.accountName"), value: bankSettings?.account_name || "AMG Pergola LTD" },
                { label: t("payment.accountNumber"), value: bankSettings?.account_number || "12345678" },
                { label: t("payment.branchNumber"), value: bankSettings?.branch_number || "123" },
                { label: t("payment.bankCode"), value: bankSettings?.bank_code || "12" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-semibold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-base font-bold">
                <span>{t("payment.amountToPay")}</span>
                <span>{t("common.currency")}{totalAfterDiscount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Upload receipt section */}
          <div className="bg-white rounded-xl border border-border p-6 mb-6">
            <h3 className="text-base font-bold text-foreground mb-4">{t("payment.uploadTitle")}</h3>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-muted-foreground transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                {t("payment.dropText")}
              </p>
              <p className="text-xs text-muted-foreground/60">JPG, PNG, PDF · {locale === "ar" ? "حتى 10MB لكل ملف" : "עד 10MB לכל קובץ"}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {/* Uploaded previews */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                {uploadedFiles.map((uf, idx) => (
                  <div key={idx} className="relative group">
                    {uf.preview ? (
                      <img src={uf.preview} alt="" className="w-full aspect-square rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="w-full aspect-square rounded-lg border border-border bg-muted/20 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">PDF</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Submit receipt button */}
          <button
            onClick={handleSubmitReceipt}
            disabled={uploadedFiles.length === 0 || isSubmittingReceipt}
            className="w-full h-14 flex items-center justify-center gap-2 text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmittingReceipt ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LockIcon />
                {t("payment.submitReceipt")}
              </>
            )}
          </button>
        </motion.main>
        </PaymentStepLoader>
      </div>
    );
  }

  /* ---------- FORM STEP ---------- */
  return (
    <div className="min-h-screen" style={{ backgroundColor: "rgb(242,242,242)" }}>
      <SendCartModal open={showSendCartModal} onClose={() => setShowSendCartModal(false)} />

      <header className="sticky top-0 z-30" style={{ backgroundColor: "rgb(242,242,242)", borderBottom: "1px solid rgb(210,210,210)" }}>
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 md:px-10" style={{ height: 76 }}>
          <Link to={localePath("/")} className="flex items-center">
            <img src={logoWhite} alt="AMG Pergola" className="h-12 md:h-14 invert" />
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && items.length > 0 && (
              <button
                onClick={() => setShowSendCartModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-bold hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                שלח ללקוח
              </button>
            )}
            <Link to={localePath("/cart")} className="relative flex items-center justify-center w-10 h-10 text-foreground">
              <CartBagIcon />
              {itemCount > 0 && (
                <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">{itemCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <motion.main className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
        {/* Mobile: collapsible order summary */}
        <div className="md:hidden mb-6 px-6">
          <button onClick={() => setSummaryOpen(!summaryOpen)} className="w-full flex items-center justify-between py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <CartBagIcon />
              <span className="text-sm font-medium">{t("checkout.showSummary")}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
            </div>
            <span className="text-sm font-bold">{t("common.currency")}{totalAfterDiscount.toLocaleString()}</span>
          </button>
          <AnimatePresence>
            {summaryOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="py-4">{orderSummaryJSX}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid md:grid-cols-[1fr_1px_1fr] gap-0">
          {/* LEFT: Checkout Form */}
          <div className="flex justify-end">
            <div className="w-full max-w-[600px] px-6 md:px-10 py-6">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                {/* Contact Info */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">{t("checkout.contactInfo")}</h2>
                    {user ? (
                      <button
                        type="button"
                        onClick={async () => { await signOut(); }}
                        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                      >
                        {t("auth.logout")}
                      </button>
                    ) : (
                      <Link to={`${localePath("/login")}?redirect=${encodeURIComponent(localePath("/checkout"))}`} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                        {t("checkout.loginLink")}
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FloatingInput inputRef={firstInputRef} name="firstName" label={t("checkout.firstName")} value={form.firstName} onChange={handleChange} onBlur={() => handleBlur("firstName")} error={fieldError("firstName")} />
                    <FloatingInput name="lastName" label={t("checkout.lastName")} value={form.lastName} onChange={handleChange} onBlur={() => handleBlur("lastName")} error={fieldError("lastName")} />
                    <FloatingInput name="email" label={t("checkout.email")} value={form.email} onChange={handleChange} onBlur={() => handleBlur("email")} error={fieldError("email")} type="email" inputMode="email" />
                    <FloatingInput name="phone" label={t("checkout.phone")} value={form.phone} onChange={handleChange} onBlur={() => handleBlur("phone")} error={fieldError("phone")} type="tel" inputMode="numeric" />
                  </div>
                  <label className="flex items-start gap-2.5 mt-3 cursor-pointer select-none">
                    <input type="checkbox" checked={emailMarketing} onChange={(e) => setEmailMarketing(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-border accent-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground leading-relaxed">{t("checkout.emailMarketing")}</span>
                  </label>
                </div>

                {/* Shipping Address */}
                <div>
                  <h2 className="text-lg font-bold mb-4">{t("checkout.shippingAddress")}</h2>
                  {savedAddresses.length > 0 && (
                    <select
                      value={selectedAddressId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__new__") {
                          setSelectedAddressId("__new__");
                          setAddressState(emptyAddress());
                          setSelectedZone("");
                        } else {
                          const addr = savedAddresses.find((a) => a.id === val);
                          if (addr) {
                            setSelectedAddressId(addr.id);
                            setAddressState({ city: addr.city, street: addr.street, houseNumber: addr.houseNumber, apartment: addr.apartment, citySelected: true, streetSelected: true });
                            const z = detectZoneFromCity(addr.city);
                            if (z) setSelectedZone(z);
                          }
                        }
                      }}
                      className="w-full h-[48px] px-4 rounded-lg border border-border bg-white text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30"
                    >
                      <option value="" disabled>{t("account.selectAddress")}</option>
                      {savedAddresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.city}, {a.street} {a.houseNumber}{a.apartment ? ` ${a.apartment}` : ""}
                        </option>
                      ))}
                      <option value="__new__">+ {t("checkout.newAddress")}</option>
                    </select>
                  )}
                  <AddressFields
                    value={addressState}
                    onChange={(s) => {
                      if (s.citySelected && !addressState.citySelected) {
                        const z = detectZoneFromCity(s.city);
                        if (z) setSelectedZone(z);
                      }
                      setAddressState(s);
                      // Re-validate immediately so stale errors are cleared
                      setTimeout(() => setErrors(prev => {
                        const updated = { ...prev };
                        if (s.street.trim() && s.streetSelected) delete updated.street;
                        if (s.houseNumber.trim()) delete updated.houseNumber;
                        if (s.city.trim() && s.citySelected) delete updated.city;
                        return updated;
                      }), 0);
                    }}
                    errors={{ city: fieldError("city"), street: errors.street, houseNumber: errors.houseNumber }}
                    touched={addrTouched}
                    onBlur={(field) => setAddrTouched(p => ({ ...p, [field]: true }))}
                    isStaff={isStaff}
                  />
                  {user && (selectedAddressId === "__new__" || savedAddresses.length === 0) && (
                    <label className="flex items-center gap-2.5 mt-2 cursor-pointer select-none">
                      <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} className="w-4 h-4 rounded border-border accent-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">שמור כתובת זו לפרופיל שלי</span>
                    </label>
                  )}
                </div>

                {/* Shipping Method */}
                <div>
                  <h2 className="text-lg font-bold mb-4">{t("checkout.shippingMethod")}</h2>
                  {isFreeShipping ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-green-700">{t("checkout.freeDelivery")}</p>
                        <p className="text-xs text-green-600">{(t("checkout.shippingFreeAbove") as string).replace("{amount}", shipping.threshold.toLocaleString())}</p>
                      </div>
                      <span className="text-sm font-semibold text-green-700">{t("cart.complimentary")}</span>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-white p-4 space-y-3">
                      <p className="text-sm font-semibold">{t("checkout.shippingZone")}</p>
                      {!addressState.citySelected ? (
                        <p className="text-xs text-muted-foreground">{t("checkout.shippingZoneNote")}</p>
                      ) : (
                        <div className="space-y-2">
                          {(["north", "center", "south", "jerusalem"] as const).map((zone) => (
                            <label key={zone} className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-foreground has-[:checked]:bg-muted/20">
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="shipping_zone"
                                  value={zone}
                                  checked={selectedZone === zone}
                                  onChange={() => setSelectedZone(zone)}
                                  className="accent-foreground"
                                />
                                <span className="text-sm font-medium">{(t("checkout.shippingZoneNames") as any)[zone]}</span>
                              </div>
                              <span className="text-sm font-semibold">{t("common.currency")}{shipping.zones[zone].toLocaleString()}</span>
                            </label>
                          ))}
                          {!isFreeShipping && (
                            <p className="text-xs text-muted-foreground pt-1">
                              {(t("checkout.shippingFreeAbove") as string).replace("{amount}", shipping.threshold.toLocaleString())}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <h2 className="text-lg font-bold mb-4">{t("checkout.paymentMethod")}</h2>
                  <div className="rounded-xl border-2 border-foreground bg-white p-4 flex items-start gap-4">
                    {/* Bank icon */}
                    <div className="w-11 h-11 rounded-xl bg-foreground flex items-center justify-center shrink-0 mt-0.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold">{t("checkout.bankTransfer")}</p>
                        {/* Selected indicator */}
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground bg-foreground/8 border border-foreground/20 rounded-full px-2 py-0.5">
                          <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                          {t("checkout.selected") || "נבחר"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t("checkout.bankTransferNote")}</p>
                    </div>
                  </div>
                </div>

                {/* Order Note */}
                <div>
                  <h2 className="text-lg font-bold mb-4">{t("checkout.orderNote")}</h2>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                    placeholder={t("checkout.orderNotePlaceholder")}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4f6df5]/30 focus:border-[#4f6df5] transition-colors resize-none"
                  />
                </div>

                {/* Privacy */}
                {!adminOrderEnabled && (
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input type="checkbox" checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-border accent-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {t("checkout.acceptPrivacy")}{" "}
                      <Link to={localePath("/legal/privacy")} className="underline underline-offset-2 text-foreground hover:text-foreground/80 transition-colors">{t("checkout.privacyPolicy")}</Link>
                    </span>
                  </label>
                )}

                {/* Place Order */}
                <button type="submit" disabled={!isValid || isSubmitting || isPayLater}
                  className="w-full h-14 flex items-center justify-center gap-2 text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LockIcon />{t("checkout.placeOrder")}</>}
                </button>

                {/* Pay Later — admin only */}
                {adminOrderEnabled && (
                  <button
                    type="button"
                    onClick={handlePayLater}
                    disabled={isPayLater || isSubmitting}
                    className="w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold border-2 border-amber-400 text-amber-700 bg-amber-50 rounded-[1.875rem] hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPayLater ? <Loader2 className="w-4 h-4 animate-spin" /> : "💳 שמור הזמנה — ישלם מאוחר יותר"}
                  </button>
                )}

                {/* Bottom links */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 pb-8">
                  <Link to={localePath("/legal/returns")} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">{t("checkout.refundPolicy")}</Link>
                  <Link to={localePath("/legal/shipping")} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">{t("checkout.shippingPolicy")}</Link>
                  <Link to={localePath("/legal/privacy")} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">{t("checkout.privacyPolicy")}</Link>
                  <Link to={localePath("/legal/terms")} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">{t("checkout.termsOfService")}</Link>
                  <Link to={localePath("/contact")} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">{t("nav.contact")}</Link>
                </div>
              </form>
            </div>
          </div>

          <div className="hidden md:block" style={{ backgroundColor: "rgb(210,210,210)" }} />

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
