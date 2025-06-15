import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  TrendingUp,
  FileText,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'analysis' | 'explanation' | 'suggestion' | 'error';
  data?: any;
}

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Ethra, your AI governance assistant. I have access to real-time DAO data, proposal analysis, and voting patterns. I can help you understand complex governance mechanisms, analyze specific proposals, and provide insights based on actual blockchain data. What would you like to explore?",
      sender: 'ai',
      timestamp: new Date(),
      type: 'explanation'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch real-time governance data
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

  const { data: ecosystemStats } = useQuery({
    queryKey: ['ecosystem-stats'],
    queryFn: async () => {
      const response = await apiClient.getEcosystemStats();
      return response.success ? response.data : null;
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Import the OpenRouter service dynamically
      const { openRouterService } = await import('@/services/OpenRouterService');
      
      // Try to get real-time AI response using OpenRouter
      const aiResponseContent = await openRouterService.analyzeGovernanceData(currentInput, {
        proposals,
        daos,
        ecosystemStats,
        conversationHistory: conversationContext.slice(-5)
      });

      const responseType = determineResponseType(currentInput);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        sender: 'ai',
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
        title: "Ethra Response",
        description: "Real-time AI analysis complete",
      });

    } catch (error) {
      console.error('Error getting OpenRouter AI response:', error);
      
      // Fallback to enhanced local analysis
      try {
        const analysisResult = await generateEnhancedResponse(currentInput);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: analysisResult.content,
          sender: 'ai',
          timestamp: new Date(),
          type: analysisResult.type,
          data: analysisResult.data
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        toast({
          title: "Ethra Response",
          description: "Using enhanced local analysis mode",
          variant: "default",
        });
        
      } catch (fallbackError) {
        console.error('Fallback analysis failed:', fallbackError);
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I'm experiencing technical difficulties. Please try asking your question again or rephrase it.",
          sender: 'ai',
          timestamp: new Date(),
          type: 'error'
        };
        
        setMessages(prev => [...prev, errorMessage]);
        
        toast({
          title: "Connection Issue",
          description: "Ethra is temporarily unavailable",
          variant: "destructive",
        });
      }
    } finally {
      setIsTyping(false);
    }
  };

  const generateEnhancedResponse = async (input: string): Promise<{content: string, type: 'analysis' | 'explanation' | 'suggestion', data?: any}> => {
    const lowercaseInput = input.toLowerCase();
    
    // Proposal analysis
    if (lowercaseInput.includes('proposal') || lowercaseInput.includes('vote')) {
      if (proposals && proposals.length > 0) {
        const activeProposals = proposals.filter(p => p.status === 'active');
        const totalVotes = proposals.reduce((sum, p) => sum + (p.totalVotes || 0), 0);
        
        return {
          content: `Based on current data, I see ${proposals.length} total proposals with ${activeProposals.length} currently active. Total votes cast: ${totalVotes}. The most recent proposal "${proposals[0]?.title}" has ${proposals[0]?.votesFor || 0} votes for and ${proposals[0]?.votesAgainst || 0} against. Would you like me to analyze any specific proposal in detail?`,
          type: 'analysis',
          data: { proposals: activeProposals.slice(0, 3) }
        };
      }
      return {
        content: "I don't see any active proposals right now. This could mean the DAOs are in a quiet period, or there might be connectivity issues. Would you like me to explain how the proposal process typically works?",
        type: 'explanation'
      };
    }
    
    // DAO governance analysis
    if (lowercaseInput.includes('dao') || lowercaseInput.includes('governance')) {
      if (daos && daos.length > 0) {
        const totalMembers = daos.reduce((sum, dao) => sum + (dao.memberCount || 0), 0);
        const totalTreasury = daos.reduce((sum, dao) => sum + parseFloat(dao.treasuryValue || '0'), 0);
        
        return {
          content: `The ecosystem currently has ${daos.length} active DAOs with ${totalMembers} total members and approximately $${totalTreasury.toLocaleString()} in combined treasury value. The largest DAO "${daos[0]?.name}" has ${daos[0]?.memberCount || 0} members. Each DAO operates with different governance parameters - would you like me to explain how any specific DAO's governance works?`,
          type: 'analysis',
          data: { daos: daos.slice(0, 3) }
        };
      }
      return {
        content: "DAO governance systems vary significantly, but they typically include token-based voting, proposal mechanisms, and execution systems. The key is balancing efficiency with decentralization. Would you like me to explain any specific governance mechanism?",
        type: 'explanation'
      };
    }
    
    // Voting power and tokenomics
    if (lowercaseInput.includes('token') || lowercaseInput.includes('voting power')) {
      return {
        content: "Voting power distribution is crucial for DAO health. Most DAOs use token-weighted voting, but many implement safeguards like quadratic voting, delegation systems, or voting caps to prevent centralization. Some DAOs also use time-locked tokens or reputation systems. Would you like me to analyze the voting power distribution of any specific DAO?",
        type: 'explanation'
      };
    }
    
    // Ecosystem statistics
    if (lowercaseInput.includes('stat') || lowercaseInput.includes('metric') || lowercaseInput.includes('data')) {
      if (ecosystemStats) {
        return {
          content: `Here are the latest ecosystem metrics: ${JSON.stringify(ecosystemStats, null, 2)}. These numbers show the overall health and activity of the governance ecosystem. Would you like me to dive deeper into any specific metric?`,
          type: 'analysis',
          data: ecosystemStats
        };
      }
      return {
        content: "I can help you understand governance metrics like participation rates, proposal success rates, voter turnout, and treasury utilization. What specific metrics are you interested in?",
        type: 'suggestion'
      };
    }
    
    // Default intelligent response
    return {
      content: "I'm here to provide detailed governance analysis using real blockchain data. I can examine proposals, analyze voting patterns, explain DAO mechanisms, or help you understand the implications of governance decisions. What specific aspect of decentralized governance interests you most?",
      type: 'suggestion'
    };
  };

  const determineResponseType = (input: string): 'analysis' | 'explanation' | 'suggestion' => {
    const lowercaseInput = input.toLowerCase();
    if (lowercaseInput.includes('analyze') || lowercaseInput.includes('data') || lowercaseInput.includes('stat')) return 'analysis';
    if (lowercaseInput.includes('how') || lowercaseInput.includes('what') || lowercaseInput.includes('explain')) return 'explanation';
    return 'suggestion';
  };

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'analysis': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'explanation': return <FileText className="h-4 w-4 text-green-500" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <MessageSquare className="h-4 w-4 text-primary" />;
    }
  };

  const quickPrompts = [
    "Analyze current active proposals",
    "Show me DAO governance statistics", 
    "Explain voting mechanisms",
    "What are the latest governance trends?",
    "How is treasury being utilized?",
    "Compare proposal success rates"
  ];

  const isEthraOnline = proposals !== undefined || daos !== undefined;
  const isOpenRouterConnected = true; // We have the API key now

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
          Ethra Assistant
        </h1>
        <p className="text-lg text-muted-foreground">
          Your AI companion for real-time governance analysis and insights
        </p>
      </div>

      <Card className="h-[600px] flex flex-col glass-card">
        <CardHeader className="ai-assistant-gradient text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <span>Ethra Assistant</span>
              <Badge variant="secondary" className={`ml-2 bg-white/20 text-white border-white/30 ${isOpenRouterConnected ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                {isOpenRouterConnected ? 'AI Connected' : 'Limited Mode'}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription className="text-white/80">
            AI Governance Analyst - {isOpenRouterConnected ? 'Real-time AI responses enabled' : 'Operating with cached data'}
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
                      {message.sender === 'ai' && (
                        <div className="p-1.5 bg-primary/10 rounded-full mt-0.5">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      {message.sender === 'user' && (
                        <div className="p-1.5 bg-white/20 rounded-full mt-0.5">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex-1">
                        {message.sender === 'ai' && message.type && (
                          <div className="flex items-center space-x-1 mb-1">
                            {getMessageIcon(message.type)}
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {message.type}
                            </span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                        
                        {/* Display additional data if available */}
                        {message.data && message.sender === 'ai' && (
                          <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                            <strong>Additional Data:</strong>
                            <pre className="mt-1 overflow-auto">{JSON.stringify(message.data, null, 2)}</pre>
                          </div>
                        )}
                        
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
                        <Bot className="h-4 w-4 text-primary" />
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
            {/* Quick Prompts */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue(prompt)}
                    className="text-xs"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about proposals, governance metrics, or DAO analysis..."
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
