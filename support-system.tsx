import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Ticket,
  HeadphonesIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MessageSquare,
  User,
  Users,
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
  Building,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Reply,
  Send,
  Paperclip,
  Flag,
  Tag,
  Archive,
  RefreshCw,
  Download,
  Upload,
  FileText,
  Settings,
  Shield,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  resolutionRate: number;
}

interface SupportTicket {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assignedTo: string;
  customerEmail: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
  lastResponseAt: string;
  tags: string[];
  messagesCount: number;
}

interface SupportProvider {
  id: number;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  supportTypes: string[];
  rating: number;
  responseTime: number;
  isActive: boolean;
  contractStart: string;
  contractEnd: string;
}

export function SupportSystem() {
  const [selectedTab, setSelectedTab] = useState('tickets');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch support statistics
  const { data: supportStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/support/stats'],
    refetchInterval: 30000,
  });

  // Fetch support tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/admin/support/tickets', searchTerm, statusFilter, priorityFilter],
  });

  // Fetch support providers
  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['/api/admin/support/providers'],
  });

  // Fetch ticket messages
  const { data: ticketMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/admin/support/tickets', selectedTicket?.id, 'messages'],
    enabled: !!selectedTicket,
  });

  // Update ticket status mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return await apiRequest('PATCH', `/api/admin/support/tickets/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/stats'] });
      toast({
        title: "Ticket Updated",
        description: "Support ticket has been successfully updated.",
      });
    },
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: number; message: string }) => {
      return await apiRequest('POST', `/api/admin/support/tickets/${ticketId}/reply`, {
        message,
        senderType: 'admin'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/tickets', selectedTicket?.id, 'messages'] });
      setReplyMessage('');
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent to the customer.",
      });
    },
  });

  // Assign ticket mutation
  const assignTicketMutation = useMutation({
    mutationFn: async ({ ticketId, adminId }: { ticketId: number; adminId: number }) => {
      return await apiRequest('PATCH', `/api/admin/support/tickets/${ticketId}/assign`, { adminId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/tickets'] });
      toast({
        title: "Ticket Assigned",
        description: "Ticket has been assigned successfully.",
      });
    },
  });

  // Stats card component
  const StatsCard = ({ title, value, icon: Icon, change, description, suffix = '' }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">
          {value?.toLocaleString() || '0'}{suffix}
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

  // Priority badge component
  const PriorityBadge = ({ priority }: { priority: string }) => {
    const getPriorityConfig = (priority: string) => {
      switch (priority.toLowerCase()) {
        case 'urgent':
          return { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' };
        case 'high':
          return { variant: 'destructive' as const, color: 'bg-orange-100 text-orange-800' };
        case 'medium':
          return { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' };
        case 'low':
          return { variant: 'outline' as const, color: 'bg-green-100 text-green-800' };
        default:
          return { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
      }
    };

    const config = getPriorityConfig(priority);
    return (
      <Badge variant={config.variant} className={config.color}>
        {priority}
      </Badge>
    );
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusConfig = (status: string) => {
      switch (status.toLowerCase()) {
        case 'open':
          return { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' };
        case 'in_progress':
          return { variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' };
        case 'pending':
          return { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' };
        case 'resolved':
          return { variant: 'default' as const, color: 'bg-green-100 text-green-800' };
        case 'closed':
          return { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
        default:
          return { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
      }
    };

    const config = getStatusConfig(status);
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Support System</h1>
            <p className="text-slate-600">Manage customer support tickets and providers</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Tickets"
            value={supportStats?.totalTickets || 1456}
            icon={Ticket}
            change={8}
            description="All time tickets"
          />
          <StatsCard
            title="Open Tickets"
            value={supportStats?.openTickets || 23}
            icon={AlertCircle}
            change={-12}
            description="Awaiting response"
          />
          <StatsCard
            title="Avg Response Time"
            value={supportStats?.avgResponseTime || 2.4}
            icon={Clock}
            change={-5}
            description="Hours to first response"
            suffix="h"
          />
          <StatsCard
            title="Customer Satisfaction"
            value={supportStats?.customerSatisfaction || 4.8}
            icon={Star}
            change={3}
            description="Average rating"
            suffix="/5"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>
                  Manage and respond to customer support requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tickets Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticketsLoading ? (
                        Array(5).fill(0).map((_, i) => (
                          <TableRow key={i}>
                            {Array(7).fill(0).map((_, j) => (
                              <TableCell key={j}>
                                <div className="animate-pulse h-4 bg-slate-200 rounded"></div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <>
                          <TableRow className="cursor-pointer hover:bg-slate-50">
                            <TableCell>
                              <div>
                                <p className="font-medium">#1234 - IDE crashes when opening large files</p>
                                <p className="text-sm text-slate-500">Technical Issue</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">John Doe</p>
                                <p className="text-sm text-slate-500">john.doe@example.com</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status="open" />
                            </TableCell>
                            <TableCell>
                              <PriorityBadge priority="high" />
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">Alex Smith</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{format(new Date(), 'MMM dd, yyyy')}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Ticket #1234 - IDE crashes when opening large files</DialogTitle>
                                      <DialogDescription>
                                        Support ticket details and conversation history
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-6">
                                      {/* Ticket Info */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label>Customer</Label>
                                          <p className="text-sm">John Doe (john.doe@example.com)</p>
                                        </div>
                                        <div>
                                          <Label>Status</Label>
                                          <div className="mt-1">
                                            <StatusBadge status="open" />
                                          </div>
                                        </div>
                                        <div>
                                          <Label>Priority</Label>
                                          <div className="mt-1">
                                            <PriorityBadge priority="high" />
                                          </div>
                                        </div>
                                        <div>
                                          <Label>Assigned To</Label>
                                          <p className="text-sm">Alex Smith</p>
                                        </div>
                                      </div>

                                      {/* Description */}
                                      <div>
                                        <Label>Description</Label>
                                        <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                                          <p className="text-sm">
                                            When I try to open large JavaScript files ({'>'}1MB), the IDE becomes unresponsive and eventually crashes. 
                                            This happens consistently with files from our main project. The error occurs immediately after file selection.
                                          </p>
                                        </div>
                                      </div>

                                      {/* Conversation */}
                                      <div>
                                        <Label>Conversation</Label>
                                        <ScrollArea className="h-64 mt-2 border rounded-lg">
                                          <div className="p-4 space-y-4">
                                            <div className="flex space-x-3">
                                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                                                JD
                                              </div>
                                              <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                  <span className="font-medium text-sm">John Doe</span>
                                                  <span className="text-xs text-slate-500">2 hours ago</span>
                                                </div>
                                                <p className="text-sm mt-1">
                                                  I've attached a screenshot of the error message that appears before the crash.
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex space-x-3">
                                              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
                                                AS
                                              </div>
                                              <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                  <span className="font-medium text-sm">Alex Smith</span>
                                                  <Badge variant="outline" className="text-xs">Admin</Badge>
                                                  <span className="text-xs text-slate-500">1 hour ago</span>
                                                </div>
                                                <p className="text-sm mt-1">
                                                  Thank you for reporting this issue. We're investigating the problem with large file handling. 
                                                  Can you please let me know which browser you're using and the approximate size of the files?
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </ScrollArea>
                                      </div>

                                      {/* Reply Section */}
                                      <div>
                                        <Label>Reply</Label>
                                        <div className="mt-2 space-y-3">
                                          <Textarea
                                            placeholder="Type your reply..."
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            rows={4}
                                          />
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                              <Button variant="outline" size="sm">
                                                <Paperclip className="h-4 w-4 mr-2" />
                                                Attach File
                                              </Button>
                                              <Select>
                                                <SelectTrigger className="w-40">
                                                  <SelectValue placeholder="Change Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                                  <SelectItem value="pending">Pending</SelectItem>
                                                  <SelectItem value="resolved">Resolved</SelectItem>
                                                  <SelectItem value="closed">Closed</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <Button
                                              onClick={() => sendReplyMutation.mutate({
                                                ticketId: 1234,
                                                message: replyMessage
                                              })}
                                              disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                                            >
                                              <Send className="h-4 w-4 mr-2" />
                                              Send Reply
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button variant="outline" size="sm">
                                  <Reply className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          <TableRow className="cursor-pointer hover:bg-slate-50">
                            <TableCell>
                              <div>
                                <p className="font-medium">#1233 - Billing question about subscription</p>
                                <p className="text-sm text-slate-500">Billing</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">Jane Smith</p>
                                <p className="text-sm text-slate-500">jane.smith@example.com</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status="in_progress" />
                            </TableCell>
                            <TableCell>
                              <PriorityBadge priority="medium" />
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">Sarah Johnson</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Reply className="h-4 w-4" />
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

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Providers</CardTitle>
                <CardDescription>
                  Manage external support providers and contractors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <Input
                    placeholder="Search providers..."
                    className="max-w-sm"
                  />
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Provider
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">TechSupport Pro</CardTitle>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <CardDescription>
                        24/7 technical support specialist
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Rating</span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">4.8</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Response Time</span>
                          <span className="text-sm font-medium">{'<'} 1 hour</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Support Types</span>
                          <div className="flex space-x-1">
                            <Badge variant="outline" className="text-xs">Technical</Badge>
                            <Badge variant="outline" className="text-xs">General</Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Mail className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">BillingSolutions Inc</CardTitle>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <CardDescription>
                        Specialized billing and payment support
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Rating</span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">4.6</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Response Time</span>
                          <span className="text-sm font-medium">2-4 hours</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Support Types</span>
                          <div className="flex space-x-1">
                            <Badge variant="outline" className="text-xs">Billing</Badge>
                          </div>
                        </div>
                        <div className="flex space-x-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Mail className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Response Time Trends
                  </CardTitle>
                  <CardDescription>
                    Average response time over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-500">
                    Response time chart visualization would go here
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Ticket Categories
                  </CardTitle>
                  <CardDescription>
                    Distribution of tickets by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm">Technical Issues</span>
                      </div>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">Billing Questions</span>
                      </div>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">General Inquiries</span>
                      </div>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-sm">Feature Requests</span>
                      </div>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Key support performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">94%</div>
                    <div className="text-sm text-slate-600">Resolution Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">2.4h</div>
                    <div className="text-sm text-slate-600">Avg Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">4.8/5</div>
                    <div className="text-sm text-slate-600">Customer Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">1.2d</div>
                    <div className="text-sm text-slate-600">Avg Resolution Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Settings</CardTitle>
                <CardDescription>
                  Configure support system preferences and automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="auto-assign">Auto-assign Tickets</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <input type="checkbox" id="auto-assign" defaultChecked />
                      <span className="text-sm">Automatically assign new tickets to available agents</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="response-time">Target Response Time (hours)</Label>
                    <Input
                      id="response-time"
                      type="number"
                      defaultValue="2"
                      className="max-w-xs mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="escalation-time">Auto-escalation Time (hours)</Label>
                    <Input
                      id="escalation-time"
                      type="number"
                      defaultValue="24"
                      className="max-w-xs mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notification-email">Notification Email</Label>
                    <Input
                      id="notification-email"
                      type="email"
                      defaultValue="support@deepblueide.dev"
                      className="max-w-md mt-2"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="email-notifications" defaultChecked />
                    <Label htmlFor="email-notifications">Send email notifications for new tickets</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="customer-surveys" defaultChecked />
                    <Label htmlFor="customer-surveys">Send satisfaction surveys after resolution</Label>
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