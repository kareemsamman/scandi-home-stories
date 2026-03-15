import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const { t, localePath } = useLocale();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isValid = fullName.trim() && username.trim() && email.trim() && phone.trim() && password.trim() && acceptPrivacy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    // Placeholder — will integrate with auth later
    await new Promise((r) => setTimeout(r, 1500));
    toast({ title: t("auth.signupSuccess"), description: t("auth.signupSuccessText") });
    setLoading(false);
  };

  const FloatingField = ({ name, label, value, onChange, type = "text" }: { name: string; label: string; value: string; onChange: (v: string) => void; type?: string }) => {
    const isActive = focusedField === name || value.length > 0;
    return (
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocusedField(name)}
          onBlur={() => setFocusedField(null)}
          className="peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4f6df5]/30 focus:border-[#4f6df5] transition-colors"
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
    );
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-16" style={{ backgroundColor: "rgb(242,242,242)" }}>
        <div className="w-full max-w-md bg-white rounded-xl border border-border shadow-sm p-8 space-y-6">
          <h1 className="text-xl font-bold text-foreground text-center">{t("auth.signup")}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatingField name="fullName" label={t("auth.fullName")} value={fullName} onChange={setFullName} />
            <FloatingField name="username" label={t("auth.username")} value={username} onChange={setUsername} />
            <FloatingField name="email" label={t("checkout.email")} value={email} onChange={setEmail} type="email" />
            <FloatingField name="phone" label={t("checkout.phone")} value={phone} onChange={setPhone} type="tel" />
            <FloatingField name="password" label={t("auth.password")} value={password} onChange={setPassword} type="password" />

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
            <Link
              to={localePath("/login")}
              className="text-foreground font-semibold underline underline-offset-2 hover:text-foreground/80 transition-colors"
            >
              {t("auth.loginLink")}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Signup;
