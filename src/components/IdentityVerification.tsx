
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { useBlockchain } from '@/hooks/useBlockchain';
import { VerificationSubmission } from '@/services/IdentityVerificationService';

interface IdentityVerificationProps {
  onVerify?: (verified: boolean) => void;
  onSubmit?: (data: VerificationSubmission) => Promise<{ success: boolean; error?: string }>;
}

export const IdentityVerification: React.FC<IdentityVerificationProps> = ({ onVerify, onSubmit }) => {
  const { mintIdentityNFT, checkVerificationStatus, loading, isVerified } = useIdentityVerification();
  const { account, isConnected, isCorrectNetwork } = useBlockchain();

  useEffect(() => {
    if (account && isConnected && isCorrectNetwork) {
      checkVerificationStatus(account);
    }
  }, [account, isConnected, isCorrectNetwork]);

  if (!isConnected) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-orange-800">Connect your wallet to check verification status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-yellow-800">Switch to a supported network to verify your identity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isVerified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">Identity Verified</span>
          </CardTitle>
          <CardDescription className="text-green-700">
            Your identity has been verified on-chain. You can now participate in DAO governance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Shield className="h-3 w-3 mr-1" />
            Verified Member
          </Badge>
        </CardContent>
      </Card>
    );
  }

  const handleMintNFT = async () => {
    const result = await mintIdentityNFT();
    if (onVerify) {
      onVerify(result.success);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <span>Identity Verification</span>
        </CardTitle>
        <CardDescription>
          Verify your identity on-chain to participate in DAO governance and voting. This mints a soulbound NFT that proves your verification status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-muted-foreground">
            Verification required to create DAOs, vote, and participate in governance
          </span>
        </div>
        
        <Button 
          onClick={handleMintNFT}
          disabled={loading || isVerified}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Minting Identity NFT...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Verify Identity On-Chain
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          This will mint a soulbound (non-transferable) NFT to your wallet that serves as proof of identity verification.
        </p>
      </CardContent>
    </Card>
  );
};
