import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/utils/contractAddresses';
import { MINIMAL_GOVERNOR_ABI } from '@/utils/contractABIs';

export interface GovernanceParams {
  votingDelay: number;
  votingPeriod: number;
  proposalThreshold: number;
  quorumNumerator: number;
}

export class MinimalGovernorService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  async connect(provider: ethers.BrowserProvider): Promise<void> {
    this.provider = provider;
    this.signer = await provider.getSigner();
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.MINIMAL_GOVERNOR,
      MINIMAL_GOVERNOR_ABI,
      this.signer
    );
  }

  async propose(description: string): Promise<{ proposalId: string; txHash: string }> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const tx = await this.contract.propose(description);
      const receipt = await tx.wait();
      
      // Extract proposal ID from the ProposalCreated event
      const proposalCreatedEvent = receipt.logs.find(
        (log: any) => log.eventName === 'ProposalCreated'
      );
      
      const proposalId = proposalCreatedEvent?.args?.proposalId?.toString() || '0';
      
      return {
        proposalId,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('Failed to create proposal:', error);
      throw new Error(`Proposal creation failed: ${error.message}`);
    }
  }

  async castVote(proposalId: string, support: 0 | 1 | 2): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const tx = await this.contract.castVote(proposalId, support);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to cast vote:', error);
      throw new Error(`Vote casting failed: ${error.message}`);
    }
  }

  async castVoteWithReason(
    proposalId: string,
    support: 0 | 1 | 2,
    reason: string
  ): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const tx = await this.contract.castVoteWithReason(proposalId, support, reason);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to cast vote with reason:', error);
      throw new Error(`Vote casting failed: ${error.message}`);
    }
  }

  async getProposalState(proposalId: string): Promise<number> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const state = await this.contract.state(proposalId);
      return state;
    } catch (error) {
      console.error('Failed to get proposal state:', error);
      throw error;
    }
  }

  async hasVoted(proposalId: string, account: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      return await this.contract.hasVoted(proposalId, account);
    } catch (error) {
      console.error('Failed to check vote status:', error);
      throw error;
    }
  }

  async getProposalVotes(proposalId: string): Promise<{
    againstVotes: string;
    forVotes: string;
    abstainVotes: string;
  }> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const [againstVotes, forVotes, abstainVotes] = await this.contract.proposalVotes(proposalId);
      return {
        againstVotes: againstVotes.toString(),
        forVotes: forVotes.toString(),
        abstainVotes: abstainVotes.toString()
      };
    } catch (error) {
      console.error('Failed to get proposal votes:', error);
      throw error;
    }
  }

  async getGovernanceParams(): Promise<GovernanceParams> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const params = await this.contract.params();
      return {
        votingDelay: Number(params.votingDelay),
        votingPeriod: Number(params.votingPeriod),
        proposalThreshold: Number(params.proposalThreshold),
        quorumNumerator: Number(params.quorumNumerator)
      };
    } catch (error) {
      console.error('Failed to get governance params:', error);
      throw error;
    }
  }

  async updateParams(newParams: GovernanceParams): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const tx = await this.contract.updateParams(newParams);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to update governance params:', error);
      throw new Error(`Parameter update failed: ${error.message}`);
    }
  }
}

export const minimalGovernorService = new MinimalGovernorService();
