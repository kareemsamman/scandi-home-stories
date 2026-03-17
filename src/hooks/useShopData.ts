import { useCategories, useSubCategories, useProducts as useDbProducts, useColorGroups } from "./useDbData";
import type { Collection, Product, RetailProduct, ContractorProduct, SubCategory, ColorGroup, ColorOption, SizeOption } from "@/data/products";

export const useShopData = () => {
  const { data: dbCategories, isLoading: catLoading } = useCategories();
  const { data: dbSubCategories, isLoading: subLoading } = useSubCategories();
  const { data: dbProducts, isLoading: prodLoading } = useDbProducts();
  const { data: dbColorGroups, isLoading: cgLoading } = useColorGroups();

  const isLoading = catLoading || subLoading || prodLoading || cgLoading;

  const collections: Collection[] = (dbCategories || []).map(cat => ({
    id: cat.id,
    name: { he: cat.name_he, ar: cat.name_ar },
    slug: cat.slug,
    description: { he: cat.description_he || "", ar: cat.description_ar || "" },
    image: cat.image || "",
    heroImage: cat.hero_image || "",
  }));

  // Map subcategories by category - find which category has subcategories
  const subCategoriesByCategory = new Map<string, SubCategory[]>();
  (dbSubCategories || []).forEach(sub => {
    const existing = subCategoriesByCategory.get(sub.category_id) || [];
    existing.push({ id: sub.id, name: { he: sub.name_he, ar: sub.name_ar }, image: (sub as any).image || "" });
    subCategoriesByCategory.set(sub.category_id, existing);
  });

  // Find the category that has subcategories (replaces "profiles" concept)
  const categoryWithSubs = collections.find(c => subCategoriesByCategory.has(c.id));
  const profileSubCategories: SubCategory[] = categoryWithSubs
    ? subCategoriesByCategory.get(categoryWithSubs.id) || []
    : [];
  const profilesCategorySlug = categoryWithSubs?.slug || "";

  // Build shared color groups map
  const sharedColorGroupsList: ColorGroup[] = (dbColorGroups || []).map(cg => ({
    id: cg.id,
    name: { he: cg.name_he, ar: cg.name_ar },
    colors: ((cg.colors as any[]) || []).map((c: any) => ({
      id: c.id || c.hex,
      name: { he: c.name_he || c.name?.he || c.name || "", ar: c.name_ar || c.name?.ar || c.name || "" },
      hex: c.hex,
    })),
  }));

  const products: Product[] = (dbProducts || []).map(p => {
    const base = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      collection: p.category_id || "",
      price: Number(p.price),
      description: { he: p.description_he || "", ar: p.description_ar || "" },
      longDescription: { he: p.long_description_he || "", ar: p.long_description_ar || "" },
      materials: p.materials || "",
      images: p.images || [],
      featured: p.is_featured,
      new: p.is_new,
      sort_order: p.sort_order ?? 9999,
    };

    if (p.type === "contractor") {
      let colorGroups: ColorGroup[];
      const rawColors = (p.colors as any[]) || [];
      const firstColor = rawColors[0];
      // Detect new flat format (has tax_id or label_he directly on color object)
      const isFlatFormat = firstColor && ('tax_id' in firstColor || 'label_he' in firstColor);

      if (isFlatFormat) {
        // New admin format: flat array of colors — wrap in single group
        // Always prefer product-specific colors over shared groups
        colorGroups = [{
          id: "default",
          name: { he: "", ar: "" },
          colors: rawColors.map((c: any) => ({
            id: c.tax_id || c.id || c.hex,
            name: { he: c.label_he || c.name_he || c.name?.he || "", ar: c.label_ar || c.name_ar || c.name?.ar || "" },
            hex: c.hex,
            lengths: Array.isArray(c.lengths) ? c.lengths : [],
          })),
        }];
      } else if (p.use_color_groups && rawColors.length === 0) {
        // Only fall back to shared groups if product has NO own colors
        colorGroups = sharedColorGroupsList;
      } else if (rawColors.length > 0 && rawColors[0]?.colors) {
        // Old nested format: array of color groups
        colorGroups = rawColors.map((cg: any) => ({
          id: cg.id || "default",
          name: { he: cg.name_he || cg.name?.he || "", ar: cg.name_ar || cg.name?.ar || "" },
          colors: ((cg.colors as any[]) || []).map((c: any) => ({
            id: c.id || c.hex,
            name: { he: c.name_he || c.name?.he || "", ar: c.name_ar || c.name?.ar || "" },
            hex: c.hex,
          })),
        }));
      } else {
        colorGroups = sharedColorGroupsList;
      }

      return {
        ...base,
        type: "contractor" as const,
        sku: p.sku || "",
        length: { he: p.length_he || "", ar: p.length_ar || "" },
        sizes: ((p.sizes as any[]) || []).map((s: any) => ({
          id: s.tax_id || s.id || s.value || s.label,
          label: s.label_he || s.value || s.label || "",
          price: s.price ? Number(s.price) : undefined,
        })) as SizeOption[],
        colorGroups,
        maxQuantity: p.max_quantity || undefined,
        subCategory: p.sub_category_id || undefined,
      } as ContractorProduct;
    }

    // Retail
    return {
      ...base,
      type: "retail" as const,
      dimensions: p.dimensions || undefined,
      colors: ((p.colors as any[]) || []).map((c: any) => ({
        id: c.tax_id || c.id || c.hex,
        name: { he: c.label_he || c.name_he || c.name?.he || "", ar: c.label_ar || c.name_ar || c.name?.ar || "" },
        hex: c.hex,
      })) as ColorOption[],
    } as RetailProduct;
  });

  // Helper to get product by slug
  const getProductBySlug = (slug: string) => products.find(p => p.slug === slug) || null;

  // Helper to get related products
  const getRelatedProducts = (productId: string, limit = 4) => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];
    return products
      .filter(p => p.id !== productId && p.collection === product.collection)
      .slice(0, limit);
  };

  // Helper to get collection by slug
  const getCollectionBySlug = (slug: string) => collections.find(c => c.slug === slug) || null;

  return {
    collections,
    profileSubCategories,
    profilesCategorySlug,
    products,
    isLoading,
    getProductBySlug,
    getRelatedProducts,
    getCollectionBySlug,
  };
};
