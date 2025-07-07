import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useToast } from '@/hooks/use-toast';
import { blockchainService } from '@/services/BlockchainService';
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
        description: "Please connect your wallet to create proposals on-chain",
        variant: "destructive",
      });
      return { error };
    }

    try {
      setError(null);

      // Get the DAO to find governor address
      const { data: dao, error: daoError } = await supabase
        .from('daos')
        .select('governor_address, name')
        .eq('id', proposalData.dao_id)
        .single();

      if (daoError || !dao?.governor_address) {
        throw new Error('DAO not found or not deployed on-chain');
      }

      toast({
        title: "Creating Proposal On-Chain",
        description: "Please confirm the transaction in your wallet...",
      });

      // Create proposal on blockchain - this requires wallet transaction
      const blockchainResult = await blockchainService.createProposal(
        dao.governor_address,
        {
          targets: [], // Empty for basic proposals
          values: [],
          calldatas: [],
          description: proposalData.description,
          title: proposalData.title,
          tags: [proposalData.category || 'general'],
          aiConfidenceScore: 85
        }
      );

      // Save to database with blockchain data
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          ...proposalData,
          creator_id: user.address,
          deadline: proposalData.deadline?.toISOString(),
          status: 'active',
          blockchain_proposal_id: blockchainResult.proposalId,
          blockchain_tx_hash: blockchainResult.txHash
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Proposal Created On-Chain",
        description: `Successfully created proposal (${blockchainResult.txHash.slice(0, 10)}...)`,
      });

      await fetchProposals();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      toast({
        title: "Failed to Create Proposal",
        description: error.message || "Could not create proposal on-chain. Please try again.",
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
    createProposal,
    getUserVote: (proposalId: string) => userVotes.find(vote => vote.proposal_id === proposalId),
    refetch: async () => {
      await Promise.all([fetchProposals(), fetchUserVotes()]);
    }
  };
};
