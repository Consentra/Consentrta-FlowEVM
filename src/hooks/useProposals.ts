import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useToast } from '@/hooks/use-toast';
import { blockchainService } from '@/utils/blockchain';
import { Proposal, Vote } from '@/types/proposals';

export const useProposals = (daoId?: string) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isConnected } = useAuth();
  const { isCorrectNetwork } = useBlockchain();
  const { toast } = useToast();

  const fetchProposals = async () => {
    try {
      setError(null);
      setLoading(true);

      let query = supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (daoId) {
        query = query.eq('dao_id', daoId);
      }

      const { data: proposalsData, error: proposalsError } = await query;

      if (proposalsError) {
        console.error('Supabase error fetching proposals:', proposalsError);
        throw proposalsError;
      }

      // Fetch DAO data separately
      const daoIds = [...new Set(proposalsData?.map(p => p.dao_id) || [])];
      let daosData: { id: string; name: string }[] = [];
      
      if (daoIds.length > 0) {
        const { data, error: daosError } = await supabase
          .from('daos')
          .select('id, name')
          .in('id', daoIds);

        if (daosError) {
          console.error('Supabase error fetching DAOs:', daosError);
          throw daosError;
        }
        
        daosData = data || [];
      }

      // Combine the data with proper typing
      const proposalsWithDaos: Proposal[] = proposalsData?.map(proposal => ({
        ...proposal,
        daos: daosData.find(dao => dao.id === proposal.dao_id) || null
      })) || [];

      setProposals(proposalsWithDaos);
    } catch (error: any) {
      console.error('Error fetching proposals:', error);
      setError('Failed to fetch proposals');
      toast({
        title: "Error",
        description: "Failed to fetch proposals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    if (!user?.address) return;

    try {
      setError(null);
      const userId = user.address;
      
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Supabase error fetching user votes:', error);
        throw error;
      }

      setUserVotes(data || []);
    } catch (error: any) {
      console.error('Error fetching user votes:', error);
      // Don't show error toast for vote fetching failures
    }
  };

  const castVote = async (proposalId: string, daoId: string, vote: 'for' | 'against' | 'abstain') => {
    if (!user?.address) {
      const error = new Error('Not authenticated');
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      });
      return { error };
    }

    if (!isConnected || !isCorrectNetwork) {
      const error = new Error('Wallet not connected to correct network');
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to Flow EVM Testnet",
        variant: "destructive",
      });
      return { error };
    }

    try {
      setError(null);
      const userId = user.address;

      // Get the proposal to find blockchain info
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) throw new Error('Proposal not found');

      // Get the DAO to find governor address
      const { data: dao, error: daoError } = await supabase
        .from('daos')
        .select('governor_address')
        .eq('id', daoId)
        .single();

      if (daoError) {
        console.error('Error fetching DAO:', daoError);
        throw new Error('DAO not found');
      }

      // Try to cast vote on blockchain if addresses are available
      if (dao?.governor_address && proposal.blockchain_proposal_id) {
        try {
          const voteValue = vote === 'for' ? 1 : vote === 'against' ? 0 : 2;
          await blockchainService.submitVote(
            dao.governor_address,
            proposal.blockchain_proposal_id,
            voteValue,
            `Vote: ${vote}`
          );
        } catch (blockchainError) {
          console.error('Blockchain vote error:', blockchainError);
          // Continue with database vote even if blockchain fails
        }
      }

      // Save vote to database (upsert to handle vote changes)
      const { error: voteError } = await supabase
        .from('votes')
        .upsert({
          proposal_id: proposalId,
          user_id: userId,
          dao_id: daoId,
          vote: vote,
          automated: false
        }, {
          onConflict: 'proposal_id,user_id'
        });

      if (voteError) {
        console.error('Database error casting vote:', voteError);
        throw voteError;
      }

      toast({
        title: "Vote Cast",
        description: `Successfully voted "${vote}"`,
      });

      // Refresh data
      await Promise.all([fetchProposals(), fetchUserVotes()]);

      return { error: null };
    } catch (error: any) {
      console.error('Error casting vote:', error);
      setError('Failed to cast vote');
      toast({
        title: "Failed to Cast Vote",
        description: error.message || "Could not cast your vote. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const createProposal = async (proposalData: {
    title: string;
    description: string;
    dao_id: string;
    deadline?: Date;
    category?: string;
  }) => {
    if (!user?.address) {
      const error = new Error('Not authenticated');
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to create proposals",
        variant: "destructive",
      });
      return { error };
    }

    if (!isConnected || !isCorrectNetwork) {
      const error = new Error('Wallet not connected to correct network');
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to Flow EVM Testnet",
        variant: "destructive",
      });
      return { error };
    }

    try {
      setError(null);
      const userId = user.address;

      // Get the DAO to find governor address
      const { data: dao, error: daoError } = await supabase
        .from('daos')
        .select('governor_address')
        .eq('id', proposalData.dao_id)
        .single();

      if (daoError) {
        console.error('Error fetching DAO:', daoError);
        throw new Error('DAO not found');
      }

      let blockchainProposalId = null;

      // Try to create proposal on blockchain if governor address is available
      if (dao?.governor_address) {
        try {
          await blockchainService.createProposal(
            dao.governor_address,
            [], // targets
            [], // values
            [], // calldatas
            proposalData.description,
            proposalData.title,
            [proposalData.category || 'general'],
            85 // AI confidence score
          );
          blockchainProposalId = '1'; // In real implementation, extract from tx
        } catch (blockchainError) {
          console.error('Blockchain proposal creation error:', blockchainError);
          // Continue with database creation even if blockchain fails
        }
      }

      // Save to database
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          ...proposalData,
          creator_id: userId,
          deadline: proposalData.deadline?.toISOString(),
          status: 'active',
          blockchain_proposal_id: blockchainProposalId
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating proposal:', error);
        throw error;
      }

      toast({
        title: "Proposal Created",
        description: "Successfully created proposal",
      });

      // Refresh data
      await fetchProposals();

      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      setError('Failed to create proposal');
      toast({
        title: "Failed to Create Proposal",
        description: error.message || "Could not create proposal. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const getUserVote = (proposalId: string): Vote | undefined => {
    return userVotes.find(vote => vote.proposal_id === proposalId);
  };

  // Initial data fetch
  useEffect(() => {
    fetchProposals();
  }, [daoId]);

  // Fetch user votes when user changes
  useEffect(() => {
    if (user?.address) {
      fetchUserVotes();
    } else {
      setUserVotes([]);
    }
  }, [user?.address]);

  return {
    proposals,
    userVotes,
    loading,
    error,
    castVote,
    createProposal,
    getUserVote,
    refetch: async () => {
      await Promise.all([fetchProposals(), fetchUserVotes()]);
    }
  };
};
