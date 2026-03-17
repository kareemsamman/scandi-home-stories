import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export interface ShippingSettings {
  threshold: number;
  zones: {
    north: number;
    center: number;
    south: number;
    jerusalem: number;
  };
}

export const DEFAULT_SHIPPING: ShippingSettings = {
  threshold: 3000,
  zones: {
    north: 500,
    center: 200,
    south: 400,
    jerusalem: 200,
  },
};

export const useShippingSettings = () => {
  return useQuery({
    queryKey: ["shipping_settings"],
    queryFn: async () => {
      const { data } = await db
        .from("home_content")
        .select("data")
        .eq("locale", "global")
        .eq("section", "shipping_settings")
        .maybeSingle();
      return (data?.data as ShippingSettings) ?? DEFAULT_SHIPPING;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useSaveShippingSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: ShippingSettings) => {
      const { error } = await db.from("home_content").upsert(
        { locale: "global", section: "shipping_settings", data: settings },
        { onConflict: "locale,section" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shipping_settings"] }),
  });
};

/** Map Hebrew city names → zone key */
export const CITY_ZONE_MAP: Record<string, keyof ShippingSettings["zones"]> = {
  // North
  "חיפה": "north", "נצרת": "north", "עכו": "north", "טבריה": "north",
  "צפת": "north", "נהריה": "north", "כרמיאל": "north", "עפולה": "north",
  "קריית שמונה": "north", "נוף הגליל": "north", "מגדל העמק": "north",
  "יוקנעם עילית": "north", "יוקנעם": "north", "טירת כרמל": "north",
  "קריית אתא": "north", "קריית ביאליק": "north", "קריית מוצקין": "north",
  "קריית ים": "north", "קריית טבעון": "north", "שפרעם": "north",
  "נשר": "north", "זכרון יעקב": "north", "פרדס חנה-כרכור": "north",
  "פרדס חנה": "north", "כרכור": "north", "בנימינה": "north",
  "בית שאן": "north", "אור עקיבא": "north", "חדרה": "north",
  "מגאר": "north", "כאבול": "north",
  "דלית אל-כרמל": "north", "עוספיא": "north",
  "קצרין": "north", "מעלות-תרשיחא": "north", "שלומי": "north",
  "גבעת עלייה": "north",

  // Center
  "תל אביב": "center", "תל אביב-יפו": "center", "ראשון לציון": "center",
  "פתח תקווה": "center", "נתניה": "center", "בני ברק": "center",
  "הרצליה": "center", "חולון": "center", "בת ים": "center",
  "רמת גן": "center", "כפר סבא": "center", "רעננה": "center",
  "הוד השרון": "center", "רמת השרון": "center", "גבעתיים": "center",
  "לוד": "center", "רמלה": "center", "נס ציונה": "center",
  "רחובות": "center", "יבנה": "center", "ראש העין": "center",
  "אלעד": "center", "טייבה": "center", "קלנסווה": "center",
  "טירה": "center", "שוהם": "center", "גן יבנה": "center",
  "גבעת שמואל": "center", "אור יהודה": "center", "מזכרת בתיה": "center",
  "גדרה": "center", "קריית עקרון": "center", "כפר יונה": "center",
  "תל מונד": "center", "כפר נטר": "center", "אזור": "center",
  "בית דגן": "center", "פרדסיה": "center", "ג'לג'וליה": "center",
  "כפר קאסם": "center", "ראש העין": "center", "ערערה": "center",
  "באקה אל-גרבייה": "center", "ג'ת": "center", "מועאוויה": "center",
  "כפר ברא": "center", "תירה": "center", "נעמת": "center",

  // South
  "באר שבע": "south", "אשדוד": "south", "אשקלון": "south", "אילת": "south",
  "דימונה": "south", "קריית גת": "south", "נתיבות": "south",
  "שדרות": "south", "ערד": "south", "מצפה רמון": "south",
  "ירוחם": "south", "אופקים": "south", "קריית מלאכי": "south",
  "רהט": "south", "תל שבע": "south", "לכיש": "south",
  "עומר": "south", "מיתר": "south", "להבים": "south",
  "שגב שלום": "south", "כסיפה": "south", "חורה": "south",
  "ערערה-בנגב": "south", "גבעות בר": "south",

  // Jerusalem
  "ירושלים": "jerusalem", "מבשרת ציון": "jerusalem", "בית שמש": "jerusalem",
  "מעלה אדומים": "jerusalem", "גבעת זאב": "jerusalem",
  "מודיעין-מכבים-רעות": "jerusalem", "מודיעין": "jerusalem",
  "ביתר עילית": "jerusalem", "מודיעין עילית": "jerusalem",
  "אבו גוש": "jerusalem", "הר אדר": "jerusalem",
  "גבעון": "jerusalem", "צור הדסה": "jerusalem",
  "קריית יערים": "jerusalem", "אלפי מנשה": "jerusalem",
};

export const detectZoneFromCity = (city: string): keyof ShippingSettings["zones"] | null => {
  if (!city) return null;
  const trimmed = city.trim();
  if (CITY_ZONE_MAP[trimmed]) return CITY_ZONE_MAP[trimmed];
  // Partial match
  for (const [key, zone] of Object.entries(CITY_ZONE_MAP)) {
    if (trimmed.includes(key) || key.includes(trimmed)) return zone;
  }
  return null;
};
