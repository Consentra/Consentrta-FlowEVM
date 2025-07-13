
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';


interface UserProfile {
  id: string;
  email: string;
  wallet_address?: string;
  is_verified?: boolean;
  verification_status?: 'pending' | 'in_progress' | 'verified' | 'rejected';
  soulbound_nft_token_id?: number;
  verification_completed_at?: string;
  created_at: string;
  updated_at: string;
  display_name?: string;
  bio?: string;
  identity_nft_id?: number;
  // Add computed properties that other components expect
  address: string;
  shortAddress: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isConnected: boolean;
  signOut: () => Promise<void>;
  signIn: () => Promise<{ error?: any }>;
  connectWallet: () => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAccount, setWalletAccount] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check for existing wallet connection on mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Create user when wallet is connected
  useEffect(() => {
    if (walletAccount && isWalletConnected && !user) {
      createWalletUser();
    } else if (user && walletAccount && user.wallet_address !== walletAccount) {
      updateProfile({ wallet_address: walletAccount });
    }
  }, [walletAccount, user, isWalletConnected]);

  // Initialize blockchain service when wallet connects
  useEffect(() => {
    if (isWalletConnected && walletAccount) {
      initializeBlockchainService();
    }
  }, [isWalletConnected, walletAccount]);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAccount(accounts[0]);
          setIsWalletConnected(true);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const createUserProfile = (profileData: any, walletAddress?: string): UserProfile => {
    const address = walletAddress || profileData.wallet_address || profileData.id;
    return {
      ...profileData,
      address,
      shortAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'
    };
  };

  const fetchUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            email: authUser.email || '',
            wallet_address: walletAccount || null
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          setUser(createUserProfile(newProfile, walletAccount));
        }
      } else {
        setUser(createUserProfile(profile));
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (): Promise<{ error?: any }> => {
    try {
      const connected = await connectWallet();
      if (connected) {
        return { error: null };
      } else {
        return { error: 'Failed to connect wallet' };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const connectWallet = async (): Promise<boolean> => {
    if (typeof window.ethereum === 'undefined') {
      console.error('MetaMask not found');
      return false;
    }

    // Avoid duplicate requests
    if (loading) {
      return false;
    }

    setLoading(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setWalletAccount(accounts[0]);
        setIsWalletConnected(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createWalletUser = async () => {
    if (!walletAccount) return;

    // Create a basic user profile based on wallet address
    const walletUser: UserProfile = {
      id: walletAccount,
      email: '',
      wallet_address: walletAccount,
      is_verified: false,
      verification_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      address: walletAccount,
      shortAddress: `${walletAccount.slice(0, 6)}...${walletAccount.slice(-4)}`
    };

    setUser(walletUser);
  };

  const initializeBlockchainService = async () => {
    try {
      const { blockchainService } = await import('@/services/BlockchainService');
      await blockchainService.connect();
      console.log('✅ Blockchain service connected successfully');
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
    }
  };

  const updateProfile = async (updates: Partial<Omit<UserProfile, 'address' | 'shortAddress'>>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
      } else {
        setUser(createUserProfile(data));
      }
    } catch (error) {
      console.error('Error in updateProfile:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    isConnected: isWalletConnected && !!user,
    signOut,
    signIn,
    connectWallet,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
