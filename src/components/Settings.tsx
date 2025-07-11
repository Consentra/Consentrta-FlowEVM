
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Bot,
  Zap,
  Globe,
  Mail,
  Smartphone,
  Save,
  RefreshCw
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { WalletConnection } from '@/components/WalletConnection';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useAIVoting } from '@/hooks/useAIVoting';

type Theme = 'dark' | 'light' | 'system';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const {
    settings,
    profile,
    loading,
    saving,
    updateSettings,
    updateProfile,
    saveSettings
  } = useSettings();
  const { config, updateConfig } = useAIVoting();

  const handleToggle = async (category: string, setting: string) => {
    const newValue = !settings[category][setting];
    updateSettings(category as keyof typeof settings, setting, newValue);
    
    // If it's an AI setting, also update the AI voting config
    if (category === 'ai' && setting === 'autoVoting' && config) {
      await updateConfig({
        ...config,
        autoVotingEnabled: newValue
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your account preferences and configuration
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    placeholder="Your display name"
                    value={profile.displayName}
                    onChange={(e) => updateProfile('displayName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com"
                    value={profile.email}
                    onChange={(e) => updateProfile('email', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input 
                  id="bio" 
                  placeholder="Tell us about yourself..."
                  value={profile.bio}
                  onChange={(e) => updateProfile('bio', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Wallet Connection</span>
              </CardTitle>
              <CardDescription>
                Manage your blockchain wallet connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Connected Wallet</p>
                  <p className="text-sm text-muted-foreground">
                    {user ? `Connected: ${user.shortAddress}` : 'No wallet connected'}
                  </p>
                </div>
                <WalletConnection onConnect={() => {}} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <span>Notification Preferences</span>
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email Notifications</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={() => handleToggle('notifications', 'email')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Push Notifications</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={() => handleToggle('notifications', 'push')}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                
                {[
                  { key: 'proposals', label: 'New Proposals', description: 'When new proposals are created' },
                  { key: 'voting', label: 'Voting Reminders', description: 'Reminders to vote on active proposals' },
                  { key: 'results', label: 'Voting Results', description: 'When voting on proposals ends' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-medium">{item.label}</span>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      checked={settings.notifications[item.key]}
                      onCheckedChange={() => handleToggle('notifications', item.key)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Privacy Settings</span>
              </CardTitle>
              <CardDescription>
                Control your privacy and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { 
                  key: 'publicProfile', 
                  label: 'Public Profile', 
                  description: 'Make your profile visible to other users' 
                },
                { 
                  key: 'showVotingHistory', 
                  label: 'Show Voting History', 
                  description: 'Display your voting history on your profile' 
                },
                { 
                  key: 'analyticsOptIn', 
                  label: 'Analytics Participation', 
                  description: 'Help improve the platform by sharing usage data' 
                }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-medium">{item.label}</span>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={settings.privacy[item.key]}
                    onCheckedChange={() => handleToggle('privacy', item.key)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5 text-primary" />
                <span>Appearance</span>
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light' as Theme, label: 'Light', icon: '☀️' },
                    { value: 'dark' as Theme, label: 'Dark', icon: '🌙' },
                    { value: 'system' as Theme, label: 'System', icon: '💻' }
                  ].map((themeOption) => (
                    <Button
                      key={themeOption.value}
                      variant={theme === themeOption.value ? 'default' : 'outline'}
                      onClick={() => setTheme(themeOption.value)}
                      className="h-20 flex-col space-y-2"
                    >
                      <span className="text-2xl">{themeOption.icon}</span>
                      <span>{themeOption.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-primary" />
                <span>AI Companions</span>
              </CardTitle>
              <CardDescription>
                Configure your AI assistant and automation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 ai-agent-gradient rounded-lg text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5" />
                    <div>
                      <h3 className="font-medium">Daisy Agent</h3>
                      <p className="text-xs text-white/80">Automation & Voting AI</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.ai.enableDaisy}
                    onCheckedChange={() => handleToggle('ai', 'enableDaisy')}
                  />
                </div>
                <p className="text-sm text-white/90">
                  Enable Daisy to help automate your voting decisions based on your preferences.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-medium">Automatic Voting</span>
                    <p className="text-sm text-muted-foreground">
                      Allow Daisy to vote automatically on proposals that match your criteria
                    </p>
                    {config && (
                      <p className="text-xs text-blue-600">
                        {config.preferences?.length || 0} preferences configured
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={settings.ai.autoVoting}
                    onCheckedChange={() => handleToggle('ai', 'autoVoting')}
                    disabled={!settings.ai.enableDaisy}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Analysis Detail Level</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['basic', 'detailed', 'comprehensive'].map((level) => (
                      <Button
                        key={level}
                        variant={settings.ai.analysisLevel === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSettings('ai', 'analysisLevel', level)}
                        disabled={!settings.ai.enableDaisy}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="flex items-center space-x-2"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </Button>
      </div>
    </div>
  );
};
