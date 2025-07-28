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

  return {
    createTicket,
    loading
  };
};