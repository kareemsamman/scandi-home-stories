import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { useCart } from "@/hooks/useCart";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { cn } from "@/lib/utils";

const SearchIcon = () => (
  <svg
    role="presentation"
    strokeWidth="2"
    focusable="false"
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
  >
    <circle cx="11" cy="10" r="7" stroke="currentColor" fill="none" />
    <path
      d="m16 15 3 3"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LanguageIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M20 11C24.9709 11 29 15.0291 29 20C29 24.9709 24.9709 29 20 29C15.0291 29 11 24.9709 11 20C11 15.0291 15.0291 11 20 11Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.9984 11C21.849 11 23.3483 15.0291 23.3483 20C23.3483 24.9709 21.849 29 19.9984 29C18.1478 29 16.6484 24.9709 16.6484 20C16.6484 15.0291 18.1478 11 19.9984 11Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 19.998H29"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AccountIcon = () => (
  <svg
    role="presentation"
    strokeWidth="2"
    focusable="false"
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
  >
    <circle cx="11" cy="7" r="4" fill="none" stroke="currentColor" />
    <path
      d="M3.5 19c1.421-2.974 4.247-5 7.5-5s6.079 2.026 7.5 5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    />
  </svg>
);

const CartIcon = () => (
  <svg
    role="presentation"
    strokeWidth="2"
    focusable="false"
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
  >
    <path
      d="M11 7H3.577A2 2 0 0 0 1.64 9.497l2.051 8A2 2 0 0 0 5.63 19H16.37a2 2 0 0 0 1.937-1.503l2.052-8A2 2 0 0 0 18.422 7H11Zm0 0V1"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="19" y2="6" strokeLinecap="round" />
    <line x1="3" y1="11" x2="19" y2="11" strokeLinecap="round" />
    <line x1="3" y1="16" x2="19" y2="16" strokeLinecap="round" />
  </svg>
);

export const SiteHeader = () => {
  const { t, localePath } = useLocale();
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
          "sticky top-[40px] z-40 transition-all duration-500",
          scrolled
            ? "bg-dark/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        )}
      >
        <div className="section-container">
          {/* Desktop: 3-zone grid */}
          <div className="hidden md:grid grid-cols-3 items-center h-16 md:h-20">
            {/* Zone 1 (RIGHT in RTL = grid start): Logo */}
            <div className="flex items-center justify-start">
              <Link
                to={localePath("/")}
                className="text-xl md:text-2xl font-bold text-white tracking-tight"
              >
                AMG Pergola
              </Link>
            </div>

            {/* Zone 2 (CENTER): Navigation */}
            <nav className="flex items-center justify-center gap-8">
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

            {/* Zone 3 (LEFT in RTL = grid end): Utility icons */}
            <div className="flex items-center justify-end gap-1">
              <button
                className="p-2 text-white/70 hover:text-white transition-colors"
                aria-label="Search"
              >
                <SearchIcon />
              </button>

              <LocaleSwitcher icon={<LanguageIcon />} />

              <button
                className="p-2 text-white/70 hover:text-white transition-colors"
                aria-label="Account"
              >
                <AccountIcon />
              </button>

              <Link
                to={localePath("/cart")}
                className="relative p-2 text-white/70 hover:text-white transition-colors"
                aria-label="Cart"
              >
                <CartIcon />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-white text-dark text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {itemCount > 9 ? "9+" : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>
          </div>

          {/* Mobile: 3-zone flex */}
          <div className="flex md:hidden items-center justify-between h-14">
            {/* Mobile start: menu + search */}
            <div className="flex items-center gap-0.5">
              <button
                className="p-2 text-white/80 hover:text-white transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Menu"
              >
                <MenuIcon />
              </button>
              <button
                className="p-2 text-white/80 hover:text-white transition-colors"
                aria-label="Search"
              >
                <SearchIcon />
              </button>
            </div>

            {/* Mobile center: logo */}
            <Link
              to={localePath("/")}
              className="text-lg font-bold text-white tracking-tight absolute start-1/2 -translate-x-1/2 rtl:translate-x-1/2"
            >
              AMG Pergola
            </Link>

            {/* Mobile end: account + cart */}
            <div className="flex items-center gap-0.5">
              <button
                className="p-2 text-white/80 hover:text-white transition-colors"
                aria-label="Account"
              >
                <AccountIcon />
              </button>
              <Link
                to={localePath("/cart")}
                className="relative p-2 text-white/80 hover:text-white transition-colors"
                aria-label="Cart"
              >
                <CartIcon />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-white text-dark text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {itemCount > 9 ? "9+" : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <MobileNavDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};
