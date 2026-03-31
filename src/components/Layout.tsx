import { ReactNode } from "react";
import { motion } from "framer-motion";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { AnnouncementBar } from "./AnnouncementBar";
import { MiniCart } from "./MiniCart";
import { AdminTopBar } from "./AdminTopBar";
import { WelcomePopup } from "./WelcomePopup";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminTopBar />
      <AnnouncementBar />
      <SiteHeader />
      <motion.main
        className="flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {children}
      </motion.main>
      <SiteFooter />
      <MiniCart />
      <WelcomePopup />
    </div>
  );
};
