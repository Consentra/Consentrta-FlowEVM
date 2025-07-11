import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/utils/contractAddresses';
import { PROPOSAL_REGISTRY_ABI } from '@/utils/contractABIs';

export interface ProposalMetrics {
  totalVotes: number;
  votesFor: number;
  votesAgainst: number;
  participationRate: number;
  aiConfidenceScore: number;
  predictedOutcome: number;
  timestamp: number;
}

export interface ProposalData {
  dao: string;
  proposalId: number;
  title: string;
  description: string;
  category: string;
  creator: string;
  createdAt: number;
  deadline: number;
  metrics: ProposalMetrics;
  isActive: boolean;
}

export class ProposalRegistryService {
  private signer?: ethers.Signer;
  private provider?: ethers.Provider;

  constructor(signer?: ethers.Signer) {
    this.signer = signer;
  }

  async connect(provider: ethers.BrowserProvider): Promise<void> {
    this.provider = provider;
    this.signer = await provider.getSigner();
  }

  private getContract(): ethers.Contract {
    if (!this.signer) {
      throw new Error('Signer not available. Please connect wallet first.');
    }
    return new ethers.Contract(
      CONTRACT_ADDRESSES.PROPOSAL_REGISTRY,
      PROPOSAL_REGISTRY_ABI,
      this.signer
    );
  }

  async registerProposal(
    dao: string,
    proposalId: number,
    title: string,
    description: string,
    category: string,
    deadline: number,
    aiConfidenceScore: number
  ): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.registerProposal(
      dao,
      proposalId,
      title,
      description,
      category,
      deadline,
      aiConfidenceScore
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getProposal(registryId: string): Promise<ProposalData> {
    const contract = this.getContract();
    const proposal = await contract.getProposal(registryId);
    return {
      dao: proposal.dao,
      proposalId: Number(proposal.proposalId),
      title: proposal.title,
      description: proposal.description,
      category: proposal.category,
      creator: proposal.creator,
      createdAt: Number(proposal.createdAt),
      deadline: Number(proposal.deadline),
      metrics: {
        totalVotes: Number(proposal.metrics.totalVotes),
        votesFor: Number(proposal.metrics.votesFor),
        votesAgainst: Number(proposal.metrics.votesAgainst),
        participationRate: Number(proposal.metrics.participationRate),
        aiConfidenceScore: Number(proposal.metrics.aiConfidenceScore),
        predictedOutcome: Number(proposal.metrics.predictedOutcome),
        timestamp: Number(proposal.metrics.timestamp),
      },
      isActive: proposal.isActive,
    };
  }

  async getAllProposals(offset: number = 0, limit: number = 50): Promise<ProposalData[]> {
    const contract = this.getContract();
    const proposals = await contract.getAllProposals(offset, limit);
    return proposals.map((proposal: any) => ({
      dao: proposal.dao,
      proposalId: Number(proposal.proposalId),
      title: proposal.title,
      description: proposal.description,
      category: proposal.category,
      creator: proposal.creator,
      createdAt: Number(proposal.createdAt),
      deadline: Number(proposal.deadline),
      metrics: {
        totalVotes: Number(proposal.metrics.totalVotes),
        votesFor: Number(proposal.metrics.votesFor),
        votesAgainst: Number(proposal.metrics.votesAgainst),
        participationRate: Number(proposal.metrics.participationRate),
        aiConfidenceScore: Number(proposal.metrics.aiConfidenceScore),
        predictedOutcome: Number(proposal.metrics.predictedOutcome),
        timestamp: Number(proposal.metrics.timestamp),
      },
      isActive: proposal.isActive,
    }));
  }

  async getProposalsByCategory(category: string): Promise<ProposalData[]> {
    const contract = this.getContract();
    const proposals = await contract.getProposalsByCategory(category);
    return proposals.map((proposal: any) => ({
      dao: proposal.dao,
      proposalId: Number(proposal.proposalId),
      title: proposal.title,
      description: proposal.description,
      category: proposal.category,
      creator: proposal.creator,
      createdAt: Number(proposal.createdAt),
      deadline: Number(proposal.deadline),
      metrics: {
        totalVotes: Number(proposal.metrics.totalVotes),
        votesFor: Number(proposal.metrics.votesFor),
        votesAgainst: Number(proposal.metrics.votesAgainst),
        participationRate: Number(proposal.metrics.participationRate),
        aiConfidenceScore: Number(proposal.metrics.aiConfidenceScore),
        predictedOutcome: Number(proposal.metrics.predictedOutcome),
        timestamp: Number(proposal.metrics.timestamp),
      },
      isActive: proposal.isActive,
    }));
  }

  async updateMetrics(
    registryId: string,
    totalVotes: number,
    votesFor: number,
    votesAgainst: number,
    participationRate: number
  ): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.updateMetrics(
      registryId,
      totalVotes,
      votesFor,
      votesAgainst,
      participationRate
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async updateAIAnalysis(
    registryId: string,
    newConfidenceScore: number,
    predictedOutcome: number
  ): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.updateAIAnalysis(
      registryId,
      newConfidenceScore,
      predictedOutcome
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async completeProposal(registryId: string): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.completeProposal(registryId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getUserStats(userAddress: string): Promise<{
    proposalsCreated: number;
    totalVotes: number;
    isVerified: boolean;
  }> {
    const contract = this.getContract();
    const stats = await contract.getUserStats(userAddress);
    return {
      proposalsCreated: Number(stats.proposalsCreated),
      totalVotes: Number(stats.totalVotes),
      isVerified: stats.isVerified,
    };
  }
}

// Export a singleton instance
export const proposalRegistryService = new ProposalRegistryService();
