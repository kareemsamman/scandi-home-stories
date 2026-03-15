import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { useCart } from "@/hooks/useCart";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { cn } from "@/lib/utils";
import logoWhite from "@/assets/logo-white.png";

const SearchIcon = () => (
  <svg role="presentation" strokeWidth="2" focusable="false" width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="10" r="7" stroke="currentColor" fill="none" />
    <path d="m16 15 3 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LanguageIcon = () => (
  <svg role="presentation" strokeWidth="2" focusable="false" width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="8" stroke="currentColor" fill="none" />
    <ellipse cx="11" cy="11" rx="3.5" ry="8" stroke="currentColor" fill="none" />
    <path d="M3 11h16" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

const AccountIcon = () => (
  <svg role="presentation" strokeWidth="2" focusable="false" width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="7" r="4" fill="none" stroke="currentColor" />
    <path d="M3.5 19c1.421-2.974 4.247-5 7.5-5s6.079 2.026 7.5 5" fill="none" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

const CartSvgIcon = () => (
  <svg role="presentation" strokeWidth="2" focusable="false" width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 7H3.577A2 2 0 0 0 1.64 9.497l2.051 8A2 2 0 0 0 5.63 19H16.37a2 2 0 0 0 1.937-1.503l2.052-8A2 2 0 0 0 18.422 7H11Zm0 0V1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
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
    const onScroll = () => {
      const isScrolled = window.scrollY > 60;
      setScrolled(isScrolled);

      // Toggle announcement bar hidden class
      const bar = document.querySelector(".announcement-bar");
      if (bar) {
        if (isScrolled) {
          bar.classList.add("is-hidden");
        } else {
          bar.classList.remove("is-hidden");
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: t("nav.shop"), href: localePath("/shop") },
    { label: t("nav.about"), href: localePath("/about") },
    { label: t("nav.contact"), href: localePath("/contact") },
  ];

  // Color classes based on scroll state
  const textColor = scrolled ? "text-foreground" : "text-white";
  const textHover = scrolled ? "hover:text-foreground/70" : "hover:text-white/80";
  const mobileTextColor = "text-white/80 hover:text-white";

  return (
    <>
      <header
        className={cn(
          "site-header sticky z-40 transition-all duration-[240ms] ease-in-out",
          scrolled ? "top-0 is-scrolled" : "top-[40px]"
        )}
      >
        <div className="px-6 md:px-10">
          {/* Desktop */}
          <div className="hidden md:grid grid-cols-3 items-center h-20 pt-4">
            <div className="flex items-center justify-start">
              <Link to={localePath("/")}>
                <img
                  src={logoWhite}
                  alt="AMG Pergola"
                  className={cn(
                    "h-16 w-auto transition-all duration-[240ms]",
                    scrolled && "invert"
                  )}
                />
              </Link>
            </div>

            <nav className="flex items-center justify-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "text-base font-medium transition-colors duration-[240ms]",
                    textColor,
                    textHover
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center justify-end gap-1">
              <button
                className={cn("p-2 transition-colors duration-[240ms]", textColor, textHover)}
                aria-label="Search"
              >
                <SearchIcon />
              </button>
              <LocaleSwitcher icon={<LanguageIcon />} scrolled={scrolled} />
              <button
                className={cn("p-2 transition-colors duration-[240ms]", textColor, textHover)}
                aria-label="Account"
              >
                <AccountIcon />
              </button>
              <Link
                to={localePath("/cart")}
                className={cn("relative p-2 transition-colors duration-[240ms]", textColor, textHover)}
                aria-label="Cart"
              >
                <CartSvgIcon />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className={cn(
                        "absolute -top-0.5 -end-0.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center transition-colors duration-[240ms]",
                        scrolled ? "bg-foreground text-background" : "bg-white text-dark"
                      )}
                    >
                      {itemCount > 9 ? "9+" : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center justify-between h-14">
            <div className="flex items-center gap-0.5">
              <button className={mobileTextColor + " p-2 transition-colors"} onClick={() => setMobileOpen(true)} aria-label="Menu">
                <MenuIcon />
              </button>
              <button className={mobileTextColor + " p-2 transition-colors"} aria-label="Search">
                <SearchIcon />
              </button>
            </div>

            <Link to={localePath("/")} className="absolute start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
              <img src={logoWhite} alt="AMG Pergola" className="h-9 w-auto" />
            </Link>

            <div className="flex items-center gap-0.5">
              <button className={mobileTextColor + " p-2 transition-colors"} aria-label="Account">
                <AccountIcon />
              </button>
              <Link to={localePath("/cart")} className={"relative " + mobileTextColor + " p-2 transition-colors"} aria-label="Cart">
                <CartSvgIcon />
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
