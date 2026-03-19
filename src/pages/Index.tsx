import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { HeroSlider } from "@/components/HeroSlider";
import { CategoryScroller } from "@/components/CategoryScroller";
import { FeaturedProductSlider } from "@/components/FeaturedProductSlider";
import { FeatureOverlaySection } from "@/components/FeatureOverlaySection";
import { PromoCardGrid } from "@/components/PromoCardGrid";
import { BrandIntroSection } from "@/components/BrandIntroSection";
import { LifestyleMediaSection } from "@/components/LifestyleMediaSection";
import { BeforeAfterSection } from "@/components/BeforeAfterSection";
import { FaqSection } from "@/components/FaqSection";
import { DEFAULT_SECTIONS_ORDER, type SectionItem } from "@/pages/admin/HomePage";

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  hero_slider:       HeroSlider,
  category_scroller: CategoryScroller,
  featured_slider:   FeaturedProductSlider,
  feature_overlay:   FeatureOverlaySection,
  promo_grid:        PromoCardGrid,
  brand_intro:       BrandIntroSection,
  lifestyle_media:   LifestyleMediaSection,
  before_after:      BeforeAfterSection,
  faq:               FaqSection,
};

const db = supabase as any;

const Index = () => {
  const { data: sectionsConfig } = useQuery<SectionItem[]>({
    queryKey: ["home_sections_config"],
    queryFn: async () => {
      const { data } = await db
        .from("home_content")
        .select("data")
        .eq("locale", "global")
        .eq("section", "sections_config")
        .maybeSingle();
      return data?.data ?? DEFAULT_SECTIONS_ORDER;
    },
    staleTime: 60_000,
  });

  const order = sectionsConfig ?? DEFAULT_SECTIONS_ORDER;

  return (
    <Layout>
      {order.filter((s) => s.visible).map((s) => {
        const Component = SECTION_COMPONENTS[s.id];
        return Component ? <Component key={s.id} /> : null;
      })}
    </Layout>
  );
};

export default Index;
