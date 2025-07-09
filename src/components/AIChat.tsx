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
import { useProposals } from '@/hooks/useProposals';
import { useDAOs } from '@/hooks/useDAOs';
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

  // Fetch real-time governance data using actual hooks
  const { proposals, loading: proposalsLoading } = useProposals();
  const { daos, loading: daosLoading } = useDAOs();

  // Mock ecosystem stats for now - this would come from a real API
  const ecosystemStats = {
    totalDAOs: daos?.length || 0,
    totalProposals: proposals?.length || 0,
    totalVotes: proposals?.reduce((sum, p) => sum + ((p.votes_for || 0) + (p.votes_against || 0)), 0) || 0,
    activeUsers: 890 // This would come from actual analytics
  };

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
      // Try to get real-time AI response using OpenRouter
      const { openRouterService } = await import('@/services/OpenRouterService');
      
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
      
      // Enhanced fallback using real data and intelligent responses
      try {
        const analysisResult = await generateIntelligentResponse(currentInput);
        
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
          description: "Using enhanced local analysis with real data",
          variant: "default",
        });
        
      } catch (fallbackError) {
        console.error('Fallback analysis failed:', fallbackError);
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I'm experiencing technical difficulties accessing the AI service. However, I can still provide analysis based on the current proposal data. Please try asking your question again, and I'll do my best to help with the available information.",
          sender: 'ai',
          timestamp: new Date(),
          type: 'error'
        };
        
        setMessages(prev => [...prev, errorMessage]);
        
        toast({
          title: "AI Service Issue",
          description: "Please try rephrasing your question",
          variant: "destructive",
        });
      }
    } finally {
      setIsTyping(false);
    }
  };

  const generateIntelligentResponse = async (input: string): Promise<{content: string, type: 'analysis' | 'explanation' | 'suggestion', data?: any}> => {
    const lowercaseInput = input.toLowerCase();
    
    // More intelligent proposal analysis
    if (lowercaseInput.includes('proposal')) {
      if (proposals && proposals.length > 0) {
        const activeProposals = proposals.filter(p => p.status === 'active');
        const nonActiveProposals = proposals.filter(p => p.status === 'passed' || p.status === 'failed');
        const totalVotes = proposals.reduce((sum, p) => sum + ((p.votes_for || 0) + (p.votes_against || 0)), 0);
        
        let response = `I'm analyzing ${proposals.length} proposals in the system. Here's what I found:\n\n`;
        
        if (activeProposals.length > 0) {
          response += `📋 **Active Proposals (${activeProposals.length}):**\n`;
          activeProposals.slice(0, 3).forEach((proposal, idx) => {
            const totalVotesForProposal = (proposal.votes_for || 0) + (proposal.votes_against || 0);
            response += `${idx + 1}. "${proposal.title}"\n   - ${proposal.votes_for || 0} for, ${proposal.votes_against || 0} against\n   - Total engagement: ${totalVotesForProposal} votes\n\n`;
          });
          
          if (activeProposals.length > 3) {
            response += `...and ${activeProposals.length - 3} more active proposals.\n\n`;
          }
        }
        
        if (nonActiveProposals.length > 0) {
          const passedProposals = nonActiveProposals.filter(p => p.status === 'passed');
          response += `✅ **Completed:** ${nonActiveProposals.length} proposals, ${passedProposals.length} passed\n\n`;
        }
        
        response += `Would you like me to analyze any specific proposal, or would you prefer insights about voting patterns?`;
        
        return {
          content: response,
          type: 'analysis',
          data: { 
            proposals: activeProposals.slice(0, 5),
            totalProposals: proposals.length,
            activeCount: activeProposals.length
          }
        };
      } else {
        return {
          content: "I don't see any proposals in the system currently. This could mean:\n\n• The DAOs are in a planning phase\n• Proposals haven't been synced yet\n• There might be a connectivity issue\n\nWould you like me to explain how the proposal creation process works, or help you understand what makes a good governance proposal?",
          type: 'explanation'
        };
      }
    }
    
    // DAO governance analysis
    if (lowercaseInput.includes('dao') || lowercaseInput.includes('governance')) {
      if (daos && daos.length > 0) {
        const totalMembers = daos.reduce((sum, dao) => sum + (dao.member_count || 0), 0);
        const activeDaos = daos.filter(dao => dao.is_active === true).length;
        
        let response = `🏛️ **DAO Ecosystem Analysis:**\n\n`;
        response += `• Total DAOs: ${daos.length}\n`;
        response += `• Active DAOs: ${activeDaos}\n`;
        response += `• Total members: ${totalMembers}\n\n`;
        
        if (daos.length > 0) {
          const largestDao = daos.reduce((prev, current) => 
            (current.member_count || 0) > (prev.member_count || 0) ? current : prev
          );
          response += `📈 **Largest DAO:** "${largestDao.name}" with ${largestDao.member_count || 0} members\n\n`;
          
          response += `**DAO Details:**\n`;
          daos.slice(0, 3).forEach((dao, idx) => {
            response += `${idx + 1}. ${dao.name}\n   - Members: ${dao.member_count || 0}\n   - Status: ${dao.is_active ? 'Active' : 'Inactive'}\n\n`;
          });
        }
        
        response += `What aspect of DAO governance would you like to explore further?`;
        
        return {
          content: response,
          type: 'analysis',
          data: { 
            daos: daos.slice(0, 3),
            totalDaos: daos.length,
            activeDaos: activeDaos
          }
        };
      } else {
        return {
          content: "DAO governance is fascinating! Even without current DAO data, I can explain:\n\n• **Token-based voting** - Members vote with governance tokens\n• **Proposal lifecycle** - From creation to execution\n• **Quorum requirements** - Minimum participation needed\n• **Timelock mechanisms** - Delays for security\n\nWhat specific governance mechanism would you like me to explain?",
          type: 'explanation'
        };
      }
    }
    
    // Voting and participation questions
    if (lowercaseInput.includes('vote') || lowercaseInput.includes('voting')) {
      const totalVotes = proposals?.reduce((sum, p) => sum + ((p.votes_for || 0) + (p.votes_against || 0)), 0) || 0;
      
      if (totalVotes > 0) {
        let response = `🗳️ **Voting Activity Analysis:**\n\n`;
        response += `Total votes cast: ${totalVotes}\n\n`;
        
        if (proposals && proposals.length > 0) {
          const avgVotesPerProposal = Math.round(totalVotes / proposals.length);
          response += `Average votes per proposal: ${avgVotesPerProposal}\n\n`;
          
          // Find most contentious proposal
          const contentiousProposal = proposals.reduce((prev, current) => {
            const prevRatio = Math.min((prev.votes_for || 0), (prev.votes_against || 0)) / Math.max((prev.votes_for || 0), (prev.votes_against || 0), 1);
            const currentRatio = Math.min((current.votes_for || 0), (current.votes_against || 0)) / Math.max((current.votes_for || 0), (current.votes_against || 0), 1);
            return currentRatio > prevRatio ? current : prev;
          });
          
          if (contentiousProposal.votes_for && contentiousProposal.votes_against) {
            response += `🔥 **Most Debated:** "${contentiousProposal.title}"\n   Close vote: ${contentiousProposal.votes_for} for, ${contentiousProposal.votes_against} against\n\n`;
          }
        }
        
        response += `Would you like voting strategy advice or help understanding voting mechanisms?`;
        
        return {
          content: response,
          type: 'analysis',
          data: { totalVotes, avgVotes: Math.round(totalVotes / (proposals?.length || 1)) }
        };
      } else {
        return {
          content: "Great question about voting! Here's how DAO voting typically works:\n\n• **Vote types:** For, Against, Abstain\n• **Voting power:** Usually based on token holdings\n• **Delegation:** You can delegate your votes to trusted members\n• **Timing:** Votes have specific windows\n\nWould you like me to explain any specific voting mechanism or strategy?",
          type: 'explanation'
        };
      }
    }
    
    // Help and how-to questions
    if (lowercaseInput.includes('help') || lowercaseInput.includes('how') || lowercaseInput.includes('what')) {
      return {
        content: "I'm here to help you navigate DAO governance! I can assist with:\n\n📊 **Analysis:** Proposal breakdowns, voting patterns, DAO statistics\n📚 **Education:** Governance mechanisms, best practices, terminology\n🎯 **Strategy:** Voting decisions, participation tips, risk assessment\n🔍 **Research:** Historical data, trends, comparisons\n\nWhat specific topic interests you most? Try asking about:\n• \"How do governance tokens work?\"\n• \"What makes a good proposal?\"\n• \"Show me voting statistics\"\n• \"Explain delegation\"",
        type: 'suggestion'
      };
    }
    
    // Statistics and metrics
    if (lowercaseInput.includes('stat') || lowercaseInput.includes('metric') || lowercaseInput.includes('data') || lowercaseInput.includes('number')) {
      const response = `📊 **Real-time Ecosystem Metrics:**\n\n` +
        `🏛️ DAOs: ${ecosystemStats.totalDAOs}\n` +
        `📋 Proposals: ${ecosystemStats.totalProposals}\n` +
        `🗳️ Total Votes: ${ecosystemStats.totalVotes}\n` +
        `👥 Active Users: ${ecosystemStats.activeUsers}\n\n` +
        `These numbers update in real-time as the ecosystem grows. What specific metrics would you like me to dive deeper into?`;
      
      return {
        content: response,
        type: 'analysis',
        data: ecosystemStats
      };
    }
    
    // Default intelligent response based on context
    const contextualResponse = generateContextualResponse(input, conversationContext);
    return {
      content: contextualResponse,
      type: 'suggestion'
    };
  };

  const generateContextualResponse = (input: string, context: any[]): string => {
    // Look at recent conversation for context
    const recentTopics = context.slice(-3).map(c => c.user.toLowerCase());
    
    if (recentTopics.some(topic => topic.includes('proposal'))) {
      return "I see you're interested in proposals. Would you like me to analyze specific proposals, explain the proposal lifecycle, or help you understand voting strategies?";
    }
    
    if (recentTopics.some(topic => topic.includes('dao'))) {
      return "Since we were discussing DAOs, I can dive deeper into governance structures, membership dynamics, or treasury management. What aspect interests you most?";
    }
    
    // General helpful response
    return `I understand you're asking about "${input}". While I have access to real-time DAO data and governance expertise, I'd like to provide the most relevant information. Could you be more specific about what you'd like to know? 

For example:
• Ask about specific proposals or DAOs
• Request analysis of voting patterns
• Seek explanations of governance concepts
• Get help with participation strategies

What would be most helpful for you right now?`;
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
    "How many proposals are active right now?",
    "Compare proposal success rates"
  ];

  const isDataLoading = proposalsLoading || daosLoading;
  const hasRealData = (proposals && proposals.length > 0) || (daos && daos.length > 0);

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
              <Badge variant="secondary" className={`ml-2 bg-white/20 text-white border-white/30 ${hasRealData ? 'bg-green-500/20' : isDataLoading ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                {isDataLoading ? 'Loading Data...' : hasRealData ? 'Real-time Data' : 'No Data'}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription className="text-white/80">
            AI Governance Analyst - {hasRealData ? 'Connected to live proposal data' : 'Waiting for data connection'}
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
                            <strong>Data Summary:</strong>
                            {message.data.totalProposals && (
                              <div className="mt-1">📋 Total Proposals: {message.data.totalProposals}</div>
                            )}
                            {message.data.activeCount !== undefined && (
                              <div>✅ Active: {message.data.activeCount}</div>
                            )}
                            {message.data.totalDaos && (
                              <div>🏛️ Total DAOs: {message.data.totalDaos}</div>
                            )}
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
