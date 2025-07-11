
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  Bot, 
  Settings,
  Vote,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Brain,
  History,
  Target
} from 'lucide-react';
import { useAIVoting } from '@/hooks/useAIVoting';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/utils/api';
import { useDaisyEngine } from '@/hooks/useDaisyEngine';
import { Separator } from '@/components/ui/separator';

export const DaisyAgent: React.FC = () => {
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const { toast } = useToast();

  const { 
    config, 
    activeVotingTasks, 
    isAutoVotingEnabled,
    updateConfig
  } = useAIVoting();

  const { isDaisyEnabled, isProcessing } = useDaisyEngine();

  // Fetch recent proposals for monitoring
  const { data: proposals } = useQuery({
    queryKey: ['proposals', 'recent'],
    queryFn: async () => {
      const response = await apiClient.getProposals({ limit: 5 });
      return response.success ? response.data : [];
    }
  });

  // Listen for Daisy notifications and config updates
  useEffect(() => {
    const handleDaisyNotification = (event: CustomEvent) => {
      const notification = event.detail;
      
      // Add to recent notifications
      setRecentNotifications(prev => [notification, ...prev.slice(0, 4)]);

      // Show toast based on notification type
      switch (notification.type) {
        case 'vote_success':
          toast({
            title: "Daisy Voted Successfully",
            description: `Automatically voted "${notification.vote}" on "${notification.proposalTitle}"${notification.onChain ? ' (On-chain)' : ' (Database)'}`,
          });
          break;

        case 'conflict':
          toast({
            title: "Manual Decision Required",
            description: `"${notification.proposalTitle}": ${notification.conflict}`,
            variant: "destructive",
          });
          break;

        case 'vote_failed':
          toast({
            title: "Automated Vote Failed",
            description: `Failed to vote "${notification.vote}" on "${notification.proposalTitle}": ${notification.error}`,
            variant: "destructive",
          });
          break;

        case 'low_confidence':
          toast({
            title: "Vote Skipped",
            description: `Skipped "${notification.proposalTitle}" (${notification.confidence}% confidence)`,
          });
          break;
      }
    };

    const handleConfigUpdate = (event: CustomEvent) => {
      console.log('AI voting config updated:', event.detail);
      // The config will be automatically updated by the useAIVoting hook
    };

    window.addEventListener('daisy-notification', handleDaisyNotification as EventListener);
    window.addEventListener('ai-voting-config-updated', handleConfigUpdate as EventListener);
    
    return () => {
      window.removeEventListener('daisy-notification', handleDaisyNotification as EventListener);
      window.removeEventListener('ai-voting-config-updated', handleConfigUpdate as EventListener);
    };
  }, [toast]);

  const toggleAutomation = async () => {
    if (config) {
      await updateConfig({
        ...config,
        autoVotingEnabled: !config.autoVotingEnabled
      });
    }
  };

  const getStatusIcon = () => {
    if (isProcessing) return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
    if (isDaisyEnabled) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isProcessing) return 'Processing Proposals';
    if (isDaisyEnabled) return 'Active & Monitoring';
    return 'Inactive';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'vote_success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'conflict': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'vote_failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'low_confidence': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default: return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
          Daisy Automation
        </h1>
        <p className="text-lg text-muted-foreground">
          Automated voting based on your preferences and history
        </p>
      </div>

      {/* Main Status Card */}
      <Card className="glass-card border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 ai-agent-gradient rounded-lg text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <span>Daisy Status</span>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon()}
                  <span className="text-sm text-muted-foreground">{getStatusText()}</span>
                </div>
              </div>
            </div>
            <Switch
              checked={isAutoVotingEnabled}
              onCheckedChange={toggleAutomation}
            />
          </CardTitle>
          <CardDescription>
            {isDaisyEnabled 
              ? `Monitoring ${activeVotingTasks.size} proposals with ${config?.preferences?.length || 0} preferences configured`
              : 'Enable automated voting to activate Daisy'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{config.preferences?.length || 0}</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center">
                  <Target className="h-3 w-3 mr-1" />
                  Preferences
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{config.confidenceThreshold}%</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center">
                  <Brain className="h-3 w-3 mr-1" />
                  Confidence
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{config.votingDelay}min</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Delay
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary capitalize">{config.daisyAutomation}</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center">
                  <Settings className="h-3 w-3 mr-1" />
                  Mode
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center">
              <History className="h-4 w-4 mr-2" />
              Recent Activity
            </h4>
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {recentNotifications.map((notification, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {notification.type === 'vote_success' && `Voted ${notification.vote} on ${notification.proposalTitle}`}
                        {notification.type === 'conflict' && `Conflict: ${notification.proposalTitle}`}
                        {notification.type === 'vote_failed' && `Failed to vote on ${notification.proposalTitle}`}
                        {notification.type === 'low_confidence' && `Skipped ${notification.proposalTitle}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.reasoning || notification.conflict || notification.error}
                      </p>
                      {notification.automated && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Automated • {notification.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* How Daisy Works */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="h-5 w-5 mr-2" />
            How Daisy Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">1. Check Preferences</h4>
              <p className="text-sm text-muted-foreground">
                Uses your configured voting preferences for each proposal category
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto">
                <History className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">2. Analyze History</h4>
              <p className="text-sm text-muted-foreground">
                Falls back to your voting history if no preferences are set
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">3. Handle Conflicts</h4>
              <p className="text-sm text-muted-foreground">
                Notifies you of conflicts and requires manual decision
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center">
              <Vote className="h-4 w-4 mr-2" />
              Voting Execution
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Attempts on-chain voting through smart contracts when possible</li>
              <li>• Falls back to database recording for UI consistency</li>
              <li>• Respects your confidence threshold and voting delay settings</li>
              <li>• Only active when automated voting is enabled</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
