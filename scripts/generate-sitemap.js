/**
 * Generates public/sitemap.xml with static pages + all active product slugs
 * from Supabase. Run automatically before every build via package.json.
 *
 * Usage:  node scripts/generate-sitemap.js
 * Needs:  VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in env
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });
config({ path: resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BASE_URL = "https://pergolaamg.com";
const LOCALES = ["he", "ar"];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("⚠  Supabase env vars not found — generating sitemap without products.");
}

// ── Static pages ────────────────────────────────────────────────────────────
const STATIC_PAGES = [
  { path: "",           changefreq: "weekly",  priority: "1.0" },
  { path: "/shop",      changefreq: "daily",   priority: "0.9" },
  { path: "/shop?collection=bioclimatic",  changefreq: "weekly", priority: "0.85" },
  { path: "/shop?collection=motorized",    changefreq: "weekly", priority: "0.85" },
  { path: "/shop?collection=fixed",        changefreq: "weekly", priority: "0.85" },
  { path: "/shop?collection=retractable",  changefreq: "weekly", priority: "0.85" },
  { path: "/shop?collection=accessories",  changefreq: "weekly", priority: "0.80" },
  { path: "/shop?collection=profiles",     changefreq: "weekly", priority: "0.80" },
  { path: "/catalog",   changefreq: "weekly",  priority: "0.8" },
  { path: "/about",     changefreq: "monthly", priority: "0.7" },
  { path: "/contact",   changefreq: "monthly", priority: "0.7" },
  { path: "/legal/privacy",      changefreq: "yearly", priority: "0.3" },
  { path: "/legal/terms",        changefreq: "yearly", priority: "0.3" },
  { path: "/legal/accessibility",changefreq: "yearly", priority: "0.3" },
  { path: "/legal/returns",      changefreq: "yearly", priority: "0.3" },
  { path: "/legal/shipping",     changefreq: "yearly", priority: "0.3" },
];

// ── Fetch product slugs from Supabase ────────────────────────────────────────
async function fetchProductSlugs() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await db
      .from("products")
      .select("slug")
      .eq("status", "published")
      .not("slug", "is", null)
      .order("created_at", { ascending: false });
    if (error) { console.error("Supabase error:", error.message); return []; }
    return (data || []).map((p) => p.slug).filter(Boolean);
  } catch (e) {
    console.error("Failed to fetch products:", e.message);
    return [];
  }
}

// ── Build XML ────────────────────────────────────────────────────────────────
function urlEntry(path, changefreq, priority) {
  const heHref = `${BASE_URL}/he${path}`;
  const arHref = `${BASE_URL}/ar${path}`;
  return LOCALES.map((locale) => {
    const loc = `${BASE_URL}/${locale}${path}`;
    return `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="he" href="${heHref}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${arHref}"/>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join("\n");
}

async function generate() {
  const slugs = await fetchProductSlugs();
  console.log(`✓ Fetched ${slugs.length} products from Supabase`);

  const staticXml = STATIC_PAGES.map(({ path, changefreq, priority }) =>
    urlEntry(path, changefreq, priority)
  ).join("\n\n");

  const productXml = slugs.length > 0
    ? "\n\n  <!-- ── Products ── -->\n" +
      slugs.map((slug) => urlEntry(`/product/${slug}`, "weekly", "0.75")).join("\n\n")
    : "";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

${staticXml}${productXml}

</urlset>
`;

  const outPath = resolve(__dirname, "../public/sitemap.xml");
  writeFileSync(outPath, xml, "utf8");
  console.log(`✓ Sitemap written → public/sitemap.xml (${STATIC_PAGES.length * 2} static + ${slugs.length * 2} product URLs)`);
}

generate();
