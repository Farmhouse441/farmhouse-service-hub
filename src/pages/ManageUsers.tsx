import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, Edit, Trash2, Mail, UserCog, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  address: string | null;
  created_at: string;
  role: 'admin' | 'user';
}

const ManageUsers = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

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
      
      const role = data?.role || 'user';
      setUserRole(role);
      
      if (role !== 'admin') {
        navigate('/dashboard');
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
        return;
      }

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Combine profiles with roles
      const usersWithRoles = profilesData?.map(profile => {
        const userRole = rolesData?.find(role => role.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || 'user'
        };
      }) || [];

      setUsers(usersWithRoles);
      
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      // Check if role record exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Note: This will delete the profile, but the auth.users record will remain
      // In a production app, you might want to use the Supabase Admin API to delete the auth user
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      company_name: user.company_name || '',
      address: user.address || '',
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('user_id', editingUser.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setEditingUser(null);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent successfully",
      });
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getRoleBadge = (role: string) => {
    return (
      <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
        {role === 'admin' ? 'Admin' : 'User'}
      </Badge>
    );
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.company_name && user.company_name.toLowerCase().includes(searchLower))
    );
  });

  if (!user || userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Manage Users</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1">
              <UserCog className="h-3 w-3" />
              Admin
            </Badge>
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
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-semibold">{users.length} Users</span>
          </div>
        </div>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  View and manage user accounts, roles, and permissions
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-lg">Loading users...</div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {users.length === 0 ? 'No users found' : 'No users match your search'}
                </h3>
                <p className="text-muted-foreground">
                  {users.length === 0 
                    ? 'No user accounts have been created yet'
                    : 'Try adjusting your search criteria'
                  }
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.company_name || '-'}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {/* Edit Button */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-1"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Edit className="h-3 w-3" />
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit User</DialogTitle>
                                  <DialogDescription>
                                    Update user profile information
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="first_name">First Name</Label>
                                      <Input
                                        id="first_name"
                                        value={editForm.first_name}
                                        onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="last_name">Last Name</Label>
                                      <Input
                                        id="last_name"
                                        value={editForm.last_name}
                                        onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                      id="email"
                                      type="email"
                                      value={editForm.email}
                                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                      id="phone"
                                      value={editForm.phone}
                                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="company_name">Company</Label>
                                    <Input
                                      id="company_name"
                                      value={editForm.company_name}
                                      onChange={(e) => setEditForm({...editForm, company_name: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                      id="address"
                                      value={editForm.address}
                                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleUpdateUser}>Update User</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            {/* Role Change */}
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleRoleChange(user.user_id, value as 'admin' | 'user')}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {/* Password Reset */}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => handleSendPasswordReset(user.email)}
                            >
                              <Mail className="h-3 w-3" />
                              Reset
                            </Button>
                            
                            {/* Delete Button */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.first_name} {user.last_name}? 
                                    This action cannot be undone and will remove their profile data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.user_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

export default ManageUsers;