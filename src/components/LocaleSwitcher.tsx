import { ReactNode, useState, useRef, useEffect } from "react";
import { useLocale } from "@/i18n/useLocale";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface LocaleSwitcherProps {
  icon?: ReactNode;
  scrolled?: boolean;
  /** Render inline language pills instead of a dropdown (for mobile drawer) */
  inline?: boolean;
}

const LANGUAGES = [
  { code: "he" as const, label: "עברית" },
  { code: "ar" as const, label: "العربية" },
];

export const LocaleSwitcher = ({ icon, scrolled, inline }: LocaleSwitcherProps) => {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const switchTo = (code: "he" | "ar") => {
    if (code === locale) { setOpen(false); return; }
    const pathWithoutLocale = location.pathname.replace(/^\/(he|ar)/, "");
    localStorage.setItem("amg-locale", code);
    setOpen(false);
    navigate(`/${code}${pathWithoutLocale}${location.search}`);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  /* ── Mobile inline pills ── */
  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <svg role="presentation" strokeWidth="2" focusable="false" width="18" height="18" viewBox="0 0 22 22" fill="none" className="text-muted-foreground shrink-0">
          <circle cx="11" cy="11" r="8" stroke="currentColor" fill="none" />
          <ellipse cx="11" cy="11" rx="3.5" ry="8" stroke="currentColor" fill="none" />
          <path d="M3 11h16" stroke="currentColor" strokeLinecap="round" />
        </svg>
        <div className="flex gap-1.5">
          {LANGUAGES.map((lang) => {
            const isActive = locale === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => switchTo(lang.code)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                  isActive
                    ? "bg-foreground text-background"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Desktop dropdown ── */
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200",
          icon
            ? (scrolled
                ? "text-foreground hover:bg-foreground/5"
                : "text-white hover:bg-white/10")
            : "text-foreground hover:bg-foreground/5"
        )}
        aria-label="Switch language"
        aria-expanded={open}
      >
        {icon || (
          <svg role="presentation" strokeWidth="2" focusable="false" width="20" height="20" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" fill="none" />
            <ellipse cx="11" cy="11" rx="3.5" ry="8" stroke="currentColor" fill="none" />
            <path d="M3 11h16" stroke="currentColor" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-44 bg-background border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 end-0"
        >
          {LANGUAGES.map((lang) => {
            const isActive = locale === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => switchTo(lang.code)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                  isActive
                    ? "bg-foreground/5 font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span className="flex-1 text-start">{lang.label}</span>
                {isActive && <Check className="w-4 h-4 text-foreground" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
