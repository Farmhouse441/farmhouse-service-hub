-- Make the ticket-photos bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'ticket-photos';

-- Create storage policies for ticket photos
CREATE POLICY "Allow authenticated users to view ticket photos" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'ticket-photos');

CREATE POLICY "Allow authenticated users to upload ticket photos" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'ticket-photos');

CREATE POLICY "Allow users to update their own ticket photos" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'ticket-photos');

CREATE POLICY "Allow users to delete their own ticket photos" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'ticket-photos');