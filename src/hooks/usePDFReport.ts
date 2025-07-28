import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: string;
  work_start_date: string;
  work_end_date: string;
  total_amount: number;
  before_photos: string[];
  after_photos: string[];
  admin_notes: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  line_items: Array<{
    id: string;
    description: string;
    hours: number;
    hourly_rate: number;
    total_amount: number;
  }>;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    company_name: string;
  };
}

export const usePDFReport = () => {
  const generatePDF = async (ticket: TicketData) => {
    const pdf = new jsPDF();
    let yPosition = 20;
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const maxWidth = pageWidth - (margin * 2);

    // Helper function to add text with word wrap
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight = 7) => {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        yPosition = margin;
      }
    };

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Service Ticket Report', margin, yPosition);
    yPosition += 15;

    // Ticket Information
    pdf.setFontSize(16);
    pdf.text('Ticket Information', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const ticketInfo = [
      `Ticket ID: ${ticket.id}`,
      `Title: ${ticket.title}`,
      `Status: ${ticket.status.toUpperCase()}`,
      `Customer: ${ticket.profiles.first_name} ${ticket.profiles.last_name}`,
      `Email: ${ticket.profiles.email}`,
      `Company: ${ticket.profiles.company_name || 'N/A'}`,
      `Work Start Date: ${new Date(ticket.work_start_date).toLocaleDateString()}`,
      `Work End Date: ${new Date(ticket.work_end_date).toLocaleDateString()}`,
      `Total Amount: $${ticket.total_amount?.toFixed(2) || '0.00'}`,
      `Created: ${new Date(ticket.created_at).toLocaleDateString()}`,
      `Last Updated: ${new Date(ticket.updated_at).toLocaleDateString()}`
    ];

    for (const info of ticketInfo) {
      checkNewPage(10);
      pdf.text(info, margin, yPosition);
      yPosition += 7;
    }

    yPosition += 10;

    // Description
    if (ticket.description) {
      checkNewPage(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description:', margin, yPosition);
      yPosition += 7;
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(ticket.description, margin, yPosition, maxWidth);
      yPosition += 10;
    }

    // Line Items
    if (ticket.line_items && ticket.line_items.length > 0) {
      checkNewPage(30);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Line Items:', margin, yPosition);
      yPosition += 10;

      ticket.line_items.forEach((item, index) => {
        checkNewPage(20);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${index + 1}. ${item.description}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`   Hours: ${item.hours} | Rate: $${item.hourly_rate}/hr | Total: $${item.total_amount.toFixed(2)}`, margin, yPosition);
        yPosition += 10;
      });
    }

    // Admin Notes
    if (ticket.admin_notes) {
      checkNewPage(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Admin Notes:', margin, yPosition);
      yPosition += 7;
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(ticket.admin_notes, margin, yPosition, maxWidth);
      yPosition += 10;
    }

    // Photos section
    const allPhotos = [...(ticket.before_photos || []), ...(ticket.after_photos || [])];
    if (allPhotos.length > 0) {
      checkNewPage(30);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Photos:', margin, yPosition);
      yPosition += 10;

      for (let i = 0; i < allPhotos.length; i++) {
        const photoPath = allPhotos[i];
        const isBeforePhoto = i < (ticket.before_photos?.length || 0);
        
        try {
          checkNewPage(60);
          
          // Get the photo URL
          const { data } = supabase.storage
            .from('ticket-photos')
            .getPublicUrl(photoPath);

          if (data?.publicUrl) {
            // Create an image element to load the photo
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = () => {
                try {
                  // Calculate image dimensions to fit within page
                  const maxImageWidth = maxWidth;
                  const maxImageHeight = 80;
                  
                  let imgWidth = img.width;
                  let imgHeight = img.height;
                  
                  // Scale down if necessary
                  const widthRatio = maxImageWidth / imgWidth;
                  const heightRatio = maxImageHeight / imgHeight;
                  const ratio = Math.min(widthRatio, heightRatio, 1);
                  
                  imgWidth *= ratio;
                  imgHeight *= ratio;
                  
                  // Add photo to PDF
                  pdf.text(`${isBeforePhoto ? 'Before' : 'After'} Photo ${isBeforePhoto ? i + 1 : i - (ticket.before_photos?.length || 0) + 1}:`, margin, yPosition);
                  yPosition += 7;
                  
                  pdf.addImage(img, 'JPEG', margin, yPosition, imgWidth, imgHeight);
                  yPosition += imgHeight + 10;
                  
                  resolve(void 0);
                } catch (error) {
                  console.error('Error adding image to PDF:', error);
                  resolve(void 0);
                }
              };
              
              img.onerror = () => {
                console.error('Error loading image:', photoPath);
                resolve(void 0);
              };
              
              img.src = data.publicUrl;
            });
          }
        } catch (error) {
          console.error('Error processing photo:', error);
          // Add a note that the photo couldn't be loaded
          pdf.text(`${isBeforePhoto ? 'Before' : 'After'} Photo ${isBeforePhoto ? i + 1 : i - (ticket.before_photos?.length || 0) + 1}: [Image could not be loaded]`, margin, yPosition);
          yPosition += 10;
        }
      }
    }

    // Generate filename
    const filename = `service-ticket-${ticket.id}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save the PDF
    pdf.save(filename);
  };

  return { generatePDF };
};