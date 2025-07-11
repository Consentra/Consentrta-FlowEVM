
import { ethers } from 'ethers';
import { getContractInstance } from '@/utils/contractIntegration';
import { CONTRACT_ADDRESSES } from '@/utils/contractAddresses';
import { DAO_FACTORY_ABI, MINIMAL_DAO_ABI } from '@/utils/contractABIs';
import { daoLibService, DAOConfig } from '@/services/DAOLibService';
import { governanceLibService } from '@/services/GovernanceLibService';

// Minimal Governor ABI for voting functions
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
    
    // Connect the library services
    await daoLibService.connect(provider);
    await governanceLibService.connect(provider);
  }

  private getFactoryContract(): ethers.Contract {
    if (!this.signer) throw new Error('Signer not available');
    return getContractInstance(CONTRACT_ADDRESSES.DAO_FACTORY, DAO_FACTORY_ABI, this.signer);
  }

  private getDAOContract(daoAddress: string): ethers.Contract {
    if (!this.signer) throw new Error('Signer not available');
    return getContractInstance(daoAddress, MINIMAL_DAO_ABI, this.signer);
  }

  private getGovernorContract(governorAddress: string): ethers.Contract {
    if (!this.signer) throw new Error('Signer not available');
    return getContractInstance(governorAddress, MINIMAL_GOVERNOR_ABI, this.signer);
  }

  // Enhanced DAO creation with validation
  async createDAO(
    name: string,
    initialSupply: string = "1000000"
  ): Promise<{ daoId: number; txHash: string }> {
    try {
      if (!this.signer) throw new Error('Signer not available');
      
      const signerAddress = await this.signer.getAddress();
      
      // Create and validate DAO configuration using DAOLib
      const config = daoLibService.createConfig(
        name,
        1,     // votingDelay
        50400, // votingPeriod (about 1 week in blocks)
        4,     // quorumPercentage
        signerAddress
      );
      
      // Validate configuration before proceeding
      await daoLibService.validateConfig(config);
      console.log('DAO configuration validated successfully');

      // Check if user is verified for governance participation
      const canParticipate = await governanceLibService.canParticipateInGovernance(
        CONTRACT_ADDRESSES.SOULBOUND_IDENTITY_NFT,
        signerAddress
      );
      
      if (!canParticipate.canParticipate) {
        console.warn('User verification check failed:', canParticipate.reason);
        // Continue with creation but log the warning
      }

      const factory = this.getFactoryContract();
      console.log('Creating DAO with factory at:', CONTRACT_ADDRESSES.DAO_FACTORY);
      
      // Convert initialSupply to Wei (assuming 18 decimals)
      const supplyInWei = ethers.parseEther(initialSupply);
      
      const tx = await factory.createDAO(name, supplyInWei);
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);
      
      // Extract DAO ID from events
      const daoCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const decoded = factory.interface.parseLog(log);
          return decoded && decoded.name === 'DAOCreated';
        } catch {
          return false;
        }
      });
      
      if (daoCreatedEvent) {
        const decoded = factory.interface.parseLog(daoCreatedEvent);
        const daoId = Number(decoded.args.daoId);
        console.log('DAO created with ID:', daoId);
        return { daoId, txHash: receipt.hash };
      }
      
      throw new Error('Failed to extract DAO ID from transaction receipt');
    } catch (error) {
      console.error('Failed to create DAO:', error);
      throw error;
    }
  }

  async getDAO(daoId: number): Promise<string> {
    try {
      const factory = this.getFactoryContract();
      return await factory.getDAO(daoId);
    } catch (error) {
      console.error('Failed to get DAO:', error);
      throw error;
    }
  }

  async getUserDAOs(userAddress: string): Promise<number[]> {
    try {
      const factory = this.getFactoryContract();
      const daoIds = await factory.getUserDAOs(userAddress);
      return daoIds.map((id: any) => Number(id));
    } catch (error) {
      console.error('Failed to get user DAOs:', error);
      return [];
    }
  }

  async getDaoCounter(): Promise<number> {
    try {
      const factory = this.getFactoryContract();
      const counter = await factory.daoCounter();
      return Number(counter);
    } catch (error) {
      console.error('Failed to get DAO counter:', error);
      return 0;
    }
  }

  // New DAO methods using the deployed MinimalDAO contract
  async connectToMinimalDAO(daoAddress: string = CONTRACT_ADDRESSES.MINIMAL_DAO) {
    console.log('🔗 Connecting to MinimalDAO at:', daoAddress);
    return this.getDAOContract(daoAddress);
  }

  // DAO methods using the new MinimalDAO contract
  async joinDAO(daoAddress: string = CONTRACT_ADDRESSES.MINIMAL_DAO): Promise<string> {
    try {
      const dao = this.getDAOContract(daoAddress);
      const tx = await dao.joinDAO();
      const receipt = await tx.wait();
      console.log('✅ Successfully joined DAO:', receipt.hash);
      return receipt.hash;
    } catch (error) {
      console.error('❌ Failed to join DAO:', error);
      throw error;
    }
  }

  async createProposal(daoAddress: string, description: string): Promise<{ proposalId: number; txHash: string }> {
    try {
      const dao = this.getDAOContract(daoAddress);
      const tx = await dao.createProposal(description);
      const receipt = await tx.wait();
      
      // Extract proposal ID from events
      const event = receipt.logs.find((log: any) => {
        try {
          const decoded = dao.interface.parseLog(log);
          return decoded && decoded.name === 'ProposalCreated';
        } catch {
          return false;
        }
      });
      
      let proposalId = 0;
      if (event) {
        const decoded = dao.interface.parseLog(event);
        proposalId = Number(decoded.args.proposalId);
      }
      
      console.log('✅ Proposal created:', { proposalId, txHash: receipt.hash });
      return { proposalId, txHash: receipt.hash };
    } catch (error) {
      console.error('❌ Failed to create proposal:', error);
      throw error;
    }
  }

  // Enhanced voting with verification
  async vote(daoAddress: string, proposalId: number, support: number): Promise<string> {
    try {
      if (!this.signer) throw new Error('Signer not available');
      
      const signerAddress = await this.signer.getAddress();
      
      // Validate user can participate in governance
      const canParticipate = await governanceLibService.canParticipateInGovernance(
        CONTRACT_ADDRESSES.SOULBOUND_IDENTITY_NFT,
        signerAddress
      );
      
      if (!canParticipate.canParticipate) {
        throw new Error(`Cannot vote: ${canParticipate.reason}`);
      }

      const dao = this.getDAOContract(daoAddress);
      const tx = await dao.vote(proposalId, support);
      const receipt = await tx.wait();
      console.log('✅ Vote cast successfully:', receipt.hash);
      return receipt.hash;
    } catch (error) {
      console.error('❌ Failed to vote:', error);
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
      if (!this.signer) throw new Error('Signer not available');
      
      const signerAddress = await this.signer.getAddress();
      
      // Validate user can participate in governance
      const canParticipate = await governanceLibService.canParticipateInGovernance(
        CONTRACT_ADDRESSES.SOULBOUND_IDENTITY_NFT,
        signerAddress
      );
      
      if (!canParticipate.canParticipate) {
        throw new Error(`Cannot vote: ${canParticipate.reason}`);
      }

      const dao = this.getDAOContract(daoAddress);
      const tx = await dao.voteWithReason(proposalId, support, reason);
      const receipt = await tx.wait();
      console.log('✅ Vote with reason cast successfully:', receipt.hash);
      return receipt.hash;
    } catch (error) {
      console.error('❌ Failed to vote with reason:', error);
      throw error;
    }
  }

  async isMember(daoAddress: string, account: string): Promise<boolean> {
    try {
      const dao = this.getDAOContract(daoAddress);
      return await dao.isMember(account);
    } catch (error) {
      console.error('❌ Failed to check membership:', error);
      return false;
    }
  }

  async getDAOInfo(daoAddress: string): Promise<{
    name: string;
    creator: string;
    createdAt: number;
    memberCount: number;
    proposalCount: number;
    votingDelay: number;
    votingPeriod: number;
    quorumPercentage: number;
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
        proposalCount: Number(proposalCount),
        votingDelay: Number(config.votingDelay),
        votingPeriod: Number(config.votingPeriod),
        quorumPercentage: Number(config.quorumPercentage)
      };
    } catch (error) {
      console.error('❌ Failed to get DAO info:', error);
      throw error;
    }
  }

  async getMemberInfo(daoAddress: string, account: string): Promise<{
    isActive: boolean;
    joinedAt: number;
    votingPower: number;
  }> {
    try {
      const dao = this.getDAOContract(daoAddress);
      const memberInfo = await dao.getMemberInfo(account);
      
      return {
        isActive: memberInfo.isActive,
        joinedAt: Number(memberInfo.joinedAt),
        votingPower: Number(memberInfo.votingPower)
      };
    } catch (error) {
      console.error('❌ Failed to get member info:', error);
      return {
        isActive: false,
        joinedAt: 0,
        votingPower: 0
      };
    }
  }

  async addMember(daoAddress: string, memberAddress: string): Promise<string> {
    try {
      const dao = this.getDAOContract(daoAddress);
      const tx = await dao.addMember(memberAddress);
      const receipt = await tx.wait();
      console.log('✅ Member added successfully:', receipt.hash);
      return receipt.hash;
    } catch (error) {
      console.error('❌ Failed to add member:', error);
      throw error;
    }
  }

  async removeMember(daoAddress: string, memberAddress: string): Promise<string> {
    try {
      const dao = this.getDAOContract(daoAddress);
      const tx = await dao.removeMember(memberAddress);
      const receipt = await tx.wait();
      console.log('✅ Member removed successfully:', receipt.hash);
      return receipt.hash;
    } catch (error) {
      console.error('❌ Failed to remove member:', error);
      throw error;
    }
  }
}

export const minimalDAOService = new MinimalDAOService();
