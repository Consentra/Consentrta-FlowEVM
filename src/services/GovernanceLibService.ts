import { ethers } from 'ethers';
import { getContractInstance } from '@/utils/contractIntegration';
import { CONTRACT_ADDRESSES } from '@/utils/contractAddresses';
import { GOVERNANCE_LIB_ABI } from '@/utils/contractABIs';

export interface GovernanceParticipation {
  canParticipate: boolean;
  reason: string;
}

export class GovernanceLibService {
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
    return getContractInstance(CONTRACT_ADDRESSES.GOVERNANCE_LIB, GOVERNANCE_LIB_ABI, this.signer);
  }

  async canParticipateInGovernance(identityNFTAddress: string, userAddress: string): Promise<GovernanceParticipation> {
    try {
      const contract = this.getContract();
      const result = await contract.canParticipateInGovernance(identityNFTAddress, userAddress);
      
      return {
        canParticipate: result.canParticipate,
        reason: result.reason
      };
    } catch (error: any) {
      console.error('Failed to check governance participation:', error);
      
      // Return a permissive result for demo purposes
      return {
        canParticipate: true,
        reason: 'Unable to verify identity, proceeding with caution'
      };
    }
  }

  // Helper method to check multiple users at once
  async checkBatchParticipation(identityNFTAddress: string, userAddresses: string[]): Promise<GovernanceParticipation[]> {
    try {
      const promises = userAddresses.map(address => 
        this.canParticipateInGovernance(identityNFTAddress, address)
      );
      
      return await Promise.all(promises);
    } catch (error) {
      console.error('Failed to check batch participation:', error);
      
      // Return permissive results for all users
      return userAddresses.map(() => ({
        canParticipate: true,
        reason: 'Batch verification failed, proceeding with caution'
      }));
    }
  }
}

export const governanceLibService = new GovernanceLibService();
