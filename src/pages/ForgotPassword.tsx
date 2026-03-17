import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const { t, localePath, locale } = useLocale();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/${locale}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({
        title: t("auth.forgotPwError"),
        description: t("auth.forgotPwErrorText"),
        variant: "destructive",
      });
    } else {
      setSent(true);
    }
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-16" style={{ backgroundColor: "rgb(242,242,242)" }}>
        <div className="w-full max-w-md bg-white rounded-xl border border-border shadow-sm p-8 space-y-6">
          <h1 className="text-xl font-bold text-foreground text-center">{t("auth.forgotPwTitle")}</h1>

          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">{t("auth.forgotPwSent")}</p>
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
              <p className="text-sm text-muted-foreground text-center">{t("auth.forgotPwDesc")}</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors"
                    placeholder=" "
                  />
                  <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
                    {t("auth.emailLabel")}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full h-12 flex items-center justify-center text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth.sendResetLink")}
                </button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                <Link to={localePath("/login")} className="text-foreground font-semibold underline underline-offset-2 hover:text-foreground/80 transition-colors">
                  {t("auth.backToLogin")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
