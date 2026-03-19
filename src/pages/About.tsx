import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { SEOHead, getOrganizationSchema } from "@/components/SEOHead";
import { useLocale } from "@/i18n/useLocale";
import { AboutHeroSection }    from "@/components/about/AboutHeroSection";
import { AboutMissionSection } from "@/components/about/AboutMissionSection";
import { AboutStorySection }   from "@/components/about/AboutStorySection";
import { AboutValuesSection }  from "@/components/about/AboutValuesSection";
import { AboutCtaSection }     from "@/components/about/AboutCtaSection";
import { FeaturedProductSlider } from "@/components/FeaturedProductSlider";
import { FeatureOverlaySection } from "@/components/FeatureOverlaySection";
import { BrandIntroSection }     from "@/components/BrandIntroSection";
import { FaqSection }            from "@/components/FaqSection";
import { DEFAULT_ABOUT_SECTIONS_ORDER, type SectionItem } from "@/pages/admin/AboutPage";

const SECTION_COMPONENTS: Record<string, React.ComponentType<any>> = {
  about_hero:    AboutHeroSection,
  about_mission: AboutMissionSection,
  about_story:   AboutStorySection,
  about_values:  AboutValuesSection,
  about_cta:     AboutCtaSection,
  // shared home sections
  featured_slider:  FeaturedProductSlider,
  feature_overlay:  FeatureOverlaySection,
  brand_intro:      BrandIntroSection,
  faq:              FaqSection,
};

const NON_CONFIGURABLE = new Set(["about_hero"]);

const db = supabase as any;

const About = () => {
  const { data: sectionsConfig } = useQuery<SectionItem[]>({
    queryKey: ["about_sections_config"],
    queryFn: async () => {
      const { data } = await db
        .from("home_content")
        .select("data")
        .eq("locale", "global")
        .eq("section", "about_sections_config")
        .maybeSingle();
      return data?.data ?? DEFAULT_ABOUT_SECTIONS_ORDER;
    },
    staleTime: 60_000,
  });

  const order = sectionsConfig ?? DEFAULT_ABOUT_SECTIONS_ORDER;

  return (
    <Layout>
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

export default About;
