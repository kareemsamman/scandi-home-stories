-- Upgrade pergola_requests table with profiles, enhanced lighting, santaf, spacing, new statuses

-- Add new columns
ALTER TABLE pergola_requests
  ADD COLUMN IF NOT EXISTS santaf_color text DEFAULT '',
  ADD COLUMN IF NOT EXISTS profile_preset text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS spacing_mode text DEFAULT 'automatic' CHECK (spacing_mode IN ('automatic', 'dense', 'standard', 'wide')),
  ADD COLUMN IF NOT EXISTS lighting_position text DEFAULT 'none' CHECK (lighting_position IN ('none', 'all_posts', 'selected_posts', 'no_posts')),
  ADD COLUMN IF NOT EXISTS lighting_type text DEFAULT 'none' CHECK (lighting_type IN ('none', 'spotlight', 'led_strip', 'rgb_strip', 'mixed')),
  ADD COLUMN IF NOT EXISTS lighting_posts jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS lighting_roof boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS post_layout jsonb,
  ADD COLUMN IF NOT EXISTS selected_profiles jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS spacing_cm numeric;

-- Update status check constraint to add new statuses
ALTER TABLE pergola_requests DROP CONSTRAINT IF EXISTS pergola_requests_status_check;
ALTER TABLE pergola_requests ADD CONSTRAINT pergola_requests_status_check
  CHECK (status IN ('new', 'in_review', 'needs_inspection', 'ready_for_quote', 'quoted', 'closed'));

-- Update existing 'new' rows status to conform (no-op, just safety)
UPDATE pergola_requests SET status = 'new' WHERE status NOT IN ('new', 'in_review', 'needs_inspection', 'ready_for_quote', 'quoted', 'closed');
