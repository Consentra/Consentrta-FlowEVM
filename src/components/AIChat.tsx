
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
  AlertCircle,
  Database,
  Brain
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';
import { EthraKnowledgeService } from '@/services/EthraKnowledgeService';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'analysis' | 'explanation' | 'suggestion' | 'error' | 'data-driven';
  data?: any;
  confidence?: number;
}

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Ethra, your enhanced AI governance assistant. I now have access to real-time platform data, comprehensive governance knowledge, and advanced analysis capabilities. I can provide detailed insights about current proposals, DAO activities, voting patterns, and governance best practices. What would you like to explore?",
      sender: 'ai',
      timestamp: new Date(),
      type: 'explanation',
      confidence: 95
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [knowledgeService] = useState(() => EthraKnowledgeService.getInstance());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Real-time data queries for enhanced context
  const { data: proposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ['proposals-for-ethra'],
    queryFn: async () => {
      const response = await apiClient.getProposals({ limit: 50 });
      return response.success ? response.data : [];
    },
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  const { data: daos, isLoading: daosLoading } = useQuery({
    queryKey: ['daos-for-ethra'],
    queryFn: async () => {
      const response = await apiClient.getDAOs({ limit: 20 });
      return response.success ? response.data : [];
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const { data: ecosystemStats } = useQuery({
    queryKey: ['ecosystem-stats-for-ethra'],
    queryFn: async () => {
      const response = await apiClient.getEcosystemStats();
      return response.success ? response.data : null;
    },
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
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
      console.log('Ethra processing query:', currentInput);
      
      // Get conversation history for context
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp
      }));

      // Use enhanced knowledge service
      const aiResponseContent = await knowledgeService.generateResponse(
        currentInput, 
        conversationHistory
      );

      // Analyze query for response metadata
      const queryAnalysis = knowledgeService.analyzeUserQuery(currentInput);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        sender: 'ai',
        timestamp: new Date(),
        type: queryAnalysis.complexity === 'simple' ? 'explanation' : 'analysis',
        confidence: queryAnalysis.dataNeeded.length > 0 ? 90 : 75,
        data: queryAnalysis.dataNeeded.length > 0 ? {
          usedRealData: true,
          dataTypes: queryAnalysis.dataNeeded,
          queryComplexity: queryAnalysis.complexity
        } : undefined
      };
      
      setMessages(prev => [...prev, aiMessage]);

      toast({
        title: "Enhanced Ethra Response",
        description: `Response generated using ${queryAnalysis.dataNeeded.length > 0 ? 'real platform data' : 'governance knowledge base'}`,
      });

    } catch (error) {
      console.error('Error getting enhanced AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm experiencing technical difficulties processing your request. This might be due to data connectivity issues. Please try rephrasing your question or ask about a different topic.",
        sender: 'ai',
        timestamp: new Date(),
        type: 'error',
        confidence: 0
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Processing Error",
        description: "Ethra encountered an issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const getMessageIcon = (type?: string, confidence?: number) => {
    if (confidence !== undefined && confidence < 50) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    switch (type) {
      case 'analysis': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'explanation': return <FileText className="h-4 w-4 text-green-500" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'data-driven': return <Database className="h-4 w-4 text-purple-500" />;
      default: return <Brain className="h-4 w-4 text-primary" />;
    }
  };

  const quickPrompts = [
    "Analyze current active proposals",
    "Show me DAO governance statistics", 
    "Explain quadratic voting mechanisms",
    "What are governance best practices?",
    "Compare proposal success rates",
    "How does treasury management work?",
    "Explain soulbound NFT identity system",
    "What is AI-powered voting?"
  ];

  const isDataLoaded = !proposalsLoading && !daosLoading;
  const dataStatus = isDataLoaded ? 'Connected' : 'Loading Data';

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
          Enhanced Ethra Assistant
        </h1>
        <p className="text-lg text-muted-foreground">
          AI governance expert with real-time data access and comprehensive knowledge
        </p>
      </div>

      <Card className="h-[600px] flex flex-col glass-card">
        <CardHeader className="ai-assistant-gradient text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <span>Enhanced Ethra Assistant</span>
              <Badge variant="secondary" className={`ml-2 bg-white/20 text-white border-white/30 ${isDataLoaded ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                {dataStatus}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription className="text-white/80">
            Enhanced AI Governance Expert - Real-time data • Comprehensive knowledge • Advanced analysis
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
                    className={`max-w-[85%] rounded-lg p-4 ${
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
                        {message.sender === 'ai' && (message.type || message.confidence !== undefined) && (
                          <div className="flex items-center space-x-2 mb-2">
                            {getMessageIcon(message.type, message.confidence)}
                            <div className="flex items-center space-x-2">
                              {message.type && (
                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                  {message.type.replace('-', ' ')}
                                </span>
                              )}
                              {message.confidence !== undefined && (
                                <Badge variant="outline" className={`text-xs ${
                                  message.confidence >= 80 ? 'border-green-500 text-green-600' :
                                  message.confidence >= 60 ? 'border-yellow-500 text-yellow-600' :
                                  'border-red-500 text-red-600'
                                }`}>
                                  {message.confidence}% confidence
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                        
                        {message.data?.usedRealData && (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded text-xs border border-green-200 dark:border-green-800">
                            <div className="flex items-center space-x-1 text-green-700 dark:text-green-400">
                              <Database className="h-3 w-3" />
                              <span className="font-medium">Real Platform Data Used</span>
                            </div>
                            <div className="mt-1 text-green-600 dark:text-green-500">
                              Data sources: {message.data.dataTypes.join(', ')} • 
                              Query complexity: {message.data.queryComplexity}
                            </div>
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
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-muted-foreground">Analyzing with real-time data...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="p-6 border-t border-border">
            {/* Enhanced Quick Prompts */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-1" />
                Try these enhanced questions:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue(prompt)}
                    className="text-xs justify-start h-auto py-2 px-3"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Data Status Indicator */}
            <div className="mb-4 p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Database className="h-3 w-3" />
                  <span>Platform Data Status:</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`flex items-center space-x-1 ${proposals ? 'text-green-600' : 'text-yellow-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${proposals ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span>Proposals ({proposals?.length || 0})</span>
                  </span>
                  <span className={`flex items-center space-x-1 ${daos ? 'text-green-600' : 'text-yellow-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${daos ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span>DAOs ({daos?.length || 0})</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about governance, proposals, DAOs, or any platform data..."
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
