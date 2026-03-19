import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { SEOHead, getOrganizationSchema, getWebSiteSchema, getLocalBusinessSchema } from "@/components/SEOHead";
import { useLocale } from "@/i18n/useLocale";
import { HeroSlider } from "@/components/HeroSlider";
import { CategoryScroller } from "@/components/CategoryScroller";
import { FeaturedProductSlider } from "@/components/FeaturedProductSlider";
import { FeatureOverlaySection } from "@/components/FeatureOverlaySection";
import { PromoCardGrid } from "@/components/PromoCardGrid";
import { BrandIntroSection } from "@/components/BrandIntroSection";
import { LifestyleMediaSection } from "@/components/LifestyleMediaSection";
import { BeforeAfterSection } from "@/components/BeforeAfterSection";
import { FaqSection } from "@/components/FaqSection";
import { AboutMissionSection } from "@/components/about/AboutMissionSection";
import { AboutStorySection }   from "@/components/about/AboutStorySection";
import { AboutValuesSection }  from "@/components/about/AboutValuesSection";
import { AboutCtaSection }     from "@/components/about/AboutCtaSection";
import { DEFAULT_SECTIONS_ORDER, type SectionItem } from "@/pages/admin/HomePage";

const SECTION_COMPONENTS: Record<string, React.ComponentType<any>> = {
  hero_slider:       HeroSlider,
  category_scroller: CategoryScroller,
  featured_slider:   FeaturedProductSlider,
  feature_overlay:   FeatureOverlaySection,
  promo_grid:        PromoCardGrid,
  brand_intro:       BrandIntroSection,
  lifestyle_media:   LifestyleMediaSection,
  before_after:      BeforeAfterSection,
  faq:               FaqSection,
  about_mission:     AboutMissionSection,
  about_story:       AboutStorySection,
  about_values:      AboutValuesSection,
  about_cta:         AboutCtaSection,
};

const NON_CONFIGURABLE = new Set(["hero_slider", "category_scroller"]);

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

  const { locale } = useLocale();

  const seoTitle = locale === "ar"
    ? "A.M.G PERGOLA LTD | برجولات وحلول تظليل متقدمة"
    : "A.M.G PERGOLA LTD | פרגולות ופתרונות הצללה מתקדמים";
  const seoDesc = locale === "ar"
    ? "A.M.G Pergola – خبراء في البرجولات وحلول التظليل المتقدمة. تصميم وتصنيع وتركيب مخصص للحدائق والشرفات والأعمال التجارية."
    : "A.M.G Pergola – מומחים בפרגולות ופתרונות הצללה מתקדמים. תכנון, ייצור והתקנה בהתאמה אישית לגינות, מרפסות ועסקים.";

  return (
    <Layout>
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        jsonLd={[getOrganizationSchema(), getWebSiteSchema(), getLocalBusinessSchema()]}
      />
      {order.filter((s) => s.visible).map((s) => {
        const type = s.type || s.id;
        const Component = SECTION_COMPONENTS[type];
        if (!Component) return null;
        const props = NON_CONFIGURABLE.has(type) ? {} : { sectionKey: s.id };
        return <Component key={s.id} {...props} />;
      })}
    </Layout>
  );
};

export default Index;
