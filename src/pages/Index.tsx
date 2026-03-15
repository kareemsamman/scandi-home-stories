import { Layout } from "@/components/Layout";
import { HeroSlider } from "@/components/HeroSlider";
import { CategoryScroller } from "@/components/CategoryScroller";
import { FeatureOverlaySection } from "@/components/FeatureOverlaySection";
import { PromoCardGrid } from "@/components/PromoCardGrid";
import { BrandIntroSection } from "@/components/BrandIntroSection";
import { LifestyleMediaSection } from "@/components/LifestyleMediaSection";
import { BeforeAfterSection } from "@/components/BeforeAfterSection";
import { FaqSection } from "@/components/FaqSection";

const Index = () => {
  return (
    <Layout>
      <HeroSlider />
      <CategoryScroller />
      <FeatureOverlaySection />
      <PromoCardGrid />
      <BrandIntroSection />
      <LifestyleMediaSection />
      <BeforeAfterSection />
      <FaqSection />
    </Layout>
  );
};

export default Index;