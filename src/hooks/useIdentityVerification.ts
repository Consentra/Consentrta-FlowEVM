
import { useState, useCallback } from 'react';
import { useBlockchain } from './useBlockchain';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import { soulboundIdentityService } from '@/services/SoulboundIdentityService';
import { identityVerificationService, VerificationRecord, VerificationSubmission } from '@/services/IdentityVerificationService';

export const useIdentityVerification = () => {
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [verificationRecord, setVerificationRecord] = useState<VerificationRecord | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const { isConnected, isCorrectNetwork } = useBlockchain();
  const { user } = useAuth();
  const { toast } = useToast();

  const checkVerificationStatus = async (address: string) => {
    if (!isConnected || !isCorrectNetwork) return false;
    
    try {
      const verified = await soulboundIdentityService.isVerified(address);
      setIsVerified(verified);
      return verified;
    } catch (error) {
      console.error('Error checking verification:', error);
      return false;
    }
  };

  const refetch = useCallback(async () => {
    if (!user) return;
    
    try {
      const status = await identityVerificationService.checkVerificationStatus(user.id);
      setVerificationRecord(status.record);
      setIsVerified(status.isVerified);
      setIsPending(status.isPending);
      setIsRejected(status.isRejected);
      
      // Also check on-chain status if wallet is connected
      if (user.wallet_address && isConnected && isCorrectNetwork) {
        const onChainVerified = await soulboundIdentityService.isVerified(user.wallet_address);
        setIsVerified(onChainVerified);
      }
    } catch (error) {
      console.error('Error refetching verification status:', error);
    }
  }, [user, isConnected, isCorrectNetwork]);

  const submitVerification = async (data: VerificationSubmission) => {
    if (!user || !user.wallet_address) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return { success: false };
    }

    setLoading(true);
    try {
      const result = await identityVerificationService.submitVerification(
        user.id,
        user.wallet_address,
        data
      );

      if (result.success) {
        toast({
          title: "Verification Submitted",
          description: "Your identity verification has been submitted successfully",
        });
        await refetch();
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Failed to submit verification",
          variant: "destructive",
        });
      }

      return result;
    } catch (error: any) {
      console.error('Verification submission error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to submit verification",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const mintIdentityNFT = async () => {
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
      toast({
        title: "Minting Identity NFT",
        description: "Please confirm the transaction in your wallet...",
      });

      const txHash = await soulboundIdentityService.requestVerification(
        "Default verification", // metadata URI - in production this would be more comprehensive
        "User verification request"
      );

      toast({
        title: "Identity NFT Minted",
        description: `Your identity has been verified on-chain (${txHash.slice(0, 10)}...)`,
      });

      // Refresh verification status
      const address = await window.ethereum.request({ method: 'eth_accounts' });
      if (address[0]) {
        await checkVerificationStatus(address[0]);
      }

      return { success: true, txHash };
    } catch (error: any) {
      console.error('Identity verification error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to mint identity NFT",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    mintIdentityNFT,
    checkVerificationStatus,
    submitVerification,
    refetch,
    loading,
    isVerified,
    verificationRecord,
    isPending,
    isRejected
  };
};
