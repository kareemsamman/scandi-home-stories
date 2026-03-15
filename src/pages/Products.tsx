import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { products, collections, getCollectionBySlug, profileSubCategories, ContractorProduct } from "@/data/products";
import { useLocale } from "@/i18n/useLocale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SortOption = "featured" | "newest" | "price-asc" | "price-desc" | "name-asc";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, locale, localePath } = useLocale();
  const activeCollection = searchParams.get("collection") || "all";
  const activeSort = (searchParams.get("sort") as SortOption) || "featured";
  const activeSubCategory = searchParams.get("sub") || "all";

  const sortOptions: any[] = t("shop.sortOptions") || [];
  const isProfilesCollection = activeCollection === "profiles";

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    if (activeCollection !== "all") {
      const col = collections.find((c) => c.slug === activeCollection);
      if (col) result = result.filter((p) => p.collection === col.id);
    }

    // Apply subcategory filter for profiles
    if (isProfilesCollection && activeSubCategory !== "all") {
      result = result.filter((p) => {
        if (p.type === "contractor") {
          return (p as ContractorProduct).subCategory === activeSubCategory;
        }
        return false;
      });
    }

    switch (activeSort) {
      case "newest": result = result.filter((p) => p.new).concat(result.filter((p) => !p.new)); break;
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "name-asc": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: result = result.filter((p) => p.featured).concat(result.filter((p) => !p.featured)); break;
    }
    return result;
  }, [activeCollection, activeSort, activeSubCategory, isProfilesCollection]);

  const currentCollection = activeCollection !== "all" ? getCollectionBySlug(activeCollection) : null;

  const handleFilterChange = (slug: string) => {
    const p = new URLSearchParams(searchParams);
    if (slug === "all") p.delete("collection"); else p.set("collection", slug);
    p.delete("sub"); // reset subcategory when switching collection
    setSearchParams(p);
  };

  const handleSubCategoryChange = (subId: string) => {
    const p = new URLSearchParams(searchParams);
    if (subId === "all") p.delete("sub"); else p.set("sub", subId);
    setSearchParams(p);
  };

  const handleSortChange = (v: string) => {
    const p = new URLSearchParams(searchParams);
    if (v === "featured") p.delete("sort"); else p.set("sort", v);
    setSearchParams(p);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[35vh] md:h-[45vh] overflow-hidden">
        <img src={currentCollection?.heroImage || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
        <div className="relative section-container h-full flex flex-col justify-end pb-10 md:pb-14 pt-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              {currentCollection ? currentCollection.name[locale] : t("shop.title")}
            </h1>
            {currentCollection && <p className="text-white/70 max-w-lg">{currentCollection.description[locale]}</p>}
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 border-b border-border sticky top-16 md:top-20 bg-background/95 backdrop-blur-md z-40">
        <div className="section-container flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Button variant="ghost" size="sm" onClick={() => handleFilterChange("all")} className={cn("rounded-lg px-4 text-xs whitespace-nowrap", activeCollection === "all" && "bg-foreground text-background hover:bg-foreground/90 hover:text-background")}>
              {t("shop.filterAll")}
            </Button>
            {collections.map((col) => (
              <Button key={col.id} variant="ghost" size="sm" onClick={() => handleFilterChange(col.slug)} className={cn("rounded-lg px-4 text-xs whitespace-nowrap", activeCollection === col.slug && "bg-foreground text-background hover:bg-foreground/90 hover:text-background")}>
                {col.name[locale]}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("shop.sortBy")}</span>
            <Select value={activeSort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[160px] rounded-lg text-xs h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt: any) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Subcategory filters for profiles */}
      {isProfilesCollection && (
        <section className="py-3 border-b border-border bg-background">
          <div className="section-container">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSubCategoryChange("all")}
                className={cn(
                  "rounded-full px-4 text-xs whitespace-nowrap border",
                  activeSubCategory === "all"
                    ? "border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                    : "border-border"
                )}
              >
                {t("shop.filterAll")}
              </Button>
              {profileSubCategories.map((sub) => (
                <Button
                  key={sub.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSubCategoryChange(sub.id)}
                  className={cn(
                    "rounded-full px-4 text-xs whitespace-nowrap border",
                    activeSubCategory === sub.id
                      ? "border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background"
                      : "border-border"
                  )}
                >
                  {sub.name[locale]}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Grid */}
      <section className="py-10 md:py-16">
        <div className="section-container md:!max-w-[90%]">
          {filteredAndSortedProducts.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-8">{filteredAndSortedProducts.length} {t("product.pieces")}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {filteredAndSortedProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </>
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
      </section>
    </Layout>
  );
};

export default Products;
