import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export const useSiteContent = (section: string, locale: string) => {
  return useQuery({
    queryKey: ["site_content", section, locale],
    queryFn: async () => {
      const { data } = await db
        .from("home_content")
        .select("data")
        .eq("locale", locale)
        .eq("section", section)
        .maybeSingle();
      return (data?.data as Record<string, any>) ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });
};
