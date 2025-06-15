
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Vote, XCircle } from 'lucide-react';
import { useProposals } from '@/hooks/useProposals';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface VoteButtonProps {
  proposalId: string;
  daoId: string;
  vote: 'for' | 'against' | 'abstain';
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  children: React.ReactNode;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  proposalId,
  daoId,
  vote,
  disabled = false,
  className = '',
  variant = 'default',
  children
}) => {
  const [loading, setLoading] = useState(false);
  const { castVote } = useProposals();
  const { user, isConnected } = useAuth();
  const { toast } = useToast();

  const handleVote = async () => {
    if (!user || !isConnected) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await castVote(proposalId, daoId, vote);
      if (!error) {
        toast({
          title: "Vote Cast",
          description: `Successfully voted "${vote}"`,
        });
      }
    } catch (error) {
      console.error('Vote error:', error);
      toast({
        title: "Vote Failed",
        description: "Failed to cast vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleVote}
      disabled={disabled || loading}
      className={className}
      variant={variant}
      size="sm"
    >
      {loading ? (
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
      ) : vote === 'for' ? (
        <Vote className="mr-1 h-3 w-3" />
      ) : (
        <XCircle className="mr-1 h-3 w-3" />
      )}
      {children}
    </Button>
  );
};
