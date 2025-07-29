import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Download, Edit, Send, Calendar, DollarSign, User, Building, FileText, Camera, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTickets } from '@/hooks/useTickets';
import { format } from 'date-fns';
import { usePDFReport } from '@/hooks/usePDFReport';
import { Lightbox } from '@/components/ui/lightbox';

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'submitted' | 'additional_info_requested' | 'approved_not_paid' | 'approved_paid' | 'declined';
  work_start_date: string;
  work_end_date: string;
  before_photos: string[];
  after_photos: string[];
  total_amount: number;
  hourly_rate: number;
  invoice_number: string;
  invoice_file: string;
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

const TicketView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canEditTicket, canDeleteTicket, loading: permissionsLoading } = usePermissions();
  const { toast } = useToast();
  const { deleteTicket, loading: deleteLoading } = useTickets();
  const { generatePDF } = usePDFReport();
  
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!id) {
      navigate('/dashboard');
      return;
    }

    if (user) {
      fetchUserRole();
    }
  }, [user, id, navigate]);

  // Fetch ticket when permissions are loaded
  useEffect(() => {
    if (!permissionsLoading && user && id) {
      fetchTicket();
    }
  }, [permissionsLoading, user, id]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user role:', error);
        return;
      }
      
      setUserRole(data?.role || 'user');
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchTicket = async () => {
    try {
      setLoading(true);
      
      const { data: ticketData, error } = await supabase
        .from('service_tickets')
        .select(`
          *,
          line_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching ticket:', error);
        toast({
          title: "Error",
          description: "Failed to load ticket details",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      // Fetch profile data separately
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, company_name')
        .eq('user_id', ticketData.user_id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Combine the data
      const combinedData = {
        ...ticketData,
        profiles: profileData || {
          first_name: '',
          last_name: '',
          email: '',
          company_name: ''
        }
      };

      setTicket(combinedData);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (newStatus: 'draft' | 'submitted' | 'additional_info_requested' | 'approved_not_paid' | 'approved_paid' | 'declined') => {
    if (!ticket) return;
    
    try {
      const { error } = await supabase
        .from('service_tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id);

      if (error) {
        console.error('Error updating ticket status:', error);
        toast({
          title: "Error",
          description: "Failed to update ticket status",
          variant: "destructive",
        });
        return;
      }

      const statusLabels = {
        draft: 'Draft',
        submitted: 'Submitted',
        additional_info_requested: 'Additional Info Requested',
        approved_not_paid: 'Approved (Unpaid)',
        approved_paid: 'Approved (Paid)',
        declined: 'Declined'
      };

      toast({
        title: "Success",
        description: `Ticket status updated to ${statusLabels[newStatus]}`,
      });

      // Update local state
      setTicket(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleSubmitTicket = async () => {
    await updateTicketStatus('submitted');
  };

  const handleEditTicket = () => {
    // Navigate to edit mode - we'll reuse the ticket creation form but in edit mode
    navigate(`/edit-ticket/${ticket.id}`);
  };

  const handleDownloadPDF = async () => {
    if (!ticket) return;
    
    try {
      await generatePDF(ticket);
      toast({
        title: "Success",
        description: "PDF report downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticket) return;
    
    const success = await deleteTicket(ticket.id, {
      before_photos: ticket.before_photos || [],
      after_photos: ticket.after_photos || [],
      invoice_file: ticket.invoice_file,
      status: ticket.status
    });

    if (success) {
      navigate('/dashboard');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 border-gray-300' },
      submitted: { label: 'Submitted', variant: 'outline' as const, className: 'bg-blue-50 text-blue-700 border-blue-300' },
      additional_info_requested: { label: 'Info Requested', variant: 'outline' as const, className: 'bg-orange-50 text-orange-700 border-orange-300' },
      approved_not_paid: { label: 'Approved (Unpaid)', variant: 'outline' as const, className: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
      approved_paid: { label: 'Approved (Paid)', variant: 'outline' as const, className: 'bg-green-50 text-green-700 border-green-300' },
      declined: { label: 'Declined', variant: 'destructive' as const, className: 'bg-red-50 text-red-700 border-red-300' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage
      .from('ticket-photos')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const openLightbox = (images: string[], startIndex: number) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading ticket details...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Ticket not found</h2>
          <p className="text-muted-foreground mb-4">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = userRole === 'admin';
  const lineItemsTotal = ticket.line_items?.reduce((sum, item) => sum + Number(item.total_amount || 0), 0) || 0;
  const canEdit = canEditTicket(ticket);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{ticket.title}</h1>
              <p className="text-muted-foreground">Service Ticket Details</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              
              {/* Submit button - for draft and info requested tickets owned by user */}
              {(ticket.user_id === user?.id && (ticket.status === 'draft' || ticket.status === 'additional_info_requested')) && (
                <Button onClick={handleSubmitTicket} className="gap-2">
                  <Send className="h-4 w-4" />
                  Submit Ticket
                </Button>
              )}
              
              {/* Edit button */}
              {canEdit && (
                <Button variant="outline" onClick={handleEditTicket} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Ticket
                </Button>
              )}
              

              
              {/* Delete button */}
              {canDeleteTicket(ticket) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      disabled={deleteLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{ticket.title}"? 
                        This action cannot be undone and will permanently remove the ticket and all associated files.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteTicket}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              {getStatusBadge(ticket.status)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ticket Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Title</label>
                  <p className="text-lg font-medium">{ticket.title}</p>
                </div>
                
                {ticket.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-base">{ticket.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Work Start Date</label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(ticket.work_start_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Work End Date</label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(ticket.work_end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {ticket.admin_notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Admin Notes</label>
                    <p className="text-base p-3 bg-muted rounded-lg">{ticket.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Line Items */}
            {ticket.line_items && ticket.line_items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Line Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ticket.line_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.hours} hours × ${Number(item.hourly_rate).toFixed(2)}/hour
                          </p>
                        </div>
                        <div className="text-lg font-bold">
                          ${Number(item.total_amount).toFixed(2)}
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span>${lineItemsTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Information */}
            {(ticket.hourly_rate > 0 || ticket.total_amount > 0 || ticket.invoice_number || ticket.invoice_file) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ticket.hourly_rate > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Hourly Rate</label>
                      <p className="text-lg font-semibold">${Number(ticket.hourly_rate).toFixed(2)}/hour</p>
                    </div>
                  )}
                  
                  {ticket.total_amount > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Amount Charged</label>
                      <p className="text-2xl font-bold text-primary">${Number(ticket.total_amount).toFixed(2)}</p>
                    </div>
                  )}
                  
                  {ticket.invoice_number && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                      <p className="font-mono">{ticket.invoice_number}</p>
                    </div>
                  )}
                  
                  {ticket.invoice_file && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Invoice File</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const { data } = supabase.storage.from('invoices').getPublicUrl(ticket.invoice_file);
                          window.open(data.publicUrl, '_blank');
                        }}
                        className="mt-2"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Invoice
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Photos */}
            {(ticket.before_photos?.length > 0 || ticket.after_photos?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Photos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {ticket.before_photos?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Before Photos</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {ticket.before_photos.map((photo, index) => (
                          <img
                            key={index}
                            src={getImageUrl(photo)}
                            alt={`Before photo ${index + 1}`}
                            className="rounded-lg object-cover aspect-square border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openLightbox(ticket.before_photos.map(getImageUrl), index)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {ticket.after_photos?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">After Photos</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {ticket.after_photos.map((photo, index) => (
                          <img
                            key={index}
                            src={getImageUrl(photo)}
                            alt={`After photo ${index + 1}`}
                            className="rounded-lg object-cover aspect-square border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openLightbox(ticket.after_photos.map(getImageUrl), index)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management - Only visible to admins */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Status Management</CardTitle>
                  <CardDescription>Update the ticket status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Current Status</label>
                      <div className="mt-2">
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Change Status</label>
                      <Select
                        value={ticket.status}
                        onValueChange={updateTicketStatus}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="additional_info_requested">Info Requested</SelectItem>
                          <SelectItem value="approved_not_paid">Approved (Unpaid)</SelectItem>
                          <SelectItem value="approved_paid">Approved (Paid)</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ticket Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ticket ID</label>
                  <p className="font-mono text-sm">{ticket.id}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p>{format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p>{format(new Date(ticket.updated_at), 'MMM d, yyyy h:mm a')}</p>
                </div>

                {ticket.total_amount && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                    <p className="text-lg font-bold">${Number(ticket.total_amount).toFixed(2)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Lightbox */}
      <Lightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default TicketView;