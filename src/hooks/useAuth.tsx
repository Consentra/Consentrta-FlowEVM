
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

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
  const { toast } = useToast();
  
  // Use wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // Handle wagmi account changes
  useEffect(() => {
    if (address && isConnected) {
      handleConnection(address);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [address, isConnected]);

  const handleConnection = async (walletAddress: string) => {
    await createWalletUserIfNeeded(walletAddress);
    const userObj = {
      address: walletAddress,
      shortAddress: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    };
    setUser(userObj);
    
    // Redirect to dashboard after successful connection
    if (window.location.pathname === '/auth') {
      window.location.href = '/dashboard';
    }
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


  const signIn = async () => {
    try {
      connect({ connector: injected() });
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
    disconnect();
    setUser(null);
    
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
