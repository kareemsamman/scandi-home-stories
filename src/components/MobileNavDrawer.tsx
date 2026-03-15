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

const ChevronCircle = () => (
  <span
    className="w-6 h-6 rounded-full bg-foreground/10 flex-shrink-0 grid place-items-center transition-all duration-200 rtl:rotate-180"
  >
    <svg
      role="presentation"
      focusable="false"
      width="5"
      height="8"
      viewBox="0 0 5 8"
    >
      <path d="m.75 7 3-3-3-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  </span>
);

const SocialIcons = () => (
  <div className="flex items-center justify-center gap-4">
    {/* Instagram */}
    <a href="#" aria-label="Instagram" className="text-foreground/60 hover:text-foreground transition-colors">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    </a>
    {/* Facebook */}
    <a href="#" aria-label="Facebook" className="text-foreground/60 hover:text-foreground transition-colors">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    </a>
    {/* WhatsApp */}
    <a href="#" aria-label="WhatsApp" className="text-foreground/60 hover:text-foreground transition-colors">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    </a>
  </div>
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

          {/* Centered near-fullscreen modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className="pointer-events-auto relative bg-background rounded-sm shadow-xl flex flex-col"
              style={{ width: "98%", height: "98%", maxWidth: 480 }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 end-4 w-10 h-10 border border-foreground rounded-full grid place-items-center text-foreground z-10"
                aria-label="Close"
              >
                <CloseIcon />
              </button>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 pt-16 pb-6 flex flex-col">
                {/* Brand */}
                <div className="pb-4">
                  <span className="text-lg font-bold text-foreground">AMG Pergola</span>
                </div>

                {/* Nav links */}
                <nav>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={onClose}
                      className="flex items-center justify-between py-[18px] text-lg font-semibold text-foreground border-b border-foreground/10 transition-colors hover:text-foreground/70"
                    >
                      {link.label}
                      <ChevronCircle />
                    </Link>
                  ))}
                </nav>

                {/* Collections */}
                <div className="mt-6">
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
                      <ChevronCircle />
                    </Link>
                  ))}
                </div>

                {/* Locale switcher */}
                <div className="mt-6">
                  <LocaleSwitcher />
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Bottom section: social + account */}
                <div className="mt-8">
                  <SocialIcons />
                  <div className="border-t border-foreground/10 mt-4 pt-4">
                    <button className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-foreground/70 transition-colors">
                      <span>Account</span>
                      <ChevronCircle />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
