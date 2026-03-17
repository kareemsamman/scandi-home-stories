import { useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ShopFilterSidebar } from "@/components/ShopFilterSidebar";
import { MobileFilterBar } from "@/components/MobileFilterBar";
import { useShopData } from "@/hooks/useShopData";
import type { ContractorProduct, RetailProduct } from "@/data/products";
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
  const [isSearching, setIsSearching] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, locale, localePath } = useLocale();
  const { collections, profileSubCategories, profilesCategorySlug, products, isLoading, getCollectionBySlug } = useShopData();

  const [filters, setFilters] = useState<FilterState>(() => ({
    ...defaultFilters,
    collection: searchParams.get("collection") || "all",
    subCategory: searchParams.get("sub") || "all",
    sort: searchParams.get("sort") || "featured",
  }));

  const sortOptions: any[] = t("shop.sortOptions") || [];
  const gridRef = useRef<HTMLDivElement>(null);
  const mobileSearchTimerRef = useRef<number | null>(null);

  const handleFilterChange = useCallback((partial: Partial<FilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...partial };
      const p = new URLSearchParams();
      if (next.collection !== "all") p.set("collection", next.collection);
      if (next.subCategory !== "all") p.set("sub", next.subCategory);
      if (next.sort !== "featured") p.set("sort", next.sort);
      setSearchParams(p, { replace: true });
      return next;
    });
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [setSearchParams]);

  const handleClearAll = useCallback(() => {
    setFilters({ ...defaultFilters });
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const isProfilesCollection = filters.collection === profilesCategorySlug;
  const currentCollection = filters.collection !== "all" ? getCollectionBySlug(filters.collection) : null;
  const activeSubCategory = filters.subCategory !== "all"
    ? profileSubCategories.find((s) => s.id === filters.subCategory)
    : null;
  const heroImage = (activeSubCategory?.image) || currentCollection?.heroImage || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80";

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

    // Search
    if (filters.search) {
      const normalize = (s: string) => s.toLowerCase().replace(/[-\s]/g, "");
      const q = normalize(filters.search);
      result = result.filter((p) => {
        const matchName = normalize(p.name).includes(q);
        const matchSku = p.type === "contractor" && normalize((p as ContractorProduct).sku).includes(q);
        const matchCollection = collections.find((c) => c.id === p.collection);
        const matchCol = matchCollection ? (normalize(matchCollection.name.he).includes(q) || normalize(matchCollection.name.ar).includes(q)) : false;
        return matchName || matchSku || matchCol;
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
        return true;
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
  }, [filters, isProfilesCollection, products, collections]);

  if (isLoading) {
    return (
      <Layout>
        <section className="relative h-[28vh] md:h-[40vh] bg-muted animate-pulse" />
        <section className="py-8 md:py-12">
          <div className="section-container">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border bg-background animate-pulse">
                  <div className="aspect-square bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[28vh] md:h-[40vh] overflow-hidden">
        <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
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

      {/* Subcategory pills */}
      {isProfilesCollection && profileSubCategories.length > 0 && (
        <section className="py-3 border-b border-border bg-background hidden md:block">
          <div className="section-container">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => handleFilterChange({ subCategory: "all" })} className={cn("rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap border transition-colors", filters.subCategory === "all" ? "border-foreground bg-foreground text-background" : "border-border hover:border-muted-foreground text-foreground")}>
                {t("shop.filterAll")}
              </button>
              {profileSubCategories.map((sub) => (
                <button key={sub.id} onClick={() => handleFilterChange({ subCategory: sub.id })} className={cn("rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap border transition-colors", filters.subCategory === sub.id ? "border-foreground bg-foreground text-background" : "border-border hover:border-muted-foreground text-foreground")}>
                  {sub.name[locale]}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main content */}
      <section ref={gridRef} className="py-8 md:py-12 pb-24 md:pb-12">
        <div className="section-container md:!max-w-[94%]">
          <div className="flex gap-8">
            <ShopFilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              resultCount={filteredAndSortedProducts.length}
              onSearchingChange={setIsSearching}
              collections={collections}
              products={products}
              subCategories={profileSubCategories}
              profilesCategorySlug={profilesCategorySlug}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{filteredAndSortedProducts.length} {t("product.pieces")}</p>
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

              {/* Mobile search */}
              <div className="md:hidden mb-4">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input type="text" value={filters.search} onChange={(e) => {
                    const val = e.target.value;
                    setIsSearching(true);
                    if (mobileSearchTimerRef.current) clearTimeout(mobileSearchTimerRef.current);
                    mobileSearchTimerRef.current = window.setTimeout(() => { handleFilterChange({ search: val }); setIsSearching(false); }, 600);
                    setFilters((prev) => ({ ...prev, search: val }));
                  }} placeholder={t("shop.filters.searchPlaceholder")} className="w-full h-10 ps-9 pe-9 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  {filters.search && (
                    <button onClick={() => { handleFilterChange({ search: "" }); setIsSearching(false); }} className="absolute end-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {isSearching ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-border bg-background animate-pulse">
                      <div className="aspect-square bg-muted" />
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAndSortedProducts.length > 0 ? (
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

      <MobileFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        resultCount={filteredAndSortedProducts.length}
        onClearAll={handleClearAll}
        collections={collections}
        products={products}
        subCategories={profileSubCategories}
        profilesCategorySlug={profilesCategorySlug}
      />
    </Layout>
  );
};

export default Products;
