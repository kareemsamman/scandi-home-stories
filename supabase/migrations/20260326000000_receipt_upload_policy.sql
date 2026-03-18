-- Allow anyone (including guests) to upload files under receipts/ in site-media
-- Drop if exists to allow re-running
DROP POLICY IF EXISTS "Public receipt upload" ON storage.objects;

CREATE POLICY "Public receipt upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'site-media'
    AND name LIKE 'receipts/%'
  );
