
import React from 'react';
import { IdentityVerification } from '@/components/IdentityVerification';
import { BlockchainStatus } from '@/components/BlockchainStatus';

const Profile = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Profile & Verification</h1>
        <p className="text-muted-foreground">
          Manage your on-chain identity and verification status
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-6">
        <BlockchainStatus />
        <IdentityVerification />
      </div>
    </div>
  );
};

export default Profile;
