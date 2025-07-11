import { ethers } from 'ethers';
import { apiClient } from '@/utils/apiClient';
import { VotingPreference, AIVotingConfig, ProposalForVoting } from '@/types/proposals';
import { proposalRegistryService } from '@/services/ProposalRegistryService';

export class AIVotingService {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    provider: ethers.Provider,
    signer: ethers.Signer
  ) {
    this.provider = provider;
    this.signer = signer;
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

      // Analyze proposal
      const analysis = await this.analyzeProposal(proposal, config);
      
      if (!analysis.shouldVote) {
        console.log(`Skipping auto-vote for proposal ${proposal.id}: ${analysis.reasoning}`);
        return false;
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
      console.log(`Executing automatic vote for proposal ${proposal.id}`);
      
      // For now, this is a mock implementation
      // In a real scenario, this would interact with the DAO contract
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      console.log(`Successfully executed AI vote for proposal ${proposal.id}. Tx: ${mockTxHash}`);
      this.emitVoteSuccess(proposal.id, analysis.vote, mockTxHash);

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

    // Get AI analysis from backend or proposal registry
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
      // Save to backend
      await apiClient.saveAIVotingConfig(config);
      console.log('AI voting configuration synced with backend');
    } catch (error) {
      console.error('Failed to sync config:', error);
      throw error;
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
