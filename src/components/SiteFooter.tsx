import { Link } from "react-router-dom";
import { useLocale } from "@/i18n/useLocale";

export const SiteFooter = () => {
  const { t, localePath } = useLocale();
  const columns: any[] = t("footer.columns");
  const policies: any[] = t("footer.policies");
  const copyright: string = t("footer.copyright");

  const isExternal = (href: string) =>
    href.startsWith("mailto:") || href.startsWith("tel:") || href === "#";

  return (
    <footer className="bg-dark text-white">
      {/* Main footer */}
      <div className="section-container py-16 md:py-20">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to={localePath("/")} className="text-xl font-bold block mb-4">
              AMG Pergola
            </Link>
            <p className="text-sm text-white/50 leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          {/* Link columns */}
          {Array.isArray(columns) &&
            columns.map((col: any, idx: number) => (
              <div key={idx}>
                <h4 className="text-xs font-semibold text-white/40 mb-5">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link: any, i: number) => (
                    <li key={i}>
                      {isExternal(link.href) ? (
                        <a
                          href={link.href}
                          className="text-sm text-white/60 hover:text-white transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={localePath(link.href)}
                          className="text-sm text-white/60 hover:text-white transition-colors"
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
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="section-container py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/30">
            {typeof copyright === "string"
              ? copyright.replace("{year}", new Date().getFullYear().toString())
              : ""}
          </p>
          <div className="flex gap-6">
            {Array.isArray(policies) &&
              policies.map((p: any, i: number) => (
                <a
                  key={i}
                  href={p.href}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  {p.label}
                </a>
              ))}
          </div>
        </div>
      </div>
    </footer>
  );
};