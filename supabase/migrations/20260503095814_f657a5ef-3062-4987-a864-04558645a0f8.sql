
CREATE POLICY "Authenticated users can upload images to their company folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can update images in their company folder"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can delete images in their company folder"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can upload to videos company folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text FROM public.profiles WHERE id = auth.uid()
  )
);
