import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Code,
  CreditCard,
  Users,
  Shield,
  Database,
  Server,
  Globe,
  Zap,
  Terminal,
  FileText,
  Palette,
  Bell,
  Lock,
  Key,
  Mail,
  DollarSign,
  Package,
  Cpu,
  HardDrive,
  Network,
  Monitor,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';

interface AdminConfig {
  // System Settings
  system: {
    maintenanceMode: boolean;
    maxConcurrentUsers: number;
    systemName: string;
    systemVersion: string;
    autoBackup: boolean;
    backupFrequency: string;
    logLevel: string;
    debugMode: boolean;
  };
  
  // Feature Toggles
  features: {
    aiAssistant: boolean;
    codeExecution: boolean;
    fileSharing: boolean;
    collaboration: boolean;
    gitIntegration: boolean;
    terminalAccess: boolean;
    packageManager: boolean;
    debugger: boolean;
    gameEngine: boolean;
    mobileFramework: boolean;
    umlDesigner: boolean;
    mathLibrary: boolean;
    audioVideoEditor: boolean;
    betaAccess: boolean;
    advancedEditor: boolean;
    multiLanguageSupport: boolean;
    cloudStorage: boolean;
    realTimeCollaboration: boolean;
    codeAnalysis: boolean;
    performanceMonitoring: boolean;
  };
  
  // Billing Configuration
  billing: {
    freeTierLimits: {
      maxProjects: number;
      storageLimit: string;
      aiRequestsPerDay: number;
      supportedLanguages: number;
      collaborators: number;
    };
    goldTierLimits: {
      maxProjects: number;
      storageLimit: string;
      aiRequestsPerDay: number;
      supportedLanguages: number;
      collaborators: number;
      price: number;
    };
    platinumTierLimits: {
      maxProjects: number;
      storageLimit: string;
      aiRequestsPerDay: string;
      supportedLanguages: number;
      collaborators: number;
      price: number;
    };
    paymentMethods: string[];
    taxRate: number;
    trialPeriodDays: number;
    refundPeriodDays: number;
  };
  
  // Security Settings
  security: {
    enforceHttps: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    allowedDomains: string[];
    ipWhitelist: string[];
    encryptionEnabled: boolean;
    auditLogging: boolean;
  };
  
  // Performance Settings
  performance: {
    maxFileSize: number;
    executionTimeout: number;
    memoryLimit: number;
    cpuLimit: number;
    cacheExpiry: number;
    compressionEnabled: boolean;
    cdnEnabled: boolean;
    loadBalancing: boolean;
  };
  
  // UI/UX Configuration
  interface: {
    defaultTheme: string;
    allowThemeCustomization: boolean;
    defaultLanguage: string;
    supportedLanguages: string[];
    splashScreenEnabled: boolean;
    tutorialsEnabled: boolean;
    notificationsEnabled: boolean;
    soundEffectsEnabled: boolean;
  };
  
  // API Configuration
  api: {
    rateLimit: number;
    cors: {
      enabled: boolean;
      allowedOrigins: string[];
    };
    versioning: {
      currentVersion: string;
      supportedVersions: string[];
    };
    documentation: {
      enabled: boolean;
      publicAccess: boolean;
    };
  };
  
  // Integration Settings
  integrations: {
    github: {
      enabled: boolean;
      clientId: string;
      webhooksEnabled: boolean;
    };
    stripe: {
      enabled: boolean;
      webhooksEnabled: boolean;
      testMode: boolean;
    };
    openai: {
      enabled: boolean;
      model: string;
      maxTokens: number;
    };
    analytics: {
      enabled: boolean;
      provider: string;
      trackingId: string;
    };
  };
}

const defaultConfig: AdminConfig = {
  system: {
    maintenanceMode: false,
    maxConcurrentUsers: 1000,
    systemName: 'DeepBlue:Octopus IDE',
    systemVersion: '2.1.0',
    autoBackup: true,
    backupFrequency: 'daily',
    logLevel: 'info',
    debugMode: false,
  },
  features: {
    aiAssistant: true,
    codeExecution: true,
    fileSharing: true,
    collaboration: true,
    gitIntegration: true,
    terminalAccess: true,
    packageManager: true,
    debugger: true,
    gameEngine: true,
    mobileFramework: true,
    umlDesigner: true,
    mathLibrary: true,
    audioVideoEditor: true,
    betaAccess: true,
    advancedEditor: true,
    multiLanguageSupport: true,
    cloudStorage: true,
    realTimeCollaboration: true,
    codeAnalysis: true,
    performanceMonitoring: true,
  },
  billing: {
    freeTierLimits: {
      maxProjects: 5,
      storageLimit: '100MB',
      aiRequestsPerDay: 50,
      supportedLanguages: 10,
      collaborators: 2,
    },
    goldTierLimits: {
      maxProjects: 50,
      storageLimit: '5GB',
      aiRequestsPerDay: 500,
      supportedLanguages: 20,
      collaborators: 10,
      price: 19.99,
    },
    platinumTierLimits: {
      maxProjects: 999,
      storageLimit: '50GB',
      aiRequestsPerDay: 'unlimited',
      supportedLanguages: 25,
      collaborators: 100,
      price: 49.99,
    },
    paymentMethods: ['credit_card', 'paypal', 'bank_transfer'],
    taxRate: 0.0875,
    trialPeriodDays: 14,
    refundPeriodDays: 30,
  },
  security: {
    enforceHttps: true,
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
    allowedDomains: ['deepblueide.dev'],
    ipWhitelist: [],
    encryptionEnabled: true,
    auditLogging: true,
  },
  performance: {
    maxFileSize: 50,
    executionTimeout: 30,
    memoryLimit: 512,
    cpuLimit: 80,
    cacheExpiry: 3600,
    compressionEnabled: true,
    cdnEnabled: true,
    loadBalancing: true,
  },
  interface: {
    defaultTheme: 'deepblue-dark',
    allowThemeCustomization: true,
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja'],
    splashScreenEnabled: true,
    tutorialsEnabled: true,
    notificationsEnabled: true,
    soundEffectsEnabled: true,
  },
  api: {
    rateLimit: 1000,
    cors: {
      enabled: true,
      allowedOrigins: ['https://deepblueide.dev', 'http://localhost:3000'],
    },
    versioning: {
      currentVersion: 'v2.1',
      supportedVersions: ['v2.0', 'v2.1'],
    },
    documentation: {
      enabled: true,
      publicAccess: true,
    },
  },
  integrations: {
    github: {
      enabled: true,
      clientId: '',
      webhooksEnabled: false,
    },
    stripe: {
      enabled: true,
      webhooksEnabled: true,
      testMode: true,
    },
    openai: {
      enabled: true,
      model: 'gpt-4',
      maxTokens: 4000,
    },
    analytics: {
      enabled: true,
      provider: 'custom',
      trackingId: '',
    },
  },
};

export function AdminConfiguration() {
  const [config, setConfig] = useState<AdminConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('system');
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/configuration');
      if (response.ok) {
        const data = await response.json();
        setConfig({ ...defaultConfig, ...data });
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to load configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Configuration saved successfully',
        });
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setConfig(defaultConfig);
    toast({
      title: 'Reset',
      description: 'Configuration reset to defaults',
    });
  };

  const updateConfig = (section: keyof AdminConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const updateNestedConfig = (section: keyof AdminConfig, subsection: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [key]: value,
        },
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
          <p className="text-gray-600">Configure all aspects of the DeepBlue:Octopus IDE platform</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={resetToDefaults}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset to Defaults</span>
          </Button>
          <Button
            onClick={saveConfiguration}
            disabled={isSaving}
            className="flex items-center space-x-2"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="system" className="flex items-center space-x-1">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center space-x-1">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-1">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-1">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-1">
            <Cpu className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="interface" className="flex items-center space-x-1">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Interface</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center space-x-1">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">API</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-1">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
        </TabsList>

        {/* System Configuration */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>System Settings</span>
              </CardTitle>
              <CardDescription>Configure core system parameters and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="systemName">System Name</Label>
                  <Input
                    id="systemName"
                    value={config.system.systemName}
                    onChange={(e) => updateConfig('system', 'systemName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemVersion">System Version</Label>
                  <Input
                    id="systemVersion"
                    value={config.system.systemVersion}
                    onChange={(e) => updateConfig('system', 'systemVersion', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsers">Max Concurrent Users</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={config.system.maxConcurrentUsers}
                    onChange={(e) => updateConfig('system', 'maxConcurrentUsers', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select
                    value={config.system.backupFrequency}
                    onValueChange={(value) => updateConfig('system', 'backupFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">Temporarily disable user access</p>
                  </div>
                  <Switch
                    checked={config.system.maintenanceMode}
                    onCheckedChange={(checked) => updateConfig('system', 'maintenanceMode', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Backup</Label>
                    <p className="text-sm text-gray-500">Automatically backup system data</p>
                  </div>
                  <Switch
                    checked={config.system.autoBackup}
                    onCheckedChange={(checked) => updateConfig('system', 'autoBackup', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Debug Mode</Label>
                    <p className="text-sm text-gray-500">Enable detailed logging and debugging</p>
                  </div>
                  <Switch
                    checked={config.system.debugMode}
                    onCheckedChange={(checked) => updateConfig('system', 'debugMode', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Configuration */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Feature Toggles</span>
              </CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(config.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <p className="text-xs text-gray-500">
                        {value ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => updateConfig('features', key, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Configuration */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Free Tier */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Free Tier</span>
                  <Badge variant="secondary">$0/month</Badge>
                </CardTitle>
                <CardDescription>Basic features for individual users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Projects</Label>
                  <Input
                    type="number"
                    value={config.billing.freeTierLimits.maxProjects}
                    onChange={(e) => updateNestedConfig('billing', 'freeTierLimits', 'maxProjects', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Storage Limit</Label>
                  <Input
                    value={config.billing.freeTierLimits.storageLimit}
                    onChange={(e) => updateNestedConfig('billing', 'freeTierLimits', 'storageLimit', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>AI Requests/Day</Label>
                  <Input
                    type="number"
                    value={config.billing.freeTierLimits.aiRequestsPerDay}
                    onChange={(e) => updateNestedConfig('billing', 'freeTierLimits', 'aiRequestsPerDay', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supported Languages</Label>
                  <Input
                    type="number"
                    value={config.billing.freeTierLimits.supportedLanguages}
                    onChange={(e) => updateNestedConfig('billing', 'freeTierLimits', 'supportedLanguages', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Gold Tier */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Gold Tier</span>
                  <Badge className="bg-yellow-500">${config.billing.goldTierLimits.price}/month</Badge>
                </CardTitle>
                <CardDescription>Enhanced features for professionals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Price (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.billing.goldTierLimits.price}
                    onChange={(e) => updateNestedConfig('billing', 'goldTierLimits', 'price', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Projects</Label>
                  <Input
                    type="number"
                    value={config.billing.goldTierLimits.maxProjects}
                    onChange={(e) => updateNestedConfig('billing', 'goldTierLimits', 'maxProjects', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Storage Limit</Label>
                  <Input
                    value={config.billing.goldTierLimits.storageLimit}
                    onChange={(e) => updateNestedConfig('billing', 'goldTierLimits', 'storageLimit', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>AI Requests/Day</Label>
                  <Input
                    type="number"
                    value={config.billing.goldTierLimits.aiRequestsPerDay}
                    onChange={(e) => updateNestedConfig('billing', 'goldTierLimits', 'aiRequestsPerDay', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Platinum Tier */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Platinum Tier</span>
                  <Badge className="bg-purple-500">${config.billing.platinumTierLimits.price}/month</Badge>
                </CardTitle>
                <CardDescription>Premium features for teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Price (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.billing.platinumTierLimits.price}
                    onChange={(e) => updateNestedConfig('billing', 'platinumTierLimits', 'price', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Projects</Label>
                  <Input
                    type="number"
                    value={config.billing.platinumTierLimits.maxProjects}
                    onChange={(e) => updateNestedConfig('billing', 'platinumTierLimits', 'maxProjects', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Storage Limit</Label>
                  <Input
                    value={config.billing.platinumTierLimits.storageLimit}
                    onChange={(e) => updateNestedConfig('billing', 'platinumTierLimits', 'storageLimit', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Collaborators</Label>
                  <Input
                    type="number"
                    value={config.billing.platinumTierLimits.collaborators}
                    onChange={(e) => updateNestedConfig('billing', 'platinumTierLimits', 'collaborators', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>Configure payment and billing options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={config.billing.taxRate * 100}
                    onChange={(e) => updateConfig('billing', 'taxRate', parseFloat(e.target.value) / 100)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trial Period (Days)</Label>
                  <Input
                    type="number"
                    value={config.billing.trialPeriodDays}
                    onChange={(e) => updateConfig('billing', 'trialPeriodDays', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Refund Period (Days)</Label>
                  <Input
                    type="number"
                    value={config.billing.refundPeriodDays}
                    onChange={(e) => updateConfig('billing', 'refundPeriodDays', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Configuration */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>Configure security and authentication parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Session Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={config.security.sessionTimeout}
                    onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password Min Length</Label>
                  <Input
                    type="number"
                    value={config.security.passwordMinLength}
                    onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enforce HTTPS</Label>
                    <p className="text-sm text-gray-500">Redirect HTTP to HTTPS</p>
                  </div>
                  <Switch
                    checked={config.security.enforceHttps}
                    onCheckedChange={(checked) => updateConfig('security', 'enforceHttps', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Require 2FA for all users</p>
                  </div>
                  <Switch
                    checked={config.security.requireTwoFactor}
                    onCheckedChange={(checked) => updateConfig('security', 'requireTwoFactor', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Encryption</Label>
                    <p className="text-sm text-gray-500">Enable data encryption</p>
                  </div>
                  <Switch
                    checked={config.security.encryptionEnabled}
                    onCheckedChange={(checked) => updateConfig('security', 'encryptionEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-gray-500">Log all security events</p>
                  </div>
                  <Switch
                    checked={config.security.auditLogging}
                    onCheckedChange={(checked) => updateConfig('security', 'auditLogging', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Configuration */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cpu className="h-5 w-5" />
                <span>Performance Settings</span>
              </CardTitle>
              <CardDescription>Configure resource limits and performance parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Max File Size (MB)</Label>
                  <Input
                    type="number"
                    value={config.performance.maxFileSize}
                    onChange={(e) => updateConfig('performance', 'maxFileSize', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Execution Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={config.performance.executionTimeout}
                    onChange={(e) => updateConfig('performance', 'executionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Memory Limit (MB)</Label>
                  <Input
                    type="number"
                    value={config.performance.memoryLimit}
                    onChange={(e) => updateConfig('performance', 'memoryLimit', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPU Limit (%)</Label>
                  <Input
                    type="number"
                    max="100"
                    value={config.performance.cpuLimit}
                    onChange={(e) => updateConfig('performance', 'cpuLimit', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compression</Label>
                    <p className="text-sm text-gray-500">Enable response compression</p>
                  </div>
                  <Switch
                    checked={config.performance.compressionEnabled}
                    onCheckedChange={(checked) => updateConfig('performance', 'compressionEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>CDN</Label>
                    <p className="text-sm text-gray-500">Use content delivery network</p>
                  </div>
                  <Switch
                    checked={config.performance.cdnEnabled}
                    onCheckedChange={(checked) => updateConfig('performance', 'cdnEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Load Balancing</Label>
                    <p className="text-sm text-gray-500">Distribute traffic across servers</p>
                  </div>
                  <Switch
                    checked={config.performance.loadBalancing}
                    onCheckedChange={(checked) => updateConfig('performance', 'loadBalancing', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interface Configuration */}
        <TabsContent value="interface" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>User Interface</span>
              </CardTitle>
              <CardDescription>Configure UI/UX settings and appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Theme</Label>
                  <Select
                    value={config.interface.defaultTheme}
                    onValueChange={(value) => updateConfig('interface', 'defaultTheme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deepblue-dark">DeepBlue Dark</SelectItem>
                      <SelectItem value="deepblue-light">DeepBlue Light</SelectItem>
                      <SelectItem value="classic-dark">Classic Dark</SelectItem>
                      <SelectItem value="classic-light">Classic Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select
                    value={config.interface.defaultLanguage}
                    onValueChange={(value) => updateConfig('interface', 'defaultLanguage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Theme Customization</Label>
                    <p className="text-sm text-gray-500">Allow users to customize themes</p>
                  </div>
                  <Switch
                    checked={config.interface.allowThemeCustomization}
                    onCheckedChange={(checked) => updateConfig('interface', 'allowThemeCustomization', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Splash Screen</Label>
                    <p className="text-sm text-gray-500">Show animated splash screen</p>
                  </div>
                  <Switch
                    checked={config.interface.splashScreenEnabled}
                    onCheckedChange={(checked) => updateConfig('interface', 'splashScreenEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tutorials</Label>
                    <p className="text-sm text-gray-500">Enable interactive tutorials</p>
                  </div>
                  <Switch
                    checked={config.interface.tutorialsEnabled}
                    onCheckedChange={(checked) => updateConfig('interface', 'tutorialsEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sound Effects</Label>
                    <p className="text-sm text-gray-500">Enable UI sound effects</p>
                  </div>
                  <Switch
                    checked={config.interface.soundEffectsEnabled}
                    onCheckedChange={(checked) => updateConfig('interface', 'soundEffectsEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Configuration */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>API Configuration</span>
              </CardTitle>
              <CardDescription>Configure API settings and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Rate Limit (requests/minute)</Label>
                  <Input
                    type="number"
                    value={config.api.rateLimit}
                    onChange={(e) => updateConfig('api', 'rateLimit', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Version</Label>
                  <Input
                    value={config.api.versioning.currentVersion}
                    onChange={(e) => updateNestedConfig('api', 'versioning', 'currentVersion', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>CORS</Label>
                    <p className="text-sm text-gray-500">Enable cross-origin requests</p>
                  </div>
                  <Switch
                    checked={config.api.cors.enabled}
                    onCheckedChange={(checked) => updateNestedConfig('api', 'cors', 'enabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Documentation</Label>
                    <p className="text-sm text-gray-500">Enable API documentation</p>
                  </div>
                  <Switch
                    checked={config.api.documentation.enabled}
                    onCheckedChange={(checked) => updateNestedConfig('api', 'documentation', 'enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Configuration */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>GitHub Integration</CardTitle>
                <CardDescription>Configure GitHub authentication and features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable GitHub Integration</Label>
                  <Switch
                    checked={config.integrations.github.enabled}
                    onCheckedChange={(checked) => updateNestedConfig('integrations', 'github', 'enabled', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client ID</Label>
                  <Input
                    value={config.integrations.github.clientId}
                    onChange={(e) => updateNestedConfig('integrations', 'github', 'clientId', e.target.value)}
                    placeholder="GitHub OAuth App Client ID"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Webhooks</Label>
                  <Switch
                    checked={config.integrations.github.webhooksEnabled}
                    onCheckedChange={(checked) => updateNestedConfig('integrations', 'github', 'webhooksEnabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stripe Integration</CardTitle>
                <CardDescription>Configure payment processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Stripe</Label>
                  <Switch
                    checked={config.integrations.stripe.enabled}
                    onCheckedChange={(checked) => updateNestedConfig('integrations', 'stripe', 'enabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Test Mode</Label>
                  <Switch
                    checked={config.integrations.stripe.testMode}
                    onCheckedChange={(checked) => updateNestedConfig('integrations', 'stripe', 'testMode', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Webhooks</Label>
                  <Switch
                    checked={config.integrations.stripe.webhooksEnabled}
                    onCheckedChange={(checked) => updateNestedConfig('integrations', 'stripe', 'webhooksEnabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OpenAI Integration</CardTitle>
                <CardDescription>Configure AI assistant features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable OpenAI</Label>
                  <Switch
                    checked={config.integrations.openai.enabled}
                    onCheckedChange={(checked) => updateNestedConfig('integrations', 'openai', 'enabled', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select
                    value={config.integrations.openai.model}
                    onValueChange={(value) => updateNestedConfig('integrations', 'openai', 'model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={config.integrations.openai.maxTokens}
                    onChange={(e) => updateNestedConfig('integrations', 'openai', 'maxTokens', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Configure usage analytics and tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Analytics</Label>
                  <Switch
                    checked={config.integrations.analytics.enabled}
                    onCheckedChange={(checked) => updateNestedConfig('integrations', 'analytics', 'enabled', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={config.integrations.analytics.provider}
                    onValueChange={(value) => updateNestedConfig('integrations', 'analytics', 'provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Analytics</SelectItem>
                      <SelectItem value="google">Google Analytics</SelectItem>
                      <SelectItem value="mixpanel">Mixpanel</SelectItem>
                      <SelectItem value="amplitude">Amplitude</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tracking ID</Label>
                  <Input
                    value={config.integrations.analytics.trackingId}
                    onChange={(e) => updateNestedConfig('integrations', 'analytics', 'trackingId', e.target.value)}
                    placeholder="Analytics tracking identifier"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}