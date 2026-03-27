import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/useLocale";
import { products, getLocaleName, getLocaleText } from "@/data/products";
import type { Product, Collection } from "@/data/products";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useShopData } from "@/hooks/useShopData";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

const CloseIcon = () => (
  <svg role="presentation" strokeWidth="2" focusable="false" width="14" height="14" viewBox="0 0 24 24">
    <path d="M17.658 6.343 6.344 17.657M17.658 17.657 6.344 6.343" stroke="currentColor" />
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="10" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="m16 15 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type TabKey = "products" | "suggestions" | "collections";

// Skeleton shimmer for loading state
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 animate-pulse">
      <div className="bg-foreground/10 rounded" style={{ width: 64, height: 64, borderRadius: 4 }} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="bg-foreground/10 rounded" style={{ height: 10, width: "40%" }} />
        <div className="bg-foreground/10 rounded" style={{ height: 12, width: "70%" }} />
        <div className="bg-foreground/10 rounded" style={{ height: 10, width: "30%" }} />
      </div>
    </div>
  );
}

function SkeletonTabs() {
  return (
    <div className="flex items-center border-b border-foreground/10" style={{ gap: 24, marginTop: 16, paddingBottom: 12 }}>
      {[80, 60, 70, 50].map((w, i) => (
        <div key={i} className="bg-foreground/10 rounded animate-pulse" style={{ height: 14, width: w }} />
      ))}
    </div>
  );
}

function SkeletonResults() {
  return (
    <>
      <SkeletonTabs />
      <div className="flex flex-col" style={{ gap: 16, marginTop: 16 }}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </>
  );
}

export const SearchModal = ({ open, onClose }: SearchModalProps) => {
  const { t, locale, localePath } = useLocale();
  const isMobile = useIsMobile();
  const { collections } = useShopData();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("products");
  const [mounted, setMounted] = useState(false);
  const [animState, setAnimState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const loadingRef = useRef<ReturnType<typeof setTimeout>>();

  // Animation lifecycle
  useEffect(() => {
    if (open) {
      setMounted(true);
      setQuery("");
      setDebouncedQuery("");
      setIsLoading(false);
      setActiveTab("products");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimState("opening"));
      });
      timeoutRef.current = setTimeout(() => {
        setAnimState("open");
        inputRef.current?.focus();
      }, 360);
    } else if (mounted) {
      setAnimState("closing");
      timeoutRef.current = setTimeout(() => {
        setAnimState("closed");
        setMounted(false);
      }, 360);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [open]);

  // Debounce: wait 1000ms after typing stops, show skeleton during wait, then results
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (loadingRef.current) clearTimeout(loadingRef.current);

    if (!query.trim()) {
      setDebouncedQuery("");
      setIsLoading(false);
      return;
    }

    // Show skeleton immediately while waiting
    setIsLoading(true);

    // After 1s debounce, show actual results
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setIsLoading(false);
    }, 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (loadingRef.current) clearTimeout(loadingRef.current);
    };
  }, [query]);

  // Normalize for flexible matching (remove dashes, spaces, lowercase)
  const normalize = (s: string) => s.toLowerCase().replace(/[\s\-]/g, "");

  // Search logic — uses debouncedQuery
  const filteredProducts = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = normalize(debouncedQuery);
    return products.filter((p) => {
      // Name match
      if (normalize(p.name).includes(q)) return true;
      // Description match
      if (normalize(getLocaleText(p.description, locale)).includes(q)) return true;
      // SKU match (contractor products)
      if (p.type === "contractor" && normalize(p.sku).includes(q)) return true;
      // Color match
      if (p.type === "contractor") {
        const colorMatch = p.colorGroups?.some((g) =>
          g.colors.some((c) => normalize(c.name.he).includes(q) || normalize(c.name.ar).includes(q))
        );
        if (colorMatch) return true;
      }
      if (p.type === "retail") {
        const colorMatch = p.colors?.some((c) => normalize(c.name.he).includes(q) || normalize(c.name.ar).includes(q));
        if (colorMatch) return true;
      }
      return false;
    });
  }, [debouncedQuery, locale]);

  // Collections: show collections that contain matching products
  const filteredCollections = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    // Get unique collection IDs from filtered products
    const matchedCollectionIds = new Set(filteredProducts.map(p => p.collection));
    return collections.filter(c => matchedCollectionIds.has(c.id));
  }, [debouncedQuery, locale, filteredProducts]);

  const hasResults = filteredProducts.length > 0 || filteredCollections.length > 0;
  const hasQuery = query.trim().length > 0;
  const hasSearched = debouncedQuery.trim().length > 0;

  const featuredCollections = collections;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "products", label: t("search.tabs.products") },
    { key: "suggestions", label: t("search.tabs.suggestions") },
    { key: "collections", label: t("search.tabs.collections") },
  ];

  if (!mounted) return null;

  const isVisible = animState === "opening" || animState === "open";
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Shared content
  const renderContent = () => (
    <>
      {/* Search input: icon LEFT, input CENTER, clear + close RIGHT */}
      <div dir="ltr" className="flex items-center" style={{ paddingBottom: 12, borderBottom: "2px solid hsl(var(--foreground))" }}>
        <span className="text-foreground/40 shrink-0" style={{ marginInlineEnd: 12 }}>
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          dir="auto"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          className="flex-1 bg-transparent text-foreground outline-none placeholder:text-foreground/40"
          style={{ fontSize: 16, fontWeight: 500, textAlign: locale === "ar" ? "right" : "left" }}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setDebouncedQuery(""); setIsLoading(false); }}
            className="text-foreground/50 hover:text-foreground transition-colors shrink-0"
            style={{ fontSize: 14, fontWeight: 500, marginInlineStart: 12 }}
          >
            {t("search.clear")}
          </button>
        )}
        <button
          onClick={onClose}
          className="shrink-0 w-8 h-8 border border-foreground/10 rounded-full grid place-items-center text-foreground hover:bg-foreground/5 transition-colors"
          style={{ marginInlineStart: 12 }}
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>

      {/* STATE 1: Initial — Featured Collections */}
      {!hasQuery && !isLoading && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#676767" }}>
            {t("search.featuredCollections")}
          </h3>
          <div className="flex flex-col" style={{ gap: 10 }}>
            {featuredCollections.map((col) => (
              <Link
                key={col.id}
                to={localePath(`/shop?collection=${col.slug}`)}
                onClick={onClose}
                className="text-foreground hover:text-foreground/70 transition-colors"
                style={{ fontSize: 18, fontWeight: 600 }}
              >
                {getLocaleName(col, locale)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* STATE: Loading skeleton */}
      {hasQuery && isLoading && (
        <SkeletonResults />
      )}

      {/* STATE: Results with tabs — only show if there are results */}
      {hasQuery && !isLoading && hasSearched && hasResults && (
        <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
          {/* Tabs */}
          <div className="flex items-center border-b border-foreground/10" style={{ gap: 24, marginTop: 16, paddingBottom: 0 }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "pb-3 transition-colors relative whitespace-nowrap",
                  activeTab === tab.key
                    ? "text-foreground"
                    : "text-foreground/40 hover:text-foreground/60"
                )}
                style={{ fontSize: 16, fontWeight: 600 }}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 inset-x-0 bg-foreground" style={{ height: 2 }} />
                )}
              </button>
            ))}
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-y-auto" style={{ marginTop: 16 }}>
            {activeTab === "products" && (
              filteredProducts.length > 0 ? (
                <div className="flex flex-col" style={{ gap: 16 }}>
                  {filteredProducts.map((product) => (
                    <ProductResultItem
                      key={product.id}
                      product={product}
                      locale={locale}
                      localePath={localePath}
                      onClose={onClose}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message={t("search.noResults")} />
              )
            )}

            {activeTab === "suggestions" && (
              <EmptyState message={t("search.noResults")} />
            )}

            {activeTab === "collections" && (
              filteredCollections.length > 0 ? (
                <div className="flex flex-col" style={{ gap: 16 }}>
                  {filteredCollections.map((col) => (
                    <CollectionResultItem
                      key={col.id}
                      collection={col}
                      locale={locale}
                      localePath={localePath}
                      onClose={onClose}
                      productCount={products.filter(p => p.collection === col.id).length}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message={t("search.noResults")} />
              )
            )}



          </div>
        </div>
      )}

      {/* STATE: No results */}
      {hasQuery && !isLoading && hasSearched && !hasResults && (
        <EmptyState message={t("search.noResults")} />
      )}

      {/* Typing but debounce hasn't fired yet — show nothing extra */}
    </>
  );

  // ── MOBILE: top-aligned modal ──
  if (isMobile) {
    const modalStyle: React.CSSProperties = prefersReducedMotion
      ? { width: "98%" }
      : {
          width: isVisible ? "98%" : "90%",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-20px)",
          transition: "width 340ms cubic-bezier(.22,.61,.36,1), opacity 240ms ease, transform 340ms cubic-bezier(.22,.61,.36,1)",
        };

    const contentStyle: React.CSSProperties = prefersReducedMotion
      ? {}
      : {
          opacity: animState === "open" ? 1 : 0,
          transition: "opacity 200ms ease 120ms",
        };

    return (
      <>
        <div
          className="fixed inset-0 bg-black/40 z-50"
          style={{ opacity: isVisible ? 1 : 0, transition: "opacity 200ms ease" }}
          onClick={onClose}
        />
        <div
          className="fixed z-50 bg-background shadow-xl flex flex-col pointer-events-auto"
          style={{
            ...modalStyle,
            top: 10,
            left: "50%",
            transform: prefersReducedMotion ? "translateX(-50%)" : modalStyle.transform,
            maxHeight: "98vh",
            borderRadius: 2,
          }}
        >

          <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: 24, ...contentStyle }}>
            {renderContent()}
          </div>
        </div>
      </>
    );
  }

  // ── DESKTOP: right-side panel ──
  const panelStyle: React.CSSProperties = prefersReducedMotion
    ? { width: 420 }
    : {
        width: 420,
        transform: isVisible ? "translateX(0)" : "translateX(100%)",
        opacity: isVisible ? 1 : 0,
        transition: "transform 340ms cubic-bezier(.22,.61,.36,1), opacity 240ms ease",
      };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-50"
        style={{ opacity: isVisible ? 1 : 0, transition: "opacity 200ms ease" }}
        onClick={onClose}
      />
      <div
        className="fixed z-50 flex flex-col"
        style={{
          top: 24,
          bottom: 24,
          insetInlineEnd: 24,
          width: 420,
          transform: isVisible ? "translateX(0)" : (document.documentElement.dir === "rtl" ? "translateX(-100%)" : "translateX(100%)"),
          opacity: isVisible ? 1 : 0,
          transition: "transform 340ms cubic-bezier(.22,.61,.36,1), opacity 240ms ease",
        }}
      >
        <div className="bg-background shadow-xl flex flex-col flex-1 overflow-hidden" style={{ borderRadius: 2, padding: 24 }}>
          {renderContent()}
        </div>
      </div>
    </>
  );
};

// Product result item
function ProductResultItem({
  product, locale, localePath, onClose,
}: {
  product: Product;
  locale: "he" | "ar";
  localePath: (path: string) => string;
  onClose: () => void;
}) {
  const currency = "₪";
  return (
    <Link
      to={localePath(`/product/${product.slug}`)}
      onClick={onClose}
      className="flex items-center gap-4 group"
    >
      <img
        src={product.images[0]}
        alt={product.name}
        className="object-cover rounded shrink-0"
        style={{ width: 64, height: 64, borderRadius: 4 }}
      />
      <div className="flex flex-col">
        <span className="text-foreground/50" style={{ fontSize: 12 }}>AMG Pergola</span>
        <span className="text-foreground font-semibold group-hover:text-foreground/70 transition-colors" style={{ fontSize: 14 }}>
          {product.name}
        </span>
        <span className="text-foreground/70" style={{ fontSize: 14 }}>
          {currency}{product.price.toLocaleString()}
        </span>
      </div>
    </Link>
  );
}

// Collection result item
function CollectionResultItem({
  collection, locale, localePath, onClose, productCount,
}: {
  collection: Collection;
  locale: "he" | "ar";
  localePath: (path: string) => string;
  onClose: () => void;
  productCount: number;
}) {
  return (
    <Link
      to={localePath(`/shop?collection=${collection.slug}`)}
      onClick={onClose}
      className="flex items-center gap-4 group"
    >
      <img
        src={collection.image}
        alt={getLocaleName(collection, locale)}
        className="object-cover rounded shrink-0"
        style={{ width: 64, height: 64, borderRadius: 4 }}
      />
      <div className="flex flex-col">
        <span className="text-foreground font-semibold group-hover:text-foreground/70 transition-colors" style={{ fontSize: 14 }}>
          {getLocaleName(collection, locale)}
        </span>
        <span className="text-foreground/50" style={{ fontSize: 13 }}>
          {productCount} {locale === "he" ? "מוצרים" : "منتجات"}
        </span>
      </div>
    </Link>
  );
}

// Empty state
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-foreground" style={{ fontSize: 18, fontWeight: 600 }}>
        {message}
      </p>
    </div>
  );
}
