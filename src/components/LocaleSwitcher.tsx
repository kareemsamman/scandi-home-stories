import { ReactNode } from "react";
import { useLocale } from "@/i18n/useLocale";
import { useNavigate, useLocation } from "react-router-dom";

interface LocaleSwitcherProps {
  icon?: ReactNode;
}

export const LocaleSwitcher = ({ icon }: LocaleSwitcherProps) => {
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
      className="flex items-center gap-1 p-2 text-white/70 hover:text-white transition-colors"
      aria-label="Switch language"
    >
      {icon}
      <span className="text-xs font-medium">{locale === "he" ? "عربي" : "עברית"}</span>
    </button>
  );
};
