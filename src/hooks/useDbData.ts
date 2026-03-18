import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

// ─── Types ───
export interface DbCategory {
  id: string; slug: string; name_he: string; name_ar: string;
  description_he: string; description_ar: string; image: string;
  hero_image: string; sort_order: number;
}
export interface DbSubCategory {
  id: string; category_id: string; slug: string;
  name_he: string; name_ar: string; sort_order: number;
}
export interface DbProduct {
  id: string; slug: string; name: string; type: "retail" | "contractor";
  category_id: string | null; sub_category_id: string | null;
  price: number; sku: string | null;
  description_he: string; description_ar: string;
  long_description_he: string; long_description_ar: string;
  materials: string; dimensions: string | null;
  length_he: string | null; length_ar: string | null;
  max_quantity: number | null; is_featured: boolean; is_new: boolean;
  sort_order: number; images: string[]; colors: any[]; sizes: any[];
  use_color_groups: boolean;
  content_html_he: string;
  content_html_ar: string;
  product_details: any[];
  custom_colors_enabled: boolean;
  custom_color_groups: any[];
  custom_color_prices: any;
}
export interface DbColorGroup {
  id: string; name_he: string; name_ar: string;
  sort_order: number; colors: any[];
}
export interface DbHeroSlide {
  id: string; title_he: string; title_ar: string;
  subtitle_he: string; subtitle_ar: string;
  cta_he: string; cta_ar: string;
  image: string; link: string; sort_order: number; is_active: boolean;
}
export interface DbOrder {
  id: string; user_id: string | null; order_number: string; status: string;
  total: number; discount_code: string | null; discount_amount: number;
  first_name: string; last_name: string; email: string; phone: string;
  city: string; address: string; apartment: string; notes: string;
  created_at: string; updated_at: string;
  receipt_url: string | null; locale: string | null;
}
export interface DbOrderItem {
  id: string; order_id: string; product_id: string | null;
  product_name: string; product_image: string; price: number;
  quantity: number; size: string | null; color_name: string | null;
  color_hex: string | null;
}

// ─── Translation helpers ───
function buildTransMap(trans: any[], foreignKey: string): Map<string, Record<string, any>> {
  const map = new Map<string, Record<string, any>>();
  (trans || []).forEach((t: any) => {
    const fk = t[foreignKey];
    if (!map.has(fk)) map.set(fk, {});
    map.get(fk)![t.locale] = t;
  });
  return map;
}

// ─── Queries (translation-aware, backward-compatible) ───

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const [{ data: cats }, { data: trans }] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        db.from("category_translations").select("*"),
      ]);
      const tm = buildTransMap(trans, "category_id");
      return (cats || []).map((c: any) => ({
        ...c,
        name_he: tm.get(c.id)?.he?.name || c.name_he || "",
        name_ar: tm.get(c.id)?.ar?.name || c.name_ar || "",
        description_he: tm.get(c.id)?.he?.description || c.description_he || "",
        description_ar: tm.get(c.id)?.ar?.description || c.description_ar || "",
      })) as DbCategory[];
    },
  });

export const useSubCategories = (categoryId?: string) =>
  useQuery({
    queryKey: ["sub_categories", categoryId],
    queryFn: async () => {
      let q = supabase.from("sub_categories").select("*").order("sort_order");
      if (categoryId) q = q.eq("category_id", categoryId);
      const [{ data: subs }, { data: trans }] = await Promise.all([
        q,
        db.from("sub_category_translations").select("*"),
      ]);
      const tm = buildTransMap(trans, "sub_category_id");
      return (subs || []).map((s: any) => ({
        ...s,
        name_he: tm.get(s.id)?.he?.name || s.name_he || "",
        name_ar: tm.get(s.id)?.ar?.name || s.name_ar || "",
      })) as DbSubCategory[];
    },
  });

export const useProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const [{ data: prods }, { data: trans }] = await Promise.all([
        supabase.from("products").select("*").or("status.eq.published,status.is.null").order("sort_order"),
        db.from("product_translations").select("*"),
      ]);
      const tm = buildTransMap(trans, "product_id");
      return (prods || []).map((p: any) => ({
        ...p,
        name: tm.get(p.id)?.he?.name || p.name || "",
        description_he: tm.get(p.id)?.he?.description || p.description_he || "",
        description_ar: tm.get(p.id)?.ar?.description || p.description_ar || "",
        long_description_he: tm.get(p.id)?.he?.long_description || p.long_description_he || "",
        long_description_ar: tm.get(p.id)?.ar?.long_description || p.long_description_ar || "",
        length_he: tm.get(p.id)?.he?.length || p.length_he || "",
        length_ar: tm.get(p.id)?.ar?.length || p.length_ar || "",
        content_html_he: tm.get(p.id)?.he?.content_html || "",
        content_html_ar: tm.get(p.id)?.ar?.content_html || "",
        product_details: Array.isArray(p.product_details) ? p.product_details : [],
      })) as DbProduct[];
    },
  });

export const useProductBySlug = (slug: string) =>
  useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data: p, error } = await supabase.from("products").select("*").eq("slug", slug).single();
      if (error) throw error;
      const { data: trans } = await db.from("product_translations").select("*").eq("product_id", p.id);
      const tm = buildTransMap(trans, "product_id");
      return {
        ...p,
        name: tm.get(p.id)?.he?.name || p.name || "",
        description_he: tm.get(p.id)?.he?.description || p.description_he || "",
        description_ar: tm.get(p.id)?.ar?.description || p.description_ar || "",
        long_description_he: tm.get(p.id)?.he?.long_description || p.long_description_he || "",
        long_description_ar: tm.get(p.id)?.ar?.long_description || p.long_description_ar || "",
        length_he: tm.get(p.id)?.he?.length || p.length_he || "",
        length_ar: tm.get(p.id)?.ar?.length || p.length_ar || "",
        content_html_he: tm.get(p.id)?.he?.content_html || "",
        content_html_ar: tm.get(p.id)?.ar?.content_html || "",
        product_details: Array.isArray(p.product_details) ? p.product_details : [],
        custom_colors_enabled: p.custom_colors_enabled ?? false,
        custom_color_groups: Array.isArray(p.custom_color_groups) ? p.custom_color_groups : [],
        custom_color_prices: p.custom_color_prices ?? null,
      } as DbProduct;
    },
    enabled: !!slug,
  });

export const useColorGroups = () =>
  useQuery({
    queryKey: ["color_groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("color_groups").select("*").order("sort_order");
      if (error) throw error;
      return data as DbColorGroup[];
    },
  });

export const useHeroSlides = () =>
  useQuery({
    queryKey: ["hero_slides"],
    queryFn: async () => {
      const [{ data: slides }, { data: trans }] = await Promise.all([
        supabase.from("hero_slides").select("*").eq("is_active", true).order("sort_order"),
        db.from("hero_slide_translations").select("*"),
      ]);
      const tm = buildTransMap(trans, "hero_slide_id");
      return (slides || []).map((s: any) => ({
        ...s,
        title_he: tm.get(s.id)?.he?.title || s.title_he || "",
        title_ar: tm.get(s.id)?.ar?.title || s.title_ar || "",
        subtitle_he: tm.get(s.id)?.he?.subtitle || s.subtitle_he || "",
        subtitle_ar: tm.get(s.id)?.ar?.subtitle || s.subtitle_ar || "",
        cta_he: tm.get(s.id)?.he?.cta || s.cta_he || "",
        cta_ar: tm.get(s.id)?.ar?.cta || s.cta_ar || "",
      })) as DbHeroSlide[];
    },
  });

export const useOrders = () =>
  useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (DbOrder & { order_items: DbOrderItem[] })[];
    },
  });

export const useOrderById = (orderId: string) =>
  useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .single();
      if (error) throw error;
      return data as DbOrder & { order_items: DbOrderItem[] };
    },
    enabled: !!orderId,
  });

// ─── Admin-specific queries ───

export const useAdminTranslations = (table: string, foreignKey: string, locale: string) =>
  useQuery({
    queryKey: [`admin_trans_${table}`, locale],
    queryFn: async () => {
      const { data } = await db.from(table).select("*").eq("locale", locale);
      return new Map((data || []).map((t: any) => [t[foreignKey], t]));
    },
    enabled: !!locale,
  });

export const usePages = () =>
  useQuery({
    queryKey: ["pages"],
    queryFn: async () => {
      const { data } = await db.from("pages").select("*").order("sort_order");
      return data || [];
    },
  });

export const useInventory = () =>
  useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data } = await db.from("inventory").select("*");
      return data || [];
    },
  });

// ─── Locale helpers ───
export const getLocaleName = (item: { name_he: string; name_ar: string }, locale: string) =>
  locale === "ar" ? item.name_ar : item.name_he;

export const getLocaleField = (item: Record<string, any>, field: string, locale: string) =>
  locale === "ar" ? item[`${field}_ar`] : item[`${field}_he`];
