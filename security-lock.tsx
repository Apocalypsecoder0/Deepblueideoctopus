import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Fingerprint,
  Smartphone,
  Clock,
  UserCheck
} from 'lucide-react';

interface SecurityLockProps {
  onUnlock: () => void;
  securityLevel: 'basic' | 'enhanced' | 'maximum';
}

export function SecurityLock({ onUnlock, securityLevel }: SecurityLockProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [securityCode, setSecurityCode] = useState('');
  const [biometricCode, setBiometricCode] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const { toast } = useToast();

  // Security codes based on level
  const securityCodes = {
    basic: 'SECURE2025',
    enhanced: 'DEEPBLUE-SECURITY-001',
    maximum: 'OCTOPUS-MAXIMUM-SECURITY-2025'
  };

  const biometricCodes = {
    basic: '1234',
    enhanced: '987654',
    maximum: 'BIOMETRIC-AUTH-001'
  };

  const twoFactorCodes = {
    basic: '2FA',
    enhanced: '2FA-ENHANCED',
    maximum: '2FA-MAXIMUM-001'
  };

  // Lockout timer
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => {
        setLockoutTime(lockoutTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockoutTime === 0) {
      setIsLocked(false);
      setAttempts(0);
    }
  }, [lockoutTime, isLocked]);

  const handleSecurityCodeSubmit = () => {
    if (securityCode === securityCodes[securityLevel]) {
      if (securityLevel === 'basic') {
        handleSuccessfulAuth();
      } else {
        setCurrentStep(2);
        toast({
          title: "Step 1 Complete",
          description: "Security code verified. Proceed to biometric authentication.",
        });
      }
    } else {
      handleFailedAttempt();
    }
  };

  const handleBiometricSubmit = () => {
    if (biometricCode === biometricCodes[securityLevel]) {
      if (securityLevel === 'enhanced') {
        handleSuccessfulAuth();
      } else {
        setCurrentStep(3);
        toast({
          title: "Step 2 Complete",
          description: "Biometric authentication verified. Final step: Two-factor authentication.",
        });
      }
    } else {
      handleFailedAttempt();
    }
  };

  const handleTwoFactorSubmit = () => {
    if (twoFactorCode === twoFactorCodes[securityLevel]) {
      handleSuccessfulAuth();
    } else {
      handleFailedAttempt();
    }
  };

  const handleSuccessfulAuth = () => {
    toast({
      title: "Access Granted",
      description: "Security authentication successful. Welcome to DeepBlue:Octopus IDE.",
    });
    onUnlock();
  };

  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= 3) {
      setIsLocked(true);
      setLockoutTime(300); // 5 minutes lockout
      toast({
        title: "Security Lockout",
        description: "Too many failed attempts. System locked for 5 minutes.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Access Denied",
        description: `Invalid credentials. ${3 - newAttempts} attempts remaining.`,
        variant: "destructive",
      });
    }
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-black flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-800/90 border-red-500">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-red-400">Security Lockout</CardTitle>
            <CardDescription className="text-slate-300">
              System temporarily locked due to multiple failed attempts
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="text-red-400 text-2xl font-mono">
                {Math.floor(lockoutTime / 60)}:{(lockoutTime % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-slate-400">Time remaining until unlock</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                <span>Contact administrator if this is an error</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-slate-800/90 border-blue-500">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-white">DeepBlue:Octopus Security</CardTitle>
          <CardDescription className="text-slate-300">
            Advanced security authentication required
          </CardDescription>
          <div className="flex justify-center mt-4">
            <Badge variant={securityLevel === 'maximum' ? 'destructive' : securityLevel === 'enhanced' ? 'default' : 'secondary'}>
              {securityLevel.toUpperCase()} SECURITY
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Level Indicator */}
          <div className="flex justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-blue-500' : 'bg-slate-600'}`} />
            {securityLevel !== 'basic' && (
              <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-blue-500' : 'bg-slate-600'}`} />
            )}
            {securityLevel === 'maximum' && (
              <div className={`w-3 h-3 rounded-full ${currentStep >= 3 ? 'bg-blue-500' : 'bg-slate-600'}`} />
            )}
          </div>

          {/* Step 1: Security Code */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-blue-400">
                <Key className="h-5 w-5" />
                <span className="font-medium">Security Code Authentication</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="security-code" className="text-slate-300">Enter Security Code</Label>
                <div className="relative">
                  <Input
                    id="security-code"
                    type={showPassword ? 'text' : 'password'}
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    placeholder="Enter your security code"
                    className="bg-slate-700 border-slate-600 text-white pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={handleSecurityCodeSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
                <Lock className="h-4 w-4 mr-2" />
                Verify Security Code
              </Button>
            </div>
          )}

          {/* Step 2: Biometric Authentication */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-400">
                <Fingerprint className="h-5 w-5" />
                <span className="font-medium">Biometric Authentication</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="biometric-code" className="text-slate-300">Biometric Verification</Label>
                <Input
                  id="biometric-code"
                  value={biometricCode}
                  onChange={(e) => setBiometricCode(e.target.value)}
                  placeholder="Enter biometric code"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button onClick={handleBiometricSubmit} className="w-full bg-green-600 hover:bg-green-700">
                <Fingerprint className="h-4 w-4 mr-2" />
                Verify Biometric
              </Button>
            </div>
          )}

          {/* Step 3: Two-Factor Authentication */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-purple-400">
                <Smartphone className="h-5 w-5" />
                <span className="font-medium">Two-Factor Authentication</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="two-factor-code" className="text-slate-300">2FA Verification Code</Label>
                <Input
                  id="two-factor-code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Enter 2FA code"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button onClick={handleTwoFactorSubmit} className="w-full bg-purple-600 hover:bg-purple-700">
                <UserCheck className="h-4 w-4 mr-2" />
                Complete Authentication
              </Button>
            </div>
          )}

          {/* Security Codes Reference */}
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <h4 className="text-slate-300 font-medium mb-2">Security Codes Reference:</h4>
            <div className="space-y-1 text-xs text-slate-400">
              <div>Basic: SECURE2025</div>
              <div>Enhanced: DEEPBLUE-SECURITY-001 / 987654</div>
              <div>Maximum: OCTOPUS-MAXIMUM-SECURITY-2025 / BIOMETRIC-AUTH-001 / 2FA-MAXIMUM-001</div>
            </div>
          </div>

          {/* Attempts Warning */}
          {attempts > 0 && (
            <div className="flex items-center space-x-2 text-orange-400 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Failed attempts: {attempts}/3</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}