import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/useLocale";



const TiktokIcon = () => (
  <a
    href="https://www.tiktok.com/@amg.pergola"
    target="_blank"
    rel="noopener noreferrer"
    className="transition-opacity hover:opacity-80"
    style={{ color: "#ffffff" }}
    aria-label="TikTok"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  </a>
);


export const SiteFooter = () => {
  const { t, localePath } = useLocale();
  const columns: any[] = t("footer.columns");
  const copyright: string = t("footer.copyright");

  const isExternal = (href: string) =>
    href.startsWith("mailto:") || href.startsWith("tel:") || href === "#";

  return (
    <footer className="bg-[hsl(var(--footer-background))]" style={{ color: "rgba(255,255,255,0.75)" }}>
      {/* Main footer */}
      <div
        className="mx-auto"
        style={{ maxWidth: 1400, paddingTop: 80, paddingBottom: 60, paddingInlineStart: 40, paddingInlineEnd: 40 }}
      >
        {/* Desktop: 5-col grid / Mobile: 2-col grid */}
        <div
          className="grid grid-cols-2 md:grid-cols-5"
          style={{ columnGap: 80, rowGap: 40 }}
        >
          {Array.isArray(columns) &&
            columns.map((col: any, idx: number) => (
              <div key={idx}>
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

        {/* Social row */}
        <div className="flex items-center" style={{ marginTop: 40 }}>
          <TiktokIcon />
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
