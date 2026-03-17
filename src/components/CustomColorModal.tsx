import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { ColorOption, ColorGroup } from "@/data/products";
import { useLocale } from "@/i18n/useLocale";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface CustomColorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (color: { id: string; name: string; hex: string; price?: number }) => void;
  colorGroups: ColorGroup[];
  selectedColorId?: string;
}

export const CustomColorModal = ({ open, onClose, onSelect, colorGroups, selectedColorId }: CustomColorModalProps) => {
  const { t, locale } = useLocale();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");

  const tabs = colorGroups.map(group => ({
    label: group.name[locale] || group.name.he || "Colors",
    colors: group.colors,
  }));

  const filteredColors = useMemo(() => {
    const colors = tabs[activeTab]?.colors || [];
    if (!search.trim()) return colors;
    const q = search.toLowerCase();
    return colors.filter(c =>
      c.name[locale].toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  }, [activeTab, search, tabs, locale]);

  const handleSelect = (color: ColorOption) => {
    onSelect({ id: color.id, name: color.name[locale], hex: color.hex, price: (color as any).price });
  };

  const handleConfirm = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: isMobile ? "100%" : 30, opacity: isMobile ? 1 : 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isMobile ? "100%" : 30, opacity: isMobile ? 1 : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            className={cn(
              "bg-background flex flex-col",
              isMobile
                ? "w-full rounded-t-2xl max-h-[90vh]"
                : "w-full max-w-lg rounded-2xl shadow-2xl max-h-[80vh]"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <h3 className="text-base font-bold text-foreground">{t("contractor.customColorTitle")}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pt-4 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2 border border-border rounded-xl px-3 h-11">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("contractor.searchColor")}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="px-5 pt-2 pb-1 flex-shrink-0">
              <div className="flex gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {tabs.map((tab, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveTab(idx); setSearch(""); }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all",
                      activeTab === idx
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color grid */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {filteredColors.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pt-2">
                  {filteredColors.map((color) => {
                    const isActive = selectedColorId === color.id;
                    return (
                      <button
                        key={color.id}
                        onClick={() => handleSelect(color)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all",
                          isActive ? "border-foreground bg-muted" : "border-transparent hover:border-border"
                        )}
                      >
                        <span
                          className={cn(
                            "w-10 h-10 rounded-lg border",
                            isActive ? "border-foreground ring-2 ring-foreground/20" : "border-border"
                          )}
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-[10px] font-medium text-foreground leading-tight text-center line-clamp-2">
                          {color.name[locale]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">—</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-border flex-shrink-0">
              <button
                onClick={onClose}
                className="flex-1 h-11 text-sm font-medium rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
              >
                {t("contractor.cancel")}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 h-11 text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                {t("contractor.confirmSelection")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
