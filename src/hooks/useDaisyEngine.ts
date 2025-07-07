
import { useState, useEffect, useCallback } from 'react';
import { useAIVoting } from './useAIVoting';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { DaisyVotingEngine } from '@/services/DaisyVotingEngine';
import { ProposalForVoting } from '@/types/proposals';
import { supabase } from '@/integrations/supabase/client';

export const useDaisyEngine = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [engineInstance, setEngineInstance] = useState<DaisyVotingEngine | null>(null);
  const { config } = useAIVoting();
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize Daisy engine when config and user are available
  useEffect(() => {
    if (config && user?.address) {
      const engine = new DaisyVotingEngine(config, user.address);
      setEngineInstance(engine);
      console.log('Daisy engine initialized with real data');
    } else {
      setEngineInstance(null);
    }
  }, [config, user?.address]);

  // Listen for proposal processing requests
  useEffect(() => {
    const handleProcessProposal = async (event: CustomEvent) => {
      if (!engineInstance || !config?.autoVotingEnabled) {
        return;
      }

      const proposal = event.detail as ProposalForVoting;
      setIsProcessing(true);
      
      try {
        await engineInstance.processProposal(proposal);
      } catch (error) {
        console.error('Error processing proposal with Daisy:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    window.addEventListener('daisy-process-proposal', handleProcessProposal as EventListener);
    return () => {
      window.removeEventListener('daisy-process-proposal', handleProcessProposal as EventListener);
    };
  }, [engineInstance, config?.autoVotingEnabled]);

  // Listen for Daisy notifications
  useEffect(() => {
    const handleDaisyNotification = (event: CustomEvent) => {
      const { type, proposalTitle, vote, confidence, conflict, error, txHash } = event.detail;

      switch (type) {
        case 'vote_success':
          toast({
            title: "Daisy Voted Successfully",
            description: `Voted "${vote}" on "${proposalTitle}"${txHash ? ` (TX: ${txHash.slice(0, 10)}...)` : ''}`,
          });
          break;

        case 'vote_failed':
          toast({
            title: "Daisy Vote Failed",
            description: `Failed to vote "${vote}" on "${proposalTitle}": ${error}`,
            variant: "destructive",
          });
          break;

        case 'conflict':
          toast({
            title: "Voting Conflict Detected",
            description: `"${proposalTitle}": ${conflict}. Manual review needed.`,
            variant: "destructive",
          });
          break;

        case 'low_confidence':
          toast({
            title: "Low Confidence Skip",
            description: `Skipped "${proposalTitle}" (${confidence}% confidence)`,
          });
          break;

        case 'error':
          toast({
            title: "Daisy Processing Error",
            description: `Error processing "${proposalTitle}": ${error}`,
            variant: "destructive",
          });
          break;
      }
    };

    window.addEventListener('daisy-notification', handleDaisyNotification as EventListener);
    return () => {
      window.removeEventListener('daisy-notification', handleDaisyNotification as EventListener);
    };
  }, [toast]);

  // Process new proposals automatically
  const processProposal = useCallback(async (proposal: ProposalForVoting) => {
    if (!engineInstance || !config?.autoVotingEnabled) {
      return;
    }

    setIsProcessing(true);
    try {
      await engineInstance.processProposal(proposal);
    } catch (error) {
      console.error('Error processing proposal with Daisy:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [engineInstance, config?.autoVotingEnabled]);

  return {
    isProcessing,
    processProposal,
    isDaisyEnabled: !!engineInstance && !!config?.autoVotingEnabled,
  };
};
