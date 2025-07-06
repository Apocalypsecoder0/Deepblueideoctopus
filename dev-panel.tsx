import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import ScriptingEngine from './scripting-engine';
import { 
  Code2, 
  FileEdit, 
  Upload, 
  Download, 
  Play, 
  Bug, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Terminal,
  Zap,
  Brain,
  Wrench,
  FileCode,
  Search,
  Save,
  RefreshCw,
  Monitor,
  Database,
  Globe
} from 'lucide-react';

interface FileUpdate {
  id: string;
  fileName: string;
  filePath: string;
  updateType: 'feature' | 'bugfix' | 'security' | 'performance';
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  errors: string[];
  warnings: string[];
}

interface DevAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'idle' | 'working' | 'error';
}

export default function DevPanel() {
  const [selectedTab, setSelectedTab] = useState('file-editor');
  const [fileContent, setFileContent] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('typescript');
  const [updates, setUpdates] = useState<FileUpdate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [diagnostics, setDiagnostics] = useState({ errors: 0, warnings: 0, suggestions: 0 });
  const [devAgents] = useState<DevAgent[]>([
    {
      id: 'code-analyzer',
      name: 'Code Analyzer',
      description: 'Analyzes code quality and suggests improvements',
      capabilities: ['syntax-check', 'performance-analysis', 'security-scan'],
      status: 'idle'
    },
    {
      id: 'feature-builder',
      name: 'Feature Builder',
      description: 'Generates new features based on specifications',
      capabilities: ['component-generation', 'api-creation', 'test-generation'],
      status: 'idle'
    },
    {
      id: 'bug-hunter',
      name: 'Bug Hunter',
      description: 'Identifies and fixes bugs automatically',
      capabilities: ['error-detection', 'auto-fix', 'regression-testing'],
      status: 'idle'
    },
    {
      id: 'patch-master',
      name: 'Patch Master',
      description: 'Manages file updates and deployment patches',
      capabilities: ['file-patching', 'version-control', 'rollback'],
      status: 'idle'
    }
  ]);

  useEffect(() => {
    loadRecentUpdates();
    runDiagnostics();
  }, []);

  const loadRecentUpdates = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/dev/updates');
      const data = await response.json();
      setUpdates(data.updates || []);
    } catch (error) {
      console.error('Failed to load updates:', error);
    }
  };

  const runDiagnostics = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/dev/diagnostics');
      const data = await response.json();
      setDiagnostics(data);
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('updateType', 'feature');

    try {
      setIsProcessing(true);
      const response = await apiRequest('POST', '/api/admin/dev/upload', formData);
      const data = await response.json();
      
      toast({
        title: "File Uploaded",
        description: `Successfully uploaded ${file.name}`,
      });
      
      loadRecentUpdates();
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeScript = async () => {
    if (!scriptContent.trim()) {
      toast({
        title: "Empty Script",
        description: "Please enter a script to execute",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const response = await apiRequest('POST', '/api/admin/dev/execute-script', {
        script: scriptContent,
        language: selectedLanguage
      });
      const data = await response.json();
      
      toast({
        title: "Script Executed",
        description: data.message || "Script executed successfully",
      });
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: "Script execution failed. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const callAI = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Empty Prompt",
        description: "Please enter an AI prompt",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const response = await apiRequest('POST', '/api/admin/dev/ai-assist', {
        prompt: aiPrompt,
        context: {
          selectedFile,
          fileContent: fileContent.substring(0, 1000), // Limited context
          language: selectedLanguage
        }
      });
      const data = await response.json();
      
      if (data.suggestion) {
        setFileContent(data.suggestion);
        toast({
          title: "AI Suggestion Applied",
          description: "AI has updated the file content",
        });
      }
    } catch (error) {
      toast({
        title: "AI Request Failed",
        description: "Failed to get AI assistance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const applyUpdate = async (updateId: string) => {
    try {
      setIsProcessing(true);
      const response = await apiRequest('POST', `/api/admin/dev/apply-update/${updateId}`);
      const data = await response.json();
      
      toast({
        title: "Update Applied",
        description: data.message || "Update applied successfully",
      });
      
      loadRecentUpdates();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to apply update. Check logs for details.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile || !fileContent) {
      toast({
        title: "Missing Data",
        description: "Please select a file and add content",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const response = await apiRequest('POST', '/api/admin/dev/save-file', {
        filePath: selectedFile,
        content: fileContent,
        language: selectedLanguage
      });
      
      toast({
        title: "File Saved",
        description: "File has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Development Panel</h1>
          <p className="text-slate-300">AI-powered file updates, patching, and development tools</p>
        </div>

        {/* Diagnostics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Errors</p>
                  <p className="text-2xl font-bold text-red-400">{diagnostics.errors}</p>
                </div>
                <Bug className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-400">{diagnostics.warnings}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Suggestions</p>
                  <p className="text-2xl font-bold text-green-400">{diagnostics.suggestions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="bg-slate-800/50 border-slate-700 p-1">
            <TabsTrigger value="file-editor" className="data-[state=active]:bg-blue-600">
              <FileEdit className="h-4 w-4 mr-2" />
              File Editor
            </TabsTrigger>
            <TabsTrigger value="script-runner" className="data-[state=active]:bg-blue-600">
              <Terminal className="h-4 w-4 mr-2" />
              Script Runner
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-blue-600">
              <Brain className="h-4 w-4 mr-2" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="updates" className="data-[state=active]:bg-blue-600">
              <Upload className="h-4 w-4 mr-2" />
              Updates
            </TabsTrigger>
            <TabsTrigger value="dev-agents" className="data-[state=active]:bg-blue-600">
              <Zap className="h-4 w-4 mr-2" />
              Dev Agents
            </TabsTrigger>
            <TabsTrigger value="scripting" className="data-[state=active]:bg-blue-600">
              <Code2 className="h-4 w-4 mr-2" />
              Scripting
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* File Editor Tab */}
          <TabsContent value="file-editor" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileCode className="h-5 w-5 mr-2" />
                  Advanced File Editor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="file-path" className="text-slate-300">File Path</Label>
                    <Input
                      id="file-path"
                      value={selectedFile}
                      onChange={(e) => setSelectedFile(e.target.value)}
                      placeholder="/path/to/file.tsx"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="language" className="text-slate-300">Language</Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="css">CSS</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="markdown">Markdown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="file-content" className="text-slate-300">File Content</Label>
                  <Textarea
                    id="file-content"
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    placeholder="Enter or paste your code here..."
                    className="bg-slate-700 border-slate-600 text-white min-h-[300px] font-mono"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={saveFile} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save File
                  </Button>
                  <Button variant="outline" onClick={runDiagnostics} disabled={isProcessing}>
                    <Search className="h-4 w-4 mr-2" />
                    Check Syntax
                  </Button>
                  <Button variant="outline" disabled={isProcessing}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Script Runner Tab */}
          <TabsContent value="script-runner" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Terminal className="h-5 w-5 mr-2" />
                  Script Execution Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="script" className="text-slate-300">Script Content</Label>
                  <Textarea
                    id="script"
                    value={scriptContent}
                    onChange={(e) => setScriptContent(e.target.value)}
                    placeholder="// Enter your script here&#10;console.log('Hello, World!');"
                    className="bg-slate-700 border-slate-600 text-white min-h-[200px] font-mono"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={executeScript} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                    <Play className="h-4 w-4 mr-2" />
                    Execute Script
                  </Button>
                  <Button variant="outline" disabled={isProcessing}>
                    <Bug className="h-4 w-4 mr-2" />
                    Debug Mode
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai-assistant" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Development Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ai-prompt" className="text-slate-300">AI Prompt</Label>
                  <Textarea
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe what you want the AI to help you with..."
                    className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={callAI} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-700">
                    <Brain className="h-4 w-4 mr-2" />
                    Get AI Assistance
                  </Button>
                  <Button variant="outline" disabled={isProcessing}>
                    <Code2 className="h-4 w-4 mr-2" />
                    Generate Code
                  </Button>
                  <Button variant="outline" disabled={isProcessing}>
                    <Bug className="h-4 w-4 mr-2" />
                    Fix Bugs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Updates Tab */}
          <TabsContent value="updates" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  File Updates & Patches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file-upload" className="text-slate-300">Upload Update File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".js,.ts,.tsx,.css,.html,.json,.md"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  {updates.map((update) => (
                    <div key={update.id} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-white font-medium">{update.fileName}</h4>
                          <p className="text-sm text-slate-400">{update.filePath}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={update.status === 'completed' ? 'default' : 'secondary'}>
                            {update.status}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => applyUpdate(update.id)}
                            disabled={update.status !== 'pending' || isProcessing}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{update.description}</p>
                      <Progress value={update.progress} className="mb-2" />
                      {update.errors.length > 0 && (
                        <div className="text-red-400 text-sm">
                          Errors: {update.errors.join(', ')}
                        </div>
                      )}
                      {update.warnings.length > 0 && (
                        <div className="text-yellow-400 text-sm">
                          Warnings: {update.warnings.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dev Agents Tab */}
          <TabsContent value="dev-agents" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devAgents.map((agent) => (
                <Card key={agent.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center">
                        <Zap className="h-5 w-5 mr-2" />
                        {agent.name}
                      </div>
                      <Badge variant={agent.status === 'idle' ? 'secondary' : 'default'}>
                        {agent.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 mb-4">{agent.description}</p>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-400 mb-2">Capabilities:</h4>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.map((capability) => (
                          <Badge key={capability} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Activate Agent
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Scripting Engine Tab */}
          <TabsContent value="scripting" className="space-y-4">
            <ScriptingEngine />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Development Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white text-sm flex items-center">
                        <Monitor className="h-4 w-4 mr-2" />
                        System Monitoring
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm" variant="outline" className="w-full mb-2">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Status
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        <Bug className="h-4 w-4 mr-2" />
                        Run Diagnostics
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white text-sm flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        Database Tools
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm" variant="outline" className="w-full mb-2">
                        <Database className="h-4 w-4 mr-2" />
                        Backup DB
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Migrate Schema
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white text-sm flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        Deployment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm" variant="outline" className="w-full mb-2">
                        <Upload className="h-4 w-4 mr-2" />
                        Deploy Frontend
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Deploy Backend
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-700/50 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white text-sm flex items-center">
                        <Wrench className="h-4 w-4 mr-2" />
                        Maintenance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm" variant="outline" className="w-full mb-2">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Clear Cache
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Export Logs
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}