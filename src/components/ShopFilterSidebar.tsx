import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
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

interface ShopFilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  resultCount: number;
}

export const ShopFilterSidebar = ({ filters, onFilterChange, resultCount }: ShopFilterSidebarProps) => {
  const { t, locale } = useLocale();
  const sortOptions: any[] = t("shop.sortOptions") || [];

  const isProfilesCollection = filters.collection === "profiles";

  // Compute available lengths and colors based on current collection filter
  const { availableLengths, availableColors, hasContractorProducts } = useMemo(() => {
    let relevantProducts = [...products];

    // Filter by collection
    if (filters.collection !== "all") {
      const col = collections.find((c) => c.slug === filters.collection);
      if (col) relevantProducts = relevantProducts.filter((p) => p.collection === col.id);
    }

    // Filter by subcategory
    if (isProfilesCollection && filters.subCategory !== "all") {
      relevantProducts = relevantProducts.filter((p) => {
        if (p.type === "contractor") return (p as ContractorProduct).subCategory === filters.subCategory;
        return false;
      });
    }

    const contractorProducts = relevantProducts.filter((p): p is ContractorProduct => p.type === "contractor");
    const retailProducts = relevantProducts.filter((p): p is RetailProduct => p.type === "retail");

    const lengths = Array.from(
      new Set(contractorProducts.flatMap((p) => p.sizes.map((s) => s.label)))
    );

    const colorMap = new Map<string, { id: string; name: { he: string; ar: string }; hex: string }>();
    contractorProducts.forEach((p) => {
      if (p.colorGroups[0]) {
        p.colorGroups[0].colors.forEach((c) => colorMap.set(c.id, c));
      }
    });
    retailProducts.forEach((p) => {
      p.colors.forEach((c) => colorMap.set(c.id, c));
    });

    return {
      availableLengths: lengths,
      availableColors: Array.from(colorMap.values()),
      hasContractorProducts: contractorProducts.length > 0,
    };
  }, [filters.collection, filters.subCategory, isProfilesCollection]);

  return (
    <aside className="w-[260px] flex-shrink-0 hidden md:block">
      <div className="sticky top-36 space-y-6 max-h-[calc(100vh-10rem)] overflow-y-auto pb-8 pe-2">
        {/* Search */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-2 block">
            {t("shop.filters.searchProducts")}
          </label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              placeholder={t("shop.filters.searchPlaceholder")}
              className="w-full h-9 ps-9 pe-3 text-xs bg-muted border border-border rounded-lg outline-none focus:border-foreground transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ search: "" })}
                className="absolute end-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-2 block">
            {t("shop.filters.category")}
          </label>
          <div className="space-y-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground hover:text-accent-strong transition-colors">
              <input
                type="radio"
                name="category"
                checked={filters.collection === "all"}
                onChange={() => onFilterChange({ collection: "all", subCategory: "all" })}
                className="accent-foreground w-3.5 h-3.5"
              />
              {t("shop.filterAll")}
            </label>
            {collections.map((col) => (
              <label key={col.id} className="flex items-center gap-2 cursor-pointer text-xs text-foreground hover:text-accent-strong transition-colors">
                <input
                  type="radio"
                  name="category"
                  checked={filters.collection === col.slug}
                  onChange={() => onFilterChange({ collection: col.slug, subCategory: "all" })}
                  className="accent-foreground w-3.5 h-3.5"
                />
                {col.name[locale]}
              </label>
            ))}
          </div>
        </div>

        {/* Subcategory */}
        {isProfilesCollection && (
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              {t("shop.filters.subCategory")}
            </label>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground hover:text-accent-strong transition-colors">
                <input
                  type="radio"
                  name="subcategory"
                  checked={filters.subCategory === "all"}
                  onChange={() => onFilterChange({ subCategory: "all" })}
                  className="accent-foreground w-3.5 h-3.5"
                />
                {t("shop.filterAll")}
              </label>
              {profileSubCategories.map((sub) => (
                <label key={sub.id} className="flex items-center gap-2 cursor-pointer text-xs text-foreground hover:text-accent-strong transition-colors">
                  <input
                    type="radio"
                    name="subcategory"
                    checked={filters.subCategory === sub.id}
                    onChange={() => onFilterChange({ subCategory: sub.id })}
                    className="accent-foreground w-3.5 h-3.5"
                  />
                  {sub.name[locale]}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price Range */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-2 block">
            {t("shop.filters.priceRange")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={filters.priceMin || ""}
              onChange={(e) => onFilterChange({ priceMin: Number(e.target.value) || 0 })}
              placeholder="₪ מינימום"
              className="w-full h-8 px-2 text-xs bg-muted border border-border rounded-lg outline-none focus:border-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <input
              type="number"
              value={filters.priceMax || ""}
              onChange={(e) => onFilterChange({ priceMax: Number(e.target.value) || 0 })}
              placeholder="₪ מקסימום"
              className="w-full h-8 px-2 text-xs bg-muted border border-border rounded-lg outline-none focus:border-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Length - only shown when contractor products exist in current filter */}
        {availableLengths.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              {t("shop.filters.length")}
            </label>
            <div className="space-y-1">
              {availableLengths.map((len) => (
                <label key={len} className="flex items-center gap-2 cursor-pointer text-xs text-foreground hover:text-accent-strong transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.lengths.includes(len)}
                    onChange={(e) => {
                      const newLengths = e.target.checked
                        ? [...filters.lengths, len]
                        : filters.lengths.filter((l) => l !== len);
                      onFilterChange({ lengths: newLengths });
                    }}
                    className="accent-foreground w-3.5 h-3.5 rounded"
                  />
                  {len.replace("m", "")} {t("shop.filters.meter")}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Color */}
        {availableColors.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              {t("shop.filters.color")}
            </label>
            <div className="flex gap-2 flex-wrap">
              {availableColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => {
                    const newColors = filters.colors.includes(color.id)
                      ? filters.colors.filter((c) => c !== color.id)
                      : [...filters.colors, color.id];
                    onFilterChange({ colors: newColors });
                  }}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all",
                    filters.colors.includes(color.id)
                      ? "border-foreground scale-110 ring-2 ring-foreground/20"
                      : "border-border hover:border-muted-foreground"
                  )}
                  style={{ backgroundColor: color.hex }}
                  title={color.name[locale]}
                />
              ))}
            </div>
          </div>
        )}

        {/* SKU - only for contractor products */}
        {hasContractorProducts && (
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              {t("shop.filters.sku")}
            </label>
            <input
              type="text"
              value={filters.skuSearch}
              onChange={(e) => onFilterChange({ skuSearch: e.target.value })}
              placeholder={t("shop.filters.skuPlaceholder")}
              className="w-full h-9 px-3 text-xs bg-muted border border-border rounded-lg outline-none focus:border-foreground transition-colors"
            />
          </div>
        )}

        {/* Sort */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-2 block">
            {t("shop.filters.sort")}
          </label>
          <div className="space-y-1">
            {sortOptions.map((opt: any) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-xs text-foreground hover:text-accent-strong transition-colors">
                <input
                  type="radio"
                  name="sort"
                  checked={filters.sort === opt.value}
                  onChange={() => onFilterChange({ sort: opt.value })}
                  className="accent-foreground w-3.5 h-3.5"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
