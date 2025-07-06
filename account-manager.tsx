import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Settings,
  Shield,
  Activity,
  Camera,
  Edit,
  Save,
  X,
  Github,
  Twitter,
  Linkedin,
  Globe,
  MapPin,
  Calendar,
  Clock,
  Monitor,
  Smartphone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Download,
  Upload,
  LogOut,
  UserX
} from "lucide-react";
import { updateUserSchema, type UpdateUser, type User as UserType, type UserSettings, type UserSession, type UserActivity } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";

interface AccountManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserType;
  onSignOut?: () => void;
}

export default function AccountManager({ isOpen, onClose, currentUser, onSignOut }: AccountManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const profileForm = useForm<UpdateUser>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      bio: currentUser?.bio || '',
      location: currentUser?.location || '',
      website: currentUser?.website || '',
      githubUsername: currentUser?.githubUsername || '',
      twitterUsername: currentUser?.twitterUsername || '',
      linkedinUsername: currentUser?.linkedinUsername || ''
    }
  });

  const { data: userSettings } = useQuery({
    queryKey: ['/api/user/settings'],
    enabled: isOpen && !!currentUser,
    retry: false,
  });

  const { data: userSessions } = useQuery({
    queryKey: ['/api/user/sessions'],
    enabled: isOpen && !!currentUser,
    retry: false,
  });

  const { data: userActivity } = useQuery({
    queryKey: ['/api/user/activity'],
    enabled: isOpen && !!currentUser,
    retry: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUser) => {
      const response = await apiRequest('PUT', '/api/user/profile', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const response = await apiRequest('PUT', '/api/user/settings', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest('PUT', '/api/user/password', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
      setShowChangePassword(false);
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    }
  });

  const terminateSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest('DELETE', `/api/user/sessions/${sessionId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session Terminated",
        description: "The session has been terminated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Termination Failed",
        description: error.message || "Failed to terminate session.",
        variant: "destructive",
      });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/user/account');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted successfully.",
      });
      onSignOut?.();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account.",
        variant: "destructive",
      });
    }
  });

  const onProfileSubmit = (data: UpdateUser) => {
    updateProfileMutation.mutate(data);
  };

  const handleSettingChange = (key: string, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const formatLastActivity = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <Avatar className="w-10 h-10">
              <AvatarImage src={currentUser.profilePicture || undefined} />
              <AvatarFallback className="bg-blue-600">
                {getInitials(currentUser.firstName, currentUser.lastName, currentUser.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">Account Settings</h2>
              <p className="text-sm text-slate-400">
                {currentUser.firstName && currentUser.lastName 
                  ? `${currentUser.firstName} ${currentUser.lastName}` 
                  : currentUser.username}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={currentUser.profilePicture || undefined} />
                        <AvatarFallback className="bg-blue-600 text-2xl">
                          {getInitials(currentUser.firstName, currentUser.lastName, currentUser.username)}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        {currentUser.firstName && currentUser.lastName 
                          ? `${currentUser.firstName} ${currentUser.lastName}` 
                          : currentUser.username}
                      </h3>
                      <p className="text-slate-400 text-sm">@{currentUser.username}</p>
                      {currentUser.location && (
                        <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {currentUser.location}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge className={currentUser.isEmailVerified ? "bg-green-600" : "bg-yellow-600"}>
                        {currentUser.isEmailVerified ? "Verified" : "Unverified"}
                      </Badge>
                      <Badge className={currentUser.isActive ? "bg-green-600" : "bg-red-600"}>
                        {currentUser.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-white">{currentUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Member since:</span>
                      <span className="text-white">
                        {new Date(currentUser.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {currentUser.lastLoginAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Last login:</span>
                        <span className="text-white">
                          {formatLastActivity(currentUser.lastLoginAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="md:col-span-2">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white">Profile Information</CardTitle>
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                      size="sm"
                    >
                      {isEditing ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">First Name</Label>
                            <Input
                              {...profileForm.register('firstName')}
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Last Name</Label>
                            <Input
                              {...profileForm.register('lastName')}
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-white">Bio</Label>
                          <Textarea
                            {...profileForm.register('bio')}
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="Tell us about yourself..."
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-white">Location</Label>
                          <Input
                            {...profileForm.register('location')}
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="City, Country"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-white">Website</Label>
                          <Input
                            {...profileForm.register('website')}
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="https://your-website.com"
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-white">GitHub</Label>
                            <Input
                              {...profileForm.register('githubUsername')}
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="username"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Twitter</Label>
                            <Input
                              {...profileForm.register('twitterUsername')}
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="username"
                            />
                          </div>
                          <div>
                            <Label className="text-white">LinkedIn</Label>
                            <Input
                              {...profileForm.register('linkedinUsername')}
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="username"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        {currentUser.bio && (
                          <div>
                            <Label className="text-slate-400">Bio</Label>
                            <p className="text-white mt-1">{currentUser.bio}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          {currentUser.website && (
                            <div>
                              <Label className="text-slate-400">Website</Label>
                              <a
                                href={currentUser.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                              >
                                <Globe className="w-4 h-4" />
                                {currentUser.website}
                              </a>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {currentUser.githubUsername && (
                            <a
                              href={`https://github.com/${currentUser.githubUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600"
                            >
                              <Github className="w-4 h-4" />
                              {currentUser.githubUsername}
                            </a>
                          )}
                          {currentUser.twitterUsername && (
                            <a
                              href={`https://twitter.com/${currentUser.twitterUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600"
                            >
                              <Twitter className="w-4 h-4" />
                              {currentUser.twitterUsername}
                            </a>
                          )}
                          {currentUser.linkedinUsername && (
                            <a
                              href={`https://linkedin.com/in/${currentUser.linkedinUsername}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600"
                            >
                              <Linkedin className="w-4 h-4" />
                              {currentUser.linkedinUsername}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Preferences</CardTitle>
                  <CardDescription>Customize your IDE experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Dark Mode</Label>
                      <p className="text-sm text-slate-400">Use dark theme for the interface</p>
                    </div>
                    <Switch
                      checked={userSettings?.darkMode}
                      onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Auto Save</Label>
                      <p className="text-sm text-slate-400">Automatically save your work</p>
                    </div>
                    <Switch
                      checked={userSettings?.autoSave}
                      onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Code Completion</Label>
                      <p className="text-sm text-slate-400">Enable IntelliSense and auto-completion</p>
                    </div>
                    <Switch
                      checked={userSettings?.codeCompletion}
                      onCheckedChange={(checked) => handleSettingChange('codeCompletion', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Compact Mode</Label>
                      <p className="text-sm text-slate-400">Use compact UI layout</p>
                    </div>
                    <Switch
                      checked={userSettings?.compactMode}
                      onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Notifications</CardTitle>
                  <CardDescription>Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Push Notifications</Label>
                      <p className="text-sm text-slate-400">Receive notifications in the browser</p>
                    </div>
                    <Switch
                      checked={userSettings?.notifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Email Notifications</Label>
                      <p className="text-sm text-slate-400">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={userSettings?.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="flex-1">
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Manage your account security and access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Two-Factor Authentication</Label>
                      <p className="text-sm text-slate-400">Add an extra layer of security to your account</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={userSettings?.twoFactorEnabled ? "bg-green-600" : "bg-gray-600"}>
                        {userSettings?.twoFactorEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSettingChange('twoFactorEnabled', !userSettings?.twoFactorEnabled)}
                      >
                        {userSettings?.twoFactorEnabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-700 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Change Password</Label>
                        <p className="text-sm text-slate-400">Update your account password</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowChangePassword(true)}
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700 border-red-700/50">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <UserX className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>Irreversible and destructive actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Delete Account</Label>
                      <p className="text-sm text-slate-400">Permanently delete your account and all data</p>
                    </div>
                    <Button
                      variant="outline"
                      className="text-red-400 border-red-700 hover:bg-red-900"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          deleteAccountMutation.mutate();
                        }
                      }}
                      disabled={deleteAccountMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="flex-1">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Active Sessions</CardTitle>
                <CardDescription>
                  Manage your active login sessions across different devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {userSessions?.map((session: UserSession) => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            {session.userAgent?.includes('Mobile') ? (
                              <Smartphone className="w-5 h-5 text-white" />
                            ) : (
                              <Monitor className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">
                                {session.userAgent?.includes('Mobile') ? 'Mobile Device' : 'Desktop'}
                              </span>
                              {session.isActive && (
                                <Badge className="bg-green-600">Current</Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-400">
                              IP: {session.ipAddress} • Last seen {formatLastActivity(session.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => terminateSessionMutation.mutate(session.id.toString())}
                          disabled={terminateSessionMutation.isPending}
                        >
                          Terminate
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="flex-1">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your recent actions and account activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {userActivity?.map((activity: UserActivity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-700 rounded-lg">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <Activity className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">{activity.action}</p>
                          {activity.details && (
                            <p className="text-slate-400 text-xs">{activity.details}</p>
                          )}
                          <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {formatLastActivity(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t border-slate-700">
          <div className="text-sm text-slate-400">
            Account ID: {currentUser.id} • Created {new Date(currentUser.createdAt).toLocaleDateString()}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="outline"
              className="text-red-400 border-red-700 hover:bg-red-900"
              onClick={() => {
                if (confirm('Are you sure you want to sign out?')) {
                  onSignOut?.();
                  onClose();
                }
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}