import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const { t, localePath } = useLocale();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const identifierActive = focusedField === "identifier" || identifier.length > 0;
  const passwordActive = focusedField === "password" || password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;
    setLoading(true);
    // Placeholder — will integrate with auth later
    await new Promise((r) => setTimeout(r, 1500));
    toast({ title: t("auth.loginSuccess"), description: t("auth.loginSuccessText") });
    setLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-16" style={{ backgroundColor: "rgb(242,242,242)" }}>
        <div className="w-full max-w-md bg-white rounded-xl border border-border shadow-sm p-8 space-y-6">
          <h1 className="text-xl font-bold text-foreground text-center">{t("auth.login")}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier */}
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onFocus={() => setFocusedField("identifier")}
                onBlur={() => setFocusedField(null)}
                className="peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4f6df5]/30 focus:border-[#4f6df5] transition-colors"
                placeholder=" "
              />
              <label
                className={`absolute start-4 transition-all duration-200 pointer-events-none ${
                  identifierActive
                    ? "top-1.5 text-[10px] text-muted-foreground"
                    : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                }`}
              >
                {t("auth.identifier")}
              </label>
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className="peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4f6df5]/30 focus:border-[#4f6df5] transition-colors"
                placeholder=" "
              />
              <label
                className={`absolute start-4 transition-all duration-200 pointer-events-none ${
                  passwordActive
                    ? "top-1.5 text-[10px] text-muted-foreground"
                    : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                }`}
              >
                {t("auth.password")}
              </label>
            </div>

            <div className="flex justify-end">
              <Link
                to={localePath("/forgot-password")}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
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
            <Link
              to={localePath("/signup")}
              className="text-foreground font-semibold underline underline-offset-2 hover:text-foreground/80 transition-colors"
            >
              {t("auth.signupLink")}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
