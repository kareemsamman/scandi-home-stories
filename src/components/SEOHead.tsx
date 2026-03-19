import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_NAME = "A.M.G PERGOLA LTD";
const SITE_URL = "https://amg-pergola-ltd.lovable.app";
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/og-image.jpg`;
const LOGO_URL = `${SITE_URL}/assets/logo-white.png`;

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

export const SEOHead = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  noIndex = false,
  jsonLd,
}: SEOHeadProps) => {
  const location = useLocation();
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical || `${SITE_URL}${location.pathname}`;
  const image = ogImage || DEFAULT_OG_IMAGE;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:image", image);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);

    // Alternate language links
    const pathname = location.pathname;
    const altLocale = pathname.startsWith("/ar") ? "he" : "ar";
    const altPath = pathname.replace(/^\/(he|ar)/, `/${altLocale}`);

    let altLink = document.querySelector('link[rel="alternate"][hreflang]') as HTMLLinkElement | null;
    if (!altLink) {
      altLink = document.createElement("link");
      altLink.setAttribute("rel", "alternate");
      document.head.appendChild(altLink);
    }
    altLink.setAttribute("hreflang", altLocale);
    altLink.setAttribute("href", `${SITE_URL}${altPath}`);

    // JSON-LD
    const existingScripts = document.querySelectorAll('script[data-seo-jsonld]');
    existingScripts.forEach((s) => s.remove());

    const schemas = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
    schemas.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.querySelectorAll('script[data-seo-jsonld]').forEach((s) => s.remove());
    };
  }, [fullTitle, description, canonicalUrl, image, ogType, noIndex, jsonLd]);

  return null;
};

// Organization schema — include on every page for logo in search results
export const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "A.M.G PERGOLA LTD",
  url: SITE_URL,
  logo: LOGO_URL,
  description: "מומחים בפרגולות ופתרונות הצללה מתקדמים. תכנון, ייצור והתקנה בהתאמה אישית.",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["Hebrew", "Arabic"],
  },
  sameAs: [],
});

// Product schema
export const getProductSchema = (product: {
  name: string;
  description: string;
  price: number;
  images: string[];
  sku?: string;
  slug: string;
  collection?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  image: product.images,
  sku: product.sku || product.slug,
  url: `${SITE_URL}/he/product/${product.slug}`,
  brand: {
    "@type": "Brand",
    name: "A.M.G PERGOLA",
  },
  category: product.collection || "פרגולות",
  offers: {
    "@type": "Offer",
    price: product.price,
    priceCurrency: "ILS",
    availability: "https://schema.org/InStock",
    url: `${SITE_URL}/he/product/${product.slug}`,
  },
});

// BreadcrumbList schema
export const getBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: `${SITE_URL}${item.url}`,
  })),
});

// LocalBusiness schema
export const getLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "A.M.G PERGOLA LTD",
  url: SITE_URL,
  logo: LOGO_URL,
  image: DEFAULT_OG_IMAGE,
  description: "A.M.G Pergola – מומחים בפרגולות ופתרונות הצללה מתקדמים",
  address: {
    "@type": "PostalAddress",
    addressCountry: "IL",
  },
  priceRange: "₪₪₪",
});

// WebSite schema for sitelinks search
export const getWebSiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: ["he", "ar"],
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/he/shop?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});
