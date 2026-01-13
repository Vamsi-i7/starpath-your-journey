import { useState } from 'react';
import { useAdminCredits } from '@/hooks/useAdminCredits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, TrendingUp, Users, Coins, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminCreditsPage() {
  const {
    isAdmin,
    users,
    recentTransactions,
    stats,
    isLoading,
    grantCredits,
    deductCredits,
    refetch,
  } = useAdminCredits();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page. Admin access required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleGrantCredits = async () => {
    const amount = parseInt(creditAmount);
    if (!selectedUserId || !amount || amount <= 0) {
      return;
    }
    
    const success = await grantCredits(selectedUserId, amount, creditReason || 'Admin credit grant');
    if (success) {
      setCreditAmount('');
      setCreditReason('');
      setSelectedUserId('');
    }
  };

  const handleDeductCredits = async () => {
    const amount = parseInt(creditAmount);
    if (!selectedUserId || !amount || amount <= 0) {
      return;
    }
    
    const success = await deductCredits(selectedUserId, amount, creditReason || 'Admin credit deduction');
    if (success) {
      setCreditAmount('');
      setCreditReason('');
      setSelectedUserId('');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Credit Management</h1>
          <p className="text-muted-foreground">Monitor and manage user credits</p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.users_with_zero_credits} with zero credits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                Credits in Circulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_credits_in_circulation.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {stats.avg_credits_per_user.toFixed(1)} per user
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                All-Time Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_credits_earned_all_time.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Spent: {stats.total_credits_spent_all_time.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.transactions_today.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.credits_used_today.toLocaleString()} credits used
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="manage">Manage Credits</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Credit Overview</CardTitle>
              <CardDescription>View all users and their credit balances</CardDescription>
              <Input
                placeholder="Search by email, name, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-2"
              />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Tier</th>
                      <th className="text-right p-2">Balance</th>
                      <th className="text-right p-2">Earned</th>
                      <th className="text-right p-2">Spent</th>
                      <th className="text-right p-2">This Month</th>
                      <th className="text-left p-2">Last Transaction</th>
                      <th className="text-center p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center p-8">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center p-8 text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.user_id} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{user.full_name || user.username || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant={user.subscription_tier ? 'default' : 'secondary'}>
                              {user.subscription_tier || 'free'}
                            </Badge>
                          </td>
                          <td className="text-right p-2 font-semibold">
                            {user.current_balance.toLocaleString()}
                          </td>
                          <td className="text-right p-2 text-green-600">
                            +{user.total_credits_earned.toLocaleString()}
                          </td>
                          <td className="text-right p-2 text-red-600">
                            -{user.total_credits_spent.toLocaleString()}
                          </td>
                          <td className="text-right p-2">
                            {user.credits_used_this_month.toLocaleString()}
                          </td>
                          <td className="p-2 text-sm">
                            {user.last_transaction_date
                              ? new Date(user.last_transaction_date).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className="text-center p-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUserId(user.user_id)}
                            >
                              Manage
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Credit Transactions</CardTitle>
              <CardDescription>Latest credit activities across all users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : recentTransactions.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    No transactions found
                  </div>
                ) : (
                  recentTransactions.slice(0, 20).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tx.full_name || tx.username || tx.email}</span>
                          <Badge variant={tx.transaction_type === 'usage' ? 'destructive' : 'default'}>
                            {tx.transaction_type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tx.description || 'No description'}
                          {tx.tool_type && ` • ${tx.tool_type}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${tx.transaction_type === 'usage' ? 'text-red-600' : 'text-green-600'}`}>
                          {tx.transaction_type === 'usage' ? '-' : '+'}{tx.amount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage User Credits</CardTitle>
              <CardDescription>Grant or deduct credits from specific users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-select">Select User</Label>
                <select
                  id="user-select"
                  className="w-full p-2 border rounded-md"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">-- Select a user --</option>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.email} - Balance: {user.current_balance} credits
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit-amount">Credit Amount</Label>
                <Input
                  id="credit-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit-reason">Reason (Optional)</Label>
                <Input
                  id="credit-reason"
                  placeholder="e.g., Promotional bonus, Bug compensation"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGrantCredits}
                  disabled={!selectedUserId || !creditAmount || parseInt(creditAmount) <= 0}
                  className="flex-1"
                >
                  Grant Credits
                </Button>
                <Button
                  onClick={handleDeductCredits}
                  disabled={!selectedUserId || !creditAmount || parseInt(creditAmount) <= 0}
                  variant="destructive"
                  className="flex-1"
                >
                  Deduct Credits
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
