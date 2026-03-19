import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";
import { ArrowLeft, Home, ShoppingBag } from "lucide-react";

const DEFAULT_IMAGE_DT = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80";
const DEFAULT_IMAGE_MB = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80";

const NotFound = () => {
  const { t, localePath, locale } = useLocale();
  const { data: db } = useHomeContent("page_404", locale);

  const imageDt   = db?.image        || DEFAULT_IMAGE_DT;
  const imageMb   = db?.image_mobile || DEFAULT_IMAGE_MB;
  const title     = db?.title        || t("notFound.title");
  const subtitle  = db?.subtitle     || t("notFound.text");
  const btnHome   = db?.btn_home     || t("notFound.home");
  const btnShop   = db?.btn_shop     || t("notFound.shop");

  return (
    <Layout>
      {/* Full-viewport canvas */}
      <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden -mt-[72px]">

        {/* Background images */}
        <img src={imageMb} alt="" aria-hidden
          className="absolute inset-0 w-full h-full object-cover md:hidden" />
        <img src={imageDt} alt="" aria-hidden
          className="absolute inset-0 w-full h-full object-cover hidden md:block" />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />

        {/* Decorative blurred orbs */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)", top: "10%", left: "5%" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)", bottom: "10%", right: "8%" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">

          {/* Giant 404 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-2 select-none"
          >
            {/* Shadow / echo layer */}
            <span
              className="absolute inset-0 flex items-center justify-center text-[clamp(120px,28vw,240px)] font-black leading-none text-white/5 blur-sm"
              aria-hidden
            >404</span>
            {/* Main number */}
            <span className="relative block text-[clamp(120px,28vw,240px)] font-black leading-none text-white/10 tracking-tighter">
              404
            </span>
          </motion.div>

          {/* Glass card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-3xl overflow-hidden px-8 py-10 md:px-14 md:py-12"
            style={{
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 32px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {/* Sheen line at top */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl md:text-4xl font-black text-white mb-3 leading-tight"
            >
              {title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="text-white/60 text-base md:text-lg mb-8 leading-relaxed"
            >
              {subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link
                to={localePath("/")}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-gray-900 text-sm font-bold hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Home className="w-4 h-4 shrink-0" />
                {btnHome}
              </Link>
              <Link
                to={localePath("/shop")}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                {btnShop}
              </Link>
            </motion.div>

            {/* Bottom sheen */}
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </motion.div>

          {/* Back link */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={() => window.history.back()}
            className="mt-8 inline-flex items-center gap-1.5 text-white/40 text-sm hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            חזרה לדף הקודם
          </motion.button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
