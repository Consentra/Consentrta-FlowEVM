
import { ethers } from 'ethers';
import { AI_ORACLE_ABI, CONTRACT_ADDRESSES, getContractInstance, proposalIdToBytes32 } from '@/utils/contractIntegration';

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
    this.contract = getContractInstance(CONTRACT_ADDRESSES.AI_ORACLE, AI_ORACLE_ABI, signer);
  }

  async submitPrediction(
    proposalId: string,
    confidenceScore: number,
    predictedOutcome: 'pass' | 'fail',
    reasoning: string
  ): Promise<string> {
    try {
      const proposalBytes32 = proposalIdToBytes32(proposalId);
      const outcomeValue = predictedOutcome === 'pass' ? 1 : 0;

      const tx = await this.contract.submitPrediction(
        proposalBytes32,
        confidenceScore,
        outcomeValue,
        reasoning
      );

      const receipt = await tx.wait();
      console.log(`AI prediction submitted for proposal ${proposalId}. Tx: ${receipt.hash}`);
      
      return receipt.hash;
    } catch (error) {
      console.error('Failed to submit AI prediction:', error);
      throw new Error(`Failed to submit prediction: ${error.message || 'Unknown error'}`);
    }
  }

  async getPrediction(proposalId: string): Promise<AIPrediction | null> {
    try {
      const proposalBytes32 = proposalIdToBytes32(proposalId);
      const prediction = await this.contract.getPrediction(proposalBytes32);

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
    } catch (error) {
      console.error('Failed to get AI prediction:', error);
      return null;
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
      const proposalBytes32 = proposalIdToBytes32(proposalId);

      const tx = await this.contract.submitAnalysis(
        proposalBytes32,
        summary,
        tags,
        complexityScore,
        riskScore
      );

      const receipt = await tx.wait();
      console.log(`AI analysis submitted for proposal ${proposalId}. Tx: ${receipt.hash}`);
      
      return receipt.hash;
    } catch (error) {
      console.error('Failed to submit AI analysis:', error);
      throw new Error(`Failed to submit analysis: ${error.message || 'Unknown error'}`);
    }
  }

  async getAnalysis(proposalId: string): Promise<AIAnalysis | null> {
    try {
      const proposalBytes32 = proposalIdToBytes32(proposalId);
      const analysis = await this.contract.getAnalysis(proposalBytes32);

      if (!analysis.summary) {
        return null;
      }

      return {
        summary: analysis.summary,
        tags: analysis.tags,
        complexityScore: Number(analysis.complexityScore),
        riskScore: Number(analysis.riskScore),
        timestamp: Number(analysis.timestamp)
      };
    } catch (error) {
      console.error('Failed to get AI analysis:', error);
      return null;
    }
  }

  async getBatchPredictions(proposalIds: string[]): Promise<(AIPrediction | null)[]> {
    try {
      const proposalBytes32Array = proposalIds.map(id => proposalIdToBytes32(id));
      const predictions = await this.contract.getBatchPredictions(proposalBytes32Array);

      return predictions.map((prediction: any) => {
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
      });
    } catch (error) {
      console.error('Failed to get batch predictions:', error);
      return proposalIds.map(() => null);
    }
  }

  async isAuthorizedOracle(address: string): Promise<boolean> {
    try {
      return await this.contract.authorizedOracles(address);
    } catch (error) {
      console.error('Failed to check oracle authorization:', error);
      return false;
    }
  }

  async getOwner(): Promise<string> {
    try {
      return await this.contract.owner();
    } catch (error) {
      console.error('Failed to get contract owner:', error);
      return '';
    }
  }

  // Admin functions (only for contract owner)
  async addOracle(oracleAddress: string): Promise<string> {
    try {
      const tx = await this.contract.addOracle(oracleAddress);
      const receipt = await tx.wait();
      console.log(`Oracle ${oracleAddress} added. Tx: ${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      console.error('Failed to add oracle:', error);
      throw new Error(`Failed to add oracle: ${error.message || 'Unknown error'}`);
    }
  }

  async removeOracle(oracleAddress: string): Promise<string> {
    try {
      const tx = await this.contract.removeOracle(oracleAddress);
      const receipt = await tx.wait();
      console.log(`Oracle ${oracleAddress} removed. Tx: ${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      console.error('Failed to remove oracle:', error);
      throw new Error(`Failed to remove oracle: ${error.message || 'Unknown error'}`);
    }
  }
}
