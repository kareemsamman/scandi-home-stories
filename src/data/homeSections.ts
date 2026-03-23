export type SectionItem = { id: string; type: string; visible: boolean };

export const DEFAULT_SECTIONS_ORDER: SectionItem[] = [
  { id: "hero_slider",       type: "hero_slider",       visible: true },
  { id: "category_scroller", type: "category_scroller", visible: true },
  { id: "featured_slider",   type: "featured_slider",   visible: true },
  { id: "feature_overlay",   type: "feature_overlay",   visible: true },
  { id: "promo_grid",        type: "promo_grid",        visible: true },
  { id: "brand_intro",       type: "brand_intro",       visible: true },
  { id: "lifestyle_media",   type: "lifestyle_media",   visible: true },
  { id: "before_after",      type: "before_after",      visible: true },
  { id: "faq",               type: "faq",               visible: true },
];
