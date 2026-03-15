import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/useLocale";
import { products, collections, getLocaleName, getLocaleText } from "@/data/products";
import type { Product, Collection } from "@/data/products";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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

type TabKey = "products" | "suggestions" | "collections" | "blog";

export const SearchModal = ({ open, onClose }: SearchModalProps) => {
  const { t, locale, localePath } = useLocale();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("products");
  const [mounted, setMounted] = useState(false);
  const [animState, setAnimState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Animation lifecycle
  useEffect(() => {
    if (open) {
      setMounted(true);
      setQuery("");
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

  // Search logic
  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      getLocaleText(p.description, locale).toLowerCase().includes(q)
    );
  }, [query, locale]);

  const filteredCollections = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return collections.filter(c =>
      getLocaleName(c, locale).toLowerCase().includes(q) ||
      getLocaleText(c.description, locale).toLowerCase().includes(q)
    );
  }, [query, locale]);

  const hasResults = filteredProducts.length > 0 || filteredCollections.length > 0;
  const hasQuery = query.trim().length > 0;

  // Featured collections for initial state
  const featuredCollections = collections.slice(0, 4);

  // Tabs config
  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "products", label: t("search.tabs.products"), count: filteredProducts.length },
    { key: "suggestions", label: t("search.tabs.suggestions"), count: 0 },
    { key: "collections", label: t("search.tabs.collections"), count: filteredCollections.length },
    { key: "blog", label: t("search.tabs.blog"), count: 0 },
  ];

  if (!mounted) return null;

  const isVisible = animState === "opening" || animState === "open";
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Mobile: centered modal, Desktop: right-side panel
  const renderContent = () => (
    <>
      {/* Search input */}
      <div className="flex items-center gap-3 pb-4">
        <span className="text-foreground/40">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          className="flex-1 bg-transparent text-base font-medium text-foreground outline-none placeholder:text-foreground/40"
          style={{ fontSize: 16 }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-foreground/40 hover:text-foreground transition-colors"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <div className="border-b border-foreground/10" />

      {/* STATE 1: Initial — Featured Collections */}
      {!hasQuery && (
        <div style={{ marginTop: 16 }}>
          <h3 className="text-foreground" style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
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

      {/* STATE 2/3: Has query — show tabs and results */}
      {hasQuery && (
        <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
          {/* Tabs */}
          <div className="flex items-center border-b border-foreground/10" style={{ gap: 24, marginTop: 16, paddingBottom: 0 }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "pb-3 transition-colors relative",
                  activeTab === tab.key
                    ? "text-foreground"
                    : "text-foreground/40 hover:text-foreground/60"
                )}
                style={{ fontSize: 16, fontWeight: 600 }}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-foreground" />
                )}
              </button>
            ))}
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-y-auto" style={{ marginTop: 16 }}>
            {/* Products tab */}
            {activeTab === "products" && (
              <>
                {filteredProducts.length > 0 ? (
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
                )}
              </>
            )}

            {/* Suggestions tab */}
            {activeTab === "suggestions" && (
              <EmptyState message={t("search.noResults")} />
            )}

            {/* Collections tab */}
            {activeTab === "collections" && (
              <>
                {filteredCollections.length > 0 ? (
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
                )}
              </>
            )}

            {/* Blog tab */}
            {activeTab === "blog" && (
              <EmptyState message={t("search.noResults")} />
            )}
          </div>
        </div>
      )}

      {/* STATE 4: No results */}
      {hasQuery && !hasResults && activeTab === "products" && null /* handled inside tab */}
    </>
  );

  // MOBILE: centered modal
  if (isMobile) {
    const modalStyle: React.CSSProperties = prefersReducedMotion
      ? { width: "98%", maxWidth: 480 }
      : {
          maxWidth: 480,
          width: isVisible ? "98%" : "0%",
          opacity: isVisible ? 1 : 0,
          transformOrigin: "right",
          transition: "width 340ms cubic-bezier(.22,.61,.36,1), opacity 240ms ease",
          overflow: "hidden",
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
          style={{ opacity: isVisible ? 1 : 0, transition: "opacity 0ms" }}
          onClick={onClose}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="pointer-events-auto relative bg-background rounded-sm shadow-xl flex flex-col"
            style={{
              ...modalStyle,
              maxHeight: "98vh",
              borderRadius: 2,
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 start-4 w-8 h-8 border border-[hsl(0_0%_94%)] rounded-full grid place-items-center text-foreground z-10"
              aria-label="Close"
            >
              <CloseIcon />
            </button>

            <div className="flex-1 overflow-y-auto px-6 pt-14 pb-6 flex flex-col" style={contentStyle}>
              {renderContent()}
            </div>
          </div>
        </div>
      </>
    );
  }

  // DESKTOP: right-side panel
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
        className="fixed top-0 end-0 bottom-0 z-50 bg-background shadow-xl flex flex-col"
        style={panelStyle}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 start-4 w-8 h-8 border border-[hsl(0_0%_94%)] rounded-full grid place-items-center text-foreground z-10"
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        <div className="flex-1 overflow-y-auto px-6 pt-14 pb-6 flex flex-col">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

// Product result item
function ProductResultItem({
  product,
  locale,
  localePath,
  onClose,
}: {
  product: Product;
  locale: "he" | "ar";
  localePath: (path: string) => string;
  onClose: () => void;
}) {
  const currency = locale === "he" ? "₪" : "₪";

  return (
    <Link
      to={localePath(`/products/${product.slug}`)}
      onClick={onClose}
      className="flex items-center gap-4 group"
    >
      <img
        src={product.images[0]}
        alt={product.name}
        className="object-cover rounded"
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
  collection,
  locale,
  localePath,
  onClose,
  productCount,
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
        className="object-cover rounded"
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
