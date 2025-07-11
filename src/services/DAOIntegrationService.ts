import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/utils/contractAddresses';
import { PROPOSAL_REGISTRY_ABI } from '@/utils/contractABIs';
import { proposalRegistryService, ProposalData } from '@/services/ProposalRegistryService';

export class DAOIntegrationService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  constructor(signer?: ethers.Signer) {
    this.signer = signer || null;
  }

  async connect(provider: ethers.BrowserProvider): Promise<void> {
    this.provider = provider;
    this.signer = await provider.getSigner();
    await proposalRegistryService.connect(provider);
  }

  private getContract(): ethers.Contract {
    if (!this.signer) {
      throw new Error('Signer not available');
    }
    return new ethers.Contract(
      CONTRACT_ADDRESSES.PROPOSAL_REGISTRY,
      PROPOSAL_REGISTRY_ABI,
      this.signer
    );
  }

  // ProposalRegistry methods
  async registerProposal(
    dao: string,
    proposalId: number,
    title: string,
    description: string,
    category: string,
    deadline: number,
    aiConfidenceScore: number
  ): Promise<string> {
    return await proposalRegistryService.registerProposal(
      dao,
      proposalId,
      title,
      description,
      category,
      deadline,
      aiConfidenceScore
    );
  }

  async getProposal(registryId: string): Promise<ProposalData> {
    return await proposalRegistryService.getProposal(registryId);
  }

  async getAllProposals(offset: number = 0, limit: number = 50): Promise<ProposalData[]> {
    return await proposalRegistryService.getAllProposals(offset, limit);
  }

  async getProposalsByCategory(category: string): Promise<ProposalData[]> {
    return await proposalRegistryService.getProposalsByCategory(category);
  }

  async updateMetrics(
    registryId: string,
    totalVotes: number,
    votesFor: number,
    votesAgainst: number,
    participationRate: number
  ): Promise<string> {
    return await proposalRegistryService.updateMetrics(
      registryId,
      totalVotes,
      votesFor,
      votesAgainst,
      participationRate
    );
  }

  async updateAIAnalysis(
    registryId: string,
    newConfidenceScore: number,
    predictedOutcome: number
  ): Promise<string> {
    return await proposalRegistryService.updateAIAnalysis(
      registryId,
      newConfidenceScore,
      predictedOutcome
    );
  }

  async completeProposal(registryId: string): Promise<string> {
    return await proposalRegistryService.completeProposal(registryId);
  }

  async getUserStats(userAddress: string): Promise<{
    proposalsCreated: number;
    totalVotes: number;
    isVerified: boolean;
  }> {
    return await proposalRegistryService.getUserStats(userAddress);
  }

  // Legacy methods for backward compatibility
  async storeProposalMetadata(
    proposalId: string,
    title: string,
    description: string,
    tags: string[],
    aiConfidenceScore: number,
    creator: string,
    enableAIVoting: boolean = true
  ): Promise<string> {
    console.log('Legacy storeProposalMetadata called, using registerProposal instead');
    // Convert to ProposalRegistry format
    const deadline = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now
    return await this.registerProposal(
      creator, // Use creator as DAO address for legacy compatibility
      parseInt(proposalId),
      title,
      description,
      tags[0] || 'general',
      deadline,
      aiConfidenceScore
    );
  }

  async executeAIVote(
    proposalId: string,
    voter: string,
    category: string,
    daoContract: string
  ): Promise<{ support: number; reason: string }> {
    console.log('Legacy executeAIVote called');
    // Mock implementation for backward compatibility
    return {
      support: Math.floor(Math.random() * 3), // 0, 1, or 2
      reason: `AI automated vote for ${category} proposal`
    };
  }

  async recordVote(
    voter: string,
    proposalId: string,
    support: number,
    weight: string,
    reason: string,
    automated: boolean = false
  ): Promise<string> {
    console.log('Legacy recordVote called');
    // Mock implementation for backward compatibility
    const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
    return mockTxHash;
  }

  async getProposalMetadata(proposalId: string): Promise<{
    title: string;
    description: string;
    tags: string[];
    aiConfidenceScore: number;
    createdAt: number;
    creator: string;
    aiVotingEnabled: boolean;
  }> {
    console.log('Legacy getProposalMetadata called');
    // Mock implementation for backward compatibility
    return {
      title: 'Legacy Proposal',
      description: 'Legacy proposal description',
      tags: ['general'],
      aiConfidenceScore: 50,
      createdAt: Date.now(),
      creator: '0x0000000000000000000000000000000000000000',
      aiVotingEnabled: true
    };
  }

  // Mock DAO storage methods for backward compatibility
  async storeDAO(
    daoId: number,
    daoAddress: string,
    tokenAddress: string,
    timelockAddress: string,
    name: string,
    creator: string
  ): Promise<string> {
    console.log('Legacy storeDAO called');
    const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
    return mockTxHash;
  }

  async addMember(userAddress: string, daoId: number): Promise<string> {
    console.log('Legacy addMember called');
    const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
    return mockTxHash;
  }

  async checkMembership(userAddress: string, daoId: number): Promise<boolean> {
    console.log('Legacy checkMembership called');
    return Math.random() > 0.5;
  }

  async getDAO(daoId: number): Promise<{
    dao: string;
    token: string;
    timelock: string;
    name: string;
    creator: string;
    createdAt: number;
    memberCount: number;
    proposalCount: number;
  }> {
    console.log('Legacy getDAO called');
    return {
      dao: '0x' + Math.random().toString(16).substr(2, 40),
      token: '0x' + Math.random().toString(16).substr(2, 40),
      timelock: '0x' + Math.random().toString(16).substr(2, 40),
      name: 'Legacy DAO',
      creator: '0x' + Math.random().toString(16).substr(2, 40),
      createdAt: Date.now(),
      memberCount: Math.floor(Math.random() * 100),
      proposalCount: Math.floor(Math.random() * 50)
    };
  }

  async getAllDAOs(offset: number = 0, limit: number = 50): Promise<Array<{
    dao: string;
    token: string;
    timelock: string;
    name: string;
    creator: string;
    createdAt: number;
    memberCount: number;
    proposalCount: number;
  }>> {
    console.log('Legacy getAllDAOs called');
    return [];
  }

  async getUserDAOs(userAddress: string): Promise<number[]> {
    console.log('Legacy getUserDAOs called');
    return [];
  }

  async getDAOCounter(): Promise<number> {
    console.log('Legacy getDAOCounter called');
    return Math.floor(Math.random() * 10);
  }
}

export const daoIntegrationService = new DAOIntegrationService();
