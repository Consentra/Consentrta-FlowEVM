
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { identityVerificationService, VerificationRecord, VerificationSubmission } from '@/services/IdentityVerificationService';

export const useIdentityVerification = () => {
  const [verificationRecord, setVerificationRecord] = useState<VerificationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVerificationStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const record = await identityVerificationService.getVerificationStatus(user.address);
      setVerificationRecord(record);
    } catch (error) {
      console.error('Failed to fetch verification status:', error);
      toast({
        title: "Error",
        description: "Failed to load verification status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitVerification = async (data: VerificationSubmission) => {
    setSubmitting(true);
    
    try {
      const result = await identityVerificationService.submitVerification(data);
      
      if (result.success) {
        toast({
          title: "Verification Submitted",
          description: "Your documents have been submitted for review",
        });
        
        // Refresh verification status
        await fetchVerificationStatus();
        return { success: true };
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "Failed to submit verification",
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Submission Failed",
        description: message,
        variant: "destructive",
      });
      return { success: false, error: message };
    } finally {
      setSubmitting(false);
    }
  };

  const isVerified = verificationRecord?.status === 'verified';
  const isPending = verificationRecord?.status === 'pending' || verificationRecord?.status === 'in_progress';
  const isRejected = verificationRecord?.status === 'rejected';

  useEffect(() => {
    fetchVerificationStatus();
  }, [user]);

  // Poll for status updates if verification is pending
  useEffect(() => {
    if (isPending) {
      const interval = setInterval(fetchVerificationStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [isPending]);

  return {
    verificationRecord,
    loading,
    submitting,
    isVerified,
    isPending,
    isRejected,
    submitVerification,
    refetch: fetchVerificationStatus
  };
};
