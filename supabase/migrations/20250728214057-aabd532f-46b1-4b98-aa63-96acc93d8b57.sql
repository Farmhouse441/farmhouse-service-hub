-- Add invoice number and hourly rate fields to service tickets
ALTER TABLE public.service_tickets 
ADD COLUMN invoice_number text,
ADD COLUMN hourly_rate numeric DEFAULT 0;

-- Update RLS policies for service_tickets to support role-based delete permissions

-- Drop the existing delete policy
DROP POLICY IF EXISTS "Users can delete their own tickets" ON public.service_tickets;

-- Create new delete policy that respects role-based permissions
CREATE POLICY "Users can delete tickets based on role permissions"
ON public.service_tickets
FOR DELETE
USING (
  -- Check if user has permission to delete tickets in this status
  public.user_can_delete_ticket_by_status(auth.uid(), status)
);

-- Also update the update policy to be more restrictive
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.service_tickets;

-- Create new update policy that respects role-based permissions
CREATE POLICY "Users can update tickets based on role permissions"
ON public.service_tickets
FOR UPDATE
USING (
  -- Users can edit their own tickets if they have permission
  (user_id = auth.uid() AND public.user_has_permission(auth.uid(), 'can_edit_own_tickets')) OR
  -- Admins can edit all tickets if they have permission
  (public.user_has_permission(auth.uid(), 'can_edit_all_tickets'))
);