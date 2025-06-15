
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Vote, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  ExternalLink,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useProposals } from '@/hooks/useProposals';
import { useAuth } from '@/hooks/useAuth';
import { VoteButton } from '@/components/VoteButton';

export const ProposalList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const { proposals, loading, error, getUserVote } = useProposals();
  const { user, isConnected } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'passed': return 'bg-green-100 text-green-700 border-green-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'treasury': return '💰';
      case 'parameter': return '⚙️';
      case 'membership': return '👥';
      default: return '📋';
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (proposal.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = selectedTab === 'all' || proposal.status === selectedTab;
    return matchesSearch && matchesTab;
  });

  const ProposalCard = ({ proposal }: { proposal: any }) => {
    const supportPercentage = proposal.total_votes > 0 ? (proposal.votes_for / proposal.total_votes) * 100 : 0;
    const quorumPercentage = proposal.quorum > 0 ? (proposal.total_votes / proposal.quorum) * 100 : 0;
    const timeLeft = proposal.status === 'active' && proposal.deadline ? 
      Math.ceil((new Date(proposal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    
    const userVote = getUserVote(proposal.id);

    return (
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{getTypeIcon(proposal.category)}</span>
                <Badge variant="outline" className="text-xs">
                  {proposal.daos?.name || 'Unknown DAO'}
                </Badge>
                <Badge className={`text-xs ${getStatusColor(proposal.status)}`}>
                  {proposal.status.toUpperCase()}
                </Badge>
              </div>
              <CardTitle className="text-lg mb-2">
                {proposal.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {proposal.description || 'No description provided'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {proposal.status === 'active' && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Support</span>
                <span className="font-medium">{supportPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={supportPercentage} className="h-2" />
              
              {proposal.quorum > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quorum</span>
                    <span className="font-medium">{quorumPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={quorumPercentage} className="h-2" />
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{proposal.votes_for.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">For</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{proposal.votes_against.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Against</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Created {new Date(proposal.created_at).toLocaleDateString()}</span>
            </div>
            {timeLeft && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{timeLeft} days left</span>
              </div>
            )}
          </div>

          {userVote && (
            <div className="flex items-center space-x-2 p-2 bg-muted rounded">
              <User className="h-4 w-4" />
              <span className="text-sm">You voted: <strong className="capitalize">{userVote.vote}</strong></span>
            </div>
          )}

          {proposal.status === 'active' && (!user || !isConnected) && (
            <Button variant="outline" className="w-full" size="sm" disabled>
              Connect Wallet to Vote
            </Button>
          )}

          {proposal.status === 'active' && user && isConnected && !userVote && (
            <div className="flex space-x-2">
              <VoteButton
                proposalId={proposal.id}
                daoId={proposal.dao_id}
                vote="for"
                className="flex-1"
              >
                Vote For
              </VoteButton>
              <VoteButton
                proposalId={proposal.id}
                daoId={proposal.dao_id}
                vote="against"
                className="flex-1"
                variant="outline"
              >
                Vote Against
              </VoteButton>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
            Proposals
          </h1>
          <p className="text-lg text-muted-foreground">
            Vote on governance proposals across all DAOs
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading proposals...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
          Proposals
        </h1>
        <p className="text-lg text-muted-foreground">
          Vote on governance proposals across all DAOs
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}. Please refresh the page to try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({proposals.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({proposals.filter(p => p.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger value="passed">
            Passed ({proposals.filter(p => p.status === 'passed').length})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed ({proposals.filter(p => p.status === 'failed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredProposals.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-muted-foreground">
                <Vote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No proposals found</h3>
                <p className="text-sm">
                  {searchTerm 
                    ? "Try adjusting your search criteria" 
                    : "No proposals available yet"
                  }
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProposals.map(proposal => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
