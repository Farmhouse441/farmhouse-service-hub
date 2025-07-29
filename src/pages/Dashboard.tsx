import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Clock, CheckCircle, XCircle, Search, Settings, Users, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTickets } from '@/hooks/useTickets';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading: permissionsLoading } = usePermissions();
  
  const [tickets, setTickets] = useState<Array<{
    id: string;
    title: string;
    description: string;
    status: 'draft' | 'submitted' | 'additional_info_requested' | 'approved_not_paid' | 'approved_paid' | 'declined';
    created_at: string;
    updated_at: string;
    work_start_date: string;
    total_amount: number;
    user_id: string;
    before_photos?: string[];
    after_photos?: string[];
    invoice_file?: string | null;
    profiles?: {
      first_name: string;
      last_name: string;
      email: string;
      company_name: string;
    };
  }>>([]);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    declined: 0,
    info_requested: 0,
    totalAmount: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  // Fetch tickets when userRole changes
  useEffect(() => {
    if (user && userRole) {
      fetchTickets();
    }
  }, [userRole]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) {
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

      // If admin, fetch user profiles for all tickets
      if (userRole === 'admin' && data && data.length > 0) {
        const userIds = [...new Set(data.map(ticket => ticket.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, email, company_name')
          .in('user_id', userIds);

        if (!profilesError && profilesData) {
          const profilesMap = new Map(profilesData.map(profile => [profile.user_id, profile]));
          const ticketsWithProfiles = data.map(ticket => ({
            ...ticket,
            profiles: profilesMap.get(ticket.user_id)
          }));
          setTickets(ticketsWithProfiles);
        } else {
          setTickets(data);
        }
      } else {
        setTickets(data || []);
      }
      
      // Calculate stats
      const ticketStats = {
        total: data?.length || 0,
        draft: data?.filter(t => t.status === 'draft').length || 0,
        submitted: data?.filter(t => t.status === 'submitted').length || 0,
        approved: data?.filter(t => t.status === 'approved_not_paid' || t.status === 'approved_paid').length || 0,
        declined: data?.filter(t => t.status === 'declined').length || 0,
        info_requested: data?.filter(t => t.status === 'additional_info_requested').length || 0,
        totalAmount: data?.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0) || 0,
      };
      setStats(ticketStats);
      
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };





  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ticket.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(ticket.status);
    
    // Date range filter - now using service date (work_start_date)
    let matchesDateRange = true;
    if (dateRange.startDate || dateRange.endDate) {
      const serviceDate = ticket.work_start_date ? new Date(ticket.work_start_date) : null;
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate + 'T23:59:59') : null; // Include end date
      
      if (serviceDate) {
        if (startDate && serviceDate < startDate) {
          matchesDateRange = false;
        }
        if (endDate && serviceDate > endDate) {
          matchesDateRange = false;
        }
      } else {
        // If no service date, exclude from results when date filter is active
        matchesDateRange = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Calculate filtered stats based on current table data
  const filteredStats = {
    total: filteredTickets.length,
    draft: filteredTickets.filter(t => t.status === 'draft').length,
    submitted: filteredTickets.filter(t => t.status === 'submitted').length,
    approved: filteredTickets.filter(t => t.status === 'approved_not_paid' || t.status === 'approved_paid').length,
    declined: filteredTickets.filter(t => t.status === 'declined').length,
    info_requested: filteredTickets.filter(t => t.status === 'additional_info_requested').length,
    totalAmount: filteredTickets.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0),
  };

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
              <div className="text-2xl font-bold">{filteredStats.total}</div>
              <p className="text-xs text-muted-foreground">
                ${filteredStats.totalAmount.toFixed(2)} billed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredStats.draft}</div>
              <p className="text-xs text-muted-foreground">
                ${filteredTickets.filter(t => t.status === 'draft').reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0).toFixed(2)} billed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredStats.submitted}</div>
              <p className="text-xs text-muted-foreground">
                ${filteredTickets.filter(t => t.status === 'submitted').reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0).toFixed(2)} billed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredStats.approved}</div>
              <p className="text-xs text-muted-foreground">
                ${filteredTickets.filter(t => t.status === 'approved_not_paid' || t.status === 'approved_paid').reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0).toFixed(2)} billed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Declined</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredStats.declined}</div>
              <p className="text-xs text-muted-foreground">
                ${filteredTickets.filter(t => t.status === 'declined').reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0).toFixed(2)} billed
              </p>
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
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-40 justify-start">
                      <span className="truncate">
                        {statusFilter.length === 0 
                          ? 'All Status' 
                          : statusFilter.length === 1 
                            ? statusFilter[0] 
                            : `${statusFilter.length} selected`
                        }
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0">
                    <div className="p-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="all-status"
                          checked={statusFilter.length === 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStatusFilter([]);
                            }
                          }}
                        />
                        <label htmlFor="all-status" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          All Status
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="draft"
                          checked={statusFilter.includes('draft')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStatusFilter(prev => [...prev, 'draft']);
                            } else {
                              setStatusFilter(prev => prev.filter(s => s !== 'draft'));
                            }
                          }}
                        />
                        <label htmlFor="draft" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Draft
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="submitted"
                          checked={statusFilter.includes('submitted')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStatusFilter(prev => [...prev, 'submitted']);
                            } else {
                              setStatusFilter(prev => prev.filter(s => s !== 'submitted'));
                            }
                          }}
                        />
                        <label htmlFor="submitted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Submitted
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="info-requested"
                          checked={statusFilter.includes('additional_info_requested')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStatusFilter(prev => [...prev, 'additional_info_requested']);
                            } else {
                              setStatusFilter(prev => prev.filter(s => s !== 'additional_info_requested'));
                            }
                          }}
                        />
                        <label htmlFor="info-requested" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Info Requested
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="approved-unpaid"
                          checked={statusFilter.includes('approved_not_paid')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStatusFilter(prev => [...prev, 'approved_not_paid']);
                            } else {
                              setStatusFilter(prev => prev.filter(s => s !== 'approved_not_paid'));
                            }
                          }}
                        />
                        <label htmlFor="approved-unpaid" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Approved (Unpaid)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="approved-paid"
                          checked={statusFilter.includes('approved_paid')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStatusFilter(prev => [...prev, 'approved_paid']);
                            } else {
                              setStatusFilter(prev => prev.filter(s => s !== 'approved_paid'));
                            }
                          }}
                        />
                        <label htmlFor="approved-paid" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Approved (Paid)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="declined"
                          checked={statusFilter.includes('declined')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStatusFilter(prev => [...prev, 'declined']);
                            } else {
                              setStatusFilter(prev => prev.filter(s => s !== 'declined'));
                            }
                          }}
                        />
                        <label htmlFor="declined" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Declined
                        </label>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-40"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-40"
                  />
                  {(dateRange.startDate || dateRange.endDate) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange({ startDate: '', endDate: '' })}
                      className="h-8 px-2"
                    >
                      Clear
                    </Button>
                  )}
                </div>
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
                       <TableHead>{isAdmin ? 'Created By' : 'Description'}</TableHead>
                       <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Service Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                                        {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                         <TableCell className="font-medium">
                           <button
                             onClick={() => navigate(`/view-ticket/${ticket.id}`)}
                             className="text-left hover:text-primary hover:underline cursor-pointer"
                           >
                             {ticket.title}
                           </button>
                         </TableCell>
                         <TableCell>
                           {isAdmin ? (
                             ticket.profiles ? (
                               <div>
                                 <div className="font-medium">
                                   {ticket.profiles.first_name} {ticket.profiles.last_name}
                                 </div>
                                 <div className="text-sm text-muted-foreground">
                                   {ticket.profiles.company_name || ticket.profiles.email}
                                 </div>
                               </div>
                             ) : (
                               'Unknown User'
                             )
                           ) : (
                             ticket.description || '-'
                           )}
                         </TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>
                          {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {ticket.work_start_date 
                            ? format(new Date(ticket.work_start_date), 'MMM d, yyyy') 
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {ticket.total_amount ? `$${Number(ticket.total_amount).toFixed(2)}` : '-'}
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