import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, Grid3X3, ArrowUpDown, X, Search, Check } from "lucide-react";
import { collections, profileSubCategories, products, ContractorProduct, RetailProduct } from "@/data/products";
import { useLocale } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";

interface FilterState {
  search: string;
  collection: string;
  subCategory: string;
  sort: string;
  lengths: string[];
  colors: string[];
  skuSearch: string;
  priceMin: number;
  priceMax: number;
}

interface MobileFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  resultCount: number;
  onClearAll: () => void;
}

type PanelType = "filter" | "category" | "sort" | null;

export const MobileFilterBar = ({ filters, onFilterChange, resultCount, onClearAll }: MobileFilterBarProps) => {
  const { t, locale } = useLocale();
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const sortOptions: any[] = t("shop.sortOptions") || [];

  // Dynamic lengths and colors based on current collection
  const { availableLengths, availableColors, hasContractorProducts } = useMemo(() => {
    let relevantProducts = [...products];
    if (filters.collection !== "all") {
      const col = collections.find((c) => c.slug === filters.collection);
      if (col) relevantProducts = relevantProducts.filter((p) => p.collection === col.id);
    }
    if (filters.collection === "profiles" && filters.subCategory !== "all") {
      relevantProducts = relevantProducts.filter((p) => {
        if (p.type === "contractor") return (p as ContractorProduct).subCategory === filters.subCategory;
        return false;
      });
    }
    const contractorProducts = relevantProducts.filter((p): p is ContractorProduct => p.type === "contractor");
    const retailProducts = relevantProducts.filter((p): p is RetailProduct => p.type === "retail");
    const lengths = Array.from(new Set(contractorProducts.flatMap((p) => p.sizes.map((s) => s.label))));
    const colorMap = new Map<string, { id: string; name: { he: string; ar: string }; hex: string }>();
    contractorProducts.forEach((p) => { if (p.colorGroups[0]) p.colorGroups[0].colors.forEach((c) => colorMap.set(c.id, c)); });
    retailProducts.forEach((p) => { p.colors.forEach((c) => colorMap.set(c.id, c)); });
    return { availableLengths: lengths, availableColors: Array.from(colorMap.values()), hasContractorProducts: contractorProducts.length > 0 };
  }, [filters.collection, filters.subCategory]);

  const closePanel = () => setActivePanel(null);

  const hasActiveFilters = filters.search || filters.lengths.length > 0 || filters.colors.length > 0 || filters.skuSearch || filters.priceMin > 0 || filters.priceMax > 0;

  return (
    <>
      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background border-t border-border safe-area-bottom">
        <div className="flex">
          <button
            onClick={() => setActivePanel("filter")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-14 text-sm font-medium border-e border-border transition-colors",
              hasActiveFilters ? "text-primary" : "text-foreground"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t("shop.filters.title")}
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActivePanel("category")}
            className="flex-1 flex items-center justify-center gap-2 h-14 text-sm font-medium border-e border-border text-foreground"
          >
            <Grid3X3 className="w-4 h-4" />
            {t("shop.filters.categories")}
          </button>
          <button
            onClick={() => setActivePanel("sort")}
            className="flex-1 flex items-center justify-center gap-2 h-14 text-sm font-medium text-foreground"
          >
            <ArrowUpDown className="w-4 h-4" />
            {t("shop.filters.sort")}
          </button>
        </div>
      </div>

      {/* Panels */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 md:hidden"
            onClick={closePanel}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 bg-background rounded-t-2xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                <h3 className="text-base font-bold text-foreground">
                  {activePanel === "filter" && t("shop.filters.title")}
                  {activePanel === "category" && t("shop.filters.categories")}
                  {activePanel === "sort" && t("shop.filters.sort")}
                </h3>
                <button
                  onClick={closePanel}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-border"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {activePanel === "filter" && (
                  <>
                    {/* Search */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        {t("shop.filters.searchProducts")}
                      </label>
                      <div className="relative">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={filters.search}
                          onChange={(e) => onFilterChange({ search: e.target.value })}
                          placeholder={t("shop.filters.searchPlaceholder")}
                          className="w-full h-11 ps-10 pe-3 text-sm bg-muted border border-border rounded-xl outline-none focus:border-foreground"
                        />
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        {t("shop.filters.priceRange")}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={filters.priceMin || ""}
                          onChange={(e) => onFilterChange({ priceMin: Number(e.target.value) || 0 })}
                          placeholder="₪ מינ'"
                          className="w-full h-10 px-3 text-sm bg-muted border border-border rounded-xl outline-none focus:border-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-muted-foreground">–</span>
                        <input
                          type="number"
                          value={filters.priceMax || ""}
                          onChange={(e) => onFilterChange({ priceMax: Number(e.target.value) || 0 })}
                          placeholder="₪ מקס'"
                          className="w-full h-10 px-3 text-sm bg-muted border border-border rounded-xl outline-none focus:border-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    {/* Length */}
                    {allLengths.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          {t("shop.filters.length")}
                        </label>
                        <div className="space-y-2">
                          {allLengths.map((len) => (
                            <label key={len} className="flex items-center gap-3 cursor-pointer text-sm text-foreground">
                              <input
                                type="checkbox"
                                checked={filters.lengths.includes(len)}
                                onChange={(e) => {
                                  const newLengths = e.target.checked
                                    ? [...filters.lengths, len]
                                    : filters.lengths.filter((l) => l !== len);
                                  onFilterChange({ lengths: newLengths });
                                }}
                                className="accent-foreground w-4 h-4 rounded"
                              />
                              {len.replace("m", "")} {t("shop.filters.meter")}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Color */}
                    {allColors.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          {t("shop.filters.color")}
                        </label>
                        <div className="flex gap-3 flex-wrap">
                          {allColors.map((color) => (
                            <button
                              key={color.id}
                              onClick={() => {
                                const newColors = filters.colors.includes(color.id)
                                  ? filters.colors.filter((c) => c !== color.id)
                                  : [...filters.colors, color.id];
                                onFilterChange({ colors: newColors });
                              }}
                              className={cn(
                                "w-9 h-9 rounded-full border-2 transition-all",
                                filters.colors.includes(color.id)
                                  ? "border-foreground scale-110 ring-2 ring-foreground/20"
                                  : "border-border"
                              )}
                              style={{ backgroundColor: color.hex }}
                              title={color.name[locale]}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SKU */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        {t("shop.filters.sku")}
                      </label>
                      <input
                        type="text"
                        value={filters.skuSearch}
                        onChange={(e) => onFilterChange({ skuSearch: e.target.value })}
                        placeholder={t("shop.filters.skuPlaceholder")}
                        className="w-full h-11 px-3 text-sm bg-muted border border-border rounded-xl outline-none focus:border-foreground"
                      />
                    </div>
                  </>
                )}

                {activePanel === "category" && (
                  <div className="space-y-1">
                    <button
                      onClick={() => { onFilterChange({ collection: "all", subCategory: "all" }); closePanel(); }}
                      className={cn(
                        "w-full text-start px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                        filters.collection === "all" ? "bg-foreground text-background" : "hover:bg-muted"
                      )}
                    >
                      {t("shop.filterAll")}
                    </button>
                    {collections.map((col) => (
                      <div key={col.id}>
                        <button
                          onClick={() => { onFilterChange({ collection: col.slug, subCategory: "all" }); if (col.slug !== "profiles") closePanel(); }}
                          className={cn(
                            "w-full text-start px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                            filters.collection === col.slug ? "bg-foreground text-background" : "hover:bg-muted"
                          )}
                        >
                          {col.name[locale]}
                        </button>
                        {/* Show subcategories if profiles is selected */}
                        {filters.collection === "profiles" && col.slug === "profiles" && (
                          <div className="ps-4 space-y-0.5 mt-1">
                            <button
                              onClick={() => { onFilterChange({ subCategory: "all" }); closePanel(); }}
                              className={cn(
                                "w-full text-start px-4 py-2.5 rounded-lg text-xs transition-colors",
                                filters.subCategory === "all" ? "bg-muted font-medium" : "hover:bg-muted/50"
                              )}
                            >
                              {t("shop.filterAll")}
                            </button>
                            {profileSubCategories.map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => { onFilterChange({ subCategory: sub.id }); closePanel(); }}
                                className={cn(
                                  "w-full text-start px-4 py-2.5 rounded-lg text-xs transition-colors",
                                  filters.subCategory === sub.id ? "bg-muted font-medium" : "hover:bg-muted/50"
                                )}
                              >
                                {sub.name[locale]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activePanel === "sort" && (
                  <div className="space-y-1">
                    {sortOptions.map((opt: any) => (
                      <button
                        key={opt.value}
                        onClick={() => { onFilterChange({ sort: opt.value }); closePanel(); }}
                        className={cn(
                          "w-full text-start px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-colors",
                          filters.sort === opt.value ? "bg-foreground text-background" : "hover:bg-muted"
                        )}
                      >
                        {opt.label}
                        {filters.sort === opt.value && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom actions for filter panel */}
              {activePanel === "filter" && (
                <div className="flex gap-3 p-4 border-t border-border flex-shrink-0">
                  <button
                    onClick={() => { onClearAll(); closePanel(); }}
                    className="flex-1 h-12 text-sm font-semibold border border-border rounded-xl text-foreground hover:bg-muted transition-colors"
                  >
                    {t("shop.filters.clearAll")}
                  </button>
                  <button
                    onClick={closePanel}
                    className="flex-1 h-12 text-sm font-semibold bg-foreground text-background rounded-xl hover:opacity-90 transition-opacity"
                  >
                    {t("shop.filters.showResults").replace("{count}", String(resultCount))}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
