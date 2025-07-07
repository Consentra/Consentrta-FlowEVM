
import { useState } from 'react';
import { useBlockchain } from './useBlockchain';
import { useToast } from './use-toast';
import { blockchainService } from '@/services/BlockchainService';
import { supabase } from '@/integrations/supabase/client';

export const useOnChainVoting = () => {
  const [loading, setLoading] = useState(false);
  const { isConnected, isCorrectNetwork } = useBlockchain();
  const { toast } = useToast();

  const castOnChainVote = async (
    proposalId: string,
    daoId: string,
    vote: 'for' | 'against' | 'abstain',
    reason?: string
  ) => {
    if (!isConnected || !isCorrectNetwork) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to a supported network",
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

      // Convert vote to support number
      const support = vote === 'for' ? 1 : vote === 'against' ? 0 : 2;

      // Submit vote on-chain
      const txHash = await blockchainService.submitVote(
        dao.governor_address,
        proposalId,
        support as 0 | 1 | 2,
        reason || `Vote: ${vote}`,
        false // manual vote
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
