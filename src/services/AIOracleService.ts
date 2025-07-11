
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/utils/contractAddresses';
import { AI_ORACLE_ABI } from '@/utils/contractABIs';

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
      CONTRACT_ADDRESSES.AI_ORACLE,
      AI_ORACLE_ABI,
      signer
    );
    
    console.log('🔮 AIOracle Service initialized with contract:', CONTRACT_ADDRESSES.AI_ORACLE);
  }

  async submitPrediction(
    proposalId: string,
    confidenceScore: number,
    predictedOutcome: number,
    reasoning: string
  ): Promise<string> {
    try {
      console.log('📊 Submitting AI prediction:', {
        proposalId,
        confidenceScore,
        predictedOutcome,
        reasoning
      });

      // Convert proposalId to bytes32
      const proposalIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(proposalId));

      const tx = await this.contract.submitPrediction(
        proposalIdBytes32,
        confidenceScore,
        predictedOutcome,
        reasoning
      );

      const receipt = await tx.wait();
      console.log(`✅ AI prediction submitted. Tx: ${receipt.hash}`);
      
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Failed to submit AI prediction:', error);
      throw new Error(`Failed to submit AI prediction: ${error.message || 'Unknown error'}`);
    }
  }

  async submitAnalysis(
    proposalId: string,
    summary: string,
    tags: string[],
    complexityScore: number,
    riskScore: number
  ): Promise<string> {
    try {
      console.log('📊 Submitting AI analysis:', {
        proposalId,
        summary,
        tags,
        complexityScore,
        riskScore
      });

      // Convert proposalId to bytes32
      const proposalIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(proposalId));

      const tx = await this.contract.submitAnalysis(
        proposalIdBytes32,
        summary,
        tags,
        complexityScore,
        riskScore
      );

      const receipt = await tx.wait();
      console.log(`✅ AI analysis submitted. Tx: ${receipt.hash}`);
      
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Failed to submit AI analysis:', error);
      throw new Error(`Failed to submit AI analysis: ${error.message || 'Unknown error'}`);
    }
  }

  async getPrediction(proposalId: string): Promise<AIPrediction | null> {
    try {
      const proposalIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(proposalId));
      const prediction = await this.contract.getPrediction(proposalIdBytes32);
      
      if (!prediction.isValid) {
        return null;
      }

      return {
        confidenceScore: Number(prediction.confidenceScore),
        predictedOutcome: Number(prediction.predictedOutcome) === 1 ? 'pass' : 'fail',
        reasoning: prediction.reasoning,
        timestamp: Number(prediction.timestamp),
        isValid: prediction.isValid
      };
    } catch (error: any) {
      console.error('❌ Failed to get AI prediction:', error);
      return null;
    }
  }

  async getAnalysis(proposalId: string): Promise<AIAnalysis | null> {
    try {
      const proposalIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(proposalId));
      const analysis = await this.contract.getAnalysis(proposalIdBytes32);
      
      if (!analysis.timestamp || Number(analysis.timestamp) === 0) {
        return null;
      }

      return {
        summary: analysis.summary,
        tags: analysis.tags,
        complexityScore: Number(analysis.complexityScore),
        riskScore: Number(analysis.riskScore),
        timestamp: Number(analysis.timestamp)
      };
    } catch (error: any) {
      console.error('❌ Failed to get AI analysis:', error);
      return null;
    }
  }

  async getBatchPredictions(proposalIds: string[]): Promise<AIPrediction[]> {
    try {
      const proposalIdBytes32Array = proposalIds.map(id => 
        ethers.keccak256(ethers.toUtf8Bytes(id))
      );
      
      const predictions = await this.contract.getBatchPredictions(proposalIdBytes32Array);
      
      return predictions.map((prediction: any) => ({
        confidenceScore: Number(prediction.confidenceScore),
        predictedOutcome: Number(prediction.predictedOutcome) === 1 ? 'pass' : 'fail',
        reasoning: prediction.reasoning,
        timestamp: Number(prediction.timestamp),
        isValid: prediction.isValid
      })).filter((p: AIPrediction) => p.isValid);
    } catch (error: any) {
      console.error('❌ Failed to get batch predictions:', error);
      return [];
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

  async addOracle(oracleAddress: string): Promise<string> {
    try {
      const tx = await this.contract.addOracle(oracleAddress);
      const receipt = await tx.wait();
      console.log(`✅ Oracle added: ${oracleAddress}. Tx: ${receipt.hash}`);
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Failed to add oracle:', error);
      throw new Error(`Failed to add oracle: ${error.message || 'Unknown error'}`);
    }
  }

  async removeOracle(oracleAddress: string): Promise<string> {
    try {
      const tx = await this.contract.removeOracle(oracleAddress);
      const receipt = await tx.wait();
      console.log(`✅ Oracle removed: ${oracleAddress}. Tx: ${receipt.hash}`);
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Failed to remove oracle:', error);
      throw new Error(`Failed to remove oracle: ${error.message || 'Unknown error'}`);
    }
  }

  async isAuthorizedOracle(oracleAddress: string): Promise<boolean> {
    try {
      return await this.contract.authorizedOracles(oracleAddress);
    } catch (error: any) {
      console.error('❌ Failed to check oracle authorization:', error);
      return false;
    }
  }
}
