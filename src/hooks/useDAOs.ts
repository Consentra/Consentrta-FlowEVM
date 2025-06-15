
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useToast } from '@/hooks/use-toast';
import { blockchainService } from '@/utils/blockchain';

interface DAO {
  id: string;
  name: string;
  description: string | null;
  token_address: string | null;
  governor_address: string | null;
  timelock_address: string | null;
  creator_id: string | null;
  member_count: number;
  proposal_count: number;
  treasury_value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DAOMembership {
  id: string;
  dao_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'moderator';
  joined_at: string;
}

export const useDAOs = () => {
  const [daos, setDAOs] = useState<DAO[]>([]);
  const [userMemberships, setUserMemberships] = useState<DAOMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { isConnected, isCorrectNetwork } = useBlockchain();
  const { toast } = useToast();

  // Compute userDAOs based on memberships
  const userDAOs = daos.filter(dao => 
    userMemberships.some(membership => membership.dao_id === dao.id)
  );

  const fetchDAOs = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('daos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching DAOs:', error);
        throw error;
      }
      
      setDAOs(data || []);
    } catch (error: any) {
      console.error('Error fetching DAOs:', error);
      setError('Failed to fetch DAOs');
      toast({
        title: "Error",
        description: "Failed to fetch DAOs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchUserMemberships = async () => {
    if (!user?.address) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('dao_memberships')
        .select('*')
        .eq('user_id', user.address);

      if (error) {
        console.error('Supabase error fetching memberships:', error);
        throw error;
      }
      
      setUserMemberships(data || []);
    } catch (error: any) {
      console.error('Error fetching user memberships:', error);
      setError('Failed to fetch memberships');
    }
  };

  const createDAO = async (daoData: {
    name: string;
    description: string;
    token_address?: string;
    governor_address?: string;
    timelock_address?: string;
  }) => {
    if (!user?.address) {
      const error = new Error('Not authenticated');
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to create a DAO",
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
      
      // Create the DAO on blockchain first
      let blockchainAddresses;
      try {
        blockchainAddresses = await blockchainService.createDAO({
          name: daoData.name,
          tokenName: `${daoData.name} Token`,
          tokenSymbol: daoData.name.substring(0, 4).toUpperCase(),
          initialSupply: "1000000",
          votingDelay: "1",
          votingPeriod: "7",
          proposalThreshold: "1000",
          quorumPercentage: "10",
          timelockDelay: "172800" // 2 days
        });
      } catch (blockchainError) {
        console.error('Blockchain deployment error:', blockchainError);
        toast({
          title: "Blockchain Error",
          description: "Failed to deploy DAO to blockchain. Please try again.",
          variant: "destructive",
        });
        return { error: blockchainError };
      }

      // Save to database with blockchain addresses
      const { data, error } = await supabase
        .from('daos')
        .insert({
          ...daoData,
          creator_id: user.address,
          token_address: blockchainAddresses.token,
          governor_address: blockchainAddresses.dao,
          timelock_address: blockchainAddresses.timelock,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating DAO:', error);
        throw error;
      }

      // Add creator as admin member
      const { error: membershipError } = await supabase
        .from('dao_memberships')
        .insert({
          dao_id: data.id,
          user_id: user.address,
          role: 'admin'
        });

      if (membershipError) {
        console.error('Error creating admin membership:', membershipError);
        // Don't fail the entire operation for this
      }

      toast({
        title: "DAO Created Successfully",
        description: "Your DAO has been deployed to Flow EVM Testnet",
      });

      // Refresh data
      await Promise.all([fetchDAOs(), fetchUserMemberships()]);

      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating DAO:', error);
      setError('Failed to create DAO');
      toast({
        title: "Failed to Create DAO",
        description: error.message || "Could not create the DAO. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const joinDAO = async (daoId: string) => {
    if (!user?.address) {
      const error = new Error('Not authenticated');
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to join DAOs",
        variant: "destructive",
      });
      return { error };
    }

    try {
      setError(null);
      const { error } = await supabase
        .from('dao_memberships')
        .insert({
          dao_id: daoId,
          user_id: user.address,
          role: 'member'
        });

      if (error) {
        console.error('Database error joining DAO:', error);
        throw error;
      }

      toast({
        title: "Successfully Joined DAO",
        description: "You are now a member of this DAO",
      });

      // Refresh data
      await fetchUserMemberships();

      return { error: null };
    } catch (error: any) {
      console.error('Error joining DAO:', error);
      setError('Failed to join DAO');
      toast({
        title: "Failed to Join DAO",
        description: error.message || "Could not join the DAO. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const leaveDAO = async (daoId: string) => {
    if (!user?.address) {
      const error = new Error('Not authenticated');
      return { error };
    }

    try {
      setError(null);
      const { error } = await supabase
        .from('dao_memberships')
        .delete()
        .eq('dao_id', daoId)
        .eq('user_id', user.address);

      if (error) {
        console.error('Database error leaving DAO:', error);
        throw error;
      }

      toast({
        title: "Left DAO",
        description: "You have successfully left the DAO",
      });

      // Refresh data
      await fetchUserMemberships();

      return { error: null };
    } catch (error: any) {
      console.error('Error leaving DAO:', error);
      setError('Failed to leave DAO');
      toast({
        title: "Failed to Leave DAO",
        description: error.message || "Could not leave the DAO. Please try again.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const isUserMember = (daoId: string): boolean => {
    return userMemberships.some(membership => membership.dao_id === daoId);
  };

  const getUserRole = (daoId: string): string | null => {
    const membership = userMemberships.find(membership => membership.dao_id === daoId);
    return membership?.role || null;
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDAOs();
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Fetch user memberships when user changes
  useEffect(() => {
    if (user?.address) {
      fetchUserMemberships();
    } else {
      setUserMemberships([]);
    }
  }, [user?.address]);

  return {
    daos,
    userDAOs,
    userMemberships,
    loading,
    error,
    createDAO,
    joinDAO,
    leaveDAO,
    isUserMember,
    getUserRole,
    refetch: async () => {
      await Promise.all([fetchDAOs(), fetchUserMemberships()]);
    }
  };
};
