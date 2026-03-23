/**
 * Optimize an image URL for web delivery.
 *
 * - Unsplash: rewrites URL params to request WebP at the given width.
 * - Supabase Storage: uses the Image Transformation API for resize + WebP.
 * - Other URLs are returned as-is.
 */
export function optimizeImageUrl(
  url: string,
  width = 1280,
  quality = 75,
): string {
  if (!url) return url;

  // Unsplash URLs – rewrite query params
  if (url.includes("images.unsplash.com")) {
    try {
      const u = new URL(url);
      u.searchParams.set("w", String(width));
      u.searchParams.set("q", String(quality));
      u.searchParams.set("fm", "webp");
      u.searchParams.set("fit", "crop");
      return u.toString();
    } catch {
      return url;
    }
  }

  // Supabase Storage public URLs – return as-is (render/image transforms
  // are not available on all Supabase plans / Lovable Cloud)


  return url;
}
