import { useState, useEffect, useRef } from "react";
import { useLocale } from "@/i18n/useLocale";
import { cn } from "@/lib/utils";
import { useSiteContent } from "@/hooks/useSiteContent";

export const AnnouncementBar = () => {
  const { t, locale } = useLocale();
  const { data: dbHeader } = useSiteContent("header", locale);
  const messages: string[] = (
    dbHeader?.announcement_messages?.length
      ? dbHeader.announcement_messages.map((m: any) => (typeof m === "string" ? m : m.message))
      : t("announcement.messages")
  ) as string[];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!Array.isArray(messages) || messages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages]);

  if (!Array.isArray(messages)) return null;

  return (
    <div className="announcement-bar sticky top-0 z-50 bg-primary text-primary-foreground">
      <div className="section-container flex items-center justify-center h-[40px]">
        <p className="text-xs font-medium text-center transition-opacity duration-300">
          {messages[current]}
        </p>
      </div>
    </div>
  );
};
