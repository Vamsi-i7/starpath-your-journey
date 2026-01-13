import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { needsAdminVerification } from '@/lib/adminAuth';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Users, 
  Coins, 
  CreditCard, 
  FileText, 
  Settings,
  LogOut,
  Home,
  RefreshCw
} from 'lucide-react';
import { AppTopbar } from '@/components/app/AppTopbar';
import { Link } from 'react-router-dom';
import { useAdminUserManagement, AdminUser } from '@/hooks/useAdminUserManagement';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { EditUserModal } from '@/components/admin/EditUserModal';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { useAdminCredits } from '@/hooks/useAdminCredits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function UserManagementSection() {
  const {
    users,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    setUserStatus,
    updateUserSubscription,
    grantCredits,
    deductCredits,
  } = useAdminUserManagement();

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  return (
    <>
      <div className="p-6 rounded-xl border bg-card">
        <h3 className="font-semibold mb-4">User Management</h3>
        <UserManagementTable
          users={users}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onEditUser={handleEditUser}
        />
      </div>

      <EditUserModal
        user={selectedUser}
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        onGrantCredits={grantCredits}
        onDeductCredits={deductCredits}
        onUpdateSubscription={updateUserSubscription}
        onSetStatus={setUserStatus}
      />
    </>
  );
}

function AuditLogSection() {
  const { auditLogs, refetchAuditLogs } = useAdminUserManagement();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      await refetchAuditLogs(100);
      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-6 rounded-xl border bg-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Audit Log</h3>
          <p className="text-sm text-muted-foreground">Complete history of admin actions</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchAuditLogs(100)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      <AuditLogViewer logs={auditLogs} isLoading={isLoading} />
    </div>
  );
}

/**
 * AdminDashboardPage - Main admin control panel
 * Provides access to:
 * - User management
 * - Credit management
 * - Subscription management
 * - Audit logs
 * - System settings
 */
export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get stats from admin credits hook
  const { stats, isLoading: statsLoading } = useAdminCredits();

  // Check if verification is needed
  useEffect(() => {
    if (needsAdminVerification()) {
      navigate('/app/admin/verify', { 
        state: { from: { pathname: '/app/admin/dashboard' } },
        replace: true 
      });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <AppTopbar 
        title="Admin Dashboard" 
        subtitle="System Administration"
        leftAction={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app">
              <Home className="w-4 h-4 mr-2" />
              Back to App
            </Link>
          </Button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Control Panel</h1>
              <p className="text-sm text-muted-foreground">
                Logged in as: {profile?.email}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-2">
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Credits</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Audit Log</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Quick Stats Cards */}
              <div className="p-6 rounded-xl border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="text-3xl font-bold">
                  {statsLoading ? '---' : stats?.total_users.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {statsLoading ? 'Loading...' : `${stats?.users_with_zero_credits || 0} with zero credits`}
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Credits in Circulation</span>
                  <Coins className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="text-3xl font-bold">
                  {statsLoading ? '---' : stats?.total_credits_in_circulation.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {statsLoading ? 'Loading...' : `Avg: ${stats?.avg_credits_per_user.toFixed(1) || 0} per user`}
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">All-Time Credits</span>
                  <CreditCard className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-3xl font-bold">
                  {statsLoading ? '---' : stats?.total_credits_earned_all_time.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {statsLoading ? 'Loading...' : `${stats?.total_credits_spent_all_time.toLocaleString() || 0} spent`}
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Today's Activity</span>
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-3xl font-bold">
                  {statsLoading ? '---' : stats?.transactions_today.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {statsLoading ? 'Loading...' : `${stats?.credits_used_today.toLocaleString() || 0} credits used`}
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="justify-start" onClick={() => setActiveTab('users')}>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => setActiveTab('credits')}>
                  <Coins className="w-4 h-4 mr-2" />
                  Manage Credits
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => setActiveTab('subscriptions')}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Subscriptions
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserManagementSection />
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits">
            <div className="p-6 rounded-xl border bg-card">
              <h3 className="font-semibold mb-4">Credit Management</h3>
              <p className="text-muted-foreground">Credit management features will be implemented here.</p>
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="p-6 rounded-xl border bg-card">
              <h3 className="font-semibold mb-4">Subscription Management</h3>
              <p className="text-muted-foreground">Subscription management features will be implemented here.</p>
            </div>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <AuditLogSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
