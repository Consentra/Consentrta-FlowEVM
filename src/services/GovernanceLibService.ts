
import { ethers } from 'ethers';
import { getContractInstance } from '@/utils/contractIntegration';
import { CONTRACT_ADDRESSES } from '@/utils/contractAddresses';
import { GOVERNANCE_LIB_ABI } from '@/utils/contractABIs';

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

  async validateVerifiedUser(identityNFTAddress: string, userAddress: string): Promise<boolean> {
    try {
      const contract = this.getContract();
      
      await contract.validateVerifiedUser(identityNFTAddress, userAddress);
      return true;
    } catch (error: any) {
      console.error('User verification validation failed:', error);
      
      // Handle specific library errors
      if (error.message?.includes('NotVerified')) {
        throw new Error('User is not verified through the identity NFT system');
      }
      
      throw error;
    }
  }

  // Helper method to check if a user can participate in governance
  async canParticipateInGovernance(
    identityNFTAddress: string, 
    userAddress: string
  ): Promise<{ canParticipate: boolean; reason?: string }> {
    try {
      await this.validateVerifiedUser(identityNFTAddress, userAddress);
      return { canParticipate: true };
    } catch (error: any) {
      return { 
        canParticipate: false, 
        reason: error.message || 'User verification failed' 
      };
    }
  }
}

export const governanceLibService = new GovernanceLibService();
