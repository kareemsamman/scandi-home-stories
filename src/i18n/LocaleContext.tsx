import { createContext, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { translations, type Locale } from "./translations";

interface LocaleContextValue {
  locale: Locale;
  t: (key: string) => any;
  localePath: (path: string) => string;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: "he",
  t: () => "",
  localePath: (p) => p,
});

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export const LocaleProvider = ({ children }: { children: React.ReactNode }) => {
  const { locale: localeParam } = useParams<{ locale: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const locale: Locale = localeParam === "ar" ? "ar" : "he";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" || locale === "he" ? "rtl" : "ltr";
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: (key: string) => {
        const result = getNestedValue(translations[locale], key);
        return result !== undefined ? result : key;
      },
      localePath: (path: string) => {
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        return `/${locale}${cleanPath}`;
      },
    }),
    [locale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
};

export const LocaleRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("amg-locale");
    if (saved === "ar") {
      navigate("/ar", { replace: true });
      return;
    }
    const browserLang = navigator.language?.toLowerCase() || "";
    if (browserLang.startsWith("ar")) {
      navigate("/ar", { replace: true });
    } else {
      navigate("/he", { replace: true });
    }
  }, [navigate]);

  return null;
};