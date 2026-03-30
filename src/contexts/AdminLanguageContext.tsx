import { createContext, useContext, useState, ReactNode } from "react";

type AdminLocale = "he" | "ar";

interface AdminLanguageContextType {
  locale: AdminLocale;
  setLocale: (l: AdminLocale) => void;
}

const Ctx = createContext<AdminLanguageContextType>({ locale: "he", setLocale: () => {} });

export const AdminLanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<AdminLocale>("ar");
  return <Ctx.Provider value={{ locale, setLocale }}>{children}</Ctx.Provider>;
};

export const useAdminLanguage = () => useContext(Ctx);
