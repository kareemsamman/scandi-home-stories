import { useState, useEffect } from "react";
import { X, Palette, Check } from "lucide-react";
import { useLocale } from "@/i18n/useLocale";
import { useColorTaxonomy } from "@/hooks/useProductTaxonomy";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const db = supabase as any;

// ── Global store for selected profile color ──
interface ProfileColorState {
  selectedColor: { id: string; hex: string; name: string } | null;
  setColor: (c: { id: string; hex: string; name: string } | null) => void;
  clearColor: () => void;
}

export const useProfileColor = create<ProfileColorState>()(
  persist(
    (set) => ({
      selectedColor: null,
      setColor: (c) => set({ selectedColor: c }),
      clearColor: () => set({ selectedColor: null }),
    }),
    { name: "amg-profile-color" }
  )
);

// ── Settings hook ──
const useProfileColorSettings = () =>
  useQuery<{ enabled: boolean }>({
    queryKey: ["app_settings", "profile_color_picker"],
    queryFn: async () => {
      const { data } = await db.from("app_settings").select("value").eq("key", "profile_color_picker").single();
      return (data?.value as any) ?? { enabled: true };
    },
    staleTime: 1000 * 60 * 5,
  });

// ── Popup Component ──
export const ProfileColorPopup = () => {
  const { locale } = useLocale();
  const { data: colorGroups } = useColorTaxonomy();
  const { data: settings } = useProfileColorSettings();
  const { selectedColor, setColor } = useProfileColor();
  const [open, setOpen] = useState(false);

  const isAr = locale === "ar";
  const enabled = settings?.enabled !== false;

  // Get standard colors from the color taxonomy (admin/attributes)
  const standardColors = colorGroups || [];

  useEffect(() => {
    if (!enabled || selectedColor || standardColors.length === 0) return;
    // Show popup after short delay if no color selected
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, [enabled, selectedColor, standardColors.length]);

  const getColorName = (color: any) => {
    if (isAr) return color.label_ar || color.name_ar || color.name?.ar || color.label_he || color.name_he || color.name?.he || color.name || "";
    return color.label_he || color.name_he || color.name?.he || color.label_ar || color.name_ar || color.name?.ar || color.name || "";
  };

  const handleSelect = (color: any) => {
    setColor({
      id: color.id || color.tax_id,
      hex: color.hex,
      name: getColorName(color),
    });
    setOpen(false);
  };

  if (!enabled) return null;

  return (
    <>
      {/* Popup */}
      <AnimatePresence>
        {open && !selectedColor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <button onClick={() => setOpen(false)}
                className="absolute top-3 end-3 z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all">
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="px-6 pt-6 pb-3 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Palette className="w-7 h-7 text-gray-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isAr ? "اختر لونك المفضل" : "בחרו צבע ברירת מחדל"}
                </h2>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  {isAr
                    ? "عند شراء عدة بروفيلات، اختيار لون افتراضي يسهّل عليك العملية"
                    : "קונים כמה פרופילים? בחירת צבע ברירת מחדל תחסוך לכם זמן"}
                </p>
              </div>

              {/* Colors */}
              <div className="px-6 pb-6">
                <div className="grid grid-cols-3 gap-3">
                  {standardColors.map((color: any) => (
                    <button
                      key={color.id || color.tax_id}
                      onClick={() => handleSelect(color)}
                      className="group flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-gray-100 hover:border-gray-900 hover:bg-gray-50 transition-all"
                    >
                      <div
                        className="w-12 h-12 rounded-xl border-2 border-white shadow-md group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs font-semibold text-gray-700">
                        {getColorName(color)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Skip */}
                <button
                  onClick={() => setOpen(false)}
                  className="w-full mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {isAr ? "تخطي — سأختار لكل منتج بشكل منفصل" : "דלג — אבחר צבע לכל מוצר בנפרד"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky color indicator — compact circle above WhatsApp, expands on hover / always on mobile */}
      {selectedColor && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-[11.5rem] left-6 z-[49] group"
        >
          <button
            onClick={() => { setColor(null); setOpen(true); }}
            className="relative flex items-center bg-white rounded-full shadow-lg border border-gray-200 transition-all duration-300 overflow-hidden
              h-12 w-12 sm:hover:w-auto sm:hover:pe-4 sm:hover:ps-1
              max-sm:w-auto max-sm:pe-4 max-sm:ps-1"
          >
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm shrink-0 m-1" style={{ backgroundColor: selectedColor.hex }} />
            {/* Text — hidden on desktop until hover, always visible on mobile */}
            <div className="whitespace-nowrap overflow-hidden transition-all duration-300
              sm:max-w-0 sm:opacity-0 sm:group-hover:max-w-[10rem] sm:group-hover:opacity-100 sm:group-hover:ms-1
              max-sm:max-w-[10rem] max-sm:opacity-100 max-sm:ms-1">
              <p className="text-[10px] text-gray-400 leading-none">{isAr ? "اللون المختار" : "צבע נבחר"}</p>
              <p className="text-xs font-bold text-gray-800 leading-tight">{selectedColor.name}</p>
            </div>
          </button>
        </motion.div>
      )}
    </>
  );
};
