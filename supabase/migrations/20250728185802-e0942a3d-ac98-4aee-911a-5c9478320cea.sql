-- Create storage policies for the ticket-photos bucket
-- Allow authenticated users to upload photos to their own folders

-- Policy for uploading photos
CREATE POLICY "Users can upload ticket photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'ticket-photos' 
  AND auth.uid()::text IS NOT NULL
);

-- Policy for viewing photos (users can view their own uploaded photos)
CREATE POLICY "Users can view ticket photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'ticket-photos' 
  AND auth.uid()::text IS NOT NULL
);

-- Policy for updating photos
CREATE POLICY "Users can update ticket photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'ticket-photos' 
  AND auth.uid()::text IS NOT NULL
);

-- Policy for deleting photos
CREATE POLICY "Users can delete ticket photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'ticket-photos' 
  AND auth.uid()::text IS NOT NULL
);