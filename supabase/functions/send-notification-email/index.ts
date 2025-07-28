import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  to: string;
  ticketId: string;
  ticketTitle: string;
  customerName: string;
  status: string;
  assignedTo?: string;
  type: 'status_update' | 'assignment' | 'completion';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, ticketId, ticketTitle, customerName, status, assignedTo, type }: NotificationEmailRequest = await req.json();

    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'status_update':
        subject = `Ticket Status Update - ${ticketTitle}`;
        htmlContent = `
          <h1>Ticket Status Update</h1>
          <p>Dear ${customerName},</p>
          <p>Your service ticket has been updated:</p>
          <ul>
            <li><strong>Ticket:</strong> ${ticketTitle}</li>
            <li><strong>New Status:</strong> ${status}</li>
            <li><strong>Ticket ID:</strong> ${ticketId}</li>
          </ul>
          <p>Thank you for choosing our services!</p>
        `;
        break;
      
      case 'assignment':
        subject = `Ticket Assigned - ${ticketTitle}`;
        htmlContent = `
          <h1>New Ticket Assignment</h1>
          <p>Dear Team Member,</p>
          <p>A new ticket has been assigned to you:</p>
          <ul>
            <li><strong>Ticket:</strong> ${ticketTitle}</li>
            <li><strong>Customer:</strong> ${customerName}</li>
            <li><strong>Status:</strong> ${status}</li>
            <li><strong>Ticket ID:</strong> ${ticketId}</li>
          </ul>
          <p>Please log in to the system to view the full details.</p>
        `;
        break;
      
      case 'completion':
        subject = `Service Completed - ${ticketTitle}`;
        htmlContent = `
          <h1>Service Completed</h1>
          <p>Dear ${customerName},</p>
          <p>Great news! Your service ticket has been completed:</p>
          <ul>
            <li><strong>Service:</strong> ${ticketTitle}</li>
            <li><strong>Completed by:</strong> ${assignedTo}</li>
            <li><strong>Ticket ID:</strong> ${ticketId}</li>
          </ul>
          <p>Thank you for choosing our services. We hope you're satisfied with the work!</p>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "Service Notifications <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    console.log("Notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);