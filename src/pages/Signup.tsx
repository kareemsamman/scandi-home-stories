import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from '@/components/SEOHead';

/* Defined outside component so it is never recreated on re-render */
const FloatingField = ({
  name, label, value, onChange, type = "text",
}: {
  name: string; label: string; value: string;
  onChange: (v: string) => void; type?: string;
}) => (
  <div className="relative">
    <input
      name={name}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors"
      placeholder=" "
    />
    <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
      {label}
    </label>
  </div>
);

const Signup = () => {
  const { t, localePath, locale } = useLocale();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = firstName.trim() && lastName.trim() && email.trim() && phone.trim() && password.trim() && acceptPrivacy;

  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setPhoneError("");
    setEmailError("");
    setLoading(true);

    // Check phone duplicate before attempting signup
    const { data: phoneCheck } = await supabase.functions.invoke("auth-lookup", {
      body: { action: "check_phone", phone: phone.trim() },
    });
    if (phoneCheck?.exists) {
      setLoading(false);
      setPhoneError(locale === "ar" ? "رقم الهاتف موجود بالفعل في النظام" : "מספר הטלפון כבר קיים במערכת");
      return;
    }

    const { error } = await signUp({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
    });
    setLoading(false);
    if (error) {
      const isEmailTaken =
        error.message === "User already registered" ||
        error.message?.includes("already registered") ||
        error.message?.includes("already been registered");

      if (isEmailTaken) {
        setEmailError(locale === "ar" ? "البريد الإلكتروني موجود بالفعل في النظام" : "כתובת האימייל כבר קיימת במערכת");
        return;
      }

      const signupErrors: Record<string, { he: string; ar: string }> = {
        "Password should be at least 6 characters": { he: "הסיסמה צריכה להיות לפחות 6 תווים", ar: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل" },
        "Unable to validate email address: invalid format": { he: "כתובת אימייל לא תקינה", ar: "بريد إلكتروني غير صالح" },
        "Signup requires a valid password": { he: "נדרשת סיסמה תקינה", ar: "كلمة مرور صالحة مطلوبة" },
        "To signup, please provide your email": { he: "יש להזין כתובת אימייל", ar: "يرجى إدخال البريد الإلكتروني" },
      };
      const errEntry = signupErrors[error.message] || { he: "שגיאה ביצירת החשבון, נסו שוב", ar: "خطأ في إنشاء الحساب، حاول مرة أخرى" };
      const msg = locale === "ar" ? errEntry.ar : errEntry.he;
      toast({ title: locale === "ar" ? "خطأ" : "שגיאה", description: msg, variant: "destructive" });
    } else {
      toast({ title: t("auth.signupSuccess"), description: t("auth.signupSuccessText") });
      navigate(redirectTo || localePath("/login"));
    }
  };

  return (
    <Layout>
      <SEOHead noIndex={true} title="הרשמה | AMG Pergola" description="" />
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-16" style={{ backgroundColor: "rgb(242,242,242)" }}>
        <div className="w-full max-w-md bg-white rounded-xl border border-border shadow-sm p-8 space-y-6">
          <h1 className="text-xl font-bold text-foreground text-center">{t("auth.signup")}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FloatingField name="firstName" label={t("checkout.firstName")} value={firstName} onChange={setFirstName} />
              <FloatingField name="lastName" label={t("checkout.lastName")} value={lastName} onChange={setLastName} />
            </div>
            <div>
              <FloatingField name="email" label={t("checkout.email")} value={email} onChange={(v) => { setEmail(v); setEmailError(""); }} type="email" />
              {emailError && (
                <p className="text-xs text-red-500 mt-1 px-1 flex items-center gap-1">
                  {emailError} —{" "}
                  <Link to={localePath("/login")} className="underline font-semibold">
                    {locale === "ar" ? "تسجيل الدخول" : "לכניסה לחשבון"}
                  </Link>
                </p>
              )}
            </div>
            <div>
              <FloatingField name="phone" label={t("checkout.phone")} value={phone} onChange={(v) => { setPhone(v.replace(/\D/g, "").slice(0, 10)); setPhoneError(""); }} type="tel" />
              {phoneError && <p className="text-xs text-red-500 mt-1 px-1">{phoneError}</p>}
            </div>
            <FloatingField name="password" label={t("auth.password")} value={password} onChange={setPassword} type="password" />

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-border accent-foreground flex-shrink-0"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                {t("checkout.acceptPrivacy")}{" "}
                <Link to={localePath("/legal/privacy")} className="underline underline-offset-2 text-foreground hover:text-foreground/80 transition-colors">
                  {t("checkout.privacyPolicy")}
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full h-12 flex items-center justify-center text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth.createAccount")}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <Link to={localePath("/login")} className="text-foreground font-semibold underline underline-offset-2 hover:text-foreground/80 transition-colors">
              {t("auth.loginLink")}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Signup;
