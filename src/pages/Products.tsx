import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ShopFilterSidebar } from "@/components/ShopFilterSidebar";
import { MobileFilterBar } from "@/components/MobileFilterBar";
import { products, collections, getCollectionBySlug, profileSubCategories, ContractorProduct, RetailProduct } from "@/data/products";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const defaultFilters: FilterState = {
  search: "",
  collection: "all",
  subCategory: "all",
  sort: "featured",
  lengths: [],
  colors: [],
  skuSearch: "",
  priceMin: 0,
  priceMax: 0,
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, locale, localePath } = useLocale();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...defaultFilters,
    collection: searchParams.get("collection") || "all",
    subCategory: searchParams.get("sub") || "all",
    sort: searchParams.get("sort") || "featured",
  }));

  const sortOptions: any[] = t("shop.sortOptions") || [];

  const gridRef = useRef<HTMLDivElement>(null);

  const handleFilterChange = useCallback((partial: Partial<FilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...partial };
      // Sync URL
      const p = new URLSearchParams();
      if (next.collection !== "all") p.set("collection", next.collection);
      if (next.subCategory !== "all") p.set("sub", next.subCategory);
      if (next.sort !== "featured") p.set("sort", next.sort);
      setSearchParams(p, { replace: true });
      return next;
    });
    // Scroll to product grid area
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [setSearchParams]);

  const handleClearAll = useCallback(() => {
    setFilters({ ...defaultFilters });
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const isProfilesCollection = filters.collection === "profiles";
  const currentCollection = filters.collection !== "all" ? getCollectionBySlug(filters.collection) : null;

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Collection filter
    if (filters.collection !== "all") {
      const col = collections.find((c) => c.slug === filters.collection);
      if (col) result = result.filter((p) => p.collection === col.id);
    }

    // Subcategory filter
    if (isProfilesCollection && filters.subCategory !== "all") {
      result = result.filter((p) => {
        if (p.type === "contractor") return (p as ContractorProduct).subCategory === filters.subCategory;
        return false;
      });
    }

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((p) => {
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.type === "contractor" && (p as ContractorProduct).sku.toLowerCase().includes(q);
        return matchName || matchSku;
      });
    }

    // SKU filter
    if (filters.skuSearch) {
      const q = filters.skuSearch.toLowerCase();
      result = result.filter((p) => {
        if (p.type === "contractor") return (p as ContractorProduct).sku.toLowerCase().includes(q);
        return false;
      });
    }

    // Length filter
    if (filters.lengths.length > 0) {
      result = result.filter((p) => {
        if (p.type === "contractor") {
          return (p as ContractorProduct).sizes.some((s) => filters.lengths.includes(s.label));
        }
        return true; // Don't filter out retail products by length
      });
    }

    // Color filter
    if (filters.colors.length > 0) {
      result = result.filter((p) => {
        if (p.type === "contractor") {
          const cp = p as ContractorProduct;
          return cp.colorGroups.some((g) => g.colors.some((c) => filters.colors.includes(c.id)));
        }
        if (p.type === "retail") {
          return (p as RetailProduct).colors.some((c) => filters.colors.includes(c.id));
        }
        return true;
      });
    }

    // Price filter
    if (filters.priceMin > 0) {
      result = result.filter((p) => {
        const price = p.type === "contractor" ? ((p as ContractorProduct).sizes[0]?.price || p.price) : p.price;
        return price >= filters.priceMin;
      });
    }
    if (filters.priceMax > 0) {
      result = result.filter((p) => {
        const price = p.type === "contractor" ? ((p as ContractorProduct).sizes[0]?.price || p.price) : p.price;
        return price <= filters.priceMax;
      });
    }

    // Sort
    switch (filters.sort) {
      case "newest": result = result.filter((p) => p.new).concat(result.filter((p) => !p.new)); break;
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "name-asc": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: result = result.filter((p) => p.featured).concat(result.filter((p) => !p.featured)); break;
    }
    return result;
  }, [filters, isProfilesCollection]);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[28vh] md:h-[40vh] overflow-hidden">
        <img src={currentCollection?.heroImage || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
        <div className="relative section-container h-full flex flex-col justify-end pb-8 md:pb-12 pt-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-2xl md:text-5xl font-bold text-white mb-2">
              {currentCollection ? currentCollection.name[locale] : t("shop.title")}
            </h1>
            {currentCollection && <p className="text-white/70 max-w-lg text-sm md:text-base">{currentCollection.description[locale]}</p>}
          </motion.div>
        </div>
      </section>

      {/* Desktop: Category Navigation Bar */}
      <section className="border-b border-border sticky top-16 md:top-20 bg-background/95 backdrop-blur-md z-40 hidden md:block">
        <div className="section-container">
          {/* Category tabs */}
          <div className="flex gap-0 overflow-x-auto">
            <button
              onClick={() => handleFilterChange({ collection: "all", subCategory: "all" })}
              className={cn(
                "px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                filters.collection === "all"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t("shop.filterAll")}
            </button>
            {collections.map((col) => (
              <button
                key={col.id}
                onClick={() => handleFilterChange({ collection: col.slug, subCategory: "all" })}
                className={cn(
                  "px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  filters.collection === col.slug
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {col.name[locale]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Subcategory pills (when profiles selected) */}
      {isProfilesCollection && (
        <section className="py-3 border-b border-border bg-background hidden md:block">
          <div className="section-container">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => handleFilterChange({ subCategory: "all" })}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap border transition-colors",
                  filters.subCategory === "all"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-muted-foreground text-foreground"
                )}
              >
                {t("shop.filterAll")}
              </button>
              {profileSubCategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleFilterChange({ subCategory: sub.id })}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap border transition-colors",
                    filters.subCategory === sub.id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-muted-foreground text-foreground"
                  )}
                >
                  {sub.name[locale]}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main content: Sidebar + Grid */}
      <section className="py-8 md:py-12 pb-24 md:pb-12">
        <div className="section-container md:!max-w-[94%]">
          <div className="flex gap-8">
            {/* Desktop sidebar */}
            <ShopFilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              resultCount={filteredAndSortedProducts.length}
            />

            {/* Product grid area */}
            <div className="flex-1 min-w-0">
              {/* Top bar: count + sort */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  {filteredAndSortedProducts.length} {t("product.pieces")}
                </p>
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t("shop.sortBy")}</span>
                  <Select value={filters.sort} onValueChange={(v) => handleFilterChange({ sort: v })}>
                    <SelectTrigger className="w-[160px] rounded-lg text-xs h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((opt: any) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredAndSortedProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                  {filteredAndSortedProducts.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-xl font-semibold text-muted-foreground mb-4">{t("product.noProducts")}</p>
                  <p className="text-muted-foreground mb-8">{t("product.noProductsText")}</p>
                  <Button asChild variant="outline" className="rounded-lg">
                    <Link to={localePath("/shop")}>{t("product.browseAll")}</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile filter bar */}
      <MobileFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        resultCount={filteredAndSortedProducts.length}
        onClearAll={handleClearAll}
      />
    </Layout>
  );
};

export default Products;
