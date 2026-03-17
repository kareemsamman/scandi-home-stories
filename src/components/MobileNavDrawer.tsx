import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useLocale } from "@/i18n/useLocale";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { collections } from "@/data/products";
import { useSiteContent } from "@/hooks/useSiteContent";

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


export const MobileNavDrawer = ({ open, onClose }: MobileNavDrawerProps) => {
  const { t, locale, localePath } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [animState, setAnimState] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const { data: dbHeader } = useSiteContent("header", locale);
  const { data: dbFooter } = useSiteContent("footer", locale);

  const navLinks = dbHeader?.nav_links?.length
    ? dbHeader.nav_links.map((l: any) => ({ label: l.label, href: localePath(l.href) }))
    : [
        { label: t("nav.shop"), href: localePath("/shop") },
        { label: t("nav.catalog"), href: localePath("/catalog") },
        { label: t("nav.about"), href: localePath("/about") },
        { label: t("nav.contact"), href: localePath("/contact") },
      ];

  const socialLinks: any[] = dbFooter?.social_links ?? [{ platform: "tiktok", url: "https://www.tiktok.com/@amg.pergola" }];

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
              <div className="flex items-center justify-start gap-4">
                {socialLinks.map((s: any, i: number) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="text-foreground/60 hover:text-foreground transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      {s.platform === "tiktok" && (
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 3.76.92V6.34a4.81 4.81 0 0 1-.01.35z" />
                      )}
                      {s.platform === "instagram" && (
                        <>
                          <rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="17.5" cy="6.5" r="1" />
                        </>
                      )}
                      {s.platform === "facebook" && (
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                      )}
                      {s.platform === "youtube" && (
                        <>
                          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                          <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                        </>
                      )}
                      {s.platform === "whatsapp" && (
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      )}
                      {!["tiktok","instagram","facebook","youtube","whatsapp"].includes(s.platform) && null}
                    </svg>
                  </a>
                ))}
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
