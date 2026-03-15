import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { collections } from "@/data/products";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 bottom-0 end-0 w-[85vw] max-w-sm bg-dark z-50 overflow-y-auto"
            style={{ insetInlineEnd: 0, insetInlineStart: "auto" }}
          >
            <div className="p-6">
              {/* Close */}
              <div className="flex items-center justify-between mb-10">
                <span className="text-lg font-bold text-white">AMG Pergola</span>
                <button onClick={onClose} className="p-2 text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="space-y-1 mb-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={onClose}
                    className="block py-3 text-base font-medium text-white/80 hover:text-white border-b border-white/10 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Collections */}
              <div className="mb-8">
                <p className="text-xs font-semibold text-white/40 mb-4">
                  {t("nav.collections")}
                </p>
                <div className="space-y-1">
                  {collections.map((col) => (
                    <Link
                      key={col.id}
                      to={localePath(`/shop?collection=${col.slug}`)}
                      onClick={onClose}
                      className="block py-2.5 text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {col.name[locale]}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Locale switcher */}
              <div className="text-white">
                <LocaleSwitcher />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};