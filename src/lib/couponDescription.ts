// Helpers to read/write bilingual coupon descriptions.
// Stored in the existing `description` text column as JSON: {"he":"...","ar":"..."}
// Falls back gracefully to plain strings (legacy data).

export interface CouponDescription {
  he: string;
  ar: string;
}

export const parseCouponDescription = (raw?: string | null): CouponDescription => {
  if (!raw) return { he: "", ar: "" };
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const obj = JSON.parse(trimmed);
      return { he: obj.he || "", ar: obj.ar || "" };
    } catch {
      /* fall through */
    }
  }
  // Legacy: plain string — use it for both languages
  return { he: trimmed, ar: trimmed };
};

export const stringifyCouponDescription = (d: CouponDescription): string => {
  if (!d.he && !d.ar) return "";
  return JSON.stringify({ he: d.he || "", ar: d.ar || "" });
};

export const getLocalizedCouponDescription = (
  raw: string | null | undefined,
  locale: string
): string => {
  const parsed = parseCouponDescription(raw);
  const key = locale === "ar" ? "ar" : "he";
  return parsed[key] || parsed.he || parsed.ar || "";
};
