
import { useState } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { ethers } from 'ethers';
import { MINIMAL_GOVERNOR_ABI } from '@/utils/contractABIs';
import { supabase } from '@/integrations/supabase/client';

export const useOnChainVoting = () => {
  const [loading, setLoading] = useState(false);
  const { isConnected } = useAuth();
  const { toast } = useToast();

  const castOnChainVote = async (
    proposalId: string,
    daoId: string,
    vote: 'for' | 'against' | 'abstain',
    reason?: string
  ) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      });
      return { success: false };
    }

    setLoading(true);
    try {
      // Get DAO governor address from database
      const { data: dao, error: daoError } = await supabase
        .from('daos')
        .select('governor_address, name')
        .eq('id', daoId)
        .single();

      if (daoError || !dao?.governor_address) {
        throw new Error('DAO not found or not deployed');
      }

      // Use MinimalGovernor service directly
      const { minimalGovernorService } = await import('@/services/MinimalGovernorService');
      
      // Connect to blockchain  
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await minimalGovernorService.connect(provider);
      
      // Convert vote to support number for Governor standard
      const support = vote === 'for' ? 1 : vote === 'against' ? 0 : 2;

      // We'll use the MinimalGovernor service instead of direct contract interaction

      // Submit vote on-chain using MinimalGovernor service
      const txHash = await minimalGovernorService.castVoteWithReason(
        proposalId,
        support,
        reason || `Vote: ${vote}`
      );

      // Update database to reflect on-chain vote
      const { error: dbError } = await supabase
        .from('votes')
        .upsert({
          proposal_id: proposalId,
          dao_id: daoId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          vote: vote,
          automated: false,
          blockchain_tx_hash: txHash
        }, {
          onConflict: 'proposal_id,user_id'
        });

      if (dbError) {
        console.error('Database sync error:', dbError);
        // Don't fail the vote if DB sync fails, the on-chain vote is what matters
      }

      toast({
        title: "Vote Cast Successfully",
        description: `Your vote "${vote}" has been recorded on-chain (${txHash.slice(0, 10)}...)`,
      });

      return { success: true, txHash };
    } catch (error: any) {
      console.error('On-chain voting error:', error);
      toast({
        title: "Vote Failed",
        description: error.message || "Failed to cast vote on-chain",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    castOnChainVote,
    loading
  };
};
