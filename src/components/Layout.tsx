import { ReactNode } from "react";
import { motion } from "framer-motion";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { AnnouncementBar } from "./AnnouncementBar";

interface LayoutProps {
  children: ReactNode;
  transparentHeader?: boolean;
}

export const Layout = ({ children, transparentHeader = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
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
    </div>
  );
};