
import { ethers } from 'ethers';
import { apiClient } from '@/utils/apiClient';
import { VotingPreference, AIVotingConfig, ProposalForVoting } from '@/types/proposals';
import { CONSENSTRA_DAO_ABI, voteToNumber } from '@/utils/contractIntegration';

export class AIVotingService {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private daoContract: ethers.Contract;
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    provider: ethers.Provider,
    signer: ethers.Signer,
    daoContract: ethers.Contract
  ) {
    this.provider = provider;
    this.signer = signer;
    this.daoContract = daoContract;
  }

  async scheduleAutomaticVote(
    proposal: ProposalForVoting,
    config: AIVotingConfig,
    userAddress: string
  ): Promise<boolean> {
    if (!config.autoVotingEnabled) {
      console.log(`Auto-voting disabled for user ${userAddress}`);
      return false;
    }

    try {
      // Cancel any existing timer for this proposal
      this.cancelScheduledVote(proposal.id);

      // Check if vote already cast
      try {
        const alreadyVoted = await this.daoContract.hasVoted(proposal.id, userAddress);
        if (alreadyVoted) {
          console.log(`User ${userAddress} already voted on proposal ${proposal.id}`);
          return false;
        }
      } catch (error) {
        console.warn('Could not check existing vote status, proceeding with analysis');
      }

      // Analyze proposal
      const analysis = await this.analyzeProposal(proposal, config);
      
      if (!analysis.shouldVote) {
        console.log(`Skipping auto-vote for proposal ${proposal.id}: ${analysis.reasoning}`);
        return false;
      }

      // Schedule vote on blockchain if available
      try {
        if (this.daoContract.scheduleAIVote) {
          const tx = await this.daoContract.scheduleAIVote(
            proposal.id,
            userAddress,
            proposal.category || 'general'
          );
          await tx.wait();
          console.log(`AI vote scheduled on blockchain for proposal ${proposal.id}`);
        }
      } catch (error) {
        console.warn('Blockchain scheduling failed, using local timer:', error);
      }

      // Notify backend
      try {
        await apiClient.scheduleAIVote(proposal.id, userAddress, proposal.category || 'general');
      } catch (error) {
        console.warn('Backend notification failed:', error);
      }

      // Set local timer for execution
      const delayMs = config.votingDelay * 60 * 1000;
      const timer = setTimeout(async () => {
        try {
          await this.executeAutomaticVote(proposal, analysis, userAddress);
        } catch (error) {
          console.error('Failed to execute scheduled vote:', error);
          this.emitVoteError(proposal.id, error);
        } finally {
          this.activeTimers.delete(proposal.id);
        }
      }, delayMs);

      this.activeTimers.set(proposal.id, timer);
      
      console.log(`Scheduled AI vote for proposal ${proposal.id} in ${config.votingDelay} minutes`);
      return true;

    } catch (error) {
      console.error('Failed to schedule AI vote:', error);
      throw error;
    }
  }

  private async executeAutomaticVote(
    proposal: ProposalForVoting,
    analysis: any,
    userAddress: string
  ): Promise<void> {
    try {
      // Try blockchain execution first
      try {
        if (this.daoContract.executeAIVote) {
          const tx = await this.daoContract.executeAIVote(
            proposal.id, 
            userAddress, 
            proposal.category || 'general'
          );
          const receipt = await tx.wait();
          
          console.log(`Successfully executed AI vote for proposal ${proposal.id}. Tx: ${receipt.hash}`);
          this.emitVoteSuccess(proposal.id, analysis.vote, receipt.hash);
        } else {
          throw new Error('executeAIVote function not available');
        }
      } catch (blockchainError) {
        console.warn('Blockchain execution failed, attempting direct vote:', blockchainError);
        
        // Fallback to direct vote casting
        const supportValue = voteToNumber(analysis.vote);
        const reason = `AI automated vote: ${analysis.reasoning}`;
        
        let tx;
        try {
          // Try enhanced voting function first
          if (this.daoContract.castVoteWithReasonAndAutomation) {
            tx = await this.daoContract.castVoteWithReasonAndAutomation(
              proposal.id, 
              supportValue, 
              reason, 
              true
            );
          } else {
            // Fallback to standard vote with reason
            tx = await this.daoContract.castVoteWithReason(proposal.id, supportValue, reason);
          }
        } catch {
          // Final fallback to basic vote
          tx = await this.daoContract.castVote(proposal.id, supportValue);
        }
        
        const receipt = await tx.wait();
        console.log(`Successfully cast AI vote directly for proposal ${proposal.id}. Tx: ${receipt.hash}`);
        this.emitVoteSuccess(proposal.id, analysis.vote, receipt.hash);
      }

      // Notify backend of successful execution
      try {
        await apiClient.executeAIVote(proposal.id, userAddress, proposal.category || 'general');
      } catch (error) {
        console.warn('Backend notification failed:', error);
      }

    } catch (error) {
      console.error('Error executing automatic vote:', error);
      this.emitVoteError(proposal.id, error);
      throw error;
    }
  }

  private async analyzeProposal(
    proposal: ProposalForVoting,
    config: AIVotingConfig
  ): Promise<{
    shouldVote: boolean;
    vote: 'for' | 'against' | 'abstain';
    confidence: number;
    reasoning: string;
  }> {
    // Find matching preference
    const preference = config.preferences.find(p => 
      proposal.category && proposal.category.toLowerCase().includes(p.category.toLowerCase())
    );

    if (!preference) {
      return {
        shouldVote: false,
        vote: 'abstain',
        confidence: 0,
        reasoning: 'No matching preference found'
      };
    }

    // Get AI analysis from backend
    let aiAnalysis = proposal.aiAnalysis;
    if (!aiAnalysis) {
      try {
        aiAnalysis = await apiClient.analyzeProposal(proposal.id, proposal.description);
      } catch (error) {
        console.warn('Failed to get AI analysis, using default confidence');
        aiAnalysis = {
          confidenceScore: 50,
          predictedOutcome: 'fail',
          reasoning: 'Analysis unavailable'
        };
      }
    }

    const aiConfidence = aiAnalysis.confidenceScore || 0;
    
    // Adjust confidence based on automation level
    let adjustedConfidence = aiConfidence;
    switch (config.daisyAutomation) {
      case 'conservative':
        adjustedConfidence = Math.min(aiConfidence, 85);
        break;
      case 'aggressive':
        adjustedConfidence = Math.min(aiConfidence + 10, 95);
        break;
      default: // balanced
        break;
    }

    // Check if we should vote
    const shouldVote = adjustedConfidence >= config.confidenceThreshold;
    
    // Determine vote based on preference and AI analysis
    let vote: 'for' | 'against' | 'abstain' = preference.stance;
    
    if (aiAnalysis && adjustedConfidence > 80) {
      // If AI strongly disagrees with preference, consider changing vote
      if (preference.stance === 'for' && aiAnalysis.predictedOutcome === 'fail') {
        vote = 'against';
      } else if (preference.stance === 'against' && aiAnalysis.predictedOutcome === 'pass') {
        vote = 'for';
      }
    }

    const reasoning = `AI analysis: ${aiConfidence}% confidence, predicted ${aiAnalysis.predictedOutcome}. User preference: ${preference.stance} for ${preference.category}`;

    return {
      shouldVote,
      vote,
      confidence: adjustedConfidence,
      reasoning
    };
  }

  async syncConfigWithBlockchain(config: AIVotingConfig, userAddress: string): Promise<void> {
    try {
      // Configure AI voting on blockchain if available
      if (this.daoContract.configureAIVoting) {
        await this.daoContract.configureAIVoting(
          config.autoVotingEnabled,
          config.confidenceThreshold,
          config.votingDelay * 60 // Convert minutes to seconds
        );

        // Set category preferences
        for (const preference of config.preferences) {
          if (this.daoContract.setCategoryPreference) {
            const stanceValue = voteToNumber(preference.stance);
            await this.daoContract.setCategoryPreference(preference.category, stanceValue);
          }
        }
      }

      // Save to backend
      await apiClient.saveAIVotingConfig(config);

      console.log('AI voting configuration synced with blockchain and backend');
    } catch (error) {
      console.error('Failed to sync config with blockchain:', error);
      throw error;
    }
  }

  async getBlockchainConfig(userAddress: string): Promise<any> {
    try {
      if (this.daoContract.getUserAIConfig) {
        const config = await this.daoContract.getUserAIConfig(userAddress);
        return {
          enabled: config.enabled,
          minConfidenceThreshold: Number(config.minConfidenceThreshold),
          votingDelay: Number(config.votingDelay) / 60 // Convert seconds to minutes
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get blockchain config:', error);
      return null;
    }
  }

  cancelScheduledVote(proposalId: string): boolean {
    const timer = this.activeTimers.get(proposalId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(proposalId);
      console.log(`Cancelled scheduled vote for proposal ${proposalId}`);
      return true;
    }
    return false;
  }

  getActiveVotingTasks(): string[] {
    return Array.from(this.activeTimers.keys());
  }

  isVoteScheduled(proposalId: string): boolean {
    return this.activeTimers.has(proposalId);
  }

  private emitVoteSuccess(proposalId: string, vote: string, transactionHash: string): void {
    window.dispatchEvent(new CustomEvent('ai-vote-cast', {
      detail: { proposalId, vote, transactionHash }
    }));
  }

  private emitVoteError(proposalId: string, error: any): void {
    window.dispatchEvent(new CustomEvent('ai-vote-error', {
      detail: { proposalId, error: error.message || error }
    }));
  }

  shutdown(): void {
    // Clear all active timers
    for (const timer of this.activeTimers.values()) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();
  }
}
