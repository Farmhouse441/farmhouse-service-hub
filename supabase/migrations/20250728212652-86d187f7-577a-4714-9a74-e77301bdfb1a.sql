-- Create role permissions table to centralize all permissions
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role app_role NOT NULL UNIQUE,
  -- CRUD permissions
  can_create_service_ticket BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_own_tickets BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_all_tickets BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit_own_tickets BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit_all_tickets BOOLEAN NOT NULL DEFAULT FALSE,
  -- Status transition permissions (from any status to specific status)
  can_change_to_draft BOOLEAN NOT NULL DEFAULT FALSE,
  can_change_to_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  can_change_to_additional_info_requested BOOLEAN NOT NULL DEFAULT FALSE,
  can_change_to_approved_not_paid BOOLEAN NOT NULL DEFAULT FALSE,
  can_change_to_approved_paid BOOLEAN NOT NULL DEFAULT FALSE,
  can_change_to_declined BOOLEAN NOT NULL DEFAULT FALSE,
  -- Status transition permissions (from specific status to any status)
  can_change_from_draft BOOLEAN NOT NULL DEFAULT FALSE,
  can_change_from_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  can_change_from_additional_info_requested BOOLEAN NOT NULL DEFAULT FALSE,
  can_change_from_approved_not_paid BOOLEAN NOT NULL DEFAULT FALSE,
  can_change_from_approved_paid BOOLEAN NOT NULL DEFAULT FALSE,
  can_change_from_declined BOOLEAN NOT NULL DEFAULT FALSE,
  -- Delete permissions by status
  can_delete_draft BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete_additional_info_requested BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete_approved_not_paid BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete_approved_paid BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete_declined BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for role_permissions table
CREATE POLICY "Anyone can view role permissions" 
ON public.role_permissions 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify role permissions" 
ON public.role_permissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default permissions for admin role
INSERT INTO public.role_permissions (
  role,
  can_create_service_ticket,
  can_view_own_tickets,
  can_view_all_tickets,
  can_edit_own_tickets,
  can_edit_all_tickets,
  can_change_to_draft,
  can_change_to_submitted,
  can_change_to_additional_info_requested,
  can_change_to_approved_not_paid,
  can_change_to_approved_paid,
  can_change_to_declined,
  can_change_from_draft,
  can_change_from_submitted,
  can_change_from_additional_info_requested,
  can_change_from_approved_not_paid,
  can_change_from_approved_paid,
  can_change_from_declined,
  can_delete_draft,
  can_delete_submitted,
  can_delete_additional_info_requested,
  can_delete_approved_not_paid,
  can_delete_approved_paid,
  can_delete_declined
) VALUES (
  'admin',
  TRUE, TRUE, TRUE, TRUE, TRUE, -- CRUD permissions
  TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, -- Change to permissions
  TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, -- Change from permissions
  TRUE, TRUE, TRUE, TRUE, TRUE, TRUE  -- Delete permissions
);

-- Insert default permissions for user role
INSERT INTO public.role_permissions (
  role,
  can_create_service_ticket,
  can_view_own_tickets,
  can_view_all_tickets,
  can_edit_own_tickets,
  can_edit_all_tickets,
  can_change_to_draft,
  can_change_to_submitted,
  can_change_to_additional_info_requested,
  can_change_to_approved_not_paid,
  can_change_to_approved_paid,
  can_change_to_declined,
  can_change_from_draft,
  can_change_from_submitted,
  can_change_from_additional_info_requested,
  can_change_from_approved_not_paid,
  can_change_from_approved_paid,
  can_change_from_declined,
  can_delete_draft,
  can_delete_submitted,
  can_delete_additional_info_requested,
  can_delete_approved_not_paid,
  can_delete_approved_paid,
  can_delete_declined
) VALUES (
  'user',
  TRUE, TRUE, FALSE, TRUE, FALSE, -- CRUD permissions
  TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, -- Change to permissions
  TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, -- Change from permissions
  TRUE, TRUE, FALSE, FALSE, FALSE, FALSE  -- Delete permissions
);

-- Create comprehensive permission checking functions
CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN _permission = 'can_create_service_ticket' THEN rp.can_create_service_ticket
    WHEN _permission = 'can_view_own_tickets' THEN rp.can_view_own_tickets
    WHEN _permission = 'can_view_all_tickets' THEN rp.can_view_all_tickets
    WHEN _permission = 'can_edit_own_tickets' THEN rp.can_edit_own_tickets
    WHEN _permission = 'can_edit_all_tickets' THEN rp.can_edit_all_tickets
    WHEN _permission = 'can_change_to_draft' THEN rp.can_change_to_draft
    WHEN _permission = 'can_change_to_submitted' THEN rp.can_change_to_submitted
    WHEN _permission = 'can_change_to_additional_info_requested' THEN rp.can_change_to_additional_info_requested
    WHEN _permission = 'can_change_to_approved_not_paid' THEN rp.can_change_to_approved_not_paid
    WHEN _permission = 'can_change_to_approved_paid' THEN rp.can_change_to_approved_paid
    WHEN _permission = 'can_change_to_declined' THEN rp.can_change_to_declined
    WHEN _permission = 'can_change_from_draft' THEN rp.can_change_from_draft
    WHEN _permission = 'can_change_from_submitted' THEN rp.can_change_from_submitted
    WHEN _permission = 'can_change_from_additional_info_requested' THEN rp.can_change_from_additional_info_requested
    WHEN _permission = 'can_change_from_approved_not_paid' THEN rp.can_change_from_approved_not_paid
    WHEN _permission = 'can_change_from_approved_paid' THEN rp.can_change_from_approved_paid
    WHEN _permission = 'can_change_from_declined' THEN rp.can_change_from_declined
    WHEN _permission = 'can_delete_draft' THEN rp.can_delete_draft
    WHEN _permission = 'can_delete_submitted' THEN rp.can_delete_submitted
    WHEN _permission = 'can_delete_additional_info_requested' THEN rp.can_delete_additional_info_requested
    WHEN _permission = 'can_delete_approved_not_paid' THEN rp.can_delete_approved_not_paid
    WHEN _permission = 'can_delete_approved_paid' THEN rp.can_delete_approved_paid
    WHEN _permission = 'can_delete_declined' THEN rp.can_delete_declined
    ELSE FALSE
  END
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role = rp.role
  WHERE ur.user_id = _user_id
  LIMIT 1;
$$;

-- Function to check if user can change ticket status
CREATE OR REPLACE FUNCTION public.user_can_change_ticket_status(_user_id uuid, _from_status ticket_status, _to_status ticket_status)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    public.user_has_permission(_user_id, 'can_change_from_' || _from_status::text) AND
    public.user_has_permission(_user_id, 'can_change_to_' || _to_status::text)
  );
$$;

-- Function to check if user can delete ticket by status
CREATE OR REPLACE FUNCTION public.user_can_delete_ticket_by_status(_user_id uuid, _status ticket_status)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.user_has_permission(_user_id, 'can_delete_' || _status::text);
$$;

-- Add trigger for updating timestamps
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();