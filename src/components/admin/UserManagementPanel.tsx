import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  Activity,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  user_metadata: any;
}

interface Profile {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface Subscription {
  user_id: string;
  plan: string;
  status: string;
}

interface UserWithDetails extends User {
  profile?: Profile;
  role?: string;
  subscription?: Subscription;
}

export const UserManagementPanel = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userActivity, setUserActivity] = useState<any[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active24h: 0,
    active7d: 0,
    admins: 0,
    subscribed: 0,
  });

  useEffect(() => {
    loadUsers();
    loadStatistics();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get all users from auth.users (admin only)
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) throw authError;

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Get subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subsError) throw subsError;

      // Combine data
      const usersWithDetails: UserWithDetails[] = (authData.users || []).map((user) => ({
        ...user,
        profile: profiles?.find((p) => p.id === user.id),
        role: roles?.find((r) => r.user_id === user.id)?.role || 'user',
        subscription: subscriptions?.find((s) => s.user_id === user.id),
      }));

      setUsers(usersWithDetails);
      setFilteredUsers(usersWithDetails);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_statistics');

      if (error) throw error;

      if (data && data.length > 0) {
        const statsData = data[0];
        setStats({
          total: Number(statsData.total_users) || 0,
          active24h: Number(statsData.active_users_24h) || 0,
          active7d: Number(statsData.active_users_7d) || 0,
          admins: Number(statsData.admin_count) || 0,
          subscribed: Number(statsData.users_with_subscriptions) || 0,
        });
      }
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.email?.toLowerCase().includes(term) ||
        user.profile?.username?.toLowerCase().includes(term) ||
        user.id.toLowerCase().includes(term)
    );

    setFilteredUsers(filtered);
  };

  const toggleAdminRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'grant' : 'revoke';

    if (!confirm(`Are you sure you want to ${action} admin privileges for this user?`)) {
      return;
    }

    try {
      if (newRole === 'admin') {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error) throw error;
      } else {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;
      }

      // Log admin action
      const currentUser = await supabase.auth.getUser();
      await supabase.rpc('log_admin_action', {
        p_admin_id: currentUser.data.user?.id,
        p_action: `role_change_${newRole}`,
        p_target_type: 'user',
        p_target_id: userId,
        p_details: { previous_role: currentRole, new_role: newRole },
      });

      toast({
        title: "Role Updated",
        description: `User ${action === 'grant' ? 'granted' : 'revoked'} admin privileges`,
      });

      await loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const viewUserDetails = async (user: UserWithDetails) => {
    setSelectedUser(user);
    setShowUserDetails(true);

    // Load user activity
    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setUserActivity(data || []);
    } catch (error: any) {
      console.error('Error loading user activity:', error);
    }
  };

  const exportUsers = () => {
    const csv = [
      ['Email', 'Username', 'Role', 'Subscription', 'Created', 'Last Sign In'].join(','),
      ...filteredUsers.map((user) =>
        [
          user.email,
          user.profile?.username || '',
          user.role,
          user.subscription?.plan || 'none',
          user.created_at,
          user.last_sign_in_at || 'Never',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString()}.csv`;
    a.click();

    toast({
      title: "Export Complete",
      description: `Exported ${filteredUsers.length} users to CSV`,
    });
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="destructive" className="flex items-center gap-1">
        <ShieldCheck className="h-3 w-3" />
        Admin
      </Badge>
    ) : (
      <Badge variant="outline" className="flex items-center gap-1">
        <Shield className="h-3 w-3" />
        User
      </Badge>
    );
  };

  const getSubscriptionBadge = (subscription?: Subscription) => {
    if (!subscription || subscription.status !== 'active') {
      return <Badge variant="secondary">Free</Badge>;
    }

    return <Badge variant="default">{subscription.plan}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.active24h}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.active7d}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats.admins}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Subscribed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.subscribed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email, username, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {filteredUsers.length} users found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.profile?.username || '-'}</TableCell>
                      <TableCell>{getRoleBadge(user.role || 'user')}</TableCell>
                      <TableCell>{getSubscriptionBadge(user.subscription)}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(user.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        {user.last_sign_in_at
                          ? formatDistanceToNow(new Date(user.last_sign_in_at), {
                              addSuffix: true,
                            })
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewUserDetails(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={user.role === 'admin'}
                            onCheckedChange={() =>
                              toggleAdminRole(user.id, user.role || 'user')
                            }
                            title={
                              user.role === 'admin'
                                ? 'Revoke admin'
                                : 'Grant admin'
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information and activity for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Account Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Email:</span>{' '}
                      {selectedUser.email}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Username:</span>{' '}
                      {selectedUser.profile?.username || 'Not set'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID:</span>{' '}
                      <code className="text-xs">{selectedUser.id}</code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>{' '}
                      {new Date(selectedUser.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Access & Status</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Role:</span>{' '}
                      {getRoleBadge(selectedUser.role || 'user')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Subscription:</span>{' '}
                      {getSubscriptionBadge(selectedUser.subscription)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Sign In:</span>{' '}
                      {selectedUser.last_sign_in_at
                        ? new Date(selectedUser.last_sign_in_at).toLocaleString()
                        : 'Never'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </h4>
                <div className="border rounded-lg">
                  {userActivity.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No recent activity recorded
                    </div>
                  ) : (
                    <div className="divide-y">
                      {userActivity.slice(0, 10).map((activity) => (
                        <div key={activity.id} className="p-3 flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {activity.activity_type}
                            </div>
                            {activity.page_url && (
                              <div className="text-xs text-muted-foreground">
                                {activity.page_url}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.created_at), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
