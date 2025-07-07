
import { ethers } from 'ethers';
import { blockchainService } from './BlockchainService';
import { supabase } from '@/integrations/supabase/client';

export interface DaisyVotingDecision {
  vote: 'for' | 'against' | 'abstain';
  confidence: number;
  reasoning: string;
  requiresApproval: boolean;
}

export class DaisyAutomationService {
  private userAddress: string;

  constructor(userAddress: string) {
    this.userAddress = userAddress;
  }

  async handleAutomatedVoting(
    proposalId: string,
    daoId: string,
    decision: DaisyVotingDecision
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log('Daisy handling automated voting:', { proposalId, decision });

      // Get DAO details
      const { data: dao, error: daoError } = await supabase
        .from('daos')
        .select('governor_address, name')
        .eq('id', daoId)
        .single();

      if (daoError || !dao?.governor_address) {
        throw new Error('DAO not found or not deployed');
      }

      // For automated voting, we need to handle wallet approval differently
      if (decision.requiresApproval) {
        // Notify user that manual approval is needed
        this.notifyUserApprovalRequired(proposalId, decision);
        return { success: false, error: 'Manual approval required' };
      }

      // Convert vote to support number
      const support = decision.vote === 'for' ? 1 : decision.vote === 'against' ? 0 : 2;

      // Submit automated vote on-chain
      const txHash = await blockchainService.submitAutomatedVote(
        dao.governor_address,
        proposalId,
        support as 0 | 1 | 2,
        `Daisy Automated Vote: ${decision.reasoning}`
      );

      // Update database
      const { error: dbError } = await supabase
        .from('votes')
        .upsert({
          proposal_id: proposalId,
          dao_id: daoId,
          user_id: this.userAddress,
          vote: decision.vote,
          automated: true,
          blockchain_tx_hash: txHash
        }, {
          onConflict: 'proposal_id,user_id'
        });

      if (dbError) {
        console.error('Database sync error:', dbError);
      }

      // Notify success
      this.notifyAutomatedVoteSuccess(proposalId, decision.vote, txHash);

      return { success: true, txHash };
    } catch (error: any) {
      console.error('Automated voting error:', error);
      this.notifyAutomatedVoteError(proposalId, error.message);
      return { success: false, error: error.message };
    }
  }

  private notifyUserApprovalRequired(proposalId: string, decision: DaisyVotingDecision) {
    window.dispatchEvent(new CustomEvent('daisy-notification', {
      detail: {
        type: 'approval_required',
        proposalId,
        decision,
        message: 'Manual wallet approval required for this vote'
      }
    }));
  }

  private notifyAutomatedVoteSuccess(proposalId: string, vote: string, txHash: string) {
    window.dispatchEvent(new CustomEvent('daisy-notification', {
      detail: {
        type: 'automated_vote_success',
        proposalId,
        vote,
        txHash,
        message: `Automated vote "${vote}" cast successfully on-chain`
      }
    }));
  }

  private notifyAutomatedVoteError(proposalId: string, error: string) {
    window.dispatchEvent(new CustomEvent('daisy-notification', {
      detail: {
        type: 'automated_vote_error',
        proposalId,
        error,
        message: 'Automated voting failed'
      }
    }));
  }

  async setupVotingDelegation(daoAddress: string): Promise<string> {
    try {
      // This would set up delegation for automated voting
      // User would delegate voting power to Daisy contract or approve spending
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      console.log('Voting delegation setup:', mockTxHash);
      return mockTxHash;
    } catch (error) {
      console.error('Failed to setup voting delegation:', error);
      throw error;
    }
  }

  async checkVotingPermissions(daoAddress: string): Promise<boolean> {
    try {
      // Check if Daisy has permission to vote on behalf of user
      // This would query the delegation status
      return false; // Default to requiring manual approval
    } catch (error) {
      console.error('Failed to check voting permissions:', error);
      return false;
    }
  }
}
