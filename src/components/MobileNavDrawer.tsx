import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { collections } from "@/data/products";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CloseIcon = () => (
  <svg
    role="presentation"
    strokeWidth="2"
    focusable="false"
    width="19"
    height="19"
    className="icon icon-close"
    viewBox="0 0 24 24"
  >
    <path d="M17.658 6.343 6.344 17.657M17.658 17.657 6.344 6.343" stroke="currentColor" />
  </svg>
);

export const MobileNavDrawer = ({ open, onClose }: MobileNavDrawerProps) => {
  const { t, locale, localePath } = useLocale();

  const navLinks = [
    { label: t("nav.shop"), href: localePath("/shop") },
    { label: t("nav.about"), href: localePath("/about") },
    { label: t("nav.contact"), href: localePath("/contact") },
    { label: t("nav.cart"), href: localePath("/cart") },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />

          {/* Centered modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 pointer-events-none"
          >
            <div
              className="pointer-events-auto relative bg-background rounded-2xl shadow-xl overflow-y-auto max-h-[80vh]"
              style={{ width: "calc(100% - 32px)", maxWidth: 480 }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 end-4 p-1 text-foreground/60 hover:text-foreground z-10"
                aria-label="Close"
              >
                <CloseIcon />
              </button>

              <div className="px-6 pt-6 pb-2">
                <span className="text-lg font-bold text-foreground">AMG Pergola</span>
              </div>

              {/* Nav links */}
              <nav className="px-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={onClose}
                    className="flex items-center justify-between py-[18px] text-base font-medium text-foreground border-b border-foreground/10 transition-colors hover:text-foreground/70"
                  >
                    {link.label}
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="text-foreground/40 rtl:rotate-180">
                      <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ))}
              </nav>

              {/* Collections */}
              <div className="px-6 mt-4 pb-2">
                <p className="text-xs font-semibold text-muted-foreground mb-3">
                  {t("nav.collections")}
                </p>
                {collections.map((col) => (
                  <Link
                    key={col.id}
                    to={localePath(`/shop?collection=${col.slug}`)}
                    onClick={onClose}
                    className="flex items-center justify-between py-3 text-sm text-foreground/70 hover:text-foreground border-b border-foreground/10 transition-colors"
                  >
                    {col.name[locale]}
                    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="text-foreground/30 rtl:rotate-180">
                      <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ))}
              </div>

              {/* Locale switcher */}
              <div className="px-6 py-5">
                <LocaleSwitcher />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
