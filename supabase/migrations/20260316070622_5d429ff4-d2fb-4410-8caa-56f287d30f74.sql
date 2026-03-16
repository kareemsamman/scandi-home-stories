
-- Translation tables for Polylang-style language system

CREATE TABLE IF NOT EXISTS product_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  long_description TEXT DEFAULT '',
  length TEXT DEFAULT '',
  UNIQUE(product_id, locale)
);

CREATE TABLE IF NOT EXISTS category_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  UNIQUE(category_id, locale)
);

CREATE TABLE IF NOT EXISTS sub_category_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_category_id UUID NOT NULL REFERENCES sub_categories(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  UNIQUE(sub_category_id, locale)
);

CREATE TABLE IF NOT EXISTS hero_slide_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_slide_id UUID NOT NULL REFERENCES hero_slides(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  cta TEXT DEFAULT '',
  UNIQUE(hero_slide_id, locale)
);

-- Pages CMS system
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  template TEXT DEFAULT 'default',
  status TEXT DEFAULT 'published',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT DEFAULT '',
  sections JSONB DEFAULT '[]'::jsonb,
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  UNIQUE(page_id, locale)
);

-- Inventory system
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variation_key TEXT DEFAULT '',
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, variation_key)
);

-- Migrate existing data to translation tables
INSERT INTO product_translations (product_id, locale, name, description, long_description, length)
SELECT id, 'he', name, COALESCE(description_he, ''), COALESCE(long_description_he, ''), COALESCE(length_he, '')
FROM products
ON CONFLICT (product_id, locale) DO NOTHING;

INSERT INTO product_translations (product_id, locale, name, description, long_description, length)
SELECT id, 'ar', name, COALESCE(description_ar, ''), COALESCE(long_description_ar, ''), COALESCE(length_ar, '')
FROM products
ON CONFLICT (product_id, locale) DO NOTHING;

INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'he', COALESCE(name_he, ''), COALESCE(description_he, '')
FROM categories
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO category_translations (category_id, locale, name, description)
SELECT id, 'ar', COALESCE(name_ar, ''), COALESCE(description_ar, '')
FROM categories
ON CONFLICT (category_id, locale) DO NOTHING;

INSERT INTO sub_category_translations (sub_category_id, locale, name)
SELECT id, 'he', COALESCE(name_he, '')
FROM sub_categories
ON CONFLICT (sub_category_id, locale) DO NOTHING;

INSERT INTO sub_category_translations (sub_category_id, locale, name)
SELECT id, 'ar', COALESCE(name_ar, '')
FROM sub_categories
ON CONFLICT (sub_category_id, locale) DO NOTHING;

INSERT INTO hero_slide_translations (hero_slide_id, locale, title, subtitle, cta)
SELECT id, 'he', COALESCE(title_he, ''), COALESCE(subtitle_he, ''), COALESCE(cta_he, '')
FROM hero_slides
ON CONFLICT (hero_slide_id, locale) DO NOTHING;

INSERT INTO hero_slide_translations (hero_slide_id, locale, title, subtitle, cta)
SELECT id, 'ar', COALESCE(title_ar, ''), COALESCE(subtitle_ar, ''), COALESCE(cta_ar, '')
FROM hero_slides
ON CONFLICT (hero_slide_id, locale) DO NOTHING;

-- Seed default pages
INSERT INTO pages (slug, template, status, sort_order) VALUES
  ('home', 'home', 'published', 1),
  ('about', 'default', 'published', 2),
  ('contact', 'default', 'published', 3)
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS on all new tables
ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slide_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- RLS: translation tables (public read, admin manage)
CREATE POLICY "Anyone can read product_translations" ON product_translations FOR SELECT USING (true);
CREATE POLICY "Admins can manage product_translations" ON product_translations FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read category_translations" ON category_translations FOR SELECT USING (true);
CREATE POLICY "Admins can manage category_translations" ON category_translations FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read sub_category_translations" ON sub_category_translations FOR SELECT USING (true);
CREATE POLICY "Admins can manage sub_category_translations" ON sub_category_translations FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read hero_slide_translations" ON hero_slide_translations FOR SELECT USING (true);
CREATE POLICY "Admins can manage hero_slide_translations" ON hero_slide_translations FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS: pages (public read, admin manage)
CREATE POLICY "Anyone can read pages" ON pages FOR SELECT USING (true);
CREATE POLICY "Admins can manage pages" ON pages FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read page_translations" ON page_translations FOR SELECT USING (true);
CREATE POLICY "Admins can manage page_translations" ON page_translations FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS: inventory (public read, admin + worker manage)
CREATE POLICY "Anyone can read inventory" ON inventory FOR SELECT USING (true);
CREATE POLICY "Admins can manage inventory" ON inventory FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Workers can manage inventory" ON inventory FOR ALL USING (has_role(auth.uid(), 'worker'));

-- Update triggers
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
