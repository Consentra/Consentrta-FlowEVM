import { ethers } from 'ethers';
import { VotingPreference, AIVotingConfig, ProposalForVoting } from '@/types/proposals';
import { DaisyAutomationService, DaisyVotingDecision } from './DaisyAutomationService';
import { supabase } from '@/integrations/supabase/client';

export class DaisyVotingEngine {
  private config: AIVotingConfig;
  private userAddress: string;
  private automationService: DaisyAutomationService;

  constructor(config: AIVotingConfig, userAddress: string) {
    this.config = config;
    this.userAddress = userAddress;
    this.automationService = new DaisyAutomationService(userAddress);
  }

  async processProposal(proposal: ProposalForVoting): Promise<void> {
    console.log('Daisy processing proposal for on-chain voting:', proposal.id);

    if (!this.config.autoVotingEnabled) {
      console.log('Automated voting disabled - Daisy is inactive');
      return;
    }

    try {
      // Check if user already voted on this proposal (on-chain)
      const existingVote = await this.checkExistingVote(proposal.id);
      if (existingVote) {
        console.log('User already voted on this proposal - skipping');
        return;
      }

      // Make voting decision
      const decision = await this.makeVotingDecision(proposal);

      // For on-chain voting, we need to be more careful about automation
      // Most votes will require manual approval unless user has set up delegation
      const hasVotingPermission = await this.automationService.checkVotingPermissions(
        proposal.dao_id
      );

      if (!hasVotingPermission) {
        decision.requiresApproval = true;
      }

      // Handle conflicts or low confidence
      if (decision.confidence < this.config.confidenceThreshold) {
        console.log(`Confidence too low (${decision.confidence}%) - manual approval required`);
        decision.requiresApproval = true;
      }

      // Schedule the automated vote with delay
      setTimeout(async () => {
        await this.executeAutomatedVote(proposal, decision);
      }, this.config.votingDelay * 60 * 1000);

    } catch (error) {
      console.error('Error processing proposal for on-chain voting:', error);
      this.notifyUser({
        type: 'error',
        proposalId: proposal.id,
        proposalTitle: proposal.title,
        error: error.message
      });
    }
  }

  private async executeAutomatedVote(
    proposal: ProposalForVoting, 
    decision: DaisyVotingDecision
  ): Promise<void> {
    console.log('Daisy executing automated on-chain vote:', { 
      proposalId: proposal.id, 
      vote: decision.vote,
      requiresApproval: decision.requiresApproval
    });

    try {
      const result = await this.automationService.handleAutomatedVoting(
        proposal.id,
        proposal.dao_id,
        decision
      );

      if (result.success) {
        console.log('Automated on-chain vote successful:', result.txHash);
      } else {
        console.log('Automated vote failed or requires approval:', result.error);
      }
    } catch (error) {
      console.error('Automated on-chain vote execution failed:', error);
      this.notifyUser({
        type: 'vote_failed',
        proposalId: proposal.id,
        proposalTitle: proposal.title,
        vote: decision.vote,
        error: error.message,
        automated: true
      });
    }
  }

  private async makeVotingDecision(proposal: ProposalForVoting): Promise<DaisyVotingDecision> {
    // 1. First, try to use user preferences
    const preferenceDecision = await this.getPreferenceBasedDecision(proposal);
    if (preferenceDecision) {
      return preferenceDecision;
    }

    // 2. If no preferences, use voting history
    const historyDecision = await this.getHistoryBasedDecision(proposal);
    if (historyDecision) {
      return historyDecision;
    }
    
    // Default decision for on-chain voting requires approval
    return {
      vote: 'abstain',
      confidence: 50,
      reasoning: 'On-chain voting requires manual approval by default',
      requiresApproval: true
    };
  }

  private async getPreferenceBasedDecision(proposal: ProposalForVoting): Promise<DaisyVotingDecision | null> {
    // Find matching user preference for this proposal category
    const categoryPreference = this.config.preferences.find(
      p => p.category.toLowerCase() === (proposal.category || 'general').toLowerCase()
    );

    if (!categoryPreference) {
      return null; // No preference found
    }

    // Get AI analysis for potential conflicts
    const aiAnalysis = await this.getAIAnalysis(proposal);
    
    // Check for conflicts between preference and AI recommendation
    if (aiAnalysis && aiAnalysis.predictedOutcome) {
      const aiRecommendation = aiAnalysis.predictedOutcome === 'pass' ? 'for' : 'against';
      
      // Strong AI confidence conflicts with user preference
      if (aiAnalysis.confidenceScore >= 85 && 
          categoryPreference.stance !== 'abstain' && 
          categoryPreference.stance !== aiRecommendation &&
          categoryPreference.weight < 90) {
        
        return {
          vote: categoryPreference.stance,
          confidence: categoryPreference.weight,
          reasoning: `Your ${categoryPreference.category} preference (${categoryPreference.stance}) conflicts with AI analysis (recommends ${aiRecommendation} with ${aiAnalysis.confidenceScore}% confidence)`,
          requiresApproval: true
        };
      }
    }

    // No conflict, use preference
    return {
      vote: categoryPreference.stance,
      confidence: categoryPreference.weight,
      reasoning: `Based on user preference for ${categoryPreference.category}`,
      requiresApproval: false
    };
  }

  private async getHistoryBasedDecision(proposal: ProposalForVoting): Promise<DaisyVotingDecision | null> {
    try {
      // Get user's voting history for similar proposals
      const { data: votingHistory } = await supabase
        .from('votes')
        .select(`
          vote,
          proposals!inner(category, title)
        `)
        .eq('user_id', this.userAddress)
        .eq('proposals.category', proposal.category || 'general')
        .limit(10);

      if (!votingHistory || votingHistory.length < 3) {
        return null; // Insufficient history
      }

      // Analyze voting pattern
      const voteCounts = votingHistory.reduce((acc, vote) => {
        acc[vote.vote] = (acc[vote.vote] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Find most common vote
      const mostCommonVote = Object.entries(voteCounts)
        .sort(([,a], [,b]) => b - a)[0][0] as 'for' | 'against' | 'abstain';

      const confidence = Math.min(95, (voteCounts[mostCommonVote] / votingHistory.length) * 100);

      return {
        vote: mostCommonVote,
        confidence,
        reasoning: `Based on voting history: ${mostCommonVote} in ${voteCounts[mostCommonVote]}/${votingHistory.length} similar proposals`,
        requiresApproval: false
      };

    } catch (error) {
      console.error('Error analyzing voting history:', error);
      return null;
    }
  }

  private async getAIAnalysis(proposal: ProposalForVoting): Promise<any> {
    try {
      const response = await supabase.functions.invoke('ai-analysis', {
        body: {
          title: proposal.title,
          description: proposal.description,
          category: proposal.category
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('AI analysis failed:', error);
      return null;
    }
  }

  private async checkExistingVote(proposalId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('votes')
        .select('id')
        .eq('proposal_id', proposalId)
        .eq('user_id', this.userAddress)
        .single();
      
      return !!data;
    } catch (error) {
      console.error('Error checking existing vote:', error);
      return false;
    }
  }

  private async notifyUser(notification: any): Promise<void> {
    window.dispatchEvent(new CustomEvent('daisy-notification', {
      detail: notification
    }));
    console.log('Daisy notification:', notification);
  }
}
