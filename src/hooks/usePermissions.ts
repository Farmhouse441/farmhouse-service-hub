import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPermissions {
  // CRUD permissions
  canCreateServiceTicket: boolean;
  canViewOwnTickets: boolean;
  canViewAllTickets: boolean;
  canEditOwnTickets: boolean;
  canEditAllTickets: boolean;
  
  // Status change permissions
  canChangeToStatus: (status: string) => boolean;
  canChangeFromStatus: (status: string) => boolean;
  canDeleteInStatus: (status: string) => boolean;
  
  // Combined permission checks
  canEditTicket: (ticket: { user_id: string; status: string }) => boolean;
  canDeleteTicket: (ticket: { user_id: string; status: string }) => boolean;
  canChangeTicketStatus: (ticket: { user_id: string; status: string }, newStatus: string) => boolean;
}

export const usePermissions = (): UserPermissions & { loading: boolean } => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch user's role first
        const { data: userRoleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        let roleData = userRoleData;
        if (roleError) {
          console.error('Error fetching user role:', roleError);
          // Default to 'user' role if no role is assigned
          console.log('No role found for user, defaulting to "user" role');
          roleData = { role: 'user' };
        }

        // Then fetch role permissions
        const { data: rolePermissionsData, error: permissionsError } = await supabase
          .from('role_permissions')
          .select('*')
          .eq('role', roleData.role)
          .single();

        if (permissionsError) {
          console.error('Error fetching permissions:', permissionsError);
          setPermissions(null);
          setLoading(false);
          return;
        }

        const rolePermissions = rolePermissionsData;
        
        const userPermissions: UserPermissions = {
          // CRUD permissions
          canCreateServiceTicket: rolePermissions.can_create_service_ticket,
          canViewOwnTickets: rolePermissions.can_view_own_tickets,
          canViewAllTickets: rolePermissions.can_view_all_tickets,
          canEditOwnTickets: rolePermissions.can_edit_own_tickets,
          canEditAllTickets: rolePermissions.can_edit_all_tickets,
          
          // Status change permission checkers
          canChangeToStatus: (status: string) => {
            const key = `can_change_to_${status}` as keyof typeof rolePermissions;
            return Boolean(rolePermissions[key]);
          },
          
          canChangeFromStatus: (status: string) => {
            const key = `can_change_from_${status}` as keyof typeof rolePermissions;
            return Boolean(rolePermissions[key]);
          },
          
          canDeleteInStatus: (status: string) => {
            const key = `can_delete_${status}` as keyof typeof rolePermissions;
            return Boolean(rolePermissions[key]);
          },
          
          // Combined permission checks
          canEditTicket: (ticket: { user_id: string; status: string }) => {
            const isOwner = ticket.user_id === user.id;
            const canEditOwn = Boolean(rolePermissions.can_edit_own_tickets);
            const canEditAll = Boolean(rolePermissions.can_edit_all_tickets);
            

            
            // Users can edit their own tickets only if they're in draft status
            if (isOwner) {
              return canEditOwn && ticket.status === 'draft';
            }
            
            // Admins can edit any ticket regardless of status
            return canEditAll;
          },
          
          canDeleteTicket: (ticket: { user_id: string; status: string }) => {
            const isOwner = ticket.user_id === user.id;
            const key = `can_delete_${ticket.status}` as keyof typeof rolePermissions;
            const canDeleteInStatus = Boolean(rolePermissions[key]);
            
            // Users can delete their own tickets only if they're in draft status
            if (isOwner) {
              return canDeleteInStatus && ticket.status === 'draft';
            }
            
            // Admins can delete tickets based on status permissions
            return canDeleteInStatus;
          },
          
          canChangeTicketStatus: (ticket: { user_id: string; status: string }, newStatus: string) => {
            const canChangeFromKey = `can_change_from_${ticket.status}` as keyof typeof rolePermissions;
            const canChangeToKey = `can_change_to_${newStatus}` as keyof typeof rolePermissions;
            const canChangeFrom = Boolean(rolePermissions[canChangeFromKey]);
            const canChangeTo = Boolean(rolePermissions[canChangeToKey]);
            return canChangeFrom && canChangeTo;
          }
        };

        setPermissions(userPermissions);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  // Return default permissions if not loaded yet
  const defaultPermissions: UserPermissions = {
    canCreateServiceTicket: false,
    canViewOwnTickets: false,
    canViewAllTickets: false,
    canEditOwnTickets: false,
    canEditAllTickets: false,
    canChangeToStatus: () => false,
    canChangeFromStatus: () => false,
    canDeleteInStatus: () => false,
    canEditTicket: () => false,
    canDeleteTicket: () => false,
    canChangeTicketStatus: () => false,
  };

  return {
    ...(permissions || defaultPermissions),
    loading
  };
};