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

  // Supabase Storage public URLs → render/image transform endpoint
  const match = url.match(
    /^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/object\/public\/(.+)$/,
  );
  if (match) {
    return `${match[1]}/storage/v1/render/image/public/${match[2]}?width=${width}&quality=${quality}&format=webp`;
  }

  return url;
}
