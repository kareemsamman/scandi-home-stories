

# AMG Pergola Site Redesign Plan

## Scope Summary

Complete visual and structural overhaul: replace the Maison indoor-furniture boutique with an outdoor pergola brand (AMG). Add RTL/locale support for Hebrew and Arabic. Adopt a Mirador-inspired section hierarchy without cloning.

This is a **full rebuild** of the frontend shell. The Zustand cart/wishlist logic and general React+Vite+Tailwind stack remain, but nearly every component and page file will be rewritten.

---

## Phase 1: Design System Foundation

**New files:**
- `src/styles/tokens.css` — Replace the current CSS custom properties with the new palette:
  - `--bg: 255 255 255`, `--surface: 245 245 243`, `--text: 20 21 25`, `--muted: 109 113 120`, `--accent: 245 202 86`, `--accent-strong: 215 174 73`, `--border: 20 21 25 / 0.12`, `--radius-sm: 8px`, `--radius-md: 12px`, `--container-max: 1320px`
  - Footer/header dark: `#141519`
- **Remove** all serif font references (`Cormorant Garamond`). Load `Heebo` (Hebrew) and `Alexandria` (Arabic) from Google Fonts. Body font: `Inter` or `Heebo` depending on locale.
- Update `tailwind.config.ts`: new color tokens, border-radius `8px`/`12px`, breakpoints at `700/1000/1150/1400/1600`, remove all terracotta/cream/linen/taupe references.
- Rewrite `src/index.css`: strip the entire boutique design system (`.bg-linen`, `.editorial-grid`, `.link-underline`, serif base styles, Ken Burns, etc.). Replace with the new token system and `html[lang="he"], html[lang="ar"] { direction: rtl; }`.
- **All CSS** must use logical properties (`padding-inline`, `margin-inline`, `inset-inline-start`, `text-align: start`). No hardcoded `left`/`right` except under `html[dir="rtl"]` overrides.

---

## Phase 2: Locale & Routing Infrastructure

**New files:**
- `src/i18n/he.ts` — Hebrew string dictionary (all UI labels, nav items, FAQ content, etc.)
- `src/i18n/ar.ts` — Arabic string dictionary
- `src/i18n/LocaleContext.tsx` — React context that reads the locale from the URL prefix (`/he` or `/ar`), provides `t()` translation function, sets `lang` and `dir` on `<html>` only.
- `src/i18n/useLocale.ts` — hook returning current locale, `t()`, and `localePath()` helper that prefixes all internal links.

**Routing changes in `App.tsx`:**
- All routes nested under `/:locale` parameter (`/he`, `/ar`).
- Root `/` redirects to `/he` or `/ar` based on `navigator.language` or saved preference.
- Routes: `/:locale`, `/:locale/shop`, `/:locale/product/:slug`, `/:locale/about`, `/:locale/cart`, `/:locale/checkout`, `/:locale/contact`.
- All `<Link to="...">` calls throughout the app must use the `localePath()` helper.

**Rules:**
- `dir` attribute set **only** on `<html>` via `document.documentElement.setAttribute`.
- No `dir` on any component, section, nav, card, or button.
- No `text-transform: uppercase` for Arabic/Hebrew text.
- No exaggerated letter-spacing for Arabic/Hebrew.

---

## Phase 3: Data Layer — AMG Products & Categories

**Rewrite `src/data/products.ts`:**
- Replace all indoor furniture/ceramics/lighting products with AMG pergola products.
- New collections: e.g., "Bioclimatic Pergolas", "Motorized Louver Systems", "Fixed Canopy Pergolas", "Retractable Roof Systems", "Accessories & Add-ons".
- Products should have pergola-relevant fields: `name`, `slug`, `price`, `description`, `longDescription`, `materials` (aluminum, powder-coated steel, etc.), `dimensions`, `images` (use Unsplash outdoor/pergola placeholders), `featured`, `new`.
- All text content stored as translation keys or directly in locale dictionaries.

---

## Phase 4: Reusable Component Library

Replace all existing custom components. Build these as the core kit:

| Component | Purpose |
|---|---|
| `AnnouncementBar` | Slim gold/sand strip, centered rotating messages |
| `SiteHeader` | Sticky, transparent-over-hero → dark-filled on scroll. RTL grid layout. Logo, nav, search/account/cart/locale switcher |
| `MobileNavDrawer` | Full-screen drawer for mobile nav |
| `SearchDrawer` | Modal/drawer for search |
| `CartDrawer` | Slide-in cart summary |
| `LocaleSwitcher` | Toggle between Hebrew/Arabic |
| `HeroSlider` | Image/video slides with centered content overlay, dots, swipe support (use existing `embla-carousel-react`) |
| `CategoryScroller` | Horizontal scrolling image cards with scroll-snap |
| `FeatureOverlaySection` | Large image + frosted glass panel with 4 icon features |
| `PromoCardGrid` | 3 large image-led clickable cards with hover zoom |
| `BrandIntroSection` | Centered heading + paragraph, max-width ~800px |
| `LifestyleMediaSection` | Large rounded image/video + centered CTA below |
| `BeforeAfterSection` | Draggable comparison slider (build custom with mouse/touch events) |
| `FaqSection` | Split layout: intro text + accordion (reuse Radix accordion) |
| `SiteFooter` | Dark charcoal, 4-5 column grid, social/payment icons |

**Delete** old components: `Header.tsx`, `Footer.tsx`, `CollectionCard.tsx`, `NavLink.tsx`, `CartIcon.tsx`. Their functionality is absorbed into the new components above.

**Keep/adapt:** `ProductCard.tsx` (restyle with rounded corners, sand accent, no serif), `QuantitySelector.tsx`, `ScrollToTop.tsx`, `Layout.tsx` (rewire to use new header/footer).

---

## Phase 5: Page Rebuilds

### Homepage (`Index.tsx`)
Complete rewrite. Section order:
1. `<AnnouncementBar />`
2. `<SiteHeader />` (transparent over hero)
3. `<HeroSlider />` — AMG pergola hero images/video, Hebrew/Arabic CTA
4. `<CategoryScroller />` — AMG product categories
5. `<FeatureOverlaySection />` — materials, drainage, motorization, warranty
6. `<PromoCardGrid />` — popular models, durable systems, consultation
7. `<BrandIntroSection />` — AMG identity statement
8. `<LifestyleMediaSection />` — outdoor lifestyle imagery
9. `<BeforeAfterSection />` — open vs closed louvers
10. `<FaqSection />` — AMG-specific FAQs
11. `<SiteFooter />`

### Products/Shop (`Products.tsx`)
- Restyle with new design tokens, rounded cards, no serif headings.
- Keep filtering/sorting logic, adapt labels to locale dictionaries.

### Product Detail (`ProductDetail.tsx`)
- Restyle gallery, info panel, and related products with new visual language.
- Rounded corners, modern sans typography, logical properties.

### About (`About.tsx`)
- Rewrite content for AMG brand story (outdoor engineering focus).
- Remove all indoor/artisan/craft language.

### Cart & Checkout
- Restyle with new tokens. Minimal structural changes needed.

### Contact (new page)
- Replace the deleted `/inquiry` route. Simple contact form or info page.

---

## Phase 6: Motion & Interaction

- Header: `backdrop-filter: blur()` transition on scroll (keep Framer Motion approach).
- Hero: Embla carousel with crossfade/slide, autoplay, dots, swipe.
- Cards: subtle `scale(1.03)` on hover, 300ms ease.
- Before/After: custom drag handler with `onPointerDown`/`onPointerMove`, `clip-path` based reveal.
- Accordion: 200ms open/close via Radix.
- All motion wrapped in `prefers-reduced-motion` media query check.

---

## Phase 7: Accessibility & Performance

- All interactive elements get visible focus rings.
- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<section>`, proper heading hierarchy.
- Images: `loading="lazy"` on below-fold images, Unsplash `w=` params for responsive sizing.
- Embla carousel: ARIA labels for slides, dots, arrows.
- Color contrast: `#141519` on white = 16:1 ratio. Gold `#F5CA56` used only for accents/buttons with dark text.

---

## Estimated File Changes

| Action | Count |
|---|---|
| New files | ~18 (components, i18n, styles, contact page) |
| Major rewrites | ~8 (all pages, Layout, index.css, tailwind.config, products data) |
| Deletions | ~5 (old Header, Footer, CollectionCard, NavLink, CartIcon) |
| Minor edits | ~3 (useCart storage key, QuantitySelector restyle, ScrollToTop locale-aware) |

---

## Risk Notes

- This is equivalent to a new frontend build. The only preserved logic is the Zustand stores and the React Router shell.
- All placeholder content (product names, descriptions, FAQs, hero copy) will need real AMG content to replace the Lorem-style placeholders.
- The before/after slider is a custom build — no third-party dependency needed, but it requires careful touch event handling.
- Embla Carousel is already in `package.json` but not currently used — it will power the hero slider.
- Two new Google Font families need to be loaded; a font-display strategy (`swap`) should be used to avoid layout shift.

