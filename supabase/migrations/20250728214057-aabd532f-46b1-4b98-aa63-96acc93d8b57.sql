-- Add invoice number and hourly rate fields to service tickets
ALTER TABLE public.service_tickets 
ADD COLUMN invoice_number text,
ADD COLUMN hourly_rate numeric DEFAULT 0;