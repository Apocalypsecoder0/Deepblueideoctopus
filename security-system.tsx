import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SecurityLock } from './security-lock';
import { CodeValidator } from './code-validator';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Lock,
  Key,
  Monitor,
  Activity,
  FileText,
  Bug,
  Zap,
  Clock,
  UserCheck,
  Settings
} from 'lucide-react';

interface SecuritySystemProps {
  isActive: boolean;
  onSecurityToggle: (active: boolean) => void;
  currentCode?: string;
  language?: string;
}

export function SecuritySystem({ isActive, onSecurityToggle, currentCode = '', language = 'javascript' }: SecuritySystemProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [securityLevel, setSecurityLevel] = useState<'basic' | 'enhanced' | 'maximum'>('enhanced');
  const [codeValidationEnabled, setCodeValidationEnabled] = useState(true);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [activeThreats, setActiveThreats] = useState(0);
  const { toast } = useToast();

  // Security system status
  const [systemStatus, setSystemStatus] = useState({
    firewall: true,
    antiMalware: true,
    codeValidator: true,
    authSystem: true,
    monitoring: true
  });

  useEffect(() => {
    // Simulate security monitoring
    const interval = setInterval(() => {
      // Random threat detection simulation
      if (Math.random() < 0.1) {
        setActiveThreats(prev => prev + 1);
        logSecurityEvent('threat_detected', 'Potential security threat blocked', 'medium');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSecurityUnlock = () => {
    setIsAuthenticated(true);
    logSecurityEvent('auth_success', 'Security authentication successful', 'info');
    toast({
      title: "Security Authenticated",
      description: "Access granted to IDE security system.",
    });
  };

  const handleCodeValidation = (isValid: boolean, violations: any[]) => {
    setLastValidation(new Date());
    
    if (violations.length > 0) {
      const criticalViolations = violations.filter(v => v.severity === 'critical');
      if (criticalViolations.length > 0) {
        logSecurityEvent('code_blocked', `Code execution blocked: ${criticalViolations.length} critical violations`, 'high');
        setActiveThreats(prev => prev + criticalViolations.length);
      } else {
        logSecurityEvent('code_warning', `Code warnings: ${violations.length} security concerns`, 'medium');
      }
    } else {
      logSecurityEvent('code_validated', 'Code passed security validation', 'info');
    }
  };

  const logSecurityEvent = (type: string, message: string, severity: string) => {
    const event = {
      id: Date.now(),
      timestamp: new Date(),
      type,
      message,
      severity,
      source: 'security_system'
    };
    
    setSecurityLogs(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 logs
  };

  const toggleSecurityLevel = () => {
    const levels: ('basic' | 'enhanced' | 'maximum')[] = ['basic', 'enhanced', 'maximum'];
    const currentIndex = levels.indexOf(securityLevel);
    const nextLevel = levels[(currentIndex + 1) % levels.length];
    setSecurityLevel(nextLevel);
    
    logSecurityEvent('security_level_changed', `Security level changed to ${nextLevel}`, 'info');
    toast({
      title: "Security Level Updated",
      description: `Security level changed to ${nextLevel.toUpperCase()}`,
    });
  };

  if (!isActive) {
    return (
      <Card className="bg-slate-800/90 border-slate-700">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-white opacity-50" />
          </div>
          <CardTitle className="text-white">Security System Disabled</CardTitle>
          <CardDescription className="text-slate-300">
            Click to enable comprehensive security protection
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => onSecurityToggle(true)} className="bg-blue-600 hover:bg-blue-700">
            <Shield className="h-4 w-4 mr-2" />
            Enable Security System
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return <SecurityLock onUnlock={handleSecurityUnlock} securityLevel={securityLevel} />;
  }

  return (
    <div className="space-y-6">
      {/* Security Header */}
      <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">DeepBlue:Octopus Security System</CardTitle>
                <CardDescription className="text-slate-300">
                  Advanced protection against hackers and malicious code
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                ACTIVE
              </Badge>
              <Button variant="outline" onClick={toggleSecurityLevel} className="border-slate-600">
                <Settings className="h-4 w-4 mr-2" />
                {securityLevel.toUpperCase()}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Security Dashboard */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="validator">Code Validator</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="logs">Security Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* System Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/90 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Security Level</p>
                    <p className="text-2xl font-bold text-blue-400">{securityLevel.toUpperCase()}</p>
                  </div>
                  <Lock className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/90 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Active Threats</p>
                    <p className="text-2xl font-bold text-red-400">{activeThreats}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/90 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Last Validation</p>
                    <p className="text-sm text-green-400">
                      {lastValidation ? lastValidation.toLocaleTimeString() : 'Never'}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Components Status */}
          <Card className="bg-slate-800/90 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">System Components</CardTitle>
              <CardDescription className="text-slate-300">
                Real-time status of security subsystems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(systemStatus).map(([component, status]) => (
                  <div key={component} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-white capitalize">{component.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                    <Badge variant={status ? 'default' : 'destructive'}>
                      {status ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Validator Tab */}
        <TabsContent value="validator">
          <CodeValidator
            code={currentCode}
            language={language}
            onValidationComplete={handleCodeValidation}
          />
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card className="bg-slate-800/90 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>Real-time Security Monitoring</span>
              </CardTitle>
              <CardDescription className="text-slate-300">
                Continuous monitoring of system security and threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Protection Layers</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-slate-300">Firewall Protection</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-slate-300">Anti-Malware Engine</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-slate-300">Code Injection Prevention</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-slate-300">AI System Protection</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Threat Detection</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-slate-300">Malicious Code Detection</span>
                      <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-slate-300">System Command Blocking</span>
                      <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-slate-300">Network Access Control</span>
                      <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                      <span className="text-slate-300">Compiler Exploit Prevention</span>
                      <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card className="bg-slate-800/90 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Security Event Logs</span>
              </CardTitle>
              <CardDescription className="text-slate-300">
                Real-time security events and system activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {securityLogs.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No security events logged yet</p>
                ) : (
                  securityLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                      <div className="mt-1">
                        {log.severity === 'high' ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : log.severity === 'medium' ? (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{log.message}</span>
                          <span className="text-xs text-slate-400">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {log.type.toUpperCase()}
                          </Badge>
                          <Badge 
                            className={`text-xs ${
                              log.severity === 'high' ? 'bg-red-500' :
                              log.severity === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                            }`}
                          >
                            {log.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Controls */}
      <Card className="bg-slate-800/90 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Security Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setActiveThreats(0)} className="border-slate-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Clear Threats
            </Button>
            <Button variant="outline" onClick={() => setSecurityLogs([])} className="border-slate-600">
              <FileText className="h-4 w-4 mr-2" />
              Clear Logs
            </Button>
            <Button variant="outline" onClick={() => logSecurityEvent('manual_scan', 'Manual security scan initiated', 'info')} className="border-slate-600">
              <Zap className="h-4 w-4 mr-2" />
              Run Scan
            </Button>
            <Button variant="destructive" onClick={() => onSecurityToggle(false)}>
              <Shield className="h-4 w-4 mr-2" />
              Disable Security
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}