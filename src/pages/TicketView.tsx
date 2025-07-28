import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, FileText, DollarSign, Camera, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: string;
  work_start_date: string;
  work_end_date: string;
  before_photos: string[];
  after_photos: string[];
  total_amount: number;
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
}

const TicketView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!id) {
      navigate('/dashboard');
      return;
    }

    fetchUserRole();
    fetchTicket();
  }, [user, id, navigate]);

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
      
      const { data, error } = await supabase
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

      setTicket(data);
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

      toast({
        title: "Success",
        description: `Ticket status updated to ${newStatus}`,
      });

      // Update local state
      setTicket(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const },
      submitted: { label: 'Submitted', variant: 'default' as const },
      additional_info_requested: { label: 'Info Requested', variant: 'outline' as const },
      approved_not_paid: { label: 'Approved (Unpaid)', variant: 'default' as const },
      approved_paid: { label: 'Approved (Paid)', variant: 'default' as const },
      declined: { label: 'Declined', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage
      .from('ticket-photos')
      .getPublicUrl(path);
    return data.publicUrl;
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
            {getStatusBadge(ticket.status)}
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
                            className="rounded-lg object-cover aspect-square border"
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
                            className="rounded-lg object-cover aspect-square border"
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
    </div>
  );
};

export default TicketView;