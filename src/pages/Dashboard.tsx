import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Clock, CheckCircle, XCircle, Search, Settings, Users, Eye, Edit, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tickets, setTickets] = useState([]);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    declined: 0,
    info_requested: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      fetchUserRole();
      fetchTickets();
    }
  }, [user, navigate]);

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

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      // Build query based on user role
      let query = supabase
        .from('service_tickets')
        .select(`
          *,
          line_items(*)
        `)
        .order('created_at', { ascending: false });

      // Non-admin users only see their own tickets
      if (userRole !== 'admin') {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tickets:', error);
        toast({
          title: "Error",
          description: "Failed to load tickets",
          variant: "destructive",
        });
        return;
      }

      setTickets(data || []);
      
      // Calculate stats
      const ticketStats = {
        total: data?.length || 0,
        draft: data?.filter(t => t.status === 'draft').length || 0,
        submitted: data?.filter(t => t.status === 'submitted').length || 0,
        approved: data?.filter(t => t.status === 'approved_not_paid' || t.status === 'approved_paid').length || 0,
        declined: data?.filter(t => t.status === 'declined').length || 0,
        info_requested: data?.filter(t => t.status === 'additional_info_requested').length || 0,
      };
      setStats(ticketStats);
      
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: 'draft' | 'submitted' | 'additional_info_requested' | 'approved_not_paid' | 'approved_paid' | 'declined') => {
    try {
      const { error } = await supabase
        .from('service_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

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

      fetchTickets(); // Refresh the list
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleSubmitTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('service_tickets')
        .update({ status: 'submitted' })
        .eq('id', ticketId);

      if (error) {
        console.error('Error submitting ticket:', error);
        toast({
          title: "Error",
          description: "Failed to submit ticket",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Ticket submitted successfully",
      });

      fetchTickets(); // Refresh the list
    } catch (error) {
      console.error('Error submitting ticket:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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

  const filteredTickets = tickets.filter((ticket: any) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ticket.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return null;
  }

  const isAdmin = userRole === 'admin';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Service Provider Portal</h1>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => navigate('/manage-users')}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Badge variant="outline" className="gap-1">
                  <Settings className="h-3 w-3" />
                  Admin
                </Badge>
              </>
            )}
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </h2>
            <p className="text-muted-foreground">
              {isAdmin ? 'Manage all service tickets and users' : 'Manage your service tickets and work reports'}
            </p>
          </div>
          <Button onClick={() => navigate('/new-ticket')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Service Ticket
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submitted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Declined</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.declined}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Service Tickets</CardTitle>
                <CardDescription>
                  {isAdmin ? 'Manage all service tickets' : 'Your work reports and invoices'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
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
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg">Loading tickets...</div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {tickets.length === 0 ? 'No tickets yet' : 'No tickets match your filters'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {tickets.length === 0 
                    ? 'Create your first service ticket to get started'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {tickets.length === 0 && (
                  <Button onClick={() => navigate('/new-ticket')}>
                    Create Service Ticket
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                       <TableHead>Title</TableHead>
                       <TableHead>Description</TableHead>
                       <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket: any) => (
                      <TableRow key={ticket.id}>
                         <TableCell className="font-medium">
                           {ticket.title}
                         </TableCell>
                         <TableCell>{ticket.description || '-'}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>
                          {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {ticket.total_amount ? `$${Number(ticket.total_amount).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => navigate(`/view-ticket/${ticket.id}`)}
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                            
                            {/* Edit button - for draft tickets owned by user or admin */}
                            {(isAdmin || (ticket.user_id === user?.id && ticket.status === 'draft')) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-1"
                                onClick={() => navigate(`/edit-ticket/${ticket.id}`)}
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                            )}
                            
                            {/* Submit button - for draft tickets owned by user */}
                            {ticket.user_id === user?.id && ticket.status === 'draft' && (
                              <Button 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handleSubmitTicket(ticket.id)}
                              >
                                <Send className="h-3 w-3" />
                                Submit
                              </Button>
                            )}
                            
                            {/* Admin status change dropdown */}
                            {isAdmin && (
                              <Select
                                value={ticket.status}
                                onValueChange={(value) => updateTicketStatus(ticket.id, value as 'draft' | 'submitted' | 'additional_info_requested' | 'approved_not_paid' | 'approved_paid' | 'declined')}
                              >
                                <SelectTrigger className="w-28">
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
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;