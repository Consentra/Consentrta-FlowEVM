
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { consenstraGovernanceTokenService } from '@/services/ConsentraGovernanceTokenService';
import { useToast } from './use-toast';

interface TokenInfo {
  name: string;
  symbol: string;
  totalSupply: string;
  userBalance: string;
  votingPower: string;
}

export const useGovernanceToken = () => {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, isConnected } = useAuth();
  const { toast } = useToast();

  const loadTokenInfo = async () => {
    if (!user?.address || !isConnected) return;

    setLoading(true);
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not found');
      }
      
      const provider = new (await import('ethers')).BrowserProvider(window.ethereum);
      await consenstraGovernanceTokenService.connect(provider);
      
      const [name, symbol, totalSupply, userBalance, votingPower] = await Promise.all([
        consenstraGovernanceTokenService.getTokenName(),
        consenstraGovernanceTokenService.getTokenSymbol(),
        consenstraGovernanceTokenService.getTotalSupply(),
        consenstraGovernanceTokenService.getBalance(user.address),
        consenstraGovernanceTokenService.getVotingPower(user.address)
      ]);

      setTokenInfo({
        name,
        symbol,
        totalSupply,
        userBalance,
        votingPower
      });
    } catch (error) {
      console.error('Failed to load token info:', error);
      toast({
        title: "Error",
        description: "Failed to load governance token information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const transfer = async (to: string, amount: string) => {
    if (!user?.address || !isConnected) {
      toast({
        title: "Error",
        description: "Wallet not connected",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const txHash = await consenstraGovernanceTokenService.transfer(to, amount);
      toast({
        title: "Success",
        description: "Token transfer successful",
      });
      await loadTokenInfo(); // Refresh token info
      return txHash;
    } catch (error) {
      console.error('Transfer failed:', error);
      toast({
        title: "Error",
        description: "Token transfer failed",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const delegate = async (delegatee: string) => {
    if (!user?.address || !isConnected) {
      toast({
        title: "Error",
        description: "Wallet not connected",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const txHash = await consenstraGovernanceTokenService.delegate(delegatee);
      toast({
        title: "Success",
        description: "Voting power delegation successful",
      });
      await loadTokenInfo(); // Refresh token info
      return txHash;
    } catch (error) {
      console.error('Delegation failed:', error);
      toast({
        title: "Error",
        description: "Voting power delegation failed",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && user?.address) {
      loadTokenInfo();
    }
  }, [isConnected, user?.address]);

  return {
    tokenInfo,
    loading,
    transfer,
    delegate,
    refreshTokenInfo: loadTokenInfo
  };
};
