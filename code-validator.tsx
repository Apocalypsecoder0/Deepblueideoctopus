import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Code,
  Bug,
  Lock,
  FileX,
  Scan,
  Activity
} from 'lucide-react';

interface SecurityViolation {
  type: 'malicious' | 'suspicious' | 'restricted' | 'unsafe';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  line?: number;
  suggestion?: string;
}

interface CodeValidatorProps {
  code: string;
  language: string;
  onValidationComplete: (isValid: boolean, violations: SecurityViolation[]) => void;
}

export function CodeValidator({ code, language, onValidationComplete }: CodeValidatorProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [violations, setViolations] = useState<SecurityViolation[]>([]);
  const [securityScore, setSecurityScore] = useState(100);
  const { toast } = useToast();

  // Malicious code patterns
  const maliciousPatterns = {
    'system-commands': {
      patterns: [
        /rm\s+-rf\s+\/|del\s+\/s\s+\/q|format\s+c:/i,
        /eval\s*\(.*\)|exec\s*\(.*\)|system\s*\(.*\)/i,
        /os\.system|subprocess\.call|shell_exec/i,
        /document\.write|innerHTML\s*=|eval\(/i
      ],
      severity: 'critical' as const,
      message: 'Detected potentially destructive system commands'
    },
    'network-access': {
      patterns: [
        /fetch\s*\(.*\)|axios\.|XMLHttpRequest|curl\s+/i,
        /socket\.|connect\(|bind\(|listen\(/i,
        /import\s+requests|import\s+urllib|import\s+socket/i
      ],
      severity: 'high' as const,
      message: 'Unauthorized network access attempt detected'
    },
    'file-manipulation': {
      patterns: [
        /open\s*\(.*,\s*['"]w['"]|fopen\s*\(.*,\s*['"]w['"]/i,
        /unlink\s*\(|remove\s*\(|delete\s+/i,
        /fs\.writeFile|fs\.unlinkSync|fs\.rmdir/i
      ],
      severity: 'high' as const,
      message: 'Suspicious file manipulation operations'
    },
    'code-injection': {
      patterns: [
        /\$\{.*\}|\$\(.*\)|`.*`/,
        /\<script.*\>|\<\/script\>/i,
        /javascript:|data:|vbscript:/i,
        /base64|atob|btoa/i
      ],
      severity: 'high' as const,
      message: 'Potential code injection vulnerability'
    },
    'crypto-mining': {
      patterns: [
        /crypto|mining|blockchain|bitcoin|ethereum/i,
        /hash|sha256|md5/i,
        /worker|webworker|serviceworker/i
      ],
      severity: 'medium' as const,
      message: 'Potential cryptocurrency mining code'
    }
  };

  // Restricted AI/Compiler functions
  const restrictedAIPatterns = {
    'ai-bypass': {
      patterns: [
        /jailbreak|prompt.injection|ignore.previous|forget.instructions/i,
        /act.as|roleplay|pretend.to.be/i,
        /developer.mode|admin.mode|god.mode/i
      ],
      severity: 'critical' as const,
      message: 'AI system bypass attempt detected'
    },
    'compiler-exploit': {
      patterns: [
        /#include\s*<.*>.*system|#pragma|asm\s*\(/i,
        /buffer.overflow|stack.overflow|heap.overflow/i,
        /shellcode|payload|exploit/i
      ],
      severity: 'critical' as const,
      message: 'Compiler exploitation attempt'
    },
    'memory-corruption': {
      patterns: [
        /malloc\s*\(.*\)|free\s*\(.*\)|calloc\s*\(/i,
        /strcpy|strcat|sprintf|gets/i,
        /pointer.*overflow|buffer.*overflow/i
      ],
      severity: 'high' as const,
      message: 'Memory corruption vulnerability'
    }
  };

  // Language-specific security rules
  const languageSecurityRules = {
    javascript: [
      { pattern: /setTimeout\s*\(.*eval|setInterval\s*\(.*eval/i, severity: 'high' as const, message: 'Dangerous eval in timer' },
      { pattern: /localStorage|sessionStorage|indexedDB/i, severity: 'medium' as const, message: 'Browser storage access' },
      { pattern: /navigator\.|location\.|window\./i, severity: 'medium' as const, message: 'Browser API access' }
    ],
    python: [
      { pattern: /__import__\s*\(|importlib/i, severity: 'high' as const, message: 'Dynamic import detected' },
      { pattern: /pickle\.loads|marshal\.loads/i, severity: 'critical' as const, message: 'Unsafe deserialization' },
      { pattern: /input\s*\(.*\)|raw_input\s*\(/i, severity: 'medium' as const, message: 'User input without validation' }
    ],
    php: [
      { pattern: /eval\s*\(|assert\s*\(|system\s*\(/i, severity: 'critical' as const, message: 'Dangerous PHP functions' },
      { pattern: /\$_GET|\$_POST|\$_REQUEST/i, severity: 'medium' as const, message: 'Unvalidated user input' },
      { pattern: /include\s+|require\s+|file_get_contents/i, severity: 'high' as const, message: 'File inclusion vulnerability' }
    ]
  };

  const validateCode = async () => {
    setIsScanning(true);
    const foundViolations: SecurityViolation[] = [];
    let score = 100;

    // Check malicious patterns
    Object.entries(maliciousPatterns).forEach(([category, config]) => {
      config.patterns.forEach((pattern, index) => {
        if (pattern.test(code)) {
          foundViolations.push({
            type: 'malicious',
            severity: config.severity,
            message: `${config.message} (${category})`,
            suggestion: 'Remove or replace with secure alternatives'
          });
          score -= config.severity === 'critical' ? 30 : config.severity === 'high' ? 20 : 10;
        }
      });
    });

    // Check restricted AI patterns
    Object.entries(restrictedAIPatterns).forEach(([category, config]) => {
      config.patterns.forEach((pattern) => {
        if (pattern.test(code)) {
          foundViolations.push({
            type: 'restricted',
            severity: config.severity,
            message: `${config.message} (${category})`,
            suggestion: 'This type of code is not allowed in the IDE'
          });
          score -= 40;
        }
      });
    });

    // Check language-specific rules
    const langRules = languageSecurityRules[language as keyof typeof languageSecurityRules];
    if (langRules) {
      langRules.forEach((rule) => {
        if (rule.pattern.test(code)) {
          foundViolations.push({
            type: 'suspicious',
            severity: rule.severity,
            message: rule.message,
            suggestion: 'Review for security implications'
          });
          score -= rule.severity === 'critical' ? 25 : rule.severity === 'high' ? 15 : 5;
        }
      });
    }

    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    setViolations(foundViolations);
    setSecurityScore(Math.max(0, score));
    setIsScanning(false);

    const isValid = foundViolations.filter(v => v.severity === 'critical').length === 0;
    onValidationComplete(isValid, foundViolations);

    if (!isValid) {
      toast({
        title: "Security Violations Detected",
        description: `Found ${foundViolations.length} security issues. Code execution blocked.`,
        variant: "destructive",
      });
    } else if (foundViolations.length > 0) {
      toast({
        title: "Security Warnings",
        description: `Found ${foundViolations.length} potential security concerns.`,
      });
    } else {
      toast({
        title: "Code Validation Passed",
        description: "No security violations detected. Code is safe to execute.",
      });
    }
  };

  useEffect(() => {
    if (code.trim()) {
      validateCode();
    }
  }, [code, language]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Card className="bg-slate-800/90 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Shield className="h-5 w-5 text-blue-400" />
          <span>Security Code Validator</span>
          {isScanning && <Activity className="h-4 w-4 animate-spin text-blue-400" />}
        </CardTitle>
        <CardDescription className="text-slate-300">
          Real-time security analysis and threat detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Score */}
        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Scan className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-white">Security Score</h3>
              <p className="text-sm text-slate-400">Code safety assessment</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>
              {securityScore}/100
            </div>
            <p className="text-sm text-slate-400">
              {securityScore >= 80 ? 'Secure' : securityScore >= 60 ? 'Caution' : securityScore >= 40 ? 'Warning' : 'Dangerous'}
            </p>
          </div>
        </div>

        {/* Scanning Status */}
        {isScanning && (
          <div className="flex items-center space-x-3 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <Activity className="h-5 w-5 animate-spin text-blue-400" />
            <div>
              <p className="font-medium text-blue-400">Security Scan in Progress</p>
              <p className="text-sm text-slate-400">Analyzing code for threats and vulnerabilities...</p>
            </div>
          </div>
        )}

        {/* Violations List */}
        {violations.length > 0 && !isScanning && (
          <div className="space-y-3">
            <h4 className="font-medium text-white flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span>Security Violations ({violations.length})</span>
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {violations.map((violation, index) => (
                <div key={index} className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {violation.severity === 'critical' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      <Badge className={`${getSeverityColor(violation.severity)} text-white text-xs`}>
                        {violation.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {violation.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-white mb-1">{violation.message}</p>
                  {violation.suggestion && (
                    <p className="text-xs text-slate-400">{violation.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Status */}
        {!isScanning && violations.length === 0 && (
          <div className="flex items-center space-x-3 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="font-medium text-green-400">Code Security Verified</p>
              <p className="text-sm text-slate-400">No security violations detected. Safe to execute.</p>
            </div>
          </div>
        )}

        {/* Security Features */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Lock className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">AI Protection</span>
            </div>
            <p className="text-xs text-slate-400">Prevents AI system manipulation</p>
          </div>
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Bug className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-white">Malware Detection</span>
            </div>
            <p className="text-xs text-slate-400">Blocks malicious code patterns</p>
          </div>
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <FileX className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-white">System Protection</span>
            </div>
            <p className="text-xs text-slate-400">Prevents file system damage</p>
          </div>
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-white">Real-time Scan</span>
            </div>
            <p className="text-xs text-slate-400">Continuous security monitoring</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}