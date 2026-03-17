import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const { t, localePath } = useLocale();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Listen for PASSWORD_RECOVERY event so Supabase sets the session from the URL token
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // session is now set, user can update password
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(t("auth.pwMinLength"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.pwMismatch"));
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(t("auth.resetPwError"));
    } else {
      setDone(true);
      setTimeout(() => navigate(localePath("/login")), 3000);
    }
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-16" style={{ backgroundColor: "rgb(242,242,242)" }}>
        <div className="w-full max-w-md bg-white rounded-xl border border-border shadow-sm p-8 space-y-6">
          <h1 className="text-xl font-bold text-foreground text-center">{t("auth.resetPwTitle")}</h1>

          {done ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
              <p className="text-sm text-muted-foreground">{t("auth.resetPwSuccess")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New password */}
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors"
                  placeholder=" "
                />
                <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
                  {t("auth.newPassword")}
                </label>
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm password */}
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors"
                  placeholder=" "
                />
                <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
                  {t("auth.confirmPassword")}
                </label>
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full h-12 flex items-center justify-center text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth.resetPwButton")}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResetPassword;
