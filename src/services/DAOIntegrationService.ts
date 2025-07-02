
import { ethers } from 'ethers';
import { 
  CONTRACT_ADDRESSES, 
  DAO_INTEGRATION_MODULE_ABI, 
  DAO_STORAGE_MODULE_ABI,
  getContractInstance 
} from '@/utils/contractIntegration';

export class DAOIntegrationService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  constructor(signer?: ethers.Signer) {
    this.signer = signer || null;
  }

  async connect(provider: ethers.BrowserProvider): Promise<void> {
    this.provider = provider;
    this.signer = await provider.getSigner();
  }

  private getIntegrationContract(): ethers.Contract {
    if (!this.signer) {
      throw new Error('Signer not available');
    }
    return getContractInstance(
      CONTRACT_ADDRESSES.DAO_INTEGRATION_MODULE,
      DAO_INTEGRATION_MODULE_ABI,
      this.signer
    );
  }

  private getStorageContract(): ethers.Contract {
    if (!this.signer) {
      throw new Error('Signer not available');
    }
    return getContractInstance(
      CONTRACT_ADDRESSES.DAO_STORAGE_MODULE,
      DAO_STORAGE_MODULE_ABI,
      this.signer
    );
  }

  // DAO Integration Module methods
  async storeProposalMetadata(
    proposalId: string,
    title: string,
    description: string,
    tags: string[],
    aiConfidenceScore: number,
    creator: string,
    enableAIVoting: boolean = true
  ): Promise<string> {
    try {
      const contract = this.getIntegrationContract();
      const tx = await contract.storeProposalMetadata(
        proposalId,
        title,
        description,
        tags,
        Math.floor(aiConfidenceScore * 100), // Convert to basis points
        creator,
        enableAIVoting
      );
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Failed to store proposal metadata:', error);
      throw error;
    }
  }

  async executeAIVote(
    proposalId: string,
    voter: string,
    category: string,
    daoContract: string
  ): Promise<{ support: number; reason: string }> {
    try {
      const contract = this.getIntegrationContract();
      const result = await contract.executeAIVote(proposalId, voter, category, daoContract);
      return {
        support: result[0],
        reason: result[1]
      };
    } catch (error) {
      console.error('Failed to execute AI vote:', error);
      throw error;
    }
  }

  async recordVote(
    voter: string,
    proposalId: string,
    support: number,
    weight: string,
    reason: string,
    automated: boolean = false
  ): Promise<string> {
    try {
      const contract = this.getIntegrationContract();
      const tx = await contract.recordVote(
        voter,
        proposalId,
        support,
        ethers.parseEther(weight),
        reason,
        automated
      );
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Failed to record vote:', error);
      throw error;
    }
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
    try {
      const contract = this.getIntegrationContract();
      const metadata = await contract.getProposalMetadata(proposalId);
      return {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        aiConfidenceScore: Number(metadata.aiConfidenceScore) / 100, // Convert from basis points
        createdAt: Number(metadata.createdAt),
        creator: metadata.creator,
        aiVotingEnabled: metadata.aiVotingEnabled
      };
    } catch (error) {
      console.error('Failed to get proposal metadata:', error);
      throw error;
    }
  }

  async getUserStats(address: string): Promise<{
    voteCount: number;
    proposalCount: number;
    isVerified: boolean;
  }> {
    try {
      const contract = this.getIntegrationContract();
      const stats = await contract.getUserStats(address);
      return {
        voteCount: Number(stats.voteCount),
        proposalCount: Number(stats.proposalCount),
        isVerified: stats.isVerified
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      throw error;
    }
  }

  // DAO Storage Module methods
  async storeDAO(
    daoId: number,
    daoAddress: string,
    tokenAddress: string,
    timelockAddress: string,
    name: string,
    creator: string
  ): Promise<string> {
    try {
      const contract = this.getStorageContract();
      const tx = await contract.storeDAO(
        daoId,
        daoAddress,
        tokenAddress,
        timelockAddress,
        name,
        creator
      );
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Failed to store DAO:', error);
      throw error;
    }
  }

  async addMember(userAddress: string, daoId: number): Promise<string> {
    try {
      const contract = this.getStorageContract();
      const tx = await contract.addMember(userAddress, daoId);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Failed to add member:', error);
      throw error;
    }
  }

  async checkMembership(userAddress: string, daoId: number): Promise<boolean> {
    try {
      const contract = this.getStorageContract();
      return await contract.checkMembership(userAddress, daoId);
    } catch (error) {
      console.error('Failed to check membership:', error);
      return false;
    }
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
    try {
      const contract = this.getStorageContract();
      const daoData = await contract.getDAO(daoId);
      return {
        dao: daoData.dao,
        token: daoData.token,
        timelock: daoData.timelock,
        name: daoData.name,
        creator: daoData.creator,
        createdAt: Number(daoData.createdAt),
        memberCount: Number(daoData.memberCount),
        proposalCount: Number(daoData.proposalCount)
      };
    } catch (error) {
      console.error('Failed to get DAO:', error);
      throw error;
    }
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
    try {
      const contract = this.getStorageContract();
      const daosData = await contract.getAllDAOs(offset, limit);
      return daosData.map((dao: any) => ({
        dao: dao.dao,
        token: dao.token,
        timelock: dao.timelock,
        name: dao.name,
        creator: dao.creator,
        createdAt: Number(dao.createdAt),
        memberCount: Number(dao.memberCount),
        proposalCount: Number(dao.proposalCount)
      }));
    } catch (error) {
      console.error('Failed to get all DAOs:', error);
      return [];
    }
  }

  async getUserDAOs(userAddress: string): Promise<number[]> {
    try {
      const contract = this.getStorageContract();
      const daoIds = await contract.getUserDAOs(userAddress);
      return daoIds.map((id: any) => Number(id));
    } catch (error) {
      console.error('Failed to get user DAOs:', error);
      return [];
    }
  }

  async getDAOCounter(): Promise<number> {
    try {
      const contract = this.getStorageContract();
      const counter = await contract.daoCounter();
      return Number(counter);
    } catch (error) {
      console.error('Failed to get DAO counter:', error);
      return 0;
    }
  }
}

export const daoIntegrationService = new DAOIntegrationService();
