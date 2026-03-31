import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

import fallbackPergola from "@/assets/popup-pergola.jpg";
import fallbackProfiles from "@/assets/popup-profiles.jpg";
import fallbackSantaf from "@/assets/popup-santaf.jpg";

const db = supabase as any;

const FALLBACK_IMAGES = [fallbackPergola, fallbackProfiles, fallbackSantaf];

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
    { title_he: "קניית פרגולות", title_ar: "شراء عرائش", button_he: "צפו בקולקציה", button_ar: "تصفح المجموعة", image: "", link: "/shop" },
    { title_he: "קניית פרופילים", title_ar: "شراء بروفيلات", button_he: "לפרופילים", button_ar: "تصفح البروفيلات", image: "", link: "/shop" },
    { title_he: "קניית סנטף", title_ar: "شراء سنطاف", button_he: "לסנטף", button_ar: "تصفح السنطاف", image: "", link: "/shop" },
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            {/* Close */}
            <button
              onClick={close}
              className="absolute top-3 end-3 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:bg-black/60 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="px-5 pt-5 pb-2 sm:px-6 sm:pt-6 sm:pb-3 text-center">
              <h2 className="text-lg sm:text-2xl font-bold text-foreground">
                {isAr ? config.title_ar : config.title_he}
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                {isAr ? config.subtitle_ar : config.subtitle_he}
              </p>
            </div>

            {/* Cards grid — horizontal scroll on mobile, grid on desktop */}
            <div className="px-3 pb-4 sm:px-4 sm:pb-5">
              {/* Mobile: horizontal scroll */}
              <div className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-2 sm:hidden scrollbar-hide"
                   style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {config.cards.map((card, i) => {
                  const imgSrc = card.image || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.1, duration: 0.45, ease: "easeOut" }}
                      className="flex-shrink-0 snap-center"
                      style={{ width: "calc(100vw - 64px)", maxWidth: "280px" }}
                    >
                      <Link
                        to={localePath(card.link)}
                        onClick={close}
                        className="group relative block rounded-xl overflow-hidden aspect-[4/5]"
                      >
                        <img
                          src={imgSrc}
                          alt={isAr ? card.title_ar : card.title_he}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3.5 flex flex-col items-center text-center gap-2">
                          <h3 className="text-white text-sm font-bold leading-tight drop-shadow-lg">
                            {isAr ? card.title_ar : card.title_he}
                          </h3>
                          <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-semibold rounded-full">
                            {isAr ? card.button_ar : card.button_he}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Desktop: grid */}
              <div className={`hidden sm:grid gap-3 ${
                config.cards.length === 3 ? "grid-cols-3" :
                config.cards.length === 2 ? "grid-cols-2" :
                "grid-cols-1 max-w-sm mx-auto"
              }`}>
                {config.cards.map((card, i) => {
                  const imgSrc = card.image || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.1, duration: 0.45, ease: "easeOut" }}
                    >
                      <Link
                        to={localePath(card.link)}
                        onClick={close}
                        className="group relative block rounded-xl overflow-hidden aspect-[2/3]"
                      >
                        <img
                          src={imgSrc}
                          alt={isAr ? card.title_ar : card.title_he}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/60" />
                        <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col items-center text-center gap-2.5">
                          <h3 className="text-white text-lg font-bold leading-tight drop-shadow-lg">
                            {isAr ? card.title_ar : card.title_he}
                          </h3>
                          <span className="inline-block px-5 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold rounded-full transition-all duration-300 group-hover:bg-white/30 group-hover:-translate-y-0.5">
                            {isAr ? card.button_ar : card.button_he}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
