-- Pergola quote requests table
CREATE TABLE IF NOT EXISTS pergola_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer info
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,

  -- Dimensions (in mm)
  width integer NOT NULL,
  length integer NOT NULL,
  height integer,

  -- Configuration
  pergola_type text NOT NULL DEFAULT 'bioclimatic',
  mount_type text NOT NULL DEFAULT 'wall' CHECK (mount_type IN ('wall', 'freestanding')),
  installation boolean NOT NULL DEFAULT false,
  lighting text NOT NULL DEFAULT 'none' CHECK (lighting IN ('none', 'white', 'rgb')),
  santaf_roofing boolean NOT NULL DEFAULT false,
  frame_color text DEFAULT '',
  roof_color text DEFAULT '',
  notes text DEFAULT '',

  -- Computed values (stored at submission time)
  module_classification text NOT NULL,
  carrier_count integer NOT NULL,
  front_post_count integer NOT NULL,
  back_post_count integer NOT NULL DEFAULT 0,

  -- PDF
  pdf_url text,

  -- Admin workflow
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'ready_for_quote', 'quoted', 'closed')),
  admin_notes text DEFAULT '',
  admin_modified_config jsonb,

  -- Metadata
  locale text DEFAULT 'he',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pergola_requests_status ON pergola_requests(status);
CREATE INDEX idx_pergola_requests_created ON pergola_requests(created_at DESC);

-- Enable RLS
ALTER TABLE pergola_requests ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "admins_all_pergola_requests" ON pergola_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin')));

-- Workers can read
CREATE POLICY "workers_read_pergola_requests" ON pergola_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('worker')));

-- Public can insert (customer submission)
CREATE POLICY "public_insert_pergola_requests" ON pergola_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_pergola_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pergola_requests_updated_at
  BEFORE UPDATE ON pergola_requests
  FOR EACH ROW EXECUTE FUNCTION update_pergola_requests_updated_at();
