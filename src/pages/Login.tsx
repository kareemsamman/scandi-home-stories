import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const { t, localePath } = useLocale();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || localePath("/account");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestHint, setGuestHint] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  const checkEmailHasGuestOrders = async (email: string) => {
    const db = supabase as any;
    const { data } = await db.from("orders").select("id").eq("email", email).is("user_id", null).limit(1);
    return (data?.length ?? 0) > 0;
  };

  /** Detect if input looks like an Israeli phone number */
  const isPhoneInput = (v: string) => /^[\d\s\-\+]{7,15}$/.test(v.trim()) && !v.includes("@");

  /** Resolve identifier to email (look up by phone if needed) */
  const resolveEmail = async (raw: string): Promise<{ email: string | null; needs_password?: boolean }> => {
    if (!isPhoneInput(raw)) return { email: raw.trim() };
    const res = await supabase.functions.invoke("auth-lookup", {
      body: { action: "login", phone: raw.trim() },
    });
    if (res.data?.needs_password) return { email: null, needs_password: true };
    if (res.data?.found) return { email: res.data.email as string };
    return { email: null };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;
    setLoading(true);
    setGuestHint(false);
    setNeedsRegistration(false);

    // Resolve phone → email if needed
    const { email: resolvedEmail, needs_password } = await resolveEmail(identifier.trim());

    if (needs_password) {
      setLoading(false);
      setNeedsRegistration(true);
      return;
    }

    if (!resolvedEmail) {
      setLoading(false);
      toast({ title: "שגיאה", description: isPhoneInput(identifier.trim()) ? "מספר הטלפון לא נמצא במערכת" : "שם משתמש או סיסמה שגויים", variant: "destructive" });
      return;
    }

    const { error } = await signIn({ email: resolvedEmail, password });
    setLoading(false);
    if (error) {
      const isCredentialsError = error.message === "Invalid login credentials" || error.message === "Invalid email or password";

      // Phone found but wrong password → likely an auto-created account needing registration
      if (isCredentialsError && isPhoneInput(identifier.trim())) {
        setNeedsRegistration(true);
        return;
      }

      if (isCredentialsError && !isPhoneInput(identifier.trim())) {
        const hasGuestOrders = await checkEmailHasGuestOrders(resolvedEmail);
        if (hasGuestOrders) {
          setGuestHint(true);
          return;
        }
      }
      const hebrewErrors: Record<string, string> = {
        "Invalid login credentials": "שם משתמש או סיסמה שגויים",
        "Email not confirmed": "כתובת האימייל לא אומתה, בדקו את תיבת הדואר",
        "Too many requests": "יותר מדי ניסיונות, נסו שוב מאוחר יותר",
        "User not found": "משתמש לא נמצא",
        "Signups not allowed for this instance": "הרשמה אינה זמינה כרגע",
      };
      const msg = hebrewErrors[error.message] || "שם משתמש או סיסמה שגויים";
      toast({ title: "שגיאה", description: msg, variant: "destructive" });
    } else {
      // Check if user is admin — redirect to /admin
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        if (roles?.some(r => r.role === "admin")) {
          toast({ title: t("auth.loginSuccess"), description: t("auth.loginSuccessText") });
          navigate("/admin");
          return;
        }
        if (roles?.some(r => r.role === "worker")) {
          toast({ title: t("auth.loginSuccess"), description: t("auth.loginSuccessText") });
          navigate("/admin/orders");
          return;
        }
      }
      toast({ title: t("auth.loginSuccess"), description: t("auth.loginSuccessText") });
      navigate(redirectTo);
    }
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-16" style={{ backgroundColor: "rgb(242,242,242)" }}>
        <div className="w-full max-w-md bg-white rounded-xl border border-border shadow-sm p-8 space-y-6">
          <h1 className="text-xl font-bold text-foreground text-center">{t("auth.login")}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors"
                placeholder=" "
              />
              <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
                אימייל או מספר טלפון
              </label>
            </div>

            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors"
                placeholder=" "
              />
              <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
                {t("auth.password")}
              </label>
            </div>

            <div className="flex justify-end">
              <Link to={localePath("/forgot-password")} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password.trim()}
              className="w-full h-12 flex items-center justify-center text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth.login")}
            </button>
          </form>

          {needsRegistration && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-lg">📦</span>
                <div>
                  <p className="font-bold">יש לך הזמנה אצלנו!</p>
                  <p className="text-xs text-blue-700 mt-0.5">מצאנו חשבון עם מספר הטלפון שהזנת, אבל עדיין לא הגדרת סיסמה. השלם את ההרשמה כדי לצפות בהזמנות שלך.</p>
                </div>
              </div>
              <Link
                to={`${localePath("/complete-registration")}?phone=${encodeURIComponent(identifier.trim())}`}
                className="block w-full text-center text-sm font-bold py-2.5 rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition-colors"
              >
                השלם הרשמה וצפה בהזמנות שלך →
              </Link>
            </div>
          )}

          {guestHint && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
              <p className="font-semibold">נראה שביצעת הזמנה בעבר עם כתובת מייל זו ללא סיסמה.</p>
              <p className="text-xs text-amber-700">כדי לצפות בהזמנות שלך, הירשם עם אותו מייל — ההזמנות יתחברו לחשבון שלך אוטומטית.</p>
              <div className="flex gap-2 pt-1">
                <Link
                  to={`${localePath("/signup")}?redirect=${encodeURIComponent(redirectTo)}&email=${encodeURIComponent(identifier.trim())}`}
                  className="flex-1 text-center text-xs font-bold py-2 rounded-lg bg-amber-900 text-white hover:bg-amber-800 transition-colors"
                >
                  יצירת חשבון
                </Link>
                <Link
                  to={localePath("/forgot-password")}
                  className="flex-1 text-center text-xs font-medium py-2 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  שכחתי סיסמה
                </Link>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link to={`${localePath("/signup")}${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`} className="text-foreground font-semibold underline underline-offset-2 hover:text-foreground/80 transition-colors">
              {t("auth.signupLink")}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
