import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
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
    width="14"
    height="14"
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

const TikTokIcon = () => (
  <a href="#" aria-label="TikTok" className="text-foreground/60 hover:text-foreground transition-colors">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 3.76.92V6.34a4.81 4.81 0 0 1-.01.35z" />
    </svg>
  </a>
);

export const MobileNavDrawer = ({ open, onClose }: MobileNavDrawerProps) => {
  const { t, locale, localePath } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [animState, setAnimState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const navLinks = [
    { label: t("nav.shop"), href: localePath("/shop") },
    { label: t("nav.about"), href: localePath("/about") },
    { label: t("nav.contact"), href: localePath("/contact") },
  ];

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Force reflow before triggering animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimState("opening");
        });
      });
      timeoutRef.current = setTimeout(() => setAnimState("open"), 360);
    } else if (mounted) {
      setAnimState("closing");
      timeoutRef.current = setTimeout(() => {
        setAnimState("closed");
        setMounted(false);
      }, 360);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [open]);

  if (!mounted) return null;

  const isVisible = animState === "opening" || animState === "open";
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const modalStyle: React.CSSProperties = prefersReducedMotion
    ? { width: "98%", height: "98%", maxWidth: 480 }
    : {
        height: "98%",
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
        opacity: animState === "open" ? 1 : isVisible ? 0 : 0,
        transition: "opacity 200ms ease 120ms",
      };

  return (
    <>
      {/* Overlay - no animation */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        style={{ opacity: isVisible ? 1 : 0, transition: "opacity 0ms" }}
        onClick={onClose}
      />

      {/* Centered near-fullscreen modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto relative bg-background rounded-sm shadow-xl flex flex-col"
          style={modalStyle}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 start-4 w-8 h-8 bg-background border border-[#f0f0f0] rounded-full grid place-items-center text-foreground z-10"
            aria-label="Close"
          >
            <CloseIcon />
          </button>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 pt-14 pb-6 flex flex-col" style={contentStyle}>
            {/* Nav links */}
            <nav>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={onClose}
                  className="flex items-center justify-between py-2.5 text-lg font-semibold text-foreground border-b border-foreground/10 transition-colors hover:text-foreground/70"
                >
                  {link.label}
                  <ChevronCircle />
                </Link>
              ))}
            </nav>


            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom section */}
            <div className="mt-8 mb-4">
              <div className="flex items-center justify-start">
                <TikTokIcon />
              </div>
              <div className="border-t border-foreground/10 mt-4 pt-4 space-y-1">
                <Link to={localePath("/account")} onClick={onClose} className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-foreground/70 transition-colors">
                  <span>{t("nav.account")}</span>
                  <ChevronCircle />
                </Link>
                <div className="py-2">
                  <LocaleSwitcher />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
