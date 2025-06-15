
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Zap, 
  Bot,
  BookOpen,
  Settings2,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { AIChat } from '@/components/AIChat';
import { DaisyAgent } from '@/components/DaisyAgent';
import { VotingPreferences } from '@/components/VotingPreferences';

const AICompanions: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
          AI Assistance
        </h1>
        <p className="text-lg text-muted-foreground">
          Get help with governance decisions and automate your voting
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ask-ethra">Ask Questions</TabsTrigger>
          <TabsTrigger value="automation">Auto-Voting</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* AI Assistants Overview */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Ethra - Question & Answer */}
            <Card className="glass-card">
              <CardHeader className="ai-assistant-gradient text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <span>Ethra</span>
                    <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30">
                      Q&A Assistant
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription className="text-white/80">
                  Get explanations about proposals and governance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>Explains complex proposals in simple terms</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    <span>Answers questions about DAO governance</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <span>Provides educational guidance</span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setActiveTab('ask-ethra')}
                >
                  Ask Ethra a Question
                </Button>
              </CardContent>
            </Card>

            {/* Daisy - Automation */}
            <Card className="glass-card">
              <CardHeader className="ai-agent-gradient text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <span>Daisy</span>
                    <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30">
                      Voting Agent
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription className="text-white/80">
                  Automate your voting based on your preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Settings2 className="h-4 w-4 text-primary" />
                    <span>Learns your voting preferences</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Votes automatically on your behalf</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Bot className="h-4 w-4 text-primary" />
                    <span>Analyzes proposals for risk assessment</span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setActiveTab('automation')}
                >
                  Configure Auto-Voting
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>AI Usage Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">156</div>
                  <div className="text-sm text-muted-foreground">Questions Asked</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">47</div>
                  <div className="text-sm text-muted-foreground">Auto Votes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">89%</div>
                  <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">12.5h</div>
                  <div className="text-sm text-muted-foreground">Time Saved</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ask-ethra" className="mt-6">
          <AIChat />
        </TabsContent>

        <TabsContent value="automation" className="mt-6">
          <DaisyAgent />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <VotingPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AICompanions;
