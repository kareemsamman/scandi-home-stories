import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { SEOHead } from "@/components/SEOHead";
import { useLocale } from "@/i18n/useLocale";
import { Package, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const db = supabase as any;

const ProductCatalogPage = () => {
  const { locale, localePath } = useLocale();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["catalog_categories"],
    queryFn: async () => {
      const { data } = await db.from("categories").select("id, name_he, name_ar, sort_order").order("sort_order");
      return data || [];
    },
    staleTime: 60_000,
  });

  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ["catalog_products"],
    queryFn: async () => {
      const { data: prods } = await db
        .from("products")
        .select("id, slug, name, images, category_id, price, sku, show_in_catalog")
        .eq("show_in_catalog", true)
        .or("status.eq.published,status.is.null")
        .order("sort_order");
      if (!prods?.length) return [];
      const ids = prods.map((p: any) => p.id);
      const { data: trans } = await db
        .from("product_translations")
        .select("product_id, name, locale")
        .in("product_id", ids)
        .eq("locale", "ar");
      const arMap = new Map((trans || []).map((t: any) => [t.product_id, t.name]));
      return prods.map((p: any) => ({ ...p, name_ar: arMap.get(p.id) || p.name }));
    },
    staleTime: 60_000,
  });

  const catsWithProducts = categories
    .map((cat: any) => ({ cat, items: products.filter((p: any) => p.category_id === cat.id) }))
    .filter((g) => g.items.length > 0);

  const filtered = selectedCat
    ? catsWithProducts.filter((g) => g.cat.id === selectedCat)
    : catsWithProducts;

  const seoTitle = locale === "ar" ? "قائمة المنتجات | A.M.G PERGOLA" : "קטלוג מוצרים | A.M.G PERGOLA";
  const seoDesc = locale === "ar"
    ? "تصفح قائمة منتجاتنا — برجولات وملحقات ألمنيوم عالية الجودة"
    : "צפו בקטלוג המוצרים שלנו — פרגולות ואביזרי אלומיניום באיכות גבוהה";

  return (
    <Layout>
      <SEOHead title={seoTitle} description={seoDesc} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 md:py-24 md:mt-16">
        <div className="section-container text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black tracking-tight"
          >
            {locale === "ar" ? "قائمة المنتجات" : "קטלוג מוצרים"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 mt-3 text-base md:text-lg max-w-xl mx-auto"
          >
            {locale === "ar"
              ? "تصفح مجموعتنا الكاملة من المنتجات"
              : "עיינו במגוון המוצרים המלא שלנו"}
          </motion.p>
        </div>
      </section>

      {/* Category filter pills */}
      {catsWithProducts.length > 1 && (
        <section className="sticky top-[64px] md:top-[72px] z-20 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="section-container py-3 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCat(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                !selectedCat
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {locale === "ar" ? "الكل" : "הכל"}
            </button>
            {catsWithProducts.map(({ cat }) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCat === cat.id
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {locale === "ar" ? cat.name_ar : cat.name_he}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <section className="section-container py-10 md:py-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">
              {locale === "ar" ? "لا توجد منتجات" : "אין מוצרים להצגה"}
            </p>
          </div>
        ) : (
          filtered.map(({ cat, items }, gi) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gi * 0.1 }}
              className="mb-14 last:mb-0"
            >
              {/* Category heading */}
              <div className="flex items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    {locale === "ar" ? cat.name_ar : cat.name_he}
                  </h2>
                  {locale !== "ar" && cat.name_ar && (
                    <p className="text-base text-muted-foreground mt-0.5">{cat.name_ar}</p>
                  )}
                  {locale === "ar" && cat.name_he && (
                    <p className="text-base text-muted-foreground mt-0.5">{cat.name_he}</p>
                  )}
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Products grid — 1 col mobile, 2 col sm, 3 col lg */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((product: any, pi: number) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: pi * 0.05 }}
                  >
                    <Link
                      to={localePath(`/product/${product.slug}`)}
                      className="group block rounded-2xl border border-border bg-background overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="aspect-square bg-muted overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={locale === "ar" ? product.name_ar : product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-accent-strong transition-colors">
                          {product.name}
                        </h3>
                        {product.name_ar && product.name_ar !== product.name && (
                          <p className="text-sm text-muted-foreground mt-1 leading-tight">
                            {product.name_ar}
                          </p>
                        )}
                        {product.sku && (
                          <p className="text-[10px] text-muted-foreground/60 font-mono mt-2">
                            {product.sku}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </section>
    </Layout>
  );
};

export default ProductCatalogPage;
