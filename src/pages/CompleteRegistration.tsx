import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CompleteRegistration = () => {
  const { localePath } = useLocale();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phoneFromUrl = searchParams.get("phone") || "";
  const firstNameFromUrl = searchParams.get("firstName") || "";
  const lastNameFromUrl = searchParams.get("lastName") || "";
  const emailFromUrl = searchParams.get("email") || "";
  const tokenFromUrl = searchParams.get("token") || "";

  const [form, setForm] = useState({
    firstName: firstNameFromUrl,
    lastName: lastNameFromUrl,
    phone: phoneFromUrl,
    email: emailFromUrl,
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [registrationToken, setRegistrationToken] = useState(tokenFromUrl);

  // If arriving from Login (no name/email in URL), fetch from latest order by phone
  useEffect(() => {
    if (!phoneFromUrl || (firstNameFromUrl && lastNameFromUrl)) return;
    const digits = phoneFromUrl.replace(/[\s\-\+\(\)]/g, "");
    const local = digits.startsWith("972") ? "0" + digits.slice(3) : digits;
    const intl = local.startsWith("0") ? "972" + local.slice(1) : local;
    (supabase as any)
      .from("orders")
      .select("first_name, last_name, email")
      .or(`phone.eq.${local},phone.eq.${intl},phone.eq.+${intl}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }: { data: any[] | null }) => {
        const order = data?.[0];
        if (!order) return;
        setForm(prev => ({
          ...prev,
          firstName: prev.firstName || order.first_name || "",
          lastName: prev.lastName || order.last_name || "",
          email: prev.email || (order.email && !order.email.includes("@no-email.amg-pergola.com") ? order.email : ""),
        }));
      });
  }, [phoneFromUrl]);

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({ title: "שגיאה", description: "נא למלא שם פרטי ושם משפחה", variant: "destructive" });
      return;
    }
    if (!form.phone.trim()) {
      toast({ title: "שגיאה", description: "נא למלא מספר טלפון", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "שגיאה", description: "הסיסמה חייבת להכיל לפחות 6 תווים", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "שגיאה", description: "הסיסמאות אינן תואמות", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.functions.invoke("set-password", {
      body: {
        phone: form.phone.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
      },
    });
    setLoading(false);

    if (error || data?.error) {
      toast({ title: "שגיאה", description: "לא הצלחנו להשלים את ההרשמה. בדוק את הפרטים ונסה שוב.", variant: "destructive" });
      return;
    }

    toast({ title: "ההרשמה הושלמה! 🎉", description: "הסיסמה נוצרה בהצלחה. אנא התחבר עם האימייל והסיסמה שלך." });
    navigate(localePath("/login"));
  };

  const fields = [
    { key: "firstName", label: "שם פרטי", type: "text" },
    { key: "lastName",  label: "שם משפחה", type: "text" },
    { key: "phone",     label: "מספר טלפון", type: "tel" },
    { key: "email",     label: "אימייל (אופציונלי)", type: "email" },
    { key: "password",  label: "סיסמה (לפחות 6 תווים)", type: "password" },
    { key: "confirmPassword", label: "אימות סיסמה", type: "password" },
  ] as const;

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-16" style={{ backgroundColor: "rgb(242,242,242)" }}>
        <div className="w-full max-w-md bg-white rounded-xl border border-border shadow-sm p-8 space-y-6">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📦</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">השלמת הרשמה</h1>
            <p className="text-sm text-muted-foreground">מלא את הפרטים שלך כדי לגשת להזמנות שלך</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, type }) => (
              <div key={key} className="relative">
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  readOnly={key === "phone" && !!phoneFromUrl}
                  className={`peer w-full h-[48px] px-4 pt-4 pb-1 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] transition-colors ${key === "phone" && phoneFromUrl ? "bg-gray-50 text-gray-500" : ""}`}
                  placeholder=" "
                  dir={type === "email" || type === "password" || key === "phone" ? "ltr" : "rtl"}
                />
                <label className="absolute start-4 transition-all duration-200 pointer-events-none top-1/2 -translate-y-1/2 text-sm text-muted-foreground peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px]">
                  {label}
                </label>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center text-sm font-bold bg-foreground text-background rounded-[1.875rem] hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "השלם הרשמה והתחבר"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CompleteRegistration;
