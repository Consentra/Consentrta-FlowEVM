
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  FileText,
  Camera,
  User
} from 'lucide-react';
import { VerificationRecord } from '@/services/IdentityVerificationService';
import { SoulboundNFT } from './SoulboundNFT';

interface VerificationStatusProps {
  verificationRecord: VerificationRecord | null;
  loading: boolean;
  onRefetch: () => void;
  onStartVerification: () => void;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  verificationRecord,
  loading,
  onRefetch,
  onStartVerification
}) => {
  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // No verification record - user needs to start verification
  if (!verificationRecord) {
    return (
      <Card className="glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle>Identity Verification Required</CardTitle>
          <CardDescription>
            Complete KYC verification to receive your Soulbound NFT and participate in DAO governance
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={onStartVerification} className="btn-gradient">
            <Shield className="mr-2 h-4 w-4" />
            Start Identity Verification
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusInfo = () => {
    switch (verificationRecord.status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-yellow-500',
          badge: 'status-pending',
          title: 'Verification Pending',
          description: 'Your documents are in the verification queue'
        };
      case 'in_progress':
        return {
          icon: RefreshCw,
          color: 'bg-blue-500',
          badge: 'status-pending',
          title: 'Verification In Progress',
          description: 'Our AI is analyzing your documents'
        };
      case 'verified':
        return {
          icon: CheckCircle,
          color: 'bg-green-500',
          badge: 'status-verified',
          title: 'Identity Verified',
          description: 'Your Soulbound NFT has been minted successfully'
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          color: 'bg-red-500',
          badge: 'status-failed',
          title: 'Verification Failed',
          description: verificationRecord.rejection_reason || 'Verification was unsuccessful'
        };
      default:
        return {
          icon: Shield,
          color: 'bg-muted',
          badge: 'status-pending',
          title: 'Unknown Status',
          description: 'Please contact support'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 ${statusInfo.color} rounded-full flex items-center justify-center mb-4`}>
            <StatusIcon className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            {statusInfo.title}
          </CardTitle>
          <CardDescription>{statusInfo.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <Badge className={statusInfo.badge}>
              {verificationRecord.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Verification Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Name:</span>
              </div>
              <span className="font-medium">{verificationRecord.full_name}</span>
              
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Document:</span>
              </div>
              <span className="font-medium capitalize">
                {verificationRecord.document_type.replace('_', ' ')}
              </span>
              
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Submitted:</span>
              </div>
              <span className="font-medium">
                {new Date(verificationRecord.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3">
            <Button variant="outline" onClick={onRefetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Status
            </Button>
            
            {verificationRecord.status === 'rejected' && (
              <Button onClick={onStartVerification} className="btn-gradient">
                <Shield className="mr-2 h-4 w-4" />
                Retry Verification
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Show Soulbound NFT if verified */}
      {verificationRecord.status === 'verified' && (
        <SoulboundNFT verificationRecord={verificationRecord} />
      )}
    </div>
  );
};
