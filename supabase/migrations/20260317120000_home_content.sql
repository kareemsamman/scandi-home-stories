-- Home page flexible content table
CREATE TABLE IF NOT EXISTS home_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale TEXT NOT NULL,
  section TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(locale, section)
);

ALTER TABLE home_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read home_content" ON home_content FOR SELECT USING (true);
CREATE POLICY "Admin manage home_content" ON home_content FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_home_content_updated_at
  BEFORE UPDATE ON home_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for site media (images)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('site-media', 'site-media', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read site-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-media');
CREATE POLICY "Admin upload site-media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update site-media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'site-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete site-media" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-media' AND public.has_role(auth.uid(), 'admin'));
