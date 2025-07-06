import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building,
  User,
  CreditCardIcon,
  Receipt,
  Banknote,
  Wallet,
  PieChart,
  BarChart3,
  LineChart,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface BillingStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
}

interface Subscription {
  id: number;
  userId: number;
  planName: string;
  status: string;
  amount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface Payment {
  id: number;
  userId: number;
  subscriptionId: number;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  description: string;
  paidAt: string;
  createdAt: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface Invoice {
  id: number;
  userId: number;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export function BillingSystem() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch billing statistics
  const { data: billingStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/billing/stats', dateRange],
    refetchInterval: 30000,
  });

  // Fetch subscriptions
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['/api/admin/billing/subscriptions', searchTerm, statusFilter],
  });

  // Fetch payments
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/admin/billing/payments', searchTerm, dateRange],
  });

  // Fetch invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['/api/admin/billing/invoices', searchTerm, statusFilter],
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async (type: string) => {
      return await apiRequest('POST', '/api/admin/billing/export', { type, dateRange });
    },
    onSuccess: () => {
      toast({
        title: "Export Ready",
        description: "Your billing data export has been prepared for download.",
      });
    },
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return await apiRequest('PATCH', `/api/admin/billing/subscriptions/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/billing/subscriptions'] });
      toast({
        title: "Subscription Updated",
        description: "Subscription has been successfully updated.",
      });
    },
  });

  // Refund payment mutation
  const refundPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      return await apiRequest('POST', `/api/admin/billing/payments/${paymentId}/refund`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/billing/payments'] });
      toast({
        title: "Refund Processed",
        description: "Payment refund has been initiated successfully.",
      });
    },
  });

  // Send invoice reminder mutation
  const sendInvoiceReminderMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      return await apiRequest('POST', `/api/admin/billing/invoices/${invoiceId}/reminder`);
    },
    onSuccess: () => {
      toast({
        title: "Reminder Sent",
        description: "Invoice reminder has been sent to the customer.",
      });
    },
  });

  // Stats card component
  const StatsCard = ({ title, value, icon: Icon, change, description, prefix = '' }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">
          {prefix}{value?.toLocaleString() || '0'}
        </div>
        {change !== undefined && (
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

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusConfig = (status: string) => {
      switch (status.toLowerCase()) {
        case 'active':
          return { variant: 'default' as const, color: 'text-green-700 bg-green-100' };
        case 'cancelled':
          return { variant: 'destructive' as const, color: 'text-red-700 bg-red-100' };
        case 'expired':
          return { variant: 'outline' as const, color: 'text-gray-700 bg-gray-100' };
        case 'suspended':
          return { variant: 'secondary' as const, color: 'text-yellow-700 bg-yellow-100' };
        case 'succeeded':
        case 'paid':
          return { variant: 'default' as const, color: 'text-green-700 bg-green-100' };
        case 'failed':
          return { variant: 'destructive' as const, color: 'text-red-700 bg-red-100' };
        case 'pending':
          return { variant: 'secondary' as const, color: 'text-yellow-700 bg-yellow-100' };
        case 'open':
          return { variant: 'outline' as const, color: 'text-blue-700 bg-blue-100' };
        case 'void':
          return { variant: 'outline' as const, color: 'text-gray-700 bg-gray-100' };
        default:
          return { variant: 'outline' as const, color: 'text-gray-700 bg-gray-100' };
      }
    };

    const config = getStatusConfig(status);
    return (
      <Badge variant={config.variant} className={config.color}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Billing System</h1>
            <p className="text-slate-600">Manage subscriptions, payments, and revenue</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportDataMutation.mutate('all')}
              disabled={exportDataMutation.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Revenue"
            value={billingStats?.totalRevenue || 128450}
            icon={DollarSign}
            change={15}
            description="All-time revenue"
            prefix="$"
          />
          <StatsCard
            title="Monthly Revenue"
            value={billingStats?.monthlyRevenue || 28450}
            icon={TrendingUp}
            change={12}
            description="Current month"
            prefix="$"
          />
          <StatsCard
            title="Active Subscriptions"
            value={billingStats?.activeSubscriptions || 892}
            icon={Users}
            change={8}
            description="Paying customers"
          />
          <StatsCard
            title="Churn Rate"
            value={`${billingStats?.churnRate || 2.3}%`}
            icon={TrendingDown}
            change={-5}
            description="Monthly churn rate"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Revenue Trends
                  </CardTitle>
                  <CardDescription>
                    Monthly revenue over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-500">
                    Revenue chart visualization would go here
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Subscription Plans
                  </CardTitle>
                  <CardDescription>
                    Distribution by plan type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Free Plan</span>
                      </div>
                      <span className="text-sm font-medium">1,245 (58%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Gold Plan</span>
                      </div>
                      <span className="text-sm font-medium">678 (32%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-sm">Platinum Plan</span>
                      </div>
                      <span className="text-sm font-medium">214 (10%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Billing Activity</CardTitle>
                <CardDescription>
                  Latest payments and subscription changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Payment successful</p>
                        <p className="text-sm text-slate-500">john.doe@example.com - Gold Plan</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">+$19.99</p>
                      <p className="text-xs text-slate-500">2 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">New subscription</p>
                        <p className="text-sm text-slate-500">jane.smith@example.com - Platinum Plan</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">+$49.99</p>
                      <p className="text-xs text-slate-500">5 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-full">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">Subscription cancelled</p>
                        <p className="text-sm text-slate-500">user@example.com - Gold Plan</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">-$19.99</p>
                      <p className="text-xs text-slate-500">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>
                  View and manage customer subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by email or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subscriptions Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Next Billing</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptionsLoading ? (
                        Array(5).fill(0).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div className="animate-pulse h-4 bg-slate-200 rounded"></div>
                            </TableCell>
                            <TableCell>
                              <div className="animate-pulse h-4 bg-slate-200 rounded"></div>
                            </TableCell>
                            <TableCell>
                              <div className="animate-pulse h-4 bg-slate-200 rounded"></div>
                            </TableCell>
                            <TableCell>
                              <div className="animate-pulse h-4 bg-slate-200 rounded"></div>
                            </TableCell>
                            <TableCell>
                              <div className="animate-pulse h-4 bg-slate-200 rounded"></div>
                            </TableCell>
                            <TableCell>
                              <div className="animate-pulse h-4 bg-slate-200 rounded"></div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <>
                          <TableRow>
                            <TableCell>
                              <div>
                                <p className="font-medium">John Doe</p>
                                <p className="text-sm text-slate-500">john.doe@example.com</p>
                              </div>
                            </TableCell>
                            <TableCell>Gold Plan</TableCell>
                            <TableCell>
                              <StatusBadge status="active" />
                            </TableCell>
                            <TableCell>$19.99/month</TableCell>
                            <TableCell>{format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <div>
                                <p className="font-medium">Jane Smith</p>
                                <p className="text-sm text-slate-500">jane.smith@example.com</p>
                              </div>
                            </TableCell>
                            <TableCell>Platinum Plan</TableCell>
                            <TableCell>
                              <StatusBadge status="active" />
                            </TableCell>
                            <TableCell>$49.99/month</TableCell>
                            <TableCell>{format(new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Management</CardTitle>
                <CardDescription>
                  View payment history and process refunds
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                </div>

                {/* Payments Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-sm">#PAY-1234567</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">John Doe</p>
                            <p className="text-sm text-slate-500">john.doe@example.com</p>
                          </div>
                        </TableCell>
                        <TableCell>$19.99</TableCell>
                        <TableCell>
                          <StatusBadge status="succeeded" />
                        </TableCell>
                        <TableCell>{format(new Date(), 'MMM dd, yyyy HH:mm')}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => refundPaymentMutation.mutate(1)}
                              disabled={refundPaymentMutation.isPending}
                            >
                              Refund
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">#PAY-1234566</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">Jane Smith</p>
                            <p className="text-sm text-slate-500">jane.smith@example.com</p>
                          </div>
                        </TableCell>
                        <TableCell>$49.99</TableCell>
                        <TableCell>
                          <StatusBadge status="succeeded" />
                        </TableCell>
                        <TableCell>{format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'MMM dd, yyyy HH:mm')}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              Refund
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Management</CardTitle>
                <CardDescription>
                  Manage customer invoices and send reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Invoice Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-sm">INV-2024-001</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">John Doe</p>
                            <p className="text-sm text-slate-500">john.doe@example.com</p>
                          </div>
                        </TableCell>
                        <TableCell>$19.99</TableCell>
                        <TableCell>
                          <StatusBadge status="paid" />
                        </TableCell>
                        <TableCell>{format(new Date(), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-sm">INV-2024-002</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">Mike Johnson</p>
                            <p className="text-sm text-slate-500">mike.johnson@example.com</p>
                          </div>
                        </TableCell>
                        <TableCell>$19.99</TableCell>
                        <TableCell>
                          <StatusBadge status="open" />
                        </TableCell>
                        <TableCell>{format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => sendInvoiceReminderMutation.mutate(2)}
                              disabled={sendInvoiceReminderMutation.isPending}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>
                    Detailed revenue breakdown and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Average Revenue Per User</span>
                      <span className="text-sm font-medium">$31.85</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Customer Lifetime Value</span>
                      <span className="text-sm font-medium">$425.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Monthly Recurring Revenue</span>
                      <span className="text-sm font-medium">$28,450</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Annual Run Rate</span>
                      <span className="text-sm font-medium">$341,400</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Distribution of payment methods used
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm">Credit Cards</span>
                      </div>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Banknote className="h-4 w-4" />
                        <span className="text-sm">Bank Transfer</span>
                      </div>
                      <span className="text-sm font-medium">15%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4" />
                        <span className="text-sm">Digital Wallets</span>
                      </div>
                      <span className="text-sm font-medium">7%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}