import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/utils/contractAddresses';
import { PROPOSAL_REGISTRY_ABI } from '@/utils/contractABIs';

export interface AIPrediction {
  confidenceScore: number;
  predictedOutcome: 'pass' | 'fail';
  reasoning: string;
  timestamp: number;
  isValid: boolean;
}

export interface AIAnalysis {
  summary: string;
  tags: string[];
  complexityScore: number;
  riskScore: number;
  timestamp: number;
}

export class AIOracleService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(signer: ethers.Signer) {
    this.signer = signer;
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.PROPOSAL_REGISTRY,
      PROPOSAL_REGISTRY_ABI,
      signer
    );
    
    console.log('🔮 AIOracle Service initialized with ProposalRegistry:', CONTRACT_ADDRESSES.PROPOSAL_REGISTRY);
  }

  async updateAIAnalysis(
    registryId: string,
    confidenceScore: number,
    predictedOutcome: number
  ): Promise<string> {
    try {
      console.log('📊 Updating AI analysis:', {
        registryId,
        confidenceScore,
        predictedOutcome
      });

      const tx = await this.contract.updateAIAnalysis(
        registryId,
        confidenceScore,
        predictedOutcome
      );

      const receipt = await tx.wait();
      console.log(`✅ AI analysis updated. Tx: ${receipt.hash}`);
      
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Failed to update AI analysis:', error);
      throw new Error(`Failed to update AI analysis: ${error.message || 'Unknown error'}`);
    }
  }

  async getProposal(registryId: string): Promise<any> {
    try {
      const proposal = await this.contract.getProposal(registryId);
      console.log('🔍 Retrieved proposal:', registryId, proposal);
      return proposal;
    } catch (error: any) {
      console.error('❌ Failed to get proposal:', error);
      return null;
    }
  }

  async getAllProposals(offset: number = 0, limit: number = 50): Promise<any[]> {
    try {
      const proposals = await this.contract.getAllProposals(offset, limit);
      console.log('📊 Retrieved proposals:', proposals.length);
      return proposals;
    } catch (error: any) {
      console.error('❌ Failed to get proposals:', error);
      return [];
    }
  }

  async getProposalsByCategory(category: string): Promise<any[]> {
    try {
      const proposals = await this.contract.getProposalsByCategory(category);
      console.log('📊 Retrieved proposals by category:', category, proposals.length);
      return proposals;
    } catch (error: any) {
      console.error('❌ Failed to get proposals by category:', error);
      return [];
    }
  }

  async getUserStats(address: string): Promise<{
    proposalsCreated: number;
    totalVotes: number;
    isVerified: boolean;
  }> {
    try {
      const stats = await this.contract.getUserStats(address);
      return {
        proposalsCreated: Number(stats.proposalsCreated),
        totalVotes: Number(stats.totalVotes),
        isVerified: stats.isVerified
      };
    } catch (error: any) {
      console.error('❌ Failed to get user stats:', error);
      return {
        proposalsCreated: 0,
        totalVotes: 0,
        isVerified: false
      };
    }
  }

  async getOwner(): Promise<string> {
    try {
      const owner = await this.contract.owner();
      console.log('👑 Contract owner:', owner);
      return owner;
    } catch (error: any) {
      console.error('❌ Failed to get contract owner:', error);
      return '';
    }
  }
}
