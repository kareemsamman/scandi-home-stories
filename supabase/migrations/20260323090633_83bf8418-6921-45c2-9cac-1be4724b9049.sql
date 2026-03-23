
-- Drop any existing INSERT policies on receipts bucket
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname ILIKE '%insert%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END$$;

-- Block all direct INSERT from client SDK on receipts bucket
-- Service role bypasses RLS, so edge functions still work
CREATE POLICY "block_anon_receipt_insert"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id <> 'receipts');

CREATE POLICY "block_auth_receipt_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id <> 'receipts' OR (SELECT public.has_role(auth.uid(), 'admin')));
