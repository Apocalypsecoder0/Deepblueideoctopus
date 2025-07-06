import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Download,
  Upload,
  Package,
  FileText,
  Folder,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Settings,
  Info,
  Shield,
  Zap,
  Terminal,
  Code,
  Database,
  Globe,
  Users,
  Wrench
} from 'lucide-react';

interface PatchFile {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'feature' | 'bugfix' | 'security' | 'performance' | 'ui' | 'api';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'installing' | 'installed' | 'failed' | 'rollback';
  size: number;
  createdAt: Date;
  installDate?: Date;
  files: {
    path: string;
    action: 'create' | 'update' | 'delete';
    content?: string;
    backup?: string;
  }[];
  dependencies: string[];
  rollbackInfo?: {
    available: boolean;
    backupId: string;
  };
}

interface UpdatePackage {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'ide' | 'website' | 'admin' | 'api' | 'database' | 'security';
  files: string[];
  installScript: string;
  rollbackScript: string;
  checksums: Record<string, string>;
}

export function PatchManager() {
  const [selectedTab, setSelectedTab] = useState('patches');
  const [uploadDialog, setUploadDialog] = useState(false);
  const [installDialog, setInstallDialog] = useState(false);
  const [selectedPatch, setSelectedPatch] = useState<PatchFile | null>(null);
  const [installProgress, setInstallProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available patches
  const { data: patches = [], isLoading: patchesLoading } = useQuery({
    queryKey: ['/api/admin/patches'],
    refetchInterval: 30000,
  });

  // Fetch update packages
  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['/api/admin/update-packages'],
    refetchInterval: 30000,
  });

  // Fetch installation history
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['/api/admin/installation-history'],
    refetchInterval: 30000,
  });

  // Install patch mutation
  const installPatchMutation = useMutation({
    mutationFn: async (patchId: string) => {
      const response = await apiRequest('POST', `/api/admin/patches/${patchId}/install`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Installation Started",
        description: "Patch installation is in progress",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/patches'] });
      setInstallDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Installation Failed",
        description: error.message || "Failed to start patch installation",
        variant: "destructive",
      });
    },
  });

  // Upload patch mutation
  const uploadPatchMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/admin/patches/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "Patch file uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/patches'] });
      setUploadDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload patch file",
        variant: "destructive",
      });
    },
  });

  // Rollback patch mutation
  const rollbackPatchMutation = useMutation({
    mutationFn: async (patchId: string) => {
      const response = await apiRequest('POST', `/api/admin/patches/${patchId}/rollback`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Rollback Started",
        description: "Patch rollback is in progress",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/patches'] });
    },
    onError: (error: any) => {
      toast({
        title: "Rollback Failed",
        description: error.message || "Failed to rollback patch",
        variant: "destructive",
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'installed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'installing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'rollback': return <RotateCcw className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Zap className="h-4 w-4" />;
      case 'bugfix': return <Wrench className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'performance': return <Terminal className="h-4 w-4" />;
      case 'ui': return <Code className="h-4 w-4" />;
      case 'api': return <Database className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('patch', file);
    uploadPatchMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Patch Manager</h1>
            <p className="text-slate-600">System updates, patches, and file management</p>
          </div>
          <div className="flex items-center space-x-3">
            <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Patch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Patch File</DialogTitle>
                  <DialogDescription>
                    Upload a new patch file (.patch, .zip, .tar.gz)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="patch-file">Patch File</Label>
                    <Input
                      id="patch-file"
                      type="file"
                      accept=".patch,.zip,.tar.gz,.json"
                      onChange={handleFileUpload}
                      className="mt-2"
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patches">Available Patches</TabsTrigger>
            <TabsTrigger value="packages">Update Packages</TabsTrigger>
            <TabsTrigger value="history">Installation History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Available Patches Tab */}
          <TabsContent value="patches" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {patches.map((patch: PatchFile) => (
                <Card key={patch.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(patch.type)}
                        <CardTitle className="text-lg">{patch.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(patch.status)}
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(patch.priority)}`} />
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {patch.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Version: {patch.version}</span>
                      <Badge variant="outline">{patch.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Size: {(patch.size / 1024).toFixed(1)} KB</span>
                      <span>Files: {patch.files.length}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {patch.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPatch(patch);
                            setInstallDialog(true);
                          }}
                          className="flex-1"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Install
                        </Button>
                      )}
                      {patch.status === 'installed' && patch.rollbackInfo?.available && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rollbackPatchMutation.mutate(patch.id)}
                          className="flex-1"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Rollback
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Update Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            <div className="grid gap-6">
              {packages.map((pkg: UpdatePackage) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Package className="h-5 w-5" />
                          <span>{pkg.name}</span>
                          <Badge variant="secondary">{pkg.version}</Badge>
                        </CardTitle>
                        <CardDescription>{pkg.description}</CardDescription>
                      </div>
                      <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Install Package
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Category:</span>
                        <p className="text-slate-600">{pkg.category}</p>
                      </div>
                      <div>
                        <span className="font-medium">Files:</span>
                        <p className="text-slate-600">{pkg.files.length} files</p>
                      </div>
                      <div>
                        <span className="font-medium">Checksums:</span>
                        <p className="text-slate-600">{Object.keys(pkg.checksums).length} verified</p>
                      </div>
                      <div>
                        <span className="font-medium">Scripts:</span>
                        <p className="text-slate-600">Install + Rollback</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Installation History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Installations</CardTitle>
                <CardDescription>
                  History of patch installations and system updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(item.status)}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-slate-600">{item.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.version}</p>
                        <p className="text-xs text-slate-600">{item.installDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Auto-Update Settings</CardTitle>
                  <CardDescription>
                    Configure automatic patch installation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-security">Auto-install security patches</Label>
                    <input type="checkbox" id="auto-security" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-critical">Auto-install critical updates</Label>
                    <input type="checkbox" id="auto-critical" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="backup-before">Create backup before installation</Label>
                    <input type="checkbox" id="backup-before" defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backup Settings</CardTitle>
                  <CardDescription>
                    Configure system backup options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="backup-location">Backup Location</Label>
                    <Input
                      id="backup-location"
                      defaultValue="/var/backups/patches"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="retention-days">Retention Period (days)</Label>
                    <Input
                      id="retention-days"
                      type="number"
                      defaultValue="30"
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Install Confirmation Dialog */}
        <Dialog open={installDialog} onOpenChange={setInstallDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Install Patch</DialogTitle>
              <DialogDescription>
                Are you sure you want to install this patch?
              </DialogDescription>
            </DialogHeader>
            {selectedPatch && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium">{selectedPatch.name}</h4>
                  <p className="text-sm text-slate-600 mt-1">{selectedPatch.description}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm">
                    <span>Version: {selectedPatch.version}</span>
                    <span>Files: {selectedPatch.files.length}</span>
                    <Badge variant="outline">{selectedPatch.priority}</Badge>
                  </div>
                </div>
                {installProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Installation Progress</span>
                      <span>{installProgress}%</span>
                    </div>
                    <Progress value={installProgress} />
                  </div>
                )}
                <div className="flex items-center space-x-2 pt-4">
                  <Button
                    onClick={() => installPatchMutation.mutate(selectedPatch.id)}
                    disabled={installPatchMutation.isPending}
                    className="flex-1"
                  >
                    {installPatchMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Install Patch
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setInstallDialog(false)}
                    disabled={installPatchMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default PatchManager;