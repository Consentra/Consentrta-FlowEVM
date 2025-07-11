
import { ethers } from 'ethers';
import { getContractInstance } from '@/utils/contractIntegration';
import { CONTRACT_ADDRESSES } from '@/utils/contractAddresses';
import { DAO_LIB_ABI } from '@/utils/contractABIs';

export interface DAOConfig {
  name: string;
  votingDelay: number;
  votingPeriod: number;
  quorumPercentage: number;
  creator: string;
  createdAt: number;
}

export class DAOLibService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  constructor(signer?: ethers.Signer) {
    this.signer = signer || null;
  }

  async connect(provider: ethers.BrowserProvider): Promise<void> {
    this.provider = provider;
    this.signer = await provider.getSigner();
  }

  private getContract(): ethers.Contract {
    if (!this.signer) throw new Error('Signer not available');
    return getContractInstance(CONTRACT_ADDRESSES.DAO_LIB, DAO_LIB_ABI, this.signer);
  }

  async validateConfig(config: DAOConfig): Promise<boolean> {
    try {
      const contract = this.getContract();
      
      // Convert config to the format expected by the contract
      const contractConfig = {
        name: config.name,
        votingDelay: config.votingDelay,
        votingPeriod: config.votingPeriod,
        quorumPercentage: config.quorumPercentage,
        creator: config.creator,
        createdAt: config.createdAt
      };

      await contract.validateConfig(contractConfig);
      return true;
    } catch (error: any) {
      console.error('DAO config validation failed:', error);
      
      // Handle specific library errors
      if (error.message?.includes('InvalidConfig')) {
        throw new Error('Invalid DAO configuration provided');
      }
      
      throw error;
    }
  }

  // Helper method to create a proper config object
  createConfig(
    name: string,
    votingDelay: number = 1,
    votingPeriod: number = 50400,
    quorumPercentage: number = 4,
    creator: string
  ): DAOConfig {
    return {
      name,
      votingDelay,
      votingPeriod,
      quorumPercentage,
      creator,
      createdAt: Math.floor(Date.now() / 1000)
    };
  }
}

export const daoLibService = new DAOLibService();
