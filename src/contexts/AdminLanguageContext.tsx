import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type AdminLocale = "he" | "ar";

interface AdminLanguageContextType {
  locale: AdminLocale;
  setLocale: (l: AdminLocale) => void;
}

const STORAGE_KEY = "amg-admin-locale";

const Ctx = createContext<AdminLanguageContextType>({ locale: "he", setLocale: () => {} });

export const AdminLanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<AdminLocale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "ar" ? "ar" : "he";
  });

  const setLocale = (l: AdminLocale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  return <Ctx.Provider value={{ locale, setLocale }}>{children}</Ctx.Provider>;
};

export const useAdminLanguage = () => useContext(Ctx);
