
CREATE POLICY "Allow anyone to upload receipts"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Allow anyone to update receipts"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'receipts')
WITH CHECK (bucket_id = 'receipts');
