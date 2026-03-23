
-- Re-create INSERT policy for site-media bucket (was dropped by the blanket DROP)
CREATE POLICY "site_media_insert_admin"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-media' AND (SELECT public.has_role(auth.uid(), 'admin')));
