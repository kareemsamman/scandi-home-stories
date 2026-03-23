import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from '@/components/SEOHead';

const ForgotPassword = () => {
  const { t, localePath, locale } = useLocale();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentVia, setSentVia] = useState<"email" | "sms" | "phone_email">("email");
  // Create-password flow (for order-auto-created accounts)
  const [needsPassword, setNeedsPassword] = useState(false);
  const [phoneForPassword, setPhoneForPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [creatingPassword, setCreatingPassword] = useState(false);

  const isPhone = (v: string) => /^[\d\s\-\+]{7,15}$/.test(v.trim()) && !v.includes("@");

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: locale === "ar" ? "خطأ" : "שגיאה", description: locale === "ar" ? "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل" : "הסיסמה חייבת להכיל לפחות 6 תווים", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: locale === "ar" ? "خطأ" : "שגיאה", description: locale === "ar" ? "كلمات المرور غير متطابقة" : "הסיסמאות אינן תואמות", variant: "destructive" });
      return;
    }
    setCreatingPassword(true);
    const { data, error } = await supabase.functions.invoke("set-password", {
      body: { phone: phoneForPassword, password: newPassword },
    });
    setCreatingPassword(false);
    if (error || data?.error) {
      toast({ title: locale === "ar" ? "خطأ" : "שגיאה", description: locale === "ar" ? "تعذر حفظ كلمة المرور، حاول مرة أخرى" : "לא הצלחנו לשמור את הסיסמה, נסה שוב", variant: "destructive" });
      return;
    }
    toast({ title: locale === "ar" ? "تم إنشاء كلمة المرور بنجاح!" : "הסיסמה נוצרה בהצלחה!", description: locale === "ar" ? "يرجى تسجيل الدخول بالبريد الإلكتروني وكلمة المرور" : "אנא התחבר עם האימייל והסיסמה שלך" });
    navigate(localePath("/login"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = identifier.trim();
    if (!val) return;
    setLoading(true);

    if (isPhone(val)) {
      // Phone flow: call auth-lookup to send SMS with reset link
      const { data, error } = await supabase.functions.invoke("auth-lookup", {
        body: {
          action: "forgot_password",
          phone: val,
          origin: window.location.origin,
          locale,
        },
      });

      setLoading(false);

      if (error || !data?.sent) {
        if (data?.reason === "needs_password") {
          // Account exists but no password set — show create-password form
          setPhoneForPassword(val);
          setNeedsPassword(true);
          return;
        }
        if (data?.reason === "not_found") {
          toast({ title: locale === "ar" ? "خطأ" : "שגיאה", description: locale === "ar" ? "رقم الهاتف غير موجود في النظام" : "מספר הטלפון לא נמצא במערכת", variant: "destructive" });
        } else {
          toast({ title: locale === "ar" ? "خطأ" : "שגיאה", description: locale === "ar" ? "تعذر إرسال الرسالة، حاول مرة أخرى" : "לא הצלחנו לשלוח הודעה, נסה שוב", variant: "destructive" });
        }
        return;
      }

      setSentVia(data?.via === "sms" ? "sms" : "phone_email");
      setSent(true);
    } else {
      // Email flow: standard Supabase reset email
      const { error } = await supabase.auth.resetPasswordForEmail(val, {
        redirectTo: `${window.location.origin}/${locale}/reset-password`,
      });

      setLoading(false);

      if (error) {
        toast({
          title: t("auth.forgotPwError"),
          description: t("auth.forgotPwErrorText"),
          variant: "destructive",
        });
        return;
      }

      setSentVia("email");
      setSent(true);
    }
  };

  return (
    <Layout>
      <SEOHead noIndex={true} title="שחזור סיסמה | AMG Pergola" description="" />
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-16" style={{ backgroundColor: "rgb(242,242,242)" }}>
        <div className="w-full max-w-md bg-white rounded-xl border border-border shadow-sm p-8 space-y-6">

          {/* Create password step (order-auto-created accounts) */}
          {needsPassword ? (
            <>
              <div className="text-center space-y-1">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔐</span>
                </div>
                <h1 className="text-xl font-bold text-foreground">{locale === "ar" ? "إنشاء كلمة مرور" : "צור סיסמה"}</h1>
                <p className="text-sm text-muted-foreground">{locale === "ar" ? "وجدنا حسابك. أنشئ كلمة مرور لتسجيل الدخول وعرض طلباتك." : "מצאנו את החשבון שלך. צור סיסמה כדי להתחבר ולראות את ההזמנות שלך."}</p>
              </div>
              <form onSubmit={handleCreatePassword} className="space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors"
                    placeholder=" "
                    dir="ltr"
                  />
                  <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
                    {locale === "ar" ? "كلمة مرور جديدة (6 أحرف على الأقل)" : "סיסמה חדשה (לפחות 6 תווים)"}
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors"
                    placeholder=" "
                    dir="ltr"
                  />
                  <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
                    {locale === "ar" ? "تأكيد كلمة المرور" : "אמת סיסמה"}
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={creatingPassword || !newPassword || !confirmPassword}
                  className="w-full h-12 flex items-center justify-center text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : (locale === "ar" ? "إنشاء كلمة المرور وتسجيل الدخول" : "צור סיסמה והתחבר")}
                </button>
              </form>
              <p className="text-center text-sm text-muted-foreground">
                <button onClick={() => setNeedsPassword(false)} className="text-foreground font-semibold underline underline-offset-2 hover:text-foreground/80 transition-colors">
                  {locale === "ar" ? "رجوع" : "חזור"}
                </button>
              </p>
            </>
          ) : (
            <>
            <h1 className="text-xl font-bold text-foreground text-center">{t("auth.forgotPwTitle")}</h1>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <span className="text-2xl">{sentVia === "sms" ? "📱" : "✉️"}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {sentVia === "sms"
                  ? (locale === "ar" ? "أرسلنا لك رسالة SMS برابط إعادة تعيين كلمة المرور" : "שלחנו לך SMS עם קישור לאיפוס הסיסמה")
                  : sentVia === "phone_email"
                  ? (locale === "ar" ? "أرسلنا رابط إعادة التعيين إلى البريد الإلكتروني المرتبط بهذا الرقم" : "שלחנו קישור לאיפוס הסיסמה לכתובת האימייל המשויכת למספר זה")
                  : t("auth.forgotPwSent")}
              </p>
              <Link
                to={localePath("/login")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
              >
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                {t("auth.backToLogin")}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center">
                {locale === "ar" ? "أدخل بريدك الإلكتروني أو رقم هاتفك وسنرسل لك رابط إعادة تعيين كلمة المرور" : "הזן את כתובת האימייל או מספר הטלפון שלך ונשלח לך קישור לאיפוס הסיסמה"}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors"
                    placeholder=" "
                    dir="ltr"
                  />
                  <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
                    {locale === "ar" ? "البريد الإلكتروني أو رقم الهاتف" : "אימייל או מספר טלפון"}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full h-12 flex items-center justify-center text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (locale === "ar" ? "إرسال رابط إعادة التعيين" : "שלח קישור לאיפוס")}
                </button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                <Link to={localePath("/login")} className="text-foreground font-semibold underline underline-offset-2 hover:text-foreground/80 transition-colors">
                  {t("auth.backToLogin")}
                </Link>
              </p>
            </>
          )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
