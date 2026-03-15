import { Link } from "react-router-dom";
import { Search, User, ShoppingBag, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { useCart } from "@/hooks/useCart";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { collections } from "@/data/products";
import { cn } from "@/lib/utils";

export const SiteHeader = () => {
  const { t, locale, localePath } = useLocale();
  const itemCount = useCart((s) => s.getItemCount());
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: t("nav.shop"), href: localePath("/shop") },
    { label: t("nav.about"), href: localePath("/about") },
    { label: t("nav.contact"), href: localePath("/contact") },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-inline-start-0 inset-inline-end-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-dark/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        )}
      >
        <div className="section-container">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo - Right side in RTL */}
            <Link
              to={localePath("/")}
              className="text-xl md:text-2xl font-bold text-white tracking-tight"
            >
              AMG Pergola
            </Link>

            {/* Desktop Nav - Center */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions - Left side in RTL */}
            <div className="flex items-center gap-1">
              <div className="hidden md:block text-white">
                <LocaleSwitcher />
              </div>

              <Link
                to={localePath("/cart")}
                className="relative p-2 text-white/70 hover:text-white transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {itemCount > 9 ? "9+" : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              <button
                className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileNavDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};