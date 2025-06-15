
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: { address: string; shortAddress: string } | null;
  loading: boolean;
  signIn: () => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  isConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ address: string; shortAddress: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      signOut();
    } else {
      const address = accounts[0];
      await createWalletUserIfNeeded(address);
      const userObj = {
        address,
        shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`
      };
      setUser(userObj);
      setIsConnected(true);
      
      // Redirect to dashboard after successful connection
      if (window.location.pathname === '/auth') {
        window.location.href = '/dashboard';
      }
    }
  };

  const handleChainChanged = () => {
    // Reload the page when chain changes to avoid issues
    window.location.reload();
  };

  const createWalletUserIfNeeded = async (walletAddress: string) => {
    try {
      console.log('Creating/checking user for wallet:', walletAddress);
      
      // Check if profile already exists using wallet_address as ID
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', walletAddress)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking existing profile:', fetchError);
        return;
      }

      if (!existingProfile) {
        console.log('Creating new profile for wallet:', walletAddress);
        // Create profile with wallet address as ID
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: walletAddress,
            wallet_address: walletAddress,
            display_name: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
            email: null,
            verification_status: 'pending' as const,
            is_verified: false
          });
        
        if (insertError) {
          console.error('Error creating wallet user:', insertError);
        } else {
          console.log('Successfully created profile for wallet:', walletAddress);
        }
      } else {
        console.log('Profile already exists for wallet:', walletAddress);
      }
    } catch (error) {
      console.error('Error in createWalletUserIfNeeded:', error);
    }
  };

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const address = accounts[0];
          await createWalletUserIfNeeded(address);
          const userObj = {
            address,
            shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`
          };
          setUser(userObj);
          setIsConnected(true);
          
          // If already connected and on auth page, redirect to dashboard
          if (window.location.pathname === '/auth') {
            window.location.href = '/dashboard';
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
    setLoading(false);
  };

  const signIn = async () => {
    if (typeof window.ethereum === 'undefined') {
      const error = new Error('MetaMask not installed');
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to connect your wallet",
        variant: "destructive",
      });
      return { error };
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        const address = accounts[0];
        await createWalletUserIfNeeded(address);
        const userObj = {
          address,
          shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`
        };
        setUser(userObj);
        setIsConnected(true);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
        });

        // Redirect to dashboard after successful sign in
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    setUser(null);
    setIsConnected(false);
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
    
    // Redirect to auth page after sign out
    window.location.href = '/auth';
    
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
      isConnected,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
