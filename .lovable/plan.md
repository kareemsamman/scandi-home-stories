

## Redesign: Premium Welcome Popup

### Current Problem
The popup looks generic — small card-style layout with separate image area and text below. No visual impact.

### New Design

**Popup**: Larger (`max-w-4xl`), full-bleed image cards with dark gradient overlay and text/button rendered directly on the image. Each card is a tall, cinematic tile (`aspect-[3/4]` on mobile, `aspect-[2/3]` on desktop) — similar to premium editorial hero grids.

**Layout**:
- Header text (title + subtitle) centered above the cards, white on white background
- 3 cards side-by-side on desktop, stacked on mobile
- Each card is a full-image tile with a dark-to-transparent gradient overlay from bottom
- Category title in bold white, positioned at the bottom of the image
- CTA button as a frosted-glass pill on the image
- On hover: image zooms slightly, overlay lightens, button shifts up
- Staggered entrance animation for each card (delay per index)

**Admin — Image Upload**:
- Add a file upload button (camera/upload icon) next to the existing URL input for each card
- Upload to `site-media` bucket under `popup/` prefix (same pattern as Categories, About pages)
- After upload, auto-fill the image URL field
- Keep the URL input as fallback for external URLs

### Files to Change

**1. `src/components/WelcomePopup.tsx`** — Full redesign
- Increase popup to `max-w-4xl`
- Cards become full-bleed image tiles with gradient overlay
- Title + subtitle rendered as a minimal header section
- Text and CTA button positioned absolutely over each card image
- Staggered card entrance with framer-motion
- Fallback gradient background when no image is set

**2. `src/pages/admin/WelcomePopup.tsx`** — Add image upload
- Add upload handler using `supabase.storage.from("site-media").upload("popup/...")`
- Add an upload button (with ImageIcon) next to each card's image URL input
- On file select → upload → set the public URL into card.image
- Show larger image preview thumbnail (48x48 instead of 32x32)

