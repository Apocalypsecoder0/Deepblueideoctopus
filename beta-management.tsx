import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Power,
  Users,
  Key,
  Settings,
  Plus,
  Copy,
  Trash2,
  Edit,
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Calendar,
  BarChart3,
  Activity,
  UserCheck,
  MessageSquare,
  Bug,
  Star,
  TrendingUp,
  Download,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface BetaSettings {
  betaSystemEnabled: boolean;
  autoApprovalEnabled: boolean;
  maxBetaUsers: number;
  currentBetaUsers: number;
  requiresVerification: boolean;
  allowedDomains: string[];
  betaFeatures: {
    [key: string]: boolean;
  };
}

interface BetaUser {
  id: number;
  email: string;
  accessLevel: string;
  status: string;
  joinedAt: string;
  lastActive: string;
  feedbackCount: number;
  bugsReported: number;
}

interface BetaToken {
  id: number;
  token: string;
  accessLevel: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string;
}

export function BetaManagement() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [generateTokenDialog, setGenerateTokenDialog] = useState(false);
  const [newTokenData, setNewTokenData] = useState({
    accessLevel: 'basic',
    maxUses: 1,
    expiresAt: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch beta settings
  const { data: betaSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/beta/settings'],
    refetchInterval: 30000,
  });

  // Fetch beta users
  const { data: betaUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/beta/users'],
    refetchInterval: 10000,
  });

  // Fetch beta tokens
  const { data: betaTokens, isLoading: tokensLoading } = useQuery({
    queryKey: ['/api/admin/beta/tokens'],
    refetchInterval: 10000,
  });

  // Toggle beta system
  const toggleBetaSystem = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest('POST', '/api/admin/beta/toggle', { enabled });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/beta/settings'] });
      toast({
        title: "Beta System Updated",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to toggle beta system",
        variant: "destructive",
      });
    },
  });

  // Generate new token
  const generateToken = useMutation({
    mutationFn: async (tokenData: any) => {
      return apiRequest('POST', '/api/admin/beta/generate-token', tokenData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/beta/tokens'] });
      setGenerateTokenDialog(false);
      setNewTokenData({ accessLevel: 'basic', maxUses: 1, expiresAt: '' });
      toast({
        title: "Token Generated",
        description: `New beta token created: ${data.token}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate token",
        variant: "destructive",
      });
    },
  });

  // Update beta settings
  const updateSettings = useMutation({
    mutationFn: async (settings: any) => {
      return apiRequest('POST', '/api/admin/beta/update-settings', settings);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/beta/settings'] });
      toast({
        title: "Settings Updated",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: "Copied",
      description: "Token copied to clipboard",
    });
  };

  const getAccessLevelBadge = (level: string) => {
    const colors = {
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      developer: 'bg-green-100 text-green-800',
      admin: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[level as keyof typeof colors] || colors.basic}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.inactive}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Beta Management</h2>
          <p className="text-muted-foreground">
            Manage beta access system, users, and tokens
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Power className="h-4 w-4" />
            <Label htmlFor="beta-toggle">Beta System</Label>
            <Switch
              id="beta-toggle"
              checked={betaSettings?.betaSystemEnabled || false}
              onCheckedChange={(checked) => toggleBetaSystem.mutate(checked)}
              disabled={toggleBetaSystem.isPending}
            />
          </div>
          
          <Dialog open={generateTokenDialog} onOpenChange={setGenerateTokenDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Token
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Beta Token</DialogTitle>
                <DialogDescription>
                  Create a new beta access token for users
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="access-level">Access Level</Label>
                  <Select 
                    value={newTokenData.accessLevel} 
                    onValueChange={(value) => setNewTokenData(prev => ({ ...prev, accessLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="max-uses">Max Uses</Label>
                  <Input
                    id="max-uses"
                    type="number"
                    value={newTokenData.maxUses}
                    onChange={(e) => setNewTokenData(prev => ({ ...prev, maxUses: parseInt(e.target.value) }))}
                    min="1"
                    max="999"
                  />
                </div>
                
                <div>
                  <Label htmlFor="expires-at">Expires At (Optional)</Label>
                  <Input
                    id="expires-at"
                    type="datetime-local"
                    value={newTokenData.expiresAt}
                    onChange={(e) => setNewTokenData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setGenerateTokenDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => generateToken.mutate(newTokenData)} disabled={generateToken.isPending}>
                  Generate Token
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Beta Users</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Beta Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{betaSettings?.currentBetaUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  of {betaSettings?.maxBetaUsers || 1000} max
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {betaTokens?.filter((t: BetaToken) => t.isActive).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {betaTokens?.length || 0} total tokens
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Feedback Count</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {betaUsers?.reduce((sum: number, user: BetaUser) => sum + user.feedbackCount, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  from {betaUsers?.length || 0} users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bugs Reported</CardTitle>
                <Bug className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {betaUsers?.reduce((sum: number, user: BetaUser) => sum + user.bugsReported, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  total bug reports
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current beta system configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Beta System</span>
                  <Badge variant={betaSettings?.betaSystemEnabled ? "default" : "secondary"}>
                    {betaSettings?.betaSystemEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Auto Approval</span>
                  <Badge variant={betaSettings?.autoApprovalEnabled ? "default" : "secondary"}>
                    {betaSettings?.autoApprovalEnabled ? "On" : "Off"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Requires Verification</span>
                  <Badge variant={betaSettings?.requiresVerification ? "default" : "secondary"}>
                    {betaSettings?.requiresVerification ? "Yes" : "No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest beta user activities</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-4">
                    {betaUsers?.slice(0, 5).map((user: BetaUser) => (
                      <div key={user.id} className="flex items-center space-x-4">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last active: {format(new Date(user.lastActive), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                        {getAccessLevelBadge(user.accessLevel)}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search beta users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Beta Users ({betaUsers?.length || 0})</CardTitle>
              <CardDescription>
                Manage beta testers and their access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {betaUsers?.map((user: BetaUser) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{user.email}</h4>
                            {getAccessLevelBadge(user.accessLevel)}
                            {getStatusBadge(user.status)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Joined: {format(new Date(user.joinedAt), 'MMM dd, yyyy')}</span>
                            <span>Last active: {format(new Date(user.lastActive), 'MMM dd, HH:mm')}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span>{user.feedbackCount} feedback submissions</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Bug className="h-4 w-4 text-muted-foreground" />
                          <span>{user.bugsReported} bugs reported</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Beta Tokens ({betaTokens?.length || 0})</CardTitle>
              <CardDescription>
                Manage beta access tokens and their usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {betaTokens?.map((token: BetaToken) => (
                    <div key={token.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                              {token.token}
                            </code>
                            {getAccessLevelBadge(token.accessLevel)}
                            <Badge variant={token.isActive ? "default" : "secondary"}>
                              {token.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Created: {format(new Date(token.createdAt), 'MMM dd, yyyy')}</span>
                            <span>By: {token.createdBy}</span>
                            {token.expiresAt && (
                              <span>Expires: {format(new Date(token.expiresAt), 'MMM dd, yyyy')}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleCopyToken(token.token)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <span>Usage: {token.usedCount}/{token.maxUses}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>Remaining: {token.maxUses - token.usedCount}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {token.expiresAt ? (
                            <span className={new Date(token.expiresAt) < new Date() ? 'text-red-600' : ''}>
                              {new Date(token.expiresAt) < new Date() ? 'Expired' : 'Valid'}
                            </span>
                          ) : (
                            <span>No expiration</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure beta access system behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-approval">Auto Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve beta access requests
                    </p>
                  </div>
                  <Switch
                    id="auto-approval"
                    checked={betaSettings?.autoApprovalEnabled || false}
                    onCheckedChange={(checked) => {
                      updateSettings.mutate({
                        ...betaSettings,
                        autoApprovalEnabled: checked
                      });
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requires-verification">Requires Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Require email verification for beta users
                    </p>
                  </div>
                  <Switch
                    id="requires-verification"
                    checked={betaSettings?.requiresVerification || false}
                    onCheckedChange={(checked) => {
                      updateSettings.mutate({
                        ...betaSettings,
                        requiresVerification: checked
                      });
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-users">Maximum Beta Users</Label>
                  <Input
                    id="max-users"
                    type="number"
                    value={betaSettings?.maxBetaUsers || 1000}
                    onChange={(e) => {
                      updateSettings.mutate({
                        ...betaSettings,
                        maxBetaUsers: parseInt(e.target.value)
                      });
                    }}
                    min="1"
                    max="10000"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Beta Features</CardTitle>
                <CardDescription>Enable/disable features for beta users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {betaSettings?.betaFeatures && Object.entries(betaSettings.betaFeatures).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={feature}>
                        {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                    </div>
                    <Switch
                      id={feature}
                      checked={enabled}
                      onCheckedChange={(checked) => {
                        updateSettings.mutate({
                          ...betaSettings,
                          betaFeatures: {
                            ...betaSettings.betaFeatures,
                            [feature]: checked
                          }
                        });
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}