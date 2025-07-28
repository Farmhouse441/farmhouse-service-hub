import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TicketData {
  title: string;
  description?: string;
  work_start_date: string;
  work_end_date: string;
  before_photos?: File[];
  after_photos?: File[];
  hourly_rate?: number;
  total_amount?: number;
  invoice_number?: string;
  invoice_file?: File | null;
  status?: 'draft' | 'submitted';
}

export const useTickets = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadPhotos = async (photos: File[], folder: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-photos')
        .upload(filePath, photo);

      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        throw new Error(`Failed to upload photo: ${photo.name}`);
      }

      uploadedUrls.push(filePath);
    }

    return uploadedUrls;
  };

  const uploadInvoiceFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `invoices/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading invoice:', uploadError);
      throw new Error(`Failed to upload invoice: ${file.name}`);
    }

    return filePath;
  };

  const createTicket = async (ticketData: TicketData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a ticket",
        variant: "destructive"
      });
      return null;
    }

    try {
      setLoading(true);

      // Upload photos if provided
      let beforePhotoUrls: string[] = [];
      let afterPhotoUrls: string[] = [];
      let invoiceFilePath: string | null = null;

      if (ticketData.before_photos && ticketData.before_photos.length > 0) {
        beforePhotoUrls = await uploadPhotos(ticketData.before_photos, 'before');
      }

      if (ticketData.after_photos && ticketData.after_photos.length > 0) {
        afterPhotoUrls = await uploadPhotos(ticketData.after_photos, 'after');
      }

      if (ticketData.invoice_file) {
        invoiceFilePath = await uploadInvoiceFile(ticketData.invoice_file);
      }

      // Create ticket record
      const { data, error } = await supabase
        .from('service_tickets')
        .insert({
          user_id: user.id,
          title: ticketData.title,
          description: ticketData.description,
          work_start_date: ticketData.work_start_date,
          work_end_date: ticketData.work_end_date,
          before_photos: beforePhotoUrls,
          after_photos: afterPhotoUrls,
          hourly_rate: ticketData.hourly_rate || 0,
          total_amount: ticketData.total_amount || 0,
          invoice_number: ticketData.invoice_number || null,
          invoice_file: invoiceFilePath,
          status: ticketData.status || 'draft'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Service ticket created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteTicket = async (ticketId: string, ticketData: { 
    before_photos?: string[], 
    after_photos?: string[], 
    invoice_file?: string | null,
    status: 'draft' | 'submitted' | 'additional_info_requested' | 'approved_not_paid' | 'approved_paid' | 'declined'
  }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete a ticket",
        variant: "destructive"
      });
      return false;
    }

    try {
      setLoading(true);

      // Check if user has permission to delete this ticket based on status
      const { data: canDelete, error: permissionError } = await supabase
        .rpc('user_can_delete_ticket_by_status', {
          _user_id: user.id,
          _status: ticketData.status
        });

      if (permissionError) {
        console.error('Error checking delete permission:', permissionError);
        toast({
          title: "Error",
          description: "Failed to verify delete permissions",
          variant: "destructive"
        });
        return false;
      }

      if (!canDelete) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to delete tickets in this status",
          variant: "destructive"
        });
        return false;
      }

      // Delete associated files from storage
      const filesToDelete: string[] = [];

      // Add photos to delete list
      if (ticketData.before_photos) {
        filesToDelete.push(...ticketData.before_photos);
      }
      if (ticketData.after_photos) {
        filesToDelete.push(...ticketData.after_photos);
      }

      // Delete photos from storage
      if (filesToDelete.length > 0) {
        const { error: photoDeleteError } = await supabase.storage
          .from('ticket-photos')
          .remove(filesToDelete);

        if (photoDeleteError) {
          console.error('Error deleting photos:', photoDeleteError);
          // Continue with ticket deletion even if photo deletion fails
        }
      }

      // Delete invoice file if it exists
      if (ticketData.invoice_file) {
        const { error: invoiceDeleteError } = await supabase.storage
          .from('invoices')
          .remove([ticketData.invoice_file]);

        if (invoiceDeleteError) {
          console.error('Error deleting invoice:', invoiceDeleteError);
          // Continue with ticket deletion even if invoice deletion fails
        }
      }

      // Delete the ticket (this will cascade delete line items due to foreign key constraints)
      const { error: ticketDeleteError } = await supabase
        .from('service_tickets')
        .delete()
        .eq('id', ticketId);

      if (ticketDeleteError) {
        console.error('Error deleting ticket:', ticketDeleteError);
        toast({
          title: "Error",
          description: "Failed to delete ticket. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      });

      return true;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast({
        title: "Error",
        description: "Failed to delete ticket. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createTicket,
    deleteTicket,
    loading
  };
};