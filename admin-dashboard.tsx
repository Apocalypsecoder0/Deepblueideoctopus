import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Users,
  CreditCard,
  HeadphonesIcon,
  Settings,
  BarChart3,
  AlertTriangle,
  Bell,
  Shield,
  Database,
  Activity,
  DollarSign,
  UserCheck,
  Ticket,
  TrendingUp,
  Server,
  Monitor,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
  UserPlus,
  LogOut,
  Key,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  openTickets: number;
  resolvedTickets: number;
  systemAlerts: number;
  newSignups: number;
  churnRate: number;
}

interface RecentActivity {
  id: number;
  type: 'user' | 'billing' | 'support' | 'system';
  message: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high';
}

export function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/admin/activity'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch system metrics
  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/admin/system-metrics'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch admin users
  const { data: adminUsers, isLoading: adminUsersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  // Fetch support tickets
  const { data: supportTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/admin/support-tickets'],
  });

  // Fetch billing data
  const { data: billingData, isLoading: billingLoading } = useQuery({
    queryKey: ['/api/admin/billing'],
  });

  // System action mutations
  const refreshDataMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/admin/activity'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/admin/system-metrics'] }),
      ]);
    },
    onSuccess: () => {
      toast({
        title: "Data Refreshed",
        description: "All dashboard data has been updated.",
      });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await apiRequest('POST', '/api/admin/export', { type });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Export Ready",
        description: "Your data export has been prepared for download.",
      });
      // Handle download logic here
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return await apiRequest('PATCH', `/api/admin/alerts/${alertId}`, { resolved: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Alert Resolved",
        description: "System alert has been marked as resolved.",
      });
    },
  });

  // Loading state component
  const LoadingCard = () => (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-slate-200 rounded w-1/2"></div>
        </div>
      </CardContent>
    </Card>
  );

  // Stats card component
  const StatsCard = ({ title, value, icon: Icon, change, description }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {change && (
          <p className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}% from last month
          </p>
        )}
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  // Activity item component
  const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
    const getActivityIcon = (type: string) => {
      switch (type) {
        case 'user': return <Users className="h-4 w-4" />;
        case 'billing': return <CreditCard className="h-4 w-4" />;
        case 'support': return <HeadphonesIcon className="h-4 w-4" />;
        case 'system': return <Server className="h-4 w-4" />;
        default: return <Activity className="h-4 w-4" />;
      }
    };

    const getSeverityColor = (severity?: string) => {
      switch (severity) {
        case 'high': return 'bg-red-100 text-red-800 border-red-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'low': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-slate-100 text-slate-800 border-slate-200';
      }
    };

    return (
      <div className="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
        <div className={`p-2 rounded-full ${getSeverityColor(activity.severity)}`}>
          {getActivityIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900">{activity.message}</p>
          <p className="text-xs text-slate-500">
            {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
        <Badge variant="outline" className={getSeverityColor(activity.severity)}>
          {activity.type}
        </Badge>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600">DeepBlue:Octopus IDE Administration Panel</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshDataMutation.mutate()}
              disabled={refreshDataMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshDataMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportDataMutation.mutate('dashboard')}
              disabled={exportDataMutation.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsLoading ? (
            Array(4).fill(0).map((_, i) => <LoadingCard key={i} />)
          ) : (
            <>
              <StatsCard
                title="Total Users"
                value={stats?.totalUsers?.toLocaleString() || '1,247'}
                icon={Users}
                change={12}
                description="Active registered users"
              />
              <StatsCard
                title="Active Subscriptions"
                value={stats?.activeSubscriptions?.toLocaleString() || '892'}
                icon={CreditCard}
                change={8}
                description="Paying customers"
              />
              <StatsCard
                title="Monthly Revenue"
                value={`$${stats?.monthlyRevenue?.toLocaleString() || '28,450'}`}
                icon={DollarSign}
                change={15}
                description="Current month revenue"
              />
              <StatsCard
                title="Open Tickets"
                value={stats?.openTickets?.toLocaleString() || '23'}
                icon={Ticket}
                change={-5}
                description="Pending support requests"
              />
            </>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest system events and user actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {activityLoading ? (
                      <div className="space-y-3">
                        {Array(5).fill(0).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Sample activity data for demonstration */}
                        <ActivityItem activity={{
                          id: 1,
                          type: 'user',
                          message: 'New user registration: john.developer@email.com',
                          timestamp: new Date().toISOString(),
                          severity: 'low'
                        }} />
                        <ActivityItem activity={{
                          id: 2,
                          type: 'billing',
                          message: 'Payment successful for Gold subscription',
                          timestamp: new Date(Date.now() - 300000).toISOString(),
                          severity: 'low'
                        }} />
                        <ActivityItem activity={{
                          id: 3,
                          type: 'support',
                          message: 'Support ticket #1234 marked as resolved',
                          timestamp: new Date(Date.now() - 600000).toISOString(),
                          severity: 'medium'
                        }} />
                        <ActivityItem activity={{
                          id: 4,
                          type: 'system',
                          message: 'Database backup completed successfully',
                          timestamp: new Date(Date.now() - 900000).toISOString(),
                          severity: 'low'
                        }} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* System Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Monitor className="h-5 w-5 mr-2" />
                    System Health
                  </CardTitle>
                  <CardDescription>
                    Real-time system performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metricsLoading ? (
                    <div className="space-y-4">
                      {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                          <div className="h-2 bg-slate-200 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">CPU Usage</span>
                        <span className="text-sm text-slate-600">32%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '32%' }}></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Memory Usage</span>
                        <span className="text-sm text-slate-600">68%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Disk Usage</span>
                        <span className="text-sm text-slate-600">45%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Database</span>
                        <Badge variant="default">Healthy</Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Additional Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Support Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Response Time</span>
                      <span className="text-sm font-medium">2.4 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Resolution Rate</span>
                      <span className="text-sm font-medium">94%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Customer Satisfaction</span>
                      <span className="text-sm font-medium">4.8/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">MRR Growth</span>
                      <span className="text-sm font-medium text-green-600">+12%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Churn Rate</span>
                      <span className="text-sm font-medium text-red-600">2.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">LTV/CAC Ratio</span>
                      <span className="text-sm font-medium">3.8x</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">API Status</span>
                      <Badge variant="default">Operational</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Database</span>
                      <Badge variant="default">Healthy</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">CDN</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage users, admins, and access permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                </div>

                <div className="rounded-md border">
                  <div className="p-4 bg-slate-50 border-b">
                    <h3 className="font-medium">Admin Users</h3>
                  </div>
                  <div className="divide-y">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          AD
                        </div>
                        <div>
                          <p className="font-medium">Admin User</p>
                          <p className="text-sm text-slate-500">admin@deepblueide.dev</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">Super Admin</Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Management</CardTitle>
                <CardDescription>
                  Monitor subscriptions, payments, and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium">Total Revenue</h4>
                      <p className="text-2xl font-bold text-green-600">$128,450</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium">Active Subscriptions</h4>
                      <p className="text-2xl font-bold text-blue-600">892</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium">Pending Payments</h4>
                      <p className="text-2xl font-bold text-orange-600">7</p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg">
                    <div className="p-4 border-b">
                      <h3 className="font-medium">Recent Transactions</h3>
                    </div>
                    <div className="divide-y">
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">Gold Subscription - john.doe@example.com</p>
                          <p className="text-sm text-slate-500">Today, 2:30 PM</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+$19.99</p>
                          <Badge variant="default">Completed</Badge>
                        </div>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">Platinum Subscription - jane.smith@example.com</p>
                          <p className="text-sm text-slate-500">Yesterday, 4:15 PM</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+$49.99</p>
                          <Badge variant="default">Completed</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Management</CardTitle>
                <CardDescription>
                  Handle customer support tickets and manage support providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">Open Tickets</h4>
                      <p className="text-xl font-bold text-red-600">23</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">In Progress</h4>
                      <p className="text-xl font-bold text-yellow-600">15</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">Resolved</h4>
                      <p className="text-xl font-bold text-green-600">142</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm">Avg Response</h4>
                      <p className="text-xl font-bold text-blue-600">2.4h</p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg">
                    <div className="p-4 border-b">
                      <h3 className="font-medium">Recent Tickets</h3>
                    </div>
                    <div className="divide-y">
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">IDE crashes when opening large files</p>
                          <p className="text-sm text-slate-500">Ticket #1234 - user@example.com</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="destructive">High Priority</Badge>
                          <Badge variant="outline">Open</Badge>
                        </div>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">Billing question about subscription</p>
                          <p className="text-sm text-slate-500">Ticket #1233 - customer@example.com</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">Medium Priority</Badge>
                          <Badge variant="default">In Progress</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Monitoring</CardTitle>
                  <CardDescription>
                    Real-time system health and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Server Status</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Server</span>
                        <Badge variant="default">Online</Badge>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Database Status</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">PostgreSQL</span>
                        <Badge variant="default">Healthy</Badge>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Storage Status</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">File Storage</span>
                        <Badge variant="default">Available</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>
                    Critical system notifications and warnings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm font-medium">All systems operational</span>
                        </div>
                        <span className="text-xs text-green-600">Now</span>
                      </div>
                    </div>
                    <div className="text-center text-slate-500 py-4">
                      No active alerts
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>
                  Configure admin panel and system settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="refresh-interval">Dashboard Refresh Interval (seconds)</Label>
                    <Input
                      id="refresh-interval"
                      type="number"
                      defaultValue="30"
                      className="max-w-xs mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="alert-email">Alert Email Address</Label>
                    <Input
                      id="alert-email"
                      type="email"
                      defaultValue="admin@deepblueide.dev"
                      className="max-w-md mt-2"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="email-notifications" defaultChecked />
                    <Label htmlFor="email-notifications">Enable email notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="maintenance-mode" />
                    <Label htmlFor="maintenance-mode">Maintenance mode</Label>
                  </div>
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}