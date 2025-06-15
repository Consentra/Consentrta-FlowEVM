
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { IdentityVerification } from '@/components/IdentityVerification';
import { VerificationStatus } from '@/components/VerificationStatus';
import { Card, CardContent } from '@/components/ui/card';

const IdentityVerificationPage = () => {
  const { user } = useAuth();
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

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to access identity verification
            </p>
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
