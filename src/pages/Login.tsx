import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;
    setLoading(true);
    const { error } = await signIn({ email: identifier.trim(), password });
    setLoading(false);
    if (error) {
      const hebrewErrors: Record<string, string> = {
        "Invalid login credentials": "שם משתמש או סיסמה שגויים",
        "Email not confirmed": "כתובת האימייל לא אומתה, בדקו את תיבת הדואר",
        "Too many requests": "יותר מדי ניסיונות, נסו שוב מאוחר יותר",
        "User not found": "משתמש לא נמצא",
        "Invalid email or password": "שם משתמש או סיסמה שגויים",
        "Signups not allowed for this instance": "הרשמה אינה זמינה כרגע",
      };
      const msg = hebrewErrors[error.message] || "שגיאה בהתחברות, נסו שוב";
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
      }
      toast({ title: t("auth.loginSuccess"), description: t("auth.loginSuccessText") });
      navigate(localePath("/account"));
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
                {t("auth.identifier")}
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

          <p className="text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link to={localePath("/signup")} className="text-foreground font-semibold underline underline-offset-2 hover:text-foreground/80 transition-colors">
              {t("auth.signupLink")}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
