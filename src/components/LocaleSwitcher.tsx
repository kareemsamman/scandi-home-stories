import { useLocale } from "@/i18n/useLocale";
import { useNavigate, useLocation } from "react-router-dom";
import { Globe } from "lucide-react";

export const LocaleSwitcher = () => {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLocale = () => {
    const newLocale = locale === "he" ? "ar" : "he";
    const pathWithoutLocale = location.pathname.replace(/^\/(he|ar)/, "");
    localStorage.setItem("amg-locale", newLocale);
    navigate(`/${newLocale}${pathWithoutLocale}${location.search}`);
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md hover:bg-white/10 transition-colors"
      aria-label="Switch language"
    >
      <Globe className="w-4 h-4" />
      <span>{locale === "he" ? "عربي" : "עברית"}</span>
    </button>
  );
};