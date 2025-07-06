import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Server,
  Database,
  Globe,
  Cpu,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Monitor,
  Wifi,
  Shield,
  Zap,
  Bell,
  Eye,
  AlertCircle,
  XCircle,
  Cloud,
  Network,
  Lock,
  Key,
  Gauge
} from 'lucide-react';

export function SystemsStatus() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch system status data
  const { data: systemStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/admin/system-status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch service health data
  const { data: serviceHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/admin/service-health'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch performance metrics
  const { data: performanceMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/admin/performance-metrics'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch incident history
  const { data: incidentHistory, isLoading: incidentsLoading } = useQuery({
    queryKey: ['/api/admin/incidents'],
  });

  // System action mutations
  const refreshSystemMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/admin/system-status'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/admin/service-health'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/admin/performance-metrics'] }),
      ]);
    },
    onSuccess: () => {
      toast({
        title: "System Refreshed",
        description: "All system status data has been updated.",
      });
    },
  });

  const toggleMaintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest('POST', '/api/admin/maintenance-mode', { enabled });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Maintenance Mode Updated",
        description: `Maintenance mode has been ${maintenanceMode ? 'disabled' : 'enabled'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-status'] });
    },
  });

  const restartServiceMutation = useMutation({
    mutationFn: async (serviceName: string) => {
      const response = await apiRequest('POST', '/api/admin/restart-service', { serviceName });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Service Restarted",
        description: "The service has been successfully restarted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/service-health'] });
    },
  });

  // Mock data for demonstration
  const mockSystemStatus = {
    overallHealth: 'healthy',
    uptime: '99.98%',
    responseTime: '145ms',
    totalUsers: 1247,
    activeUsers: 342,
    errorRate: '0.02%',
    lastUpdated: new Date().toISOString(),
  };

  const mockServiceHealth = [
    { name: 'API Server', status: 'healthy', uptime: '99.99%', responseTime: '45ms', cpu: 35, memory: 67 },
    { name: 'Database', status: 'healthy', uptime: '99.95%', responseTime: '12ms', cpu: 22, memory: 45 },
    { name: 'File Storage', status: 'warning', uptime: '99.87%', responseTime: '234ms', cpu: 78, memory: 89 },
    { name: 'Authentication', status: 'healthy', uptime: '100%', responseTime: '23ms', cpu: 15, memory: 32 },
    { name: 'Code Execution', status: 'healthy', uptime: '99.92%', responseTime: '567ms', cpu: 45, memory: 56 },
    { name: 'Real-time Sync', status: 'degraded', uptime: '98.12%', responseTime: '1.2s', cpu: 85, memory: 92 },
  ];

  const mockPerformanceMetrics = {
    cpu: { current: 45, average: 38, peak: 78 },
    memory: { current: 67, average: 62, peak: 89 },
    disk: { current: 34, average: 31, peak: 45 },
    network: { current: 23, average: 28, peak: 67 },
    requests: { current: 1247, total: 45623, errors: 12 },
    bandwidth: { incoming: '2.3 GB/h', outgoing: '4.7 GB/h' },
  };

  const mockIncidents = [
    {
      id: 1,
      title: 'File Storage Slowdown',
      status: 'investigating',
      severity: 'medium',
      startTime: '2025-01-04T18:45:00Z',
      description: 'Users experiencing slower file upload speeds',
      updates: 3,
    },
    {
      id: 2,
      title: 'API Rate Limiting Issues',
      status: 'resolved',
      severity: 'low',
      startTime: '2025-01-04T14:20:00Z',
      endTime: '2025-01-04T15:30:00Z',
      description: 'Some users encountered rate limiting errors',
      updates: 5,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'degraded': return 'bg-orange-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'down': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge className="bg-orange-500 text-white">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-500 text-white">Medium</Badge>;
      case 'low': return <Badge variant="secondary">Low</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (statusLoading || healthLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Overall Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Systems Status</h2>
          <p className="text-slate-600">Real-time monitoring and health status of all platform services</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => refreshSystemMutation.mutate()}
            disabled={refreshSystemMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshSystemMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center space-x-2">
            <Switch
              checked={maintenanceMode}
              onCheckedChange={(checked) => {
                setMaintenanceMode(checked);
                toggleMaintenanceMutation.mutate(checked);
              }}
            />
            <Label>Maintenance Mode</Label>
          </div>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Overall Health</p>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon('healthy')}
                  <span className="text-lg font-semibold text-green-600">Operational</span>
                </div>
              </div>
              <Monitor className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Uptime</p>
                <p className="text-lg font-semibold text-slate-900">99.98%</p>
                <p className="text-xs text-slate-500">Last 30 days</p>
              </div>
              <TrendingUp className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Response Time</p>
                <p className="text-lg font-semibold text-slate-900">145ms</p>
                <p className="text-xs text-slate-500">Average</p>
              </div>
              <Zap className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Users</p>
                <p className="text-lg font-semibold text-slate-900">342</p>
                <p className="text-xs text-slate-500">of 1,247 total</p>
              </div>
              <Activity className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Status Interface */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Gauge className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center space-x-2">
            <Server className="h-4 w-4" />
            <span>Services</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Incidents</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  System Health Overview
                </CardTitle>
                <CardDescription>
                  Real-time status of all critical system components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockServiceHealth.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <p className="font-medium text-slate-900">{service.name}</p>
                        <p className="text-sm text-slate-600">Uptime: {service.uptime}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{service.responseTime}</p>
                      <p className="text-xs text-slate-500">Response time</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest system events and status changes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Database backup completed</p>
                      <p className="text-xs text-slate-600">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">File storage performance warning</p>
                      <p className="text-xs text-slate-600">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">System update deployed</p>
                      <p className="text-xs text-slate-600">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Security scan completed</p>
                      <p className="text-xs text-slate-600">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockServiceHealth.map((service, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}></div>
                  </div>
                  <CardDescription className="flex items-center space-x-2">
                    {getStatusIcon(service.status)}
                    <span className="capitalize">{service.status}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-slate-600">CPU Usage</span>
                        <span className="text-sm font-medium">{service.cpu}%</span>
                      </div>
                      <Progress value={service.cpu} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-slate-600">Memory Usage</span>
                        <span className="text-sm font-medium">{service.memory}%</span>
                      </div>
                      <Progress value={service.memory} className="h-2" />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-slate-600">Uptime</p>
                      <p className="font-medium">{service.uptime}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Response</p>
                      <p className="font-medium">{service.responseTime}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => restartServiceMutation.mutate(service.name)}
                    disabled={restartServiceMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart Service
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cpu className="h-5 w-5 mr-2" />
                  Resource Usage
                </CardTitle>
                <CardDescription>
                  Current system resource utilization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">CPU Usage</span>
                      <span className="text-sm">{mockPerformanceMetrics.cpu.current}%</span>
                    </div>
                    <Progress value={mockPerformanceMetrics.cpu.current} className="h-3" />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Avg: {mockPerformanceMetrics.cpu.average}%</span>
                      <span>Peak: {mockPerformanceMetrics.cpu.peak}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Memory Usage</span>
                      <span className="text-sm">{mockPerformanceMetrics.memory.current}%</span>
                    </div>
                    <Progress value={mockPerformanceMetrics.memory.current} className="h-3" />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Avg: {mockPerformanceMetrics.memory.average}%</span>
                      <span>Peak: {mockPerformanceMetrics.memory.peak}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Disk Usage</span>
                      <span className="text-sm">{mockPerformanceMetrics.disk.current}%</span>
                    </div>
                    <Progress value={mockPerformanceMetrics.disk.current} className="h-3" />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Avg: {mockPerformanceMetrics.disk.average}%</span>
                      <span>Peak: {mockPerformanceMetrics.disk.peak}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Network Usage</span>
                      <span className="text-sm">{mockPerformanceMetrics.network.current}%</span>
                    </div>
                    <Progress value={mockPerformanceMetrics.network.current} className="h-3" />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Avg: {mockPerformanceMetrics.network.average}%</span>
                      <span>Peak: {mockPerformanceMetrics.network.peak}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Traffic & Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Traffic & Requests
                </CardTitle>
                <CardDescription>
                  API requests and bandwidth usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Current Requests</p>
                    <p className="text-2xl font-bold text-blue-700">{mockPerformanceMetrics.requests.current}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Total Requests</p>
                    <p className="text-2xl font-bold text-green-700">{mockPerformanceMetrics.requests.total.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">Error Count</p>
                    <p className="text-2xl font-bold text-orange-700">{mockPerformanceMetrics.requests.errors}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Error Rate</p>
                    <p className="text-2xl font-bold text-purple-700">0.03%</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Incoming Bandwidth</span>
                    </div>
                    <span className="text-sm font-semibold">{mockPerformanceMetrics.bandwidth.incoming}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Outgoing Bandwidth</span>
                    </div>
                    <span className="text-sm font-semibold">{mockPerformanceMetrics.bandwidth.outgoing}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Incident Management</h3>
              <p className="text-sm text-slate-600">Track and manage system incidents and outages</p>
            </div>
            <Button>
              <Bell className="h-4 w-4 mr-2" />
              Create Incident
            </Button>
          </div>

          <div className="space-y-4">
            {mockIncidents.map((incident) => (
              <Card key={incident.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-slate-900">{incident.title}</h4>
                        {getSeverityBadge(incident.severity)}
                        <Badge variant={incident.status === 'resolved' ? 'secondary' : 'destructive'}>
                          {incident.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{incident.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span>Started: {new Date(incident.startTime).toLocaleString()}</span>
                        {incident.endTime && (
                          <span>Resolved: {new Date(incident.endTime).toLocaleString()}</span>
                        )}
                        <span>{incident.updates} updates</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {incident.status !== 'resolved' && (
                        <Button variant="outline" size="sm">
                          Update
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monitoring Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Monitoring Settings
                </CardTitle>
                <CardDescription>
                  Configure system monitoring and alerting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Real-time Monitoring</Label>
                      <p className="text-sm text-slate-600">Continuously monitor system health</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alert Notifications</Label>
                      <p className="text-sm text-slate-600">Send alerts for critical issues</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Performance Logging</Label>
                      <p className="text-sm text-slate-600">Log detailed performance metrics</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-healing</Label>
                      <p className="text-sm text-slate-600">Automatically restart failed services</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alert Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Alert Configuration
                </CardTitle>
                <CardDescription>
                  Set thresholds for system alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cpu-threshold">CPU Usage Alert (%)</Label>
                    <Input id="cpu-threshold" type="number" defaultValue="80" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="memory-threshold">Memory Usage Alert (%)</Label>
                    <Input id="memory-threshold" type="number" defaultValue="85" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="response-threshold">Response Time Alert (ms)</Label>
                    <Input id="response-threshold" type="number" defaultValue="1000" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="error-threshold">Error Rate Alert (%)</Label>
                    <Input id="error-threshold" type="number" defaultValue="5" className="mt-1" />
                  </div>
                  <Button className="w-full">
                    Save Alert Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}