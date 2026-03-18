CREATE POLICY "Public receipt update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-media' AND name LIKE 'receipts/%')
WITH CHECK (bucket_id = 'site-media' AND name LIKE 'receipts/%');