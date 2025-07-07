
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Vote, XCircle } from 'lucide-react';
import { useOnChainVoting } from '@/hooks/useOnChainVoting';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useToast } from '@/hooks/use-toast';

interface VoteButtonProps {
  proposalId: string;
  daoId: string;
  vote: 'for' | 'against' | 'abstain';
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  children: React.ReactNode;
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
  reason = ''
}) => {
  const { castOnChainVote, loading } = useOnChainVoting();
  const { isConnected, isCorrectNetwork } = useBlockchain();
  const { toast } = useToast();

  const handleVote = async () => {
    console.log('VoteButton - On-chain vote requested', { 
      proposalId, 
      daoId, 
      vote,
      isConnected,
      isCorrectNetwork
    });
    
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to vote on-chain",
        variant: "destructive",
      });
      return;
    }

    if (!isCorrectNetwork) {
      toast({
        title: "Wrong Network",
        description: "Please switch to a supported network (Flow EVM or Hyperion)",
        variant: "destructive",
      });
      return;
    }

    // Show user that this will require a wallet transaction
    toast({
      title: "Transaction Required",
      description: "Please confirm the transaction in your wallet to cast your vote on-chain",
    });

    const result = await castOnChainVote(proposalId, daoId, vote, reason);
    
    if (result.success) {
      console.log('On-chain vote successful:', result.txHash);
    }
  };

  return (
    <Button
      onClick={handleVote}
      disabled={disabled || loading || !isConnected}
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
