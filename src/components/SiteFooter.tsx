import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/useLocale";
import { useSiteContent } from "@/hooks/useSiteContent";

const SocialIcon = ({ platform }: { platform: string }) => {
  if (platform === "tiktok") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    );
  }
  if (platform === "instagram") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (platform === "facebook") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  }
  if (platform === "youtube") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (platform === "whatsapp") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    );
  }
  return <span style={{ fontSize: 12 }}>{platform}</span>;
};

export const SiteFooter = () => {
  const { t, localePath, locale } = useLocale();
  const { data: dbFooter } = useSiteContent("footer", locale);
  const columns: any[] = dbFooter?.columns?.length ? dbFooter.columns : t("footer.columns");
  const copyright: string = dbFooter?.copyright || t("footer.copyright");
  const socialLinks: any[] = dbFooter?.social_links ?? [{ platform: "tiktok", url: "https://www.tiktok.com/@amg.pergola" }];

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
        <div className="flex items-center gap-4" style={{ marginTop: 40 }}>
          {socialLinks.map((s: any, i: number) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
              style={{ color: "#ffffff" }}
              aria-label={s.platform}
            >
              <SocialIcon platform={s.platform} />
            </a>
          ))}
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
