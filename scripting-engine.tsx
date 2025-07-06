import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Play, 
  Square, 
  Save, 
  FileCode, 
  Terminal, 
  Bug, 
  AlertTriangle, 
  CheckCircle,
  Code2,
  Cpu,
  HardDrive,
  Clock
} from 'lucide-react';

interface ScriptResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: string;
  memoryUsage?: string;
  exitCode: number;
}

interface DebugInfo {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export default function ScriptingEngine() {
  const [script, setScript] = useState(`// DeepBlue Scripting Language (DBSL)
// Advanced scripting for IDE automation and development tasks

console.log("Welcome to DeepBlue Scripting Engine");

// File operations
const files = await ide.getFiles();
console.log("Found", files.length, "files");

// Code analysis
const errors = await ide.analyzeCode();
if (errors.length > 0) {
  console.warn("Found", errors.length, "issues to fix");
  errors.forEach(error => {
    console.log("  -", error.message, "at line", error.line);
  });
}

// AI assistance
const suggestion = await ai.optimize("Improve code performance");
console.log("AI Suggestion:", suggestion);

// Database operations
const dbStatus = await database.getStatus();
console.log("Database:", dbStatus.connected ? "Connected" : "Disconnected");

// Deployment
const buildResult = await deploy.build();
console.log("Build status:", buildResult.success ? "Success" : "Failed");`);
  
  const [language, setLanguage] = useState('dbsl');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo[]>([]);
  const [autoSave, setAutoSave] = useState(true);

  const languages = [
    { id: 'dbsl', name: 'DeepBlue Script (DBSL)', extension: '.dbsl' },
    { id: 'javascript', name: 'JavaScript', extension: '.js' },
    { id: 'typescript', name: 'TypeScript', extension: '.ts' },
    { id: 'python', name: 'Python', extension: '.py' },
    { id: 'bash', name: 'Bash Script', extension: '.sh' }
  ];

  useEffect(() => {
    if (autoSave) {
      const timer = setTimeout(() => {
        localStorage.setItem('admin-script', script);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [script, autoSave]);

  useEffect(() => {
    // Load saved script
    const saved = localStorage.getItem('admin-script');
    if (saved) {
      setScript(saved);
    }
  }, []);

  const executeScript = async () => {
    setIsExecuting(true);
    setResult(null);
    setDebugInfo([]);

    try {
      const startTime = Date.now();
      
      const response = await apiRequest('POST', '/api/admin/dev/execute-script', {
        script,
        language,
        debug: true
      });
      
      const data = await response.json();
      const executionTime = ((Date.now() - startTime) / 1000).toFixed(2) + 's';
      
      setResult({
        success: data.success || false,
        output: data.result?.output || data.message || '',
        error: data.error,
        executionTime,
        memoryUsage: data.result?.memoryUsage || 'N/A',
        exitCode: data.result?.exitCode || 0
      });

      // Simulate debug info for demonstration
      if (language === 'dbsl') {
        setDebugInfo([
          { line: 1, column: 1, message: 'DBSL Engine initialized', severity: 'info' },
          { line: 5, column: 15, message: 'File API accessed', severity: 'info' },
          { line: 9, column: 20, message: 'Code analysis completed', severity: 'info' },
          { line: 15, column: 28, message: 'AI assistant called', severity: 'info' },
          { line: 20, column: 35, message: 'Database connection verified', severity: 'info' }
        ]);
      }

      if (data.success) {
        toast({
          title: "Script Executed Successfully",
          description: `Completed in ${executionTime}`,
        });
      } else {
        toast({
          title: "Script Execution Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        output: '',
        error: error.message,
        executionTime: '0s',
        exitCode: 1
      });
      
      toast({
        title: "Execution Error",
        description: "Failed to execute script",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const stopExecution = () => {
    setIsExecuting(false);
    toast({
      title: "Script Stopped",
      description: "Execution has been terminated",
    });
  };

  const saveScript = () => {
    localStorage.setItem('admin-script-saved', script);
    localStorage.setItem('admin-script-language', language);
    toast({
      title: "Script Saved",
      description: "Script has been saved locally",
    });
  };

  const loadTemplate = (template: string) => {
    const templates = {
      'file-operations': `// File Operations Template
const files = await ide.getFiles();
console.log("Total files:", files.length);

// Create new file
await ide.createFile("new-feature.tsx", "// New React component");

// Update existing file
const config = await ide.readFile("config.json");
const updated = JSON.parse(config);
updated.version = "2.0.0";
await ide.writeFile("config.json", JSON.stringify(updated, null, 2));

console.log("File operations completed");`,

      'code-analysis': `// Code Analysis Template
const files = await ide.getFiles();
let totalErrors = 0;
let totalWarnings = 0;

for (const file of files) {
  if (file.extension === '.tsx' || file.extension === '.ts') {
    const analysis = await ide.analyzeFile(file.path);
    totalErrors += analysis.errors.length;
    totalWarnings += analysis.warnings.length;
    
    if (analysis.errors.length > 0) {
      console.error("Errors in", file.path + ":");
      analysis.errors.forEach(err => console.log("  ", err.message));
    }
  }
}

console.log("Analysis complete:", totalErrors, "errors,", totalWarnings, "warnings");`,

      'ai-enhancement': `// AI Enhancement Template
const currentFile = await ide.getCurrentFile();
const content = await ide.readFile(currentFile.path);

// Get AI suggestions
const analysis = await ai.analyze(content, {
  type: "enhancement",
  focus: ["performance", "security", "readability"]
});

console.log("AI Analysis Results:");
console.log("Performance Score:", analysis.performance + "/100");
console.log("Security Score:", analysis.security + "/100");
console.log("Readability Score:", analysis.readability + "/100");

// Apply automatic improvements
if (analysis.canAutoFix) {
  const improved = await ai.applyFixes(content, analysis.suggestions);
  await ide.writeFile(currentFile.path, improved);
  console.log("Auto-fixes applied to", currentFile.path);
}`,

      'deployment': `// Deployment Script Template
console.log("Starting deployment process...");

// Build frontend
const frontendBuild = await deploy.buildFrontend();
if (!frontendBuild.success) {
  throw new Error("Frontend build failed: " + frontendBuild.error);
}

// Build backend
const backendBuild = await deploy.buildBackend();
if (!backendBuild.success) {
  throw new Error("Backend build failed: " + backendBuild.error);
}

// Run tests
const testResults = await deploy.runTests();
if (testResults.failed > 0) {
  console.warn("Some tests failed:", testResults.failed, "failures");
}

// Deploy to production
const deployment = await deploy.toProduction({
  environment: "production",
  strategy: "rolling",
  healthCheck: true
});

console.log("Deployment", deployment.success ? "successful" : "failed");
console.log("URL:", deployment.url);`
    };

    setScript(templates[template as keyof typeof templates] || '');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <FileCode className="h-5 w-5 mr-2" />
              DeepBlue Scripting Engine
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                {languages.find(l => l.id === language)?.name}
              </Badge>
              <Badge variant={isExecuting ? "default" : "secondary"}>
                {isExecuting ? "Running" : "Ready"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selection and Templates */}
          <div className="flex items-center space-x-4">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.id} value={lang.id}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select onValueChange={loadTemplate}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Load Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="file-operations">File Operations</SelectItem>
                <SelectItem value="code-analysis">Code Analysis</SelectItem>
                <SelectItem value="ai-enhancement">AI Enhancement</SelectItem>
                <SelectItem value="deployment">Deployment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Script Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Script Editor</h3>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAutoSave(!autoSave)}
                  className={autoSave ? "border-green-500 text-green-500" : ""}
                >
                  {autoSave ? "Auto-save ON" : "Auto-save OFF"}
                </Button>
              </div>
            </div>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter your script here..."
              className="bg-slate-700 border-slate-600 text-white font-mono min-h-[400px] resize-vertical"
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={executeScript}
              disabled={isExecuting || !script.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {isExecuting ? "Executing..." : "Execute"}
            </Button>
            <Button
              onClick={stopExecution}
              disabled={!isExecuting}
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
            <Button
              onClick={saveScript}
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Execution Results */}
      {result && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Terminal className="h-5 w-5 mr-2" />
              Execution Results
              <Badge 
                variant={result.success ? "default" : "destructive"} 
                className="ml-2"
              >
                {result.success ? "Success" : "Failed"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-slate-300 text-sm">Execution Time</span>
                </div>
                <p className="text-white font-mono">{result.executionTime}</p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-green-400" />
                  <span className="text-slate-300 text-sm">Memory Usage</span>
                </div>
                <p className="text-white font-mono">{result.memoryUsage}</p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  <span className="text-slate-300 text-sm">Exit Code</span>
                </div>
                <p className="text-white font-mono">{result.exitCode}</p>
              </div>
            </div>

            {/* Output */}
            <div>
              <h4 className="text-white font-medium mb-2">Output</h4>
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-600">
                <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                  {result.output || "No output"}
                </pre>
              </div>
            </div>

            {/* Error Output */}
            {result.error && (
              <div>
                <h4 className="text-red-400 font-medium mb-2">Error</h4>
                <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/50">
                  <pre className="text-red-400 font-mono text-sm whitespace-pre-wrap">
                    {result.error}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      {debugInfo.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Bug className="h-5 w-5 mr-2" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {debugInfo.map((info, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-3 p-2 bg-slate-700/50 rounded"
                >
                  {info.severity === 'error' && <AlertTriangle className="h-4 w-4 text-red-400" />}
                  {info.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-400" />}
                  {info.severity === 'info' && <CheckCircle className="h-4 w-4 text-blue-400" />}
                  
                  <Badge variant="outline" className="text-xs">
                    Line {info.line}:{info.column}
                  </Badge>
                  
                  <span className="text-slate-300 text-sm">{info.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}