import { ReactNode } from "react";
import { useLocale } from "@/i18n/useLocale";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LocaleSwitcherProps {
  icon?: ReactNode;
  scrolled?: boolean;
}

export const LocaleSwitcher = ({ icon, scrolled }: LocaleSwitcherProps) => {
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
      className={cn(
        "flex items-center gap-1 p-2 transition-colors duration-[240ms]",
        scrolled
          ? "text-foreground hover:text-foreground/70"
          : "text-white hover:text-white/80"
      )}
      aria-label="Switch language"
    >
      {icon}
      <span className="text-xs font-medium">{locale === "he" ? "عربي" : "עברית"}</span>
    </button>
  );
};
