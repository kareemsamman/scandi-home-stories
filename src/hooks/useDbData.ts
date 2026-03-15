import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───
export interface DbCategory {
  id: string;
  slug: string;
  name_he: string;
  name_ar: string;
  description_he: string;
  description_ar: string;
  image: string;
  hero_image: string;
  sort_order: number;
}

export interface DbSubCategory {
  id: string;
  category_id: string;
  slug: string;
  name_he: string;
  name_ar: string;
  sort_order: number;
}

export interface DbProduct {
  id: string;
  slug: string;
  name: string;
  type: "retail" | "contractor";
  category_id: string | null;
  sub_category_id: string | null;
  price: number;
  sku: string | null;
  description_he: string;
  description_ar: string;
  long_description_he: string;
  long_description_ar: string;
  materials: string;
  dimensions: string | null;
  length_he: string | null;
  length_ar: string | null;
  max_quantity: number | null;
  is_featured: boolean;
  is_new: boolean;
  sort_order: number;
  images: string[];
  colors: any[];
  sizes: any[];
  use_color_groups: boolean;
}

export interface DbColorGroup {
  id: string;
  name_he: string;
  name_ar: string;
  sort_order: number;
  colors: any[];
}

export interface DbHeroSlide {
  id: string;
  title_he: string;
  title_ar: string;
  subtitle_he: string;
  subtitle_ar: string;
  cta_he: string;
  cta_ar: string;
  image: string;
  link: string;
  sort_order: number;
  is_active: boolean;
}

export interface DbOrder {
  id: string;
  user_id: string | null;
  order_number: string;
  status: string;
  total: number;
  discount_code: string | null;
  discount_amount: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  apartment: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
  size: string | null;
  color_name: string | null;
  color_hex: string | null;
}

// ─── Queries ───
export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as DbCategory[];
    },
  });

export const useSubCategories = (categoryId?: string) =>
  useQuery({
    queryKey: ["sub_categories", categoryId],
    queryFn: async () => {
      let q = supabase.from("sub_categories").select("*").order("sort_order");
      if (categoryId) q = q.eq("category_id", categoryId);
      const { data, error } = await q;
      if (error) throw error;
      return data as DbSubCategory[];
    },
  });

export const useProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as DbProduct[];
    },
  });

export const useProductBySlug = (slug: string) =>
  useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as DbProduct;
    },
    enabled: !!slug,
  });

export const useColorGroups = () =>
  useQuery({
    queryKey: ["color_groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("color_groups")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as DbColorGroup[];
    },
  });

export const useHeroSlides = () =>
  useQuery({
    queryKey: ["hero_slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as DbHeroSlide[];
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

// ─── Locale helpers ───
export const getLocaleName = (item: { name_he: string; name_ar: string }, locale: string) =>
  locale === "ar" ? item.name_ar : item.name_he;

export const getLocaleField = (item: Record<string, any>, field: string, locale: string) =>
  locale === "ar" ? item[`${field}_ar`] : item[`${field}_he`];
