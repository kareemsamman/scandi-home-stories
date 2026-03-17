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
