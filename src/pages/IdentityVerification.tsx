
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { IdentityVerification } from '@/components/IdentityVerification';
import { VerificationStatus } from '@/components/VerificationStatus';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Shield } from 'lucide-react';

const IdentityVerificationPage = () => {
  const { user, connectWallet } = useAuth();
  const { isConnected, account } = useBlockchain();
  const {
    verificationRecord,
    loading,
    isVerified,
    isPending,
    isRejected,
    submitVerification,
    refetch
  } = useIdentityVerification();
  const [showVerificationForm, setShowVerificationForm] = useState(false);

  const handleStartVerification = () => {
    setShowVerificationForm(true);
  };

  const handleVerificationComplete = (verified: boolean) => {
    if (verified) {
      setShowVerificationForm(false);
      refetch();
    }
  };

  const handleConnectWallet = async () => {
    const connected = await connectWallet();
    if (connected) {
      console.log('Wallet connected successfully:', account);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground">
              Please sign in to access identity verification
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isConnected || !user.wallet_address) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-6">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Wallet Connection Required</h2>
            <p className="text-muted-foreground mb-6">
              To mint your Soulbound Identity NFT, you need to connect your wallet to the blockchain
            </p>
            <Button onClick={handleConnectWallet} className="btn-gradient">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-display font-bold mb-2">Identity Verification</h1>
        <p className="text-muted-foreground">
          Secure your DAO participation with blockchain-verified identity
        </p>
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-center space-x-2 text-sm">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-green-700 dark:text-green-300">
              Wallet Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
            </span>
          </div>
        </div>
      </div>

      {showVerificationForm || (!verificationRecord && !loading) ? (
        <IdentityVerification 
          onVerify={handleVerificationComplete}
          onSubmit={submitVerification}
        />
      ) : (
        <VerificationStatus
          verificationRecord={verificationRecord}
          loading={loading}
          onRefetch={refetch}
          onStartVerification={handleStartVerification}
        />
      )}
    </div>
  );
};

export default IdentityVerificationPage;
