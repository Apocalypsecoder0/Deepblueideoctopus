import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield, Lock, User, KeyRound, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminLoginProps {
  onLoginSuccess: (adminData: any) => void;
}

type AuthStep = 'pin' | 'credentials' | 'verification';

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('pin');
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [sessionData, setSessionData] = useState<any>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const { toast } = useToast();

  // PIN verification mutation
  const pinMutation = useMutation({
    mutationFn: async (adminPin: string) => {
      const response = await apiRequest("POST", "/api/admin/verify-pin", { pin: adminPin });
      return response.json();
    },
    onSuccess: (data: any) => {
      setAuthToken(data.token);
      setCurrentStep('credentials');
      toast({
        title: "PIN Verified", 
        description: "Please enter your admin credentials",
      });
    },
    onError: (error: any) => {
      setAttempts(prev => prev + 1);
      if (attempts >= 2) {
        setIsLocked(true);
        toast({
          title: "Account Locked",
          description: "Too many failed attempts. Access locked for 15 minutes.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invalid PIN",
          description: `Incorrect PIN. ${3 - attempts - 1} attempts remaining.`,
          variant: "destructive",
        });
      }
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string; token: string }) => {
      const response = await apiRequest("POST", "/api/admin/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      setSessionData(data);
      setCurrentStep('verification');
      toast({
        title: "Credentials Verified",
        description: "Processing final authentication...",
      });
      // Auto-complete verification after 2 seconds
      setTimeout(() => {
        // Store admin session data for persistence
        if (data.admin) {
          localStorage.setItem('adminToken', data.token || 'admin-session-' + Date.now());
          localStorage.setItem('adminData', JSON.stringify(data.admin));
        }
        
        onLoginSuccess(data);
        toast({
          title: "Login Successful",
          description: `Welcome to the admin panel, ${data.admin?.username || 'Administrator'}`,
        });
      }, 2000);
    },
    onError: (error: any) => {
      setAttempts(prev => prev + 1);
      if (attempts >= 4) {
        setIsLocked(true);
        toast({
          title: "Account Locked",
          description: "Too many failed login attempts. Contact system administrator.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    },
  });

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      toast({
        title: "Account Locked",
        description: "Please wait 15 minutes before trying again",
        variant: "destructive",
      });
      return;
    }
    if (!pin || pin.length !== 6) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a 6-digit PIN",
        variant: "destructive",
      });
      return;
    }
    pinMutation.mutate(pin);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ username, password, token: authToken });
  };

  const getStepIcon = (step: AuthStep) => {
    switch (step) {
      case 'pin':
        return <KeyRound className="w-8 h-8 text-white" />;
      case 'credentials':
        return <User className="w-8 h-8 text-white" />;
      case 'verification':
        return <CheckCircle2 className="w-8 h-8 text-white" />;
      default:
        return <Shield className="w-8 h-8 text-white" />;
    }
  };

  const getStepTitle = (step: AuthStep) => {
    switch (step) {
      case 'pin':
        return 'Security PIN';
      case 'credentials':
        return 'Admin Credentials';
      case 'verification':
        return 'Verification';
      default:
        return 'Admin Portal';
    }
  };

  const getStepDescription = (step: AuthStep) => {
    switch (step) {
      case 'pin':
        return 'Enter your 6-digit security PIN to continue';
      case 'credentials':
        return 'Provide your administrator username and password';
      case 'verification':
        return 'Completing authentication process...';
      default:
        return 'DeepBlue:Octopus Administrator Access';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-blue-400 rounded-full opacity-20 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 1}px`,
                height: `${Math.random() * 4 + 1}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <Card className="w-full max-w-lg relative z-10 bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            {getStepIcon(currentStep)}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">{getStepTitle(currentStep)}</CardTitle>
            <CardDescription className="text-gray-300">
              {getStepDescription(currentStep)}
            </CardDescription>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${currentStep === 'pin' ? 'bg-blue-500' : currentStep === 'credentials' || currentStep === 'verification' ? 'bg-green-500' : 'bg-gray-500'}`} />
            <div className={`w-8 h-0.5 ${currentStep === 'credentials' || currentStep === 'verification' ? 'bg-green-500' : 'bg-gray-500'}`} />
            <div className={`w-3 h-3 rounded-full ${currentStep === 'credentials' ? 'bg-blue-500' : currentStep === 'verification' ? 'bg-green-500' : 'bg-gray-500'}`} />
            <div className={`w-8 h-0.5 ${currentStep === 'verification' ? 'bg-green-500' : 'bg-gray-500'}`} />
            <div className={`w-3 h-3 rounded-full ${currentStep === 'verification' ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`} />
          </div>

          {/* Attempt counter */}
          {attempts > 0 && (
            <div className="flex items-center justify-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <Badge variant="destructive" className="text-xs">
                {attempts}/5 failed attempts
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* PIN Step */}
          {currentStep === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-white">Security PIN</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Enter 6-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 text-center text-2xl tracking-widest bg-white/10 border-white/20 text-white placeholder-gray-400"
                    maxLength={6}
                    required
                    disabled={isLocked}
                  />
                </div>
                <div className="text-xs text-gray-400 text-center">
                  {pin.length}/6 digits entered
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                disabled={pinMutation.isPending || isLocked || pin.length !== 6}
              >
                {pinMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying PIN...
                  </div>
                ) : isLocked ? (
                  "Account Locked"
                ) : (
                  "Verify PIN"
                )}
              </Button>
            </form>
          )}

          {/* Credentials Step */}
          {currentStep === 'credentials' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}

          {/* Verification Step */}
          {currentStep === 'verification' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Authentication Complete</h3>
                <p className="text-gray-300 text-sm">
                  Welcome, {sessionData?.admin?.username || 'Administrator'}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Redirecting to admin dashboard...
                </p>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          <div className="text-center text-sm text-gray-400">
            <p>Secure administrator access</p>
            <p className="text-xs mt-1">© 2025 DeepBlue:Octopus IDE</p>
          </div>
        </CardContent>
      </Card>

      {/* Demo credentials */}
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm p-4 rounded-lg text-white text-sm max-w-xs">
        <p className="font-semibold mb-2">Demo Admin Access:</p>
        <div className="space-y-1 text-xs">
          <p>PIN: <span className="font-mono bg-gray-800 px-1 rounded">123456</span></p>
          <p>Username: <span className="font-mono bg-gray-800 px-1 rounded">admin</span></p>
          <p>Password: <span className="font-mono bg-gray-800 px-1 rounded">admin123</span></p>
        </div>
        <p className="text-xs text-yellow-400 mt-2">⚠️ Change in production</p>
      </div>
    </div>
  );
}