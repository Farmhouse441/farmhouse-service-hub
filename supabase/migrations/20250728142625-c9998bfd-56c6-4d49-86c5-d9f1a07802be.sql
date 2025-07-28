-- Create enum for service ticket status
CREATE TYPE public.ticket_status AS ENUM (
  'draft',
  'submitted', 
  'additional_info_requested',
  'approved_not_paid',
  'approved_paid',
  'declined'
);

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service tickets table
CREATE TABLE public.service_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_address TEXT NOT NULL,
  work_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  work_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status ticket_status NOT NULL DEFAULT 'draft',
  before_photos TEXT[] DEFAULT '{}',
  after_photos TEXT[] DEFAULT '{}',
  invoice_file TEXT,
  admin_notes TEXT,
  total_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create line items table
CREATE TABLE public.line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  hours DECIMAL(5,2) NOT NULL CHECK (hours > 0),
  hourly_rate DECIMAL(10,2) NOT NULL CHECK (hourly_rate > 0),
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (hours * hourly_rate) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for service tickets
CREATE POLICY "Users can view their own tickets"
ON public.service_tickets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
ON public.service_tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
ON public.service_tickets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tickets"
ON public.service_tickets
FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for line items
CREATE POLICY "Users can view line items for their tickets"
ON public.line_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.service_tickets 
    WHERE id = line_items.ticket_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create line items for their tickets"
ON public.line_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_tickets 
    WHERE id = line_items.ticket_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update line items for their tickets"
ON public.line_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.service_tickets 
    WHERE id = line_items.ticket_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete line items for their tickets"
ON public.line_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.service_tickets 
    WHERE id = line_items.ticket_id 
    AND user_id = auth.uid()
  )
);

-- Create storage buckets for photos and invoices
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('ticket-photos', 'ticket-photos', false),
  ('invoices', 'invoices', false);

-- Create storage policies for ticket photos
CREATE POLICY "Users can view their own ticket photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'ticket-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own ticket photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own ticket photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'ticket-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own ticket photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ticket-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for invoices
CREATE POLICY "Users can view their own invoices"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own invoices"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own invoices"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own invoices"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_tickets_updated_at
  BEFORE UPDATE ON public.service_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    new.email
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();