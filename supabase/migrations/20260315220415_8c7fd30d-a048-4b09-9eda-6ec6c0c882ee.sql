
-- Categories (replaces collections)
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_he text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  description_he text DEFAULT '',
  description_ar text DEFAULT '',
  image text DEFAULT '',
  hero_image text DEFAULT '',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sub-categories
CREATE TABLE public.sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name_he text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'retail',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sub_category_id uuid REFERENCES public.sub_categories(id) ON DELETE SET NULL,
  price numeric NOT NULL DEFAULT 0,
  sku text,
  description_he text DEFAULT '',
  description_ar text DEFAULT '',
  long_description_he text DEFAULT '',
  long_description_ar text DEFAULT '',
  materials text DEFAULT '',
  dimensions text,
  length_he text,
  length_ar text,
  max_quantity int,
  is_featured boolean DEFAULT false,
  is_new boolean DEFAULT false,
  sort_order int DEFAULT 0,
  images text[] DEFAULT '{}',
  colors jsonb DEFAULT '[]',
  sizes jsonb DEFAULT '[]',
  use_color_groups boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shared color groups for contractor products
CREATE TABLE public.color_groups (
  id text PRIMARY KEY,
  name_he text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  sort_order int DEFAULT 0,
  colors jsonb DEFAULT '[]'
);

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total numeric NOT NULL DEFAULT 0,
  discount_code text,
  discount_amount numeric DEFAULT 0,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  apartment text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL DEFAULT '',
  product_image text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1,
  size text,
  color_name text,
  color_hex text
);

-- Hero slides
CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_he text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  subtitle_he text DEFAULT '',
  subtitle_ar text DEFAULT '',
  cta_he text DEFAULT '',
  cta_ar text DEFAULT '',
  image text NOT NULL DEFAULT '',
  link text DEFAULT '/shop',
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Site content (FAQ, about, etc.)
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key text UNIQUE NOT NULL,
  value_he jsonb DEFAULT '{}',
  value_ar jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.color_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Public read for catalog data
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read sub_categories" ON public.sub_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can read color_groups" ON public.color_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can read hero_slides" ON public.hero_slides FOR SELECT USING (true);
CREATE POLICY "Anyone can read site_content" ON public.site_content FOR SELECT USING (true);

-- Admin write for catalog data
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage sub_categories" ON public.sub_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage color_groups" ON public.color_groups FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage hero_slides" ON public.hero_slides FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage site_content" ON public.site_content FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Orders: users can read/create own, admins can manage all
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Anonymous orders (not logged in users)
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
