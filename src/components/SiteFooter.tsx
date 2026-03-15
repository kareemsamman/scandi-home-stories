import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/useLocale";

const PaymentIcon = ({ name }: { name: string }) => (
  <div
    className="h-7 px-2 rounded-sm flex items-center justify-center text-[10px] font-semibold tracking-tight select-none"
    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
  >
    {name}
  </div>
);

const SocialIcon = ({ type, href }: { type: string; href?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    instagram: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    facebook: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    pinterest: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 20l4-9m0 0a5 5 0 1 0-3.5-8.5" />
        <circle cx="12" cy="10" r="5" />
      </svg>
    ),
    tiktok: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    ),
  };
  return (
    <a
      href={href || "#"}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      className="transition-opacity hover:opacity-80"
      style={{ color: "#ffffff" }}
      aria-label={type}
    >
      {icons[type]}
    </a>
  );
};

const PAYMENT_METHODS = [
  "Amex", "Apple Pay", "Diners", "Discover", "Google Pay",
  "Mastercard", "PayPal", "Shop Pay", "Venmo", "Visa",
];

export const SiteFooter = () => {
  const { t, localePath } = useLocale();
  const columns: any[] = t("footer.columns");
  const copyright: string = t("footer.copyright");

  const isExternal = (href: string) =>
    href.startsWith("mailto:") || href.startsWith("tel:") || href === "#";

  return (
    <footer style={{ background: "#0b0f16", color: "rgba(255,255,255,0.75)" }}>
      {/* Main footer */}
      <div
        className="mx-auto"
        style={{ maxWidth: 1400, paddingTop: 80, paddingBottom: 60, paddingInlineStart: 40, paddingInlineEnd: 40 }}
      >
        {/* Desktop: 5-col grid / Mobile: single column */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5"
          style={{ columnGap: 80, rowGap: 40 }}
        >
          {Array.isArray(columns) &&
            columns.map((col: any, idx: number) => (
              <div key={idx} className={idx === columns.length - 1 ? "" : ""}>
                <h4
                  className="font-semibold"
                  style={{ fontSize: 16, color: "#ffffff", marginBottom: 18 }}
                >
                  {col.title}
                </h4>
                <ul>
                  {col.links.map((link: any, i: number) => (
                    <li key={i} style={{ marginBottom: 8 }}>
                      {isExternal(link.href) ? (
                        <a
                          href={link.href}
                          className="transition-colors hover:text-white"
                          style={{ fontSize: 14, lineHeight: "28px", color: "rgba(255,255,255,0.7)" }}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={localePath(link.href)}
                          className="transition-colors hover:text-white"
                          style={{ fontSize: 14, lineHeight: "28px", color: "rgba(255,255,255,0.7)" }}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>

        {/* Social + Payment row */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between"
          style={{ marginTop: 40 }}
        >
          {/* Social icons */}
          <div className="flex items-center" style={{ gap: 24 }}>
            <SocialIcon type="instagram" />
            <SocialIcon type="facebook" />
            <SocialIcon type="pinterest" />
            <SocialIcon type="tiktok" />
          </div>

          {/* Payment icons */}
          <div className="flex flex-wrap items-center mt-6 sm:mt-0" style={{ gap: 10 }}>
            {PAYMENT_METHODS.map((m) => (
              <PaymentIcon key={m} name={m} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom copyright */}
      <div
        className="mx-auto"
        style={{
          maxWidth: 1400,
          paddingInlineStart: 40,
          paddingInlineEnd: 40,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: 20,
          paddingBottom: 20,
        }}
      >
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          {typeof copyright === "string"
            ? copyright.replace("{year}", new Date().getFullYear().toString())
            : ""}
        </p>
      </div>
    </footer>
  );
};
