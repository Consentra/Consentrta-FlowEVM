
import { ethers } from 'ethers';
import { getContractInstance } from '@/utils/contractIntegration';

// Minimal ABI for the new contracts
const MINIMAL_DAO_ABI = [
  "function joinDAO() external",
  "function createProposal(string memory description) external returns (uint256)",
  "function vote(uint256 proposalId, uint8 support) external returns (uint256)",
  "function voteWithReason(uint256 proposalId, uint8 support, string calldata reason) external returns (uint256)",
  "function isMember(address account) external view returns (bool)",
  "function getConfig() external view returns (tuple(string name, uint256 votingDelay, uint256 votingPeriod, uint256 quorumPercentage, address creator, uint256 createdAt))",
  "function memberCount() external view returns (uint256)",
  "function proposalCount() external view returns (uint256)"
];

const DAO_FACTORY_ABI = [
  "function createDAO(string memory name, uint256 initialSupply) external returns (uint256)",
  "function getDAO(uint256 daoId) external view returns (address)",
  "function getUserDAOs(address user) external view returns (uint256[])",
  "function daoCounter() external view returns (uint256)"
];

const MINIMAL_GOVERNOR_ABI = [
  "function propose(string memory description) external returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) external returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason) external returns (uint256)",
  "function state(uint256 proposalId) external view returns (uint8)",
  "function hasVoted(uint256 proposalId, address account) external view returns (bool)",
  "function proposalVotes(uint256 proposalId) external view returns (uint256, uint256, uint256)"
];

export class MinimalDAOService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  constructor(signer?: ethers.Signer) {
    this.signer = signer || null;
  }

  async connect(provider: ethers.BrowserProvider): Promise<void> {
    this.provider = provider;
    this.signer = await provider.getSigner();
  }

  private getFactoryContract(factoryAddress: string): ethers.Contract {
    if (!this.signer) throw new Error('Signer not available');
    return getContractInstance(factoryAddress, DAO_FACTORY_ABI, this.signer);
  }

  private getDAOContract(daoAddress: string): ethers.Contract {
    if (!this.signer) throw new Error('Signer not available');
    return getContractInstance(daoAddress, MINIMAL_DAO_ABI, this.signer);
  }

  private getGovernorContract(governorAddress: string): ethers.Contract {
    if (!this.signer) throw new Error('Signer not available');
    return getContractInstance(governorAddress, MINIMAL_GOVERNOR_ABI, this.signer);
  }

  // Factory methods
  async createDAO(
    factoryAddress: string,
    name: string,
    initialSupply: string = "1000000"
  ): Promise<{ daoId: number; txHash: string }> {
    try {
      const factory = this.getFactoryContract(factoryAddress);
      const tx = await factory.createDAO(name, ethers.parseEther(initialSupply));
      const receipt = await tx.wait();
      
      // Extract DAO ID from events
      const event = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id("DAOCreated(uint256,address,address,string)")
      );
      const daoId = parseInt(event?.topics[1] || "0", 16);
      
      return { daoId, txHash: receipt.hash };
    } catch (error) {
      console.error('Failed to create DAO:', error);
      throw error;
    }
  }

  async getDAO(factoryAddress: string, daoId: number): Promise<string> {
    try {
      const factory = this.getFactoryContract(factoryAddress);
      return await factory.getDAO(daoId);
    } catch (error) {
      console.error('Failed to get DAO:', error);
      throw error;
    }
  }

  async getUserDAOs(factoryAddress: string, userAddress: string): Promise<number[]> {
    try {
      const factory = this.getFactoryContract(factoryAddress);
      const daoIds = await factory.getUserDAOs(userAddress);
      return daoIds.map((id: any) => Number(id));
    } catch (error) {
      console.error('Failed to get user DAOs:', error);
      return [];
    }
  }

  // DAO methods
  async joinDAO(daoAddress: string): Promise<string> {
    try {
      const dao = this.getDAOContract(daoAddress);
      const tx = await dao.joinDAO();
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Failed to join DAO:', error);
      throw error;
    }
  }

  async createProposal(daoAddress: string, description: string): Promise<{ proposalId: number; txHash: string }> {
    try {
      const dao = this.getDAOContract(daoAddress);
      const tx = await dao.createProposal(description);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id("ProposalCreated(uint256,address)")
      );
      const proposalId = parseInt(event?.topics[1] || "0", 16);
      
      return { proposalId, txHash: receipt.hash };
    } catch (error) {
      console.error('Failed to create proposal:', error);
      throw error;
    }
  }

  async vote(daoAddress: string, proposalId: number, support: number): Promise<string> {
    try {
      const dao = this.getDAOContract(daoAddress);
      const tx = await dao.vote(proposalId, support);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Failed to vote:', error);
      throw error;
    }
  }

  async voteWithReason(
    daoAddress: string, 
    proposalId: number, 
    support: number, 
    reason: string
  ): Promise<string> {
    try {
      const dao = this.getDAOContract(daoAddress);
      const tx = await dao.voteWithReason(proposalId, support, reason);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Failed to vote with reason:', error);
      throw error;
    }
  }

  async isMember(daoAddress: string, account: string): Promise<boolean> {
    try {
      const dao = this.getDAOContract(daoAddress);
      return await dao.isMember(account);
    } catch (error) {
      console.error('Failed to check membership:', error);
      return false;
    }
  }

  async getDAOInfo(daoAddress: string): Promise<{
    name: string;
    creator: string;
    createdAt: number;
    memberCount: number;
    proposalCount: number;
  }> {
    try {
      const dao = this.getDAOContract(daoAddress);
      const [config, memberCount, proposalCount] = await Promise.all([
        dao.getConfig(),
        dao.memberCount(),
        dao.proposalCount()
      ]);
      
      return {
        name: config.name,
        creator: config.creator,
        createdAt: Number(config.createdAt),
        memberCount: Number(memberCount),
        proposalCount: Number(proposalCount)
      };
    } catch (error) {
      console.error('Failed to get DAO info:', error);
      throw error;
    }
  }
}

export const minimalDAOService = new MinimalDAOService();
