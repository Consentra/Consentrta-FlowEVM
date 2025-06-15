
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  Send, 
  Bot, 
  User, 
  Settings,
  Vote,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAIVoting } from '@/hooks/useAIVoting';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/utils/api';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'daisy';
  timestamp: Date;
  type?: 'vote_analysis' | 'automation' | 'suggestion' | 'status';
}

export const DaisyAgent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Daisy, your AI voting automation agent. I can analyze proposals, manage your voting preferences, and execute votes automatically based on your settings. How can I help you today?",
      sender: 'daisy',
      timestamp: new Date(),
      type: 'automation'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { 
    config, 
    activeVotingTasks, 
    scheduleVote, 
    cancelScheduledVote,
    isAutoVotingEnabled 
  } = useAIVoting();

  // Fetch real-time data for context
  const { data: proposals } = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const response = await apiClient.getProposals({ limit: 10 });
      return response.success ? response.data : [];
    }
  });

  const { data: daos } = useQuery({
    queryKey: ['daos'],
    queryFn: async () => {
      const response = await apiClient.getDAOs({ limit: 5 });
      return response.success ? response.data : [];
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add status message when automation settings change
  useEffect(() => {
    if (config) {
      const statusMessage: Message = {
        id: `status-${Date.now()}`,
        content: `Automation status updated: ${config.autoVotingEnabled ? 'ENABLED' : 'DISABLED'}. Confidence threshold: ${config.confidenceThreshold}%. Currently monitoring ${activeVotingTasks.size} proposals.`,
        sender: 'daisy',
        timestamp: new Date(),
        type: 'status'
      };
      setMessages(prev => [...prev, statusMessage]);
    }
  }, [config?.autoVotingEnabled, config?.confidenceThreshold]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // Import the Mistral service dynamically
      const { mistralService } = await import('@/services/MistralService');
      
      // Get real-time AI response using Mistral
      const aiResponseContent = await mistralService.analyzeVotingContext(currentInput, {
        proposals,
        daos,
        activeVotingTasks,
        config,
        conversationHistory: conversationContext.slice(-5)
      });

      const responseType = determineResponseType(currentInput);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        sender: 'daisy',
        timestamp: new Date(),
        type: responseType
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update conversation context
      setConversationContext(prev => [
        ...prev,
        { user: currentInput, ai: aiResponseContent, timestamp: new Date() }
      ].slice(-10));

      toast({
        title: "Daisy Response",
        description: "Real-time AI analysis complete",
      });

    } catch (error) {
      console.error('Error getting Mistral AI response:', error);
      
      // Fallback to enhanced local analysis
      const fallbackResponse = generateFallbackResponse(currentInput);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: fallbackResponse.content,
        sender: 'daisy',
        timestamp: new Date(),
        type: fallbackResponse.type
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      toast({
        title: "Connection Issue",
        description: "Using local analysis mode",
        variant: "default",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const generateFallbackResponse = (input: string): {content: string, type: 'vote_analysis' | 'automation' | 'suggestion' | 'status'} => {
    const lowercaseInput = input.toLowerCase();
    
    if (lowercaseInput.includes('status') || lowercaseInput.includes('check')) {
      return {
        content: `Current Status:
• Auto-voting: ${isAutoVotingEnabled ? 'ENABLED' : 'DISABLED'}
• Active tasks: ${activeVotingTasks.size} proposals being monitored
• Automation level: ${config?.daisyAutomation || 'balanced'}
• Confidence threshold: ${config?.confidenceThreshold || 75}%
• Voting delay: ${config?.votingDelay || 30} minutes

${isAutoVotingEnabled ? "I'm actively monitoring proposals and will vote according to your preferences." : "Auto-voting is disabled. Enable it in preferences to let me vote automatically."}`,
        type: 'status'
      };
    }
    
    if (lowercaseInput.includes('vote') || lowercaseInput.includes('voting')) {
      return {
        content: `I can automate your voting process! Here's what I do:

1. **Monitor Proposals**: I watch for new proposals that match your categories
2. **AI Analysis**: I analyze each proposal using multiple data sources
3. **Apply Preferences**: I check your voting preferences for each category
4. **Confidence Check**: I only vote if my confidence exceeds your threshold
5. **Execute Vote**: I cast votes automatically based on your settings

Current preferences: ${config?.preferences?.length || 0} categories configured. Would you like me to schedule votes for any specific proposals?`,
        type: 'automation'
      };
    }
    
    return {
      content: `I'm your AI voting automation assistant. I can help with:

🤖 **Automated Voting**: Vote on proposals based on your preferences
📊 **Proposal Analysis**: Analyze risks, complexity, and voting patterns  
⚙️ **Smart Configuration**: Learn from your voting history
🔍 **Real-time Monitoring**: Track active proposals across your DAOs

What specific aspect of voting automation would you like to explore?`,
      type: 'suggestion'
    };
  };

  const determineResponseType = (input: string): 'vote_analysis' | 'automation' | 'suggestion' | 'status' => {
    const lowercaseInput = input.toLowerCase();
    if (lowercaseInput.includes('status') || lowercaseInput.includes('check')) return 'status';
    if (lowercaseInput.includes('analyze') || lowercaseInput.includes('analysis')) return 'vote_analysis';
    if (lowercaseInput.includes('automate') || lowercaseInput.includes('automation')) return 'automation';
    return 'suggestion';
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'vote_analysis': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'automation': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'status': return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'suggestion': return <Vote className="h-4 w-4 text-orange-500" />;
      default: return <Bot className="h-4 w-4 text-primary" />;
    }
  };

  const quickActions = [
    "Check automation status",
    "Analyze current proposals", 
    "Configure voting preferences",
    "Schedule automatic votes",
    "What can you do?"
  ];

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    // Auto-send the quick action
    setTimeout(() => handleSend(), 100);
  };

  const isMistralConnected = true; // We have the API key now

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
          Daisy Agent
        </h1>
        <p className="text-lg text-muted-foreground">
          Your AI voting automation companion
        </p>
      </div>

      {/* Enhanced Automation Status */}
      <Card className="glass-card border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 ai-agent-gradient rounded-lg text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center space-x-2">
                  <span>Automation Status</span>
                  {isAutoVotingEnabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isAutoVotingEnabled 
                    ? `Active - Monitoring ${activeVotingTasks.size} proposals` 
                    : 'Inactive - Configure preferences to enable'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Confidence: {config?.confidenceThreshold || 75}%
              </div>
              <div className="text-sm text-muted-foreground">
                Delay: {config?.votingDelay || 30}min
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      
      <Card className="h-[600px] flex flex-col glass-card">
        <CardHeader className="ai-agent-gradient text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <span>Daisy Agent</span>
              <Badge variant="secondary" className={`ml-2 bg-white/20 text-white border-white/30 ${isMistralConnected ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                {isMistralConnected ? 'AI Connected' : isAutoVotingEnabled ? 'Active' : 'Standby'}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription className="text-white/80">
            AI-Powered Voting Automation • {isMistralConnected ? 'Real-time Mistral AI responses enabled' : `${config?.preferences?.length || 0} preferences configured`}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-muted mr-4'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.sender === 'daisy' && (
                        <div className="p-1.5 bg-primary/10 rounded-full mt-0.5 flex-shrink-0">
                          {getMessageIcon(message.type)}
                        </div>
                      )}
                      {message.sender === 'user' && (
                        <div className="p-1.5 bg-white/20 rounded-full mt-0.5 flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {message.sender === 'daisy' && message.type && (
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {message.type.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                        <div className="text-sm leading-relaxed whitespace-pre-line">{message.content}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4 mr-4">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-primary/10 rounded-full">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="p-6 border-t border-border">
            {/* Quick Actions */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="text-xs"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about automation, voting preferences, or proposal analysis..."
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!inputValue.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
