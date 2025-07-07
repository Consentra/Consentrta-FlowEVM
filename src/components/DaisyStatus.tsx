
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Zap, AlertTriangle, CheckCircle, Clock, Target, History } from 'lucide-react';
import { useAIVoting } from '@/hooks/useAIVoting';
import { useDaisyEngine } from '@/hooks/useDaisyEngine';

export const DaisyStatus: React.FC = () => {
  const { config, activeVotingTasks } = useAIVoting();
  const { isDaisyEnabled, isProcessing } = useDaisyEngine();

  const getStatusIcon = () => {
    if (isProcessing) return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
    if (isDaisyEnabled) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isProcessing) return 'Processing';
    if (isDaisyEnabled) return 'Active';
    return 'Inactive';
  };

  const getStatusColor = () => {
    if (isProcessing) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    if (isDaisyEnabled) return 'bg-green-500/10 text-green-700 border-green-200';
    return 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const getDecisionMethod = () => {
    const hasPreferences = config?.preferences && config.preferences.length > 0;
    if (!hasPreferences) return 'Voting History';
    return 'User Preferences';
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Bot className="h-4 w-4" />
          <span>Daisy Automation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant="outline" className={getStatusColor()}>
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </div>
          </Badge>
        </div>

        {config && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Decision Method</span>
              <div className="flex items-center space-x-1">
                {config.preferences && config.preferences.length > 0 ? (
                  <Target className="h-3 w-3 text-primary" />
                ) : (
                  <History className="h-3 w-3 text-primary" />
                )}
                <span className="text-sm font-medium">
                  {getDecisionMethod()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Confidence</span>
              <span className="text-sm font-medium">
                {config.minConfidenceThreshold}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Categories</span>
              <span className="text-sm font-medium">
                {config.preferences?.length || 0} configured
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monitoring</span>
              <span className="text-sm font-medium">
                {activeVotingTasks.size} proposals
              </span>
            </div>
          </>
        )}

        {isDaisyEnabled && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-start space-x-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                Daisy automatically votes based on your preferences. 
                When conflicts arise, you'll be notified for manual decision.
              </span>
            </div>
          </div>
        )}

        {!isDaisyEnabled && config && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-start space-x-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                Enable automated voting in preferences to activate Daisy.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
