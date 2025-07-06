import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DirectoryAuthProps {
  onAuthSuccess: () => void;
}

export function DirectoryAuth({ onAuthSuccess }: DirectoryAuthProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const { toast } = useToast();

  // Check if already authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/directory-status');
      const data = await response.json();
      
      if (data.authenticated) {
        onAuthSuccess();
      }
    } catch (error) {
      // Not authenticated, show login form
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      toast({
        title: "Access Locked",
        description: "Too many failed attempts. Please wait before trying again.",
        variant: "destructive",
      });
      return;
    }

    if (!username.trim() || !password.trim()) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/admin/directory-auth', {
        username: username.trim(),
        password
      });

      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "Directory Access Granted",
          description: "Proceeding to admin portal...",
        });
        
        // Small delay for better UX
        setTimeout(() => {
          onAuthSuccess();
        }, 500);
      } else {
        const error = await response.json();
        
        setAttempts(prev => prev + 1);
        
        if (attempts >= 2) {
          setIsLocked(true);
          toast({
            title: "Directory Access Locked",
            description: "Too many failed attempts. Access locked for security.",
            variant: "destructive",
          });
          
          // Auto-unlock after 15 minutes (for demo purposes, reduce in production)
          setTimeout(() => {
            setIsLocked(false);
            setAttempts(0);
          }, 15 * 60 * 1000);
        } else {
          toast({
            title: "Access Denied",
            description: `Invalid directory credentials. ${3 - attempts - 1} attempts remaining.`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Directory auth error:', error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to directory service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-orange-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-orange-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-32 h-32 bg-yellow-500 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <Card className="w-full max-w-lg relative z-10 bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Directory Access</CardTitle>
            <CardDescription className="text-gray-300">
              Server-level authentication required for admin portal access
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="directory-username" className="text-white">Directory Username</Label>
              <Input
                id="directory-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-400"
                placeholder="Enter directory username"
                disabled={isLoading || isLocked}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="directory-password" className="text-white">Directory Password</Label>
              <div className="relative">
                <Input
                  id="directory-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 pr-10"
                  placeholder="Enter directory password"
                  disabled={isLoading || isLocked}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  disabled={isLoading || isLocked}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
              disabled={isLoading || isLocked || !username.trim() || !password.trim()}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : isLocked ? (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Access Locked
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Access Directory
                </div>
              )}
            </Button>
          </form>

          {/* Security Information */}
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-sm text-red-100">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">Security Layer 1 of 3</p>
                <p className="text-xs opacity-90">
                  This is the server-level directory authentication. Additional admin credentials will be required after this step.
                </p>
              </div>
            </div>
          </div>

          {/* Attempts indicator */}
          {attempts > 0 && (
            <div className="flex justify-center space-x-2">
              {[1, 2, 3].map((attempt) => (
                <div
                  key={attempt}
                  className={`w-3 h-3 rounded-full ${
                    attempt <= attempts ? 'bg-red-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo credentials */}
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm p-4 rounded-lg text-white text-sm max-w-xs">
        <p className="font-semibold mb-2">Demo Directory Access:</p>
        <div className="space-y-1 text-xs">
          <p>Username: <span className="font-mono bg-gray-800 px-1 rounded">deepblue_admin</span></p>
          <p>Password: <span className="font-mono bg-gray-800 px-1 rounded">SecureAdmin2025!</span></p>
        </div>
        <p className="text-xs text-yellow-400 mt-2">⚠️ Configure via environment variables in production</p>
      </div>
    </div>
  );
}