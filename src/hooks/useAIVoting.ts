
import { useState, useEffect, useCallback, useRef } from 'react';
import { useBlockchain } from './useBlockchain';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VotingPreference, AIVotingConfig, ProposalForVoting } from '@/types/proposals';

export const useAIVoting = () => {
  const [config, setConfig] = useState<AIVotingConfig | null>(null);
  const [activeVotingTasks, setActiveVotingTasks] = useState<Set<string>>(new Set());
  const [isConfigSynced, setIsConfigSynced] = useState(false);
  const { isConnected, account } = useBlockchain();
  const { toast } = useToast();

  // Load configuration from backend and localStorage
  useEffect(() => {
    const loadConfig = async () => {
      if (account) {
        try {
          // Try to load from backend first
          const response = await supabase.functions.invoke('daisy-config', {
            body: { userAddress: account }
          });

          if (response.data && !response.error) {
            setConfig(response.data);
            localStorage.setItem('votingPreferences', JSON.stringify(response.data));
            setIsConfigSynced(true);
            return;
          }
        } catch (error) {
          console.warn('Failed to load config from backend, trying localStorage');
        }
      }

      // Fallback to localStorage
      const saved = localStorage.getItem('votingPreferences');
      if (saved) {
        try {
          const localConfig = JSON.parse(saved);
          setConfig(localConfig);
        } catch (error) {
          console.error('Failed to load voting preferences:', error);
        }
      }
    };

    loadConfig();
  }, [account]);

  const updateConfig = useCallback(async (newConfig: AIVotingConfig) => {
    setConfig(newConfig);
    localStorage.setItem('votingPreferences', JSON.stringify(newConfig));
    
    // Save to backend if user is connected
    if (account) {
      try {
        const response = await supabase.functions.invoke('daisy-config', {
          body: { 
            ...newConfig, 
            userAddress: account 
          }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        setIsConfigSynced(true);
        toast({
          title: "Configuration Saved",
          description: "Daisy configuration has been saved successfully.",
        });
      } catch (error) {
        console.error('Failed to save config to backend:', error);
        toast({
          title: "Save Warning",
          description: "Configuration saved locally but failed to sync with backend.",
          variant: "destructive",
        });
        setIsConfigSynced(false);
      }
    }
  }, [account, toast]);

  // Monitor for new proposals and process them with Daisy
  useEffect(() => {
    if (!config?.autoVotingEnabled || !account) {
      return;
    }

    // Subscribe to new proposals
    const channel = supabase
      .channel('daisy-proposals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'proposals'
        },
        async (payload) => {
          const newProposal = payload.new as any;
          
          // Convert to ProposalForVoting format
          const proposalForVoting: ProposalForVoting = {
            id: newProposal.id,
            title: newProposal.title,
            description: newProposal.description || '',
            category: newProposal.category || 'general',
            dao_id: newProposal.dao_id,
            blockchain_proposal_id: newProposal.blockchain_proposal_id,
            deadline: new Date(newProposal.deadline || Date.now() + 7 * 24 * 60 * 60 * 1000)
          };

          console.log('New proposal detected, processing with Daisy:', proposalForVoting.id);
          
          // Add to active tasks
          setActiveVotingTasks(prev => new Set([...prev, proposalForVoting.id]));
          
          // Process with Daisy (this would trigger the DaisyVotingEngine)
          window.dispatchEvent(new CustomEvent('daisy-process-proposal', {
            detail: proposalForVoting
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config?.autoVotingEnabled, account]);

  const scheduleVote = useCallback(async (proposal: ProposalForVoting) => {
    if (!config?.autoVotingEnabled || !isConnected || !account) {
      return;
    }

    if (activeVotingTasks.has(proposal.id)) {
      return; // Already scheduled
    }

    try {
      setActiveVotingTasks(prev => new Set([...prev, proposal.id]));
      
      toast({
        title: "Vote Scheduled",
        description: `Daisy will analyze and vote on "${proposal.title}" in ${config.votingDelay} minutes`,
      });

      // Trigger Daisy processing
      window.dispatchEvent(new CustomEvent('daisy-process-proposal', {
        detail: proposal
      }));
    } catch (error) {
      console.error('Failed to schedule vote:', error);
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule automatic vote",
        variant: "destructive",
      });
    }
  }, [config, isConnected, account, activeVotingTasks, toast]);

  const cancelScheduledVote = useCallback((proposalId: string) => {
    setActiveVotingTasks(prev => {
      const next = new Set(prev);
      next.delete(proposalId);
      return next;
    });
    
    toast({
      title: "Scheduled Vote Cancelled",
      description: "The automated vote has been cancelled",
    });
  }, [toast]);

  return {
    config,
    activeVotingTasks,
    isConfigSynced,
    scheduleVote,
    cancelScheduledVote,
    updateConfig,
    isAutoVotingEnabled: config?.autoVotingEnabled || false,
  };
};
