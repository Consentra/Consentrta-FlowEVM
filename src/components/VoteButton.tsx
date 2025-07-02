
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Vote, XCircle } from 'lucide-react';
import { useProposals } from '@/hooks/useProposals';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { blockchainService } from '@/utils/blockchain';

interface VoteButtonProps {
  proposalId: string;
  daoId: string;
  vote: 'for' | 'against' | 'abstain';
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  children: React.ReactNode;
  automated?: boolean;
  reason?: string;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  proposalId,
  daoId,
  vote,
  disabled = false,
  className = '',
  variant = 'default',
  children,
  automated = false,
  reason = ''
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
      // Convert vote to support number
      const support = vote === 'for' ? 1 : vote === 'against' ? 0 : 2;
      
      // Use enhanced blockchain service for voting
      const txHash = await blockchainService.submitVote(
        daoId, // This should be DAO address
        proposalId,
        support as 0 | 1 | 2,
        reason || `Vote: ${vote}`,
        automated
      );

      // Also update via hooks for UI consistency
      const { error } = await castVote(proposalId, daoId, vote);
      
      if (!error) {
        toast({
          title: "Vote Cast",
          description: `Successfully voted "${vote}" (${txHash.slice(0, 10)}...)`,
        });
      }
    } catch (error: any) {
      console.error('Vote error:', error);
      toast({
        title: "Vote Failed",
        description: error.message || "Failed to cast vote. Please try again.",
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
