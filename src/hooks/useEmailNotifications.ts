import { supabase } from "@/integrations/supabase/client";

export interface EmailNotificationData {
  to: string;
  ticketId: string;
  ticketTitle: string;
  customerName: string;
  status: string;
  assignedTo?: string;
  type: 'status_update' | 'assignment' | 'completion';
}

export const useEmailNotifications = () => {
  const sendNotificationEmail = async (data: EmailNotificationData) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-notification-email', {
        body: data
      });

      if (error) {
        console.error('Error sending notification email:', error);
        throw error;
      }

      return result;
    } catch (error) {
      console.error('Failed to send notification email:', error);
      throw error;
    }
  };

  return {
    sendNotificationEmail
  };
};