import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const db = supabase as any;

interface PopupCard {
  title_he: string;
  title_ar: string;
  button_he: string;
  button_ar: string;
  image: string;
  link: string;
}

interface PopupSettings {
  enabled: boolean;
  title_he: string;
  title_ar: string;
  subtitle_he: string;
  subtitle_ar: string;
  cards: PopupCard[];
  delay_seconds: number;
  show_once: boolean;
}

const DEFAULT_POPUP: PopupSettings = {
  enabled: true,
  title_he: "ברוכים הבאים ל-AMG Pergola",
  title_ar: "مرحباً بكم في AMG Pergola",
  subtitle_he: "מה תרצו לראות?",
  subtitle_ar: "ماذا تريد أن ترى؟",
  cards: [
    {
      title_he: "קניית פרגולות",
      title_ar: "شراء عرائش",
      button_he: "צפו בקולקציה",
      button_ar: "تصفح المجموعة",
      image: "",
      link: "/shop",
    },
    {
      title_he: "קניית פרופילים",
      title_ar: "شراء بروفيلات",
      button_he: "לפרופילים",
      button_ar: "تصفح البروفيلات",
      image: "",
      link: "/shop",
    },
    {
      title_he: "קניית סנטף",
      title_ar: "شراء سنطاف",
      button_he: "לסנטף",
      button_ar: "تصفح السنطاف",
      image: "",
      link: "/shop",
    },
  ],
  delay_seconds: 2,
  show_once: true,
};

const usePopupSettings = () =>
  useQuery<PopupSettings>({
    queryKey: ["app_settings", "welcome_popup"],
    queryFn: async () => {
      const { data } = await db.from("app_settings").select("value").eq("key", "welcome_popup").single();
      return (data?.value as PopupSettings) ?? DEFAULT_POPUP;
    },
    staleTime: 1000 * 60 * 5,
  });

export const WelcomePopup = () => {
  const { locale, localePath } = useLocale();
  const { data: settings } = usePopupSettings();
  const [open, setOpen] = useState(false);

  const config = settings ?? DEFAULT_POPUP;

  useEffect(() => {
    if (!config.enabled) return;

    // Check if already shown
    if (config.show_once) {
      const shown = sessionStorage.getItem("amg_popup_shown");
      if (shown) return;
    }

    const timer = setTimeout(() => {
      setOpen(true);
      if (config.show_once) sessionStorage.setItem("amg_popup_shown", "1");
    }, (config.delay_seconds || 2) * 1000);

    return () => clearTimeout(timer);
  }, [config.enabled, config.delay_seconds, config.show_once]);

  const close = () => setOpen(false);
  const isAr = locale === "ar";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-4 end-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white transition-all shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="px-8 pt-8 pb-4 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {isAr ? config.title_ar : config.title_he}
              </h2>
              <p className="text-sm text-gray-500">
                {isAr ? config.subtitle_ar : config.subtitle_he}
              </p>
            </div>

            {/* Cards */}
            <div className="px-6 pb-8">
              <div className={`grid gap-4 ${config.cards.length === 3 ? "grid-cols-1 sm:grid-cols-3" : config.cards.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                {config.cards.map((card, i) => (
                  <Link
                    key={i}
                    to={localePath(card.link)}
                    onClick={close}
                    className="group relative rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all"
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                      {card.image ? (
                        <img
                          src={card.image}
                          alt={isAr ? card.title_ar : card.title_he}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-3xl opacity-30">🏗️</span>
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="p-4 text-center">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">
                        {isAr ? card.title_ar : card.title_he}
                      </h3>
                      <span className="inline-block px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-full group-hover:bg-gray-700 transition-colors">
                        {isAr ? card.button_ar : card.button_he}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
