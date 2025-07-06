import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  Shield,
  Server,
  Settings,
  Check,
  X,
  AlertTriangle,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  Zap
} from "lucide-react";

interface DomainConfig {
  id: string;
  domain: string;
  subdomain?: string;
  environment: 'development' | 'staging' | 'production';
  isActive: boolean;
  sslEnabled: boolean;
  sslStatus: 'active' | 'pending' | 'expired' | 'none';
  sslExpiry?: Date;
  dnsStatus: 'connected' | 'pending' | 'failed';
  lastChecked: Date;
  redirects: DomainRedirect[];
  customHeaders: Record<string, string>;
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
  cacheSettings: {
    enabled: boolean;
    ttl: number;
    staticAssets: boolean;
  };
}

interface DomainRedirect {
  id: string;
  source: string;
  destination: string;
  type: 'permanent' | 'temporary';
  enabled: boolean;
}

const DomainConfig: React.FC = () => {
  const [domains, setDomains] = useState<DomainConfig[]>([
    {
      id: '1',
      domain: 'deepblueide.dev',
      subdomain: 'www',
      environment: 'production',
      isActive: true,
      sslEnabled: true,
      sslStatus: 'active',
      sslExpiry: new Date('2025-12-31'),
      dnsStatus: 'connected',
      lastChecked: new Date(),
      redirects: [
        {
          id: 'r1',
          source: 'deepblueide.com',
          destination: 'https://deepblueide.dev',
          type: 'permanent',
          enabled: true
        },
        {
          id: 'r2',
          source: 'www.deepblueide.com',
          destination: 'https://deepblueide.dev',
          type: 'permanent',
          enabled: true
        }
      ],
      customHeaders: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      },
      rateLimit: {
        enabled: true,
        requestsPerMinute: 1000,
        burstLimit: 100
      },
      cacheSettings: {
        enabled: true,
        ttl: 3600,
        staticAssets: true
      }
    },
    {
      id: '2',
      domain: 'api.deepblueide.dev',
      environment: 'production',
      isActive: true,
      sslEnabled: true,
      sslStatus: 'active',
      sslExpiry: new Date('2025-12-31'),
      dnsStatus: 'connected',
      lastChecked: new Date(),
      redirects: [],
      customHeaders: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      rateLimit: {
        enabled: true,
        requestsPerMinute: 5000,
        burstLimit: 500
      },
      cacheSettings: {
        enabled: false,
        ttl: 0,
        staticAssets: false
      }
    },
    {
      id: '3',
      domain: 'staging.deepblueide.dev',
      environment: 'staging',
      isActive: true,
      sslEnabled: true,
      sslStatus: 'active',
      sslExpiry: new Date('2025-12-31'),
      dnsStatus: 'connected',
      lastChecked: new Date(),
      redirects: [],
      customHeaders: {},
      rateLimit: {
        enabled: true,
        requestsPerMinute: 500,
        burstLimit: 50
      },
      cacheSettings: {
        enabled: false,
        ttl: 0,
        staticAssets: false
      }
    }
  ]);

  const [selectedDomain, setSelectedDomain] = useState<DomainConfig | null>(domains[0]);
  const [newDomain, setNewDomain] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const { toast } = useToast();

  const addDomain = async () => {
    if (!newDomain.trim()) return;

    setIsAdding(true);
    
    // Simulate domain validation and addition
    setTimeout(() => {
      const domain: DomainConfig = {
        id: `${domains.length + 1}`,
        domain: newDomain.trim(),
        environment: 'development',
        isActive: false,
        sslEnabled: false,
        sslStatus: 'none',
        dnsStatus: 'pending',
        lastChecked: new Date(),
        redirects: [],
        customHeaders: {},
        rateLimit: {
          enabled: true,
          requestsPerMinute: 100,
          burstLimit: 10
        },
        cacheSettings: {
          enabled: false,
          ttl: 0,
          staticAssets: false
        }
      };

      setDomains(prev => [...prev, domain]);
      setNewDomain('');
      setIsAdding(false);
      
      toast({
        title: "Domain Added",
        description: `${newDomain} has been added. Configure DNS settings to activate.`,
      });
    }, 2000);
  };

  const removeDomain = (domainId: string) => {
    setDomains(prev => prev.filter(d => d.id !== domainId));
    if (selectedDomain?.id === domainId) {
      setSelectedDomain(domains[0] || null);
    }
    
    toast({
      title: "Domain Removed",
      description: "Domain configuration has been deleted.",
    });
  };

  const checkDomainStatus = async (domainId: string) => {
    setIsChecking(true);
    
    // Simulate domain status check
    setTimeout(() => {
      setDomains(prev => prev.map(d => 
        d.id === domainId 
          ? { ...d, lastChecked: new Date(), dnsStatus: 'connected' as const }
          : d
      ));
      setIsChecking(false);
      
      toast({
        title: "Status Updated",
        description: "Domain status has been refreshed.",
      });
    }, 1500);
  };

  const updateDomain = (domainId: string, updates: Partial<DomainConfig>) => {
    setDomains(prev => prev.map(d => 
      d.id === domainId ? { ...d, ...updates } : d
    ));
    
    if (selectedDomain?.id === domainId) {
      setSelectedDomain(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const copyDomainUrl = (domain: string) => {
    navigator.clipboard.writeText(`https://${domain}`);
    toast({
      title: "Copied",
      description: `Domain URL copied to clipboard`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'expired':
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'connected':
        return 'Connected';
      case 'pending':
        return 'Pending';
      case 'expired':
        return 'Expired';
      case 'failed':
        return 'Failed';
      case 'none':
        return 'None';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Domain Configuration</h2>
          <p className="text-slate-400 mt-2">Manage domains, SSL certificates, and DNS settings</p>
        </div>
        <Badge variant="outline" className="text-emerald-400 border-emerald-400">
          {domains.length} Domain{domains.length !== 1 ? 's' : ''} Configured
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain List */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Globe className="mr-2 h-5 w-5" />
              Domains
            </CardTitle>
            <CardDescription>
              Configured domains and subdomains
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Domain */}
            <div className="space-y-2">
              <Label htmlFor="newDomain" className="text-slate-300">Add New Domain</Label>
              <div className="flex space-x-2">
                <Input
                  id="newDomain"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Button
                  onClick={addDomain}
                  disabled={isAdding || !newDomain.trim()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isAdding ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Domain List */}
            <div className="space-y-2">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDomain?.id === domain.id
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  }`}
                  onClick={() => setSelectedDomain(domain)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-white font-medium truncate">
                          {domain.subdomain ? `${domain.subdomain}.` : ''}{domain.domain}
                        </p>
                        {domain.isActive && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {domain.environment}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(domain.dnsStatus)}`} />
                        <span className="text-xs text-slate-400">{getStatusText(domain.dnsStatus)}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyDomainUrl(domain.domain);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDomain(domain.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Domain Configuration */}
        <div className="lg:col-span-2">
          {selectedDomain ? (
            <Tabs defaultValue="general" className="space-y-4">
              <TabsList className="bg-slate-700 border-slate-600">
                <TabsTrigger value="general" className="data-[state=active]:bg-slate-600">General</TabsTrigger>
                <TabsTrigger value="ssl" className="data-[state=active]:bg-slate-600">SSL/TLS</TabsTrigger>
                <TabsTrigger value="dns" className="data-[state=active]:bg-slate-600">DNS</TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-slate-600">Security</TabsTrigger>
                <TabsTrigger value="performance" className="data-[state=active]:bg-slate-600">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">General Settings</CardTitle>
                    <CardDescription>Basic domain configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Domain</Label>
                        <Input
                          value={selectedDomain.domain}
                          onChange={(e) => updateDomain(selectedDomain.id, { domain: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Subdomain</Label>
                        <Input
                          value={selectedDomain.subdomain || ''}
                          onChange={(e) => updateDomain(selectedDomain.id, { subdomain: e.target.value })}
                          placeholder="www, api, staging"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-300">Environment</Label>
                      <Select
                        value={selectedDomain.environment}
                        onValueChange={(value: any) => updateDomain(selectedDomain.id, { environment: value })}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-slate-300">Active Domain</Label>
                        <p className="text-sm text-slate-400">Enable this domain for public access</p>
                      </div>
                      <Switch
                        checked={selectedDomain.isActive}
                        onCheckedChange={(checked) => updateDomain(selectedDomain.id, { isActive: checked })}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => checkDomainStatus(selectedDomain.id)}
                        disabled={isChecking}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isChecking ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Check Status
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(`https://${selectedDomain.domain}`, '_blank')}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visit Domain
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ssl">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      SSL/TLS Configuration
                    </CardTitle>
                    <CardDescription>Secure socket layer settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-slate-300">SSL Enabled</Label>
                        <p className="text-sm text-slate-400">Enable HTTPS encryption</p>
                      </div>
                      <Switch
                        checked={selectedDomain.sslEnabled}
                        onCheckedChange={(checked) => updateDomain(selectedDomain.id, { sslEnabled: checked })}
                      />
                    </div>

                    {selectedDomain.sslEnabled && (
                      <>
                        <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedDomain.sslStatus)}`} />
                          <div>
                            <p className="text-white font-medium">SSL Status: {getStatusText(selectedDomain.sslStatus)}</p>
                            {selectedDomain.sslExpiry && (
                              <p className="text-sm text-slate-400">
                                Expires: {selectedDomain.sslExpiry.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            SSL certificates are automatically managed and renewed. Manual intervention is rarely needed.
                          </AlertDescription>
                        </Alert>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dns">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">DNS Settings</CardTitle>
                    <CardDescription>Domain name system configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedDomain.dnsStatus)}`} />
                      <div>
                        <p className="text-white font-medium">DNS Status: {getStatusText(selectedDomain.dnsStatus)}</p>
                        <p className="text-sm text-slate-400">
                          Last checked: {selectedDomain.lastChecked.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-300">DNS Records</Label>
                      <div className="mt-2 space-y-2">
                        <div className="p-3 bg-slate-700 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-mono">A</p>
                              <p className="text-sm text-slate-400">{selectedDomain.domain}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-mono">192.168.1.100</p>
                              <p className="text-sm text-slate-400">TTL: 300</p>
                            </div>
                          </div>
                        </div>
                        {selectedDomain.subdomain && (
                          <div className="p-3 bg-slate-700 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-white font-mono">CNAME</p>
                                <p className="text-sm text-slate-400">{selectedDomain.subdomain}.{selectedDomain.domain}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-mono">{selectedDomain.domain}</p>
                                <p className="text-sm text-slate-400">TTL: 300</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Alert>
                      <Globe className="h-4 w-4" />
                      <AlertDescription>
                        DNS changes may take up to 48 hours to propagate globally. Check status periodically.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Security Headers</CardTitle>
                    <CardDescription>HTTP security headers and rate limiting</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Custom Headers</Label>
                      <div className="mt-2 space-y-2">
                        {Object.entries(selectedDomain.customHeaders).map(([key, value]) => (
                          <div key={key} className="flex space-x-2">
                            <Input
                              value={key}
                              placeholder="Header name"
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                            <Input
                              value={value}
                              placeholder="Header value"
                              className="bg-slate-700 border-slate-600 text-white flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newHeaders = { ...selectedDomain.customHeaders };
                                delete newHeaders[key];
                                updateDomain(selectedDomain.id, { customHeaders: newHeaders });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newHeaders = { ...selectedDomain.customHeaders, 'New-Header': 'value' };
                            updateDomain(selectedDomain.id, { customHeaders: newHeaders });
                          }}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Header
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-300">Rate Limiting</Label>
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-400">Enable Rate Limiting</Label>
                          <Switch
                            checked={selectedDomain.rateLimit.enabled}
                            onCheckedChange={(checked) => 
                              updateDomain(selectedDomain.id, { 
                                rateLimit: { ...selectedDomain.rateLimit, enabled: checked }
                              })
                            }
                          />
                        </div>
                        {selectedDomain.rateLimit.enabled && (
                          <>
                            <div>
                              <Label className="text-slate-400">Requests per minute</Label>
                              <Input
                                type="number"
                                value={selectedDomain.rateLimit.requestsPerMinute}
                                onChange={(e) => 
                                  updateDomain(selectedDomain.id, { 
                                    rateLimit: { 
                                      ...selectedDomain.rateLimit, 
                                      requestsPerMinute: parseInt(e.target.value) || 0 
                                    }
                                  })
                                }
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-400">Burst limit</Label>
                              <Input
                                type="number"
                                value={selectedDomain.rateLimit.burstLimit}
                                onChange={(e) => 
                                  updateDomain(selectedDomain.id, { 
                                    rateLimit: { 
                                      ...selectedDomain.rateLimit, 
                                      burstLimit: parseInt(e.target.value) || 0 
                                    }
                                  })
                                }
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Zap className="mr-2 h-5 w-5" />
                      Performance Settings
                    </CardTitle>
                    <CardDescription>Caching and optimization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-slate-300">Enable Caching</Label>
                        <p className="text-sm text-slate-400">Cache responses to improve performance</p>
                      </div>
                      <Switch
                        checked={selectedDomain.cacheSettings.enabled}
                        onCheckedChange={(checked) => 
                          updateDomain(selectedDomain.id, { 
                            cacheSettings: { ...selectedDomain.cacheSettings, enabled: checked }
                          })
                        }
                      />
                    </div>

                    {selectedDomain.cacheSettings.enabled && (
                      <>
                        <div>
                          <Label className="text-slate-300">Cache TTL (seconds)</Label>
                          <Input
                            type="number"
                            value={selectedDomain.cacheSettings.ttl}
                            onChange={(e) => 
                              updateDomain(selectedDomain.id, { 
                                cacheSettings: { 
                                  ...selectedDomain.cacheSettings, 
                                  ttl: parseInt(e.target.value) || 0 
                                }
                              })
                            }
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-slate-300">Cache Static Assets</Label>
                            <p className="text-sm text-slate-400">Cache CSS, JS, images, and other static files</p>
                          </div>
                          <Switch
                            checked={selectedDomain.cacheSettings.staticAssets}
                            onCheckedChange={(checked) => 
                              updateDomain(selectedDomain.id, { 
                                cacheSettings: { ...selectedDomain.cacheSettings, staticAssets: checked }
                              })
                            }
                          />
                        </div>
                      </>
                    )}

                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        Aggressive caching can improve performance but may cause delays in content updates.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Globe className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">Select a domain to configure its settings</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DomainConfig;