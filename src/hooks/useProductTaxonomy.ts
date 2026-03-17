import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export interface TaxColor { id: string; label_he: string; label_ar: string; hex: string; }
export interface TaxLength { id: string; label_he: string; label_ar: string; value: string; }

const load = async (section: string) => {
  const { data } = await db.from("home_content").select("data").eq("locale", "global").eq("section", section).single();
  return (data?.data?.items ?? []) as any[];
};

const save = async (section: string, items: any[]) => {
  await db.from("home_content").upsert({ locale: "global", section, data: { items } }, { onConflict: "locale,section" });
};

export const useColorTaxonomy = () =>
  useQuery<TaxColor[]>({ queryKey: ["taxonomy", "colors"], queryFn: () => load("color_taxonomy"), staleTime: 60_000 });

export const useLengthTaxonomy = () =>
  useQuery<TaxLength[]>({ queryKey: ["taxonomy", "lengths"], queryFn: () => load("length_taxonomy"), staleTime: 60_000 });

export const useSaveColorTaxonomy = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (items: TaxColor[]) => save("color_taxonomy", items), onSuccess: () => qc.invalidateQueries({ queryKey: ["taxonomy", "colors"] }) });
};

export const useSaveLengthTaxonomy = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (items: TaxLength[]) => save("length_taxonomy", items), onSuccess: () => qc.invalidateQueries({ queryKey: ["taxonomy", "lengths"] }) });
};

const taxUid = () => Math.random().toString(36).slice(2, 9);

export interface TaxCustomColor {
  id: string;
  name_he: string;
  name_ar: string;
  hex: string;
}

export interface TaxCustomColorGroup {
  id: string;
  name_he: string;
  name_ar: string;
  sort_order: number;
  colors: TaxCustomColor[];
}

export const useCustomColorGroups = () =>
  useQuery<TaxCustomColorGroup[]>({
    queryKey: ["color_groups"],
    queryFn: async () => {
      const { data, error } = await db.from("color_groups").select("*").order("sort_order");
      if (error) throw error;
      return (data || []).map((cg: any) => ({
        id: cg.id,
        name_he: cg.name_he || "",
        name_ar: cg.name_ar || "",
        sort_order: cg.sort_order || 0,
        colors: Array.isArray(cg.colors) ? cg.colors.map((c: any) => ({
          id: c.id || taxUid(),
          name_he: c.name_he || c.name?.he || "",
          name_ar: c.name_ar || c.name?.ar || "",
          hex: c.hex || "#cccccc",
        })) : [],
      }));
    },
    staleTime: 30_000,
  });

export const useSaveCustomColorGroups = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groups: TaxCustomColorGroup[]) => {
      // Upsert all groups, then delete ones that no longer exist
      const ids = groups.map(g => g.id);
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        await db.from("color_groups").upsert(
          { id: g.id, name_he: g.name_he, name_ar: g.name_ar, sort_order: i, colors: g.colors },
          { onConflict: "id" }
        );
      }
      // Delete removed groups
      if (ids.length > 0) {
        await db.from("color_groups").delete().not("id", "in", `(${ids.map(id => `"${id}"`).join(",")})`);
      } else {
        await db.from("color_groups").delete().neq("id", "__never__");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["color_groups"] }),
  });
};
