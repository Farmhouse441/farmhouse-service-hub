-- Add admin policy to allow admins to view all service tickets
CREATE POLICY "Admins can view all tickets" 
ON public.service_tickets 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to allow admins to update all service tickets
CREATE POLICY "Admins can update all tickets" 
ON public.service_tickets 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to allow admins to view all line items
CREATE POLICY "Admins can view all line items" 
ON public.line_items 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to allow admins to update all line items
CREATE POLICY "Admins can update all line items" 
ON public.line_items 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));