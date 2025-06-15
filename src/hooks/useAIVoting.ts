
import { useState, useEffect, useCallback, useRef } from 'react';
import { useBlockchain } from './useBlockchain';
import { useToast } from '@/hooks/use-toast';
import { AIVotingService } from '@/services/AIVotingService';
import { apiClient } from '@/utils/apiClient';
import { ethers } from 'ethers';
import { VotingPreference, AIVotingConfig, ProposalForVoting } from '@/types/proposals';

export const useAIVoting = () => {
  const [config, setConfig] = useState<AIVotingConfig | null>(null);
  const [activeVotingTasks, setActiveVotingTasks] = useState<Set<string>>(new Set());
  const [isConfigSynced, setIsConfigSynced] = useState(false);
  const { getContract, isConnected, account, provider, signer } = useBlockchain();
  const { toast } = useToast();
  const votingServiceRef = useRef<AIVotingService | null>(null);

  // Initialize voting service when blockchain is connected
  useEffect(() => {
    if (isConnected && provider && signer && account) {
      try {
        const daoAddress = '0x0000000000000000000000000000000000000000'; // Replace with actual DAO address
        const daoABI = [
          "function castVoteWithReasonAndAutomation(uint256 proposalId, uint8 support, string reason, bool automated) returns (uint256)",
          "function scheduleAIVote(uint256 proposalId, address voter, string category)",
          "function executeAIVote(uint256 proposalId, address voter, string category)",
          "function configureAIVoting(bool enabled, uint256 minConfidenceThreshold, uint256 votingDelay)",
          "function setCategoryPreference(string category, uint8 preference)",
          "function getUserAIConfig(address user) view returns (bool enabled, uint256 minConfidenceThreshold, uint256 votingDelay)",
          "function getScheduledAIVote(uint256 proposalId, address voter) view returns (uint256)",
          "function aiVotesCast(uint256 proposalId, address voter) view returns (bool)"
        ];
        
        const daoContract = new ethers.Contract(daoAddress, daoABI, signer);
        votingServiceRef.current = new AIVotingService(provider, signer, daoContract);
        
        console.log('AI Voting Service initialized with blockchain connection');
        
        // Load blockchain config
        loadBlockchainConfig();
        
      } catch (error) {
        console.error('Failed to initialize AI Voting Service:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to blockchain voting system",
          variant: "destructive",
        });
      }
    } else {
      // Cleanup service when disconnected
      if (votingServiceRef.current) {
        votingServiceRef.current.shutdown();
        votingServiceRef.current = null;
      }
      setIsConfigSynced(false);
    }

    return () => {
      if (votingServiceRef.current) {
        votingServiceRef.current.shutdown();
      }
    };
  }, [isConnected, provider, signer, account]);

  // Load configuration from localStorage and backend
  useEffect(() => {
    const loadLocalConfig = async () => {
      // Try to load from backend first
      if (account) {
        try {
          const backendConfig = await apiClient.getAIVotingConfig(account);
          if (backendConfig) {
            setConfig(backendConfig);
            localStorage.setItem('votingPreferences', JSON.stringify(backendConfig));
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

    loadLocalConfig();
  }, [account]);

  const loadBlockchainConfig = async () => {
    if (!votingServiceRef.current || !account) return;

    try {
      const blockchainConfig = await votingServiceRef.current.getBlockchainConfig(account);
      if (blockchainConfig) {
        console.log('Loaded blockchain config:', blockchainConfig);
        setIsConfigSynced(true);
      }
    } catch (error) {
      console.error('Failed to load blockchain config:', error);
      setIsConfigSynced(false);
    }
  };

  const syncConfigWithBlockchain = useCallback(async (newConfig: AIVotingConfig) => {
    if (!votingServiceRef.current || !account) {
      toast({
        title: "Connection Required",
        description: "Please connect your wallet to sync configuration",
        variant: "destructive",
      });
      return false;
    }

    try {
      await votingServiceRef.current.syncConfigWithBlockchain(newConfig, account);
      setIsConfigSynced(true);
      toast({
        title: "Configuration Synced",
        description: "AI voting preferences saved to blockchain and backend",
      });
      return true;
    } catch (error) {
      console.error('Failed to sync config:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to save configuration to blockchain",
        variant: "destructive",
      });
      setIsConfigSynced(false);
      return false;
    }
  }, [account, toast]);

  // Listen for AI vote events
  useEffect(() => {
    const handleVoteCast = (event: CustomEvent) => {
      const { proposalId, vote, transactionHash } = event.detail;
      toast({
        title: "AI Vote Cast Successfully",
        description: `Daisy voted "${vote}" on proposal ${proposalId}`,
      });
      
      // Remove from active tasks
      setActiveVotingTasks(prev => {
        const next = new Set(prev);
        next.delete(proposalId);
        return next;
      });
    };

    const handleVoteError = (event: CustomEvent) => {
      const { proposalId, error } = event.detail;
      toast({
        title: "AI Vote Failed",
        description: `Failed to vote on proposal ${proposalId}: ${error}`,
        variant: "destructive",
      });
      
      // Remove from active tasks
      setActiveVotingTasks(prev => {
        const next = new Set(prev);
        next.delete(proposalId);
        return next;
      });
    };

    window.addEventListener('ai-vote-cast', handleVoteCast as EventListener);
    window.addEventListener('ai-vote-error', handleVoteError as EventListener);

    return () => {
      window.removeEventListener('ai-vote-cast', handleVoteCast as EventListener);
      window.removeEventListener('ai-vote-error', handleVoteError as EventListener);
    };
  }, [toast]);

  const scheduleVote = useCallback(async (proposal: ProposalForVoting) => {
    if (!config?.autoVotingEnabled || !isConnected || !votingServiceRef.current || !account) {
      return;
    }

    if (activeVotingTasks.has(proposal.id)) {
      return; // Already scheduled
    }

    try {
      const success = await votingServiceRef.current.scheduleAutomaticVote(
        proposal,
        config,
        account
      );

      if (success) {
        setActiveVotingTasks(prev => new Set([...prev, proposal.id]));
        
        toast({
          title: "Vote Scheduled",
          description: `Daisy will analyze and vote on "${proposal.title}" in ${config.votingDelay} minutes`,
        });
      }
    } catch (error) {
      console.error('Failed to schedule vote:', error);
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule automatic vote on blockchain",
        variant: "destructive",
      });
    }
  }, [config, isConnected, account, activeVotingTasks, toast]);

  const cancelScheduledVote = useCallback((proposalId: string) => {
    if (votingServiceRef.current) {
      const cancelled = votingServiceRef.current.cancelScheduledVote(proposalId);
      
      if (cancelled) {
        setActiveVotingTasks(prev => {
          const next = new Set(prev);
          next.delete(proposalId);
          return next;
        });
        
        toast({
          title: "Scheduled Vote Cancelled",
          description: "The automated vote has been cancelled",
        });
      }
    }
  }, [toast]);

  const updateConfig = useCallback(async (newConfig: AIVotingConfig) => {
    setConfig(newConfig);
    localStorage.setItem('votingPreferences', JSON.stringify(newConfig));
    
    // Save to backend
    if (account) {
      try {
        await apiClient.saveAIVotingConfig(newConfig);
      } catch (error) {
        console.warn('Failed to save config to backend:', error);
      }
    }
    
    // Trigger sync if connected
    if (isConnected && account) {
      syncConfigWithBlockchain(newConfig);
    }
  }, [isConnected, account, syncConfigWithBlockchain]);

  return {
    config,
    activeVotingTasks,
    isConfigSynced,
    scheduleVote,
    cancelScheduledVote,
    updateConfig,
    syncConfigWithBlockchain,
    isAutoVotingEnabled: config?.autoVotingEnabled || false,
    isBlockchainConnected: isConnected,
  };
};
