import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";
import { ArrowLeft, Home, ShoppingBag } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const DEFAULT_IMAGE = "/assets/404-hero.jpg";

const NotFound = () => {
  const { t, localePath, locale } = useLocale();
  const { data: db } = useHomeContent("page_404", locale);

  const image     = db?.image        || DEFAULT_IMAGE;
  const title     = db?.title        || t("notFound.title");
  const subtitle  = db?.subtitle     || t("notFound.text");
  const btnHome   = db?.btn_home     || t("notFound.home");
  const btnShop   = db?.btn_shop     || t("notFound.shop");

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <img
        src={image}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-xl mx-auto">
        {/* 404 number */}
        <motion.span
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="block text-[clamp(100px,25vw,200px)] font-black leading-none text-white/10 tracking-tighter select-none mb-2"
        >
          404
        </motion.span>

        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl overflow-hidden px-8 py-10 md:px-12 md:py-12"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
          }}
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-2xl md:text-3xl font-bold text-white mb-3"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-white/55 text-sm md:text-base mb-8 leading-relaxed"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              to={localePath("/")}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-white text-gray-900 text-sm font-bold hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Home className="w-4 h-4 shrink-0" />
              {btnHome}
            </Link>
            <Link
              to={localePath("/shop")}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              {btnShop}
            </Link>
          </motion.div>
        </motion.div>

        {/* Back link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-1.5 text-white/35 text-sm hover:text-white/60 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {locale === "ar" ? "العودة للصفحة السابقة" : "חזרה לדף הקודם"}
        </motion.button>
      </div>
    </div>
  );
};

export default NotFound;
