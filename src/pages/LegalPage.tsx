import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { useHomeContent } from "@/hooks/useHomeContent";

const DEFAULT_CONTENT: Record<string, { he: { title: string; content: string }; ar: { title: string; content: string } }> = {
  legal_returns: {
    he: {
      title: "מדיניות החזרות",
      content: `אנו ב-AMG פרגולה מחויבים לשביעות רצונכם המלאה. להלן מדיניות ההחזרות שלנו:

**תקופת החזרה**
ניתן להחזיר מוצרים תוך 14 ימים מיום קבלת ההזמנה, בתנאי שהמוצר נמצא במצבו המקורי, ללא שימוש, ובאריזתו המקורית.

**תנאי ההחזרה**
• המוצר חייב להיות במצב חדש ולא פגום
• יש לשמור על האריזה המקורית
• נדרש קבלה או אישור רכישה
• מוצרים שהותקנו אינם ניתנים להחזרה`,
    },
    ar: {
      title: "سياسة الإرجاع",
      content: `نحن في AMG Pergola ملتزمون برضاكم التام. فيما يلي سياسة الإرجاع لدينا:

**فترة الإرجاع**
يمكن إرجاع المنتجات خلال 14 يومًا من تاريخ استلام الطلب، بشرط أن يكون المنتج في حالته الأصلية.

**شروط الإرجاع**
• يجب أن يكون المنتج في حالة جديدة وغير تالف
• يجب الحفاظ على العبوة الأصلية
• مطلوب إيصال أو تأكيد الشراء
• المنتجات المركبة غير قابلة للإرجاع`,
    },
  },
  legal_shipping: {
    he: {
      title: "מדיניות משלוחים",
      content: `**אזורי משלוח**
אנו מספקים משלוחים לכל רחבי ישראל.

**זמני אספקה**
• מוצרים מהמלאי: 5-10 ימי עסקים
• מוצרים בהזמנה מיוחדת: 3-6 שבועות`,
    },
    ar: {
      title: "سياسة الشحن",
      content: `**مناطق الشحن**
نقدم خدمات الشحن في جميع أنحاء إسرائيل.

**أوقات التسليم**
• المنتجات من المخزون: 5-10 أيام عمل
• المنتجات بطلب خاص: 3-6 أسابيع`,
    },
  },
  legal_privacy: {
    he: {
      title: "מדיניות פרטיות",
      content: `AMG פרגולה מחויבת להגן על פרטיותכם. מדיניות זו מסבירה כיצד אנו אוספים ומשתמשים במידע שלכם.

**המידע שאנו אוספים**
• פרטים אישיים: שם, אימייל, טלפון, כתובת
• פרטי רכישה והיסטוריית הזמנות`,
    },
    ar: {
      title: "سياسة الخصوصية",
      content: `تلتزم AMG Pergola بحماية خصوصيتكم. توضح هذه السياسة كيفية جمعنا لمعلوماتكم واستخدامها.

**المعلومات التي نجمعها**
• البيانات الشخصية: الاسم، البريد الإلكتروني، الهاتف، العنوان
• تفاصيل الشراء وسجل الطلبات`,
    },
  },
  legal_terms: {
    he: {
      title: "תנאי שימוש",
      content: `השימוש באתר AMG פרגולה מהווה הסכמה לתנאי שימוש אלו.

**שימוש באתר**
• האתר מיועד לשימוש אישי ולא מסחרי
• אסור להעתיק תוכן ללא אישור מפורש`,
    },
    ar: {
      title: "شروط الاستخدام",
      content: `يُعدّ استخدام موقع AMG Pergola موافقةً على شروط الاستخدام هذه.

**استخدام الموقع**
• الموقع مخصص للاستخدام الشخصي وليس التجاري
• يُحظر نسخ المحتوى دون إذن صريح`,
    },
  },
  legal_accessibility: {
    he: {
      title: "הצהרת נגישות",
      content: `AMG פרגולה מחויבת להנגשת האתר לכלל המשתמשים, כולל אנשים עם מוגבלויות.

**מאמצי הנגשה**
• האתר עומד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות
• ניווט מלא באמצעות מקלדת
• תאימות לקוראי מסך
• ניגודיות צבעים נאותה

**יצירת קשר בנושא נגישות**
אם נתקלתם בבעיית נגישות באתר, אנא פנו אלינו בטלפון 03-1234567 או במייל info@amgpergola.co.il ונטפל בכך בהקדם.`,
    },
    ar: {
      title: "بيان إمكانية الوصول",
      content: `تلتزم AMG Pergola بإتاحة الموقع لجميع المستخدمين، بما في ذلك الأشخاص ذوي الإعاقة.

**جهود الإتاحة**
• يلتزم الموقع بمتطلبات قانون المساواة في الحقوق للأشخاص ذوي الإعاقة
• تنقل كامل عبر لوحة المفاتيح
• توافق مع قارئات الشاشة
• تباين ألوان مناسب

**التواصل بشأن إمكانية الوصول**
إذا واجهتم مشكلة في إمكانية الوصول إلى الموقع، يرجى التواصل معنا على هاتف 03-1234567 أو البريد الإلكتروني info@amgpergola.co.il وسنتعامل معها في أقرب وقت.`,
    },
  },
};

const SECTION_KEY_MAP: Record<string, string> = {
  returns: "legal_returns",
  shipping: "legal_shipping",
  privacy: "legal_privacy",
  terms: "legal_terms",
  accessibility: "legal_accessibility",
};

// Render markdown-like bold (**text**)
const renderContent = (content: string) => {
  return content.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <h3 key={i} className="text-base font-bold text-foreground mt-6 mb-2 first:mt-0">
          {line.slice(2, -2)}
        </h3>
      );
    }
    if (line.startsWith("• ")) {
      return (
        <li key={i} className="text-sm text-muted-foreground leading-relaxed ms-4">
          {line.slice(2)}
        </li>
      );
    }
    if (line.trim() === "") return <br key={i} />;
    return (
      <p key={i} className="text-sm text-muted-foreground leading-relaxed">
        {line}
      </p>
    );
  });
};

const LegalPage = () => {
  const { page } = useParams<{ page: string }>();
  const { locale } = useLocale();

  const sectionKey = SECTION_KEY_MAP[page || ""] || "";
  const defaults = DEFAULT_CONTENT[sectionKey]?.[locale as "he" | "ar"] ||
    DEFAULT_CONTENT[sectionKey]?.["he"];

  const { data: dbContent } = useHomeContent(sectionKey, locale);

  const title   = dbContent?.title   || defaults?.title   || "";
  const content = dbContent?.content || defaults?.content || "";

  return (
    <Layout>
      {/* Hero strip */}
      <section className="bg-foreground py-16 md:py-24">
        <div className="section-container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl md:text-5xl font-black text-background leading-tight">
              {title}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 md:py-20 bg-white">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="space-y-1">
              {renderContent(content)}
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default LegalPage;
