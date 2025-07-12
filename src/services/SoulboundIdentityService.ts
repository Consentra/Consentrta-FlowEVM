
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/utils/contractAddresses';
import { SOULBOUND_IDENTITY_NFT_ABI } from '@/utils/contractABIs';

export interface Identity {
  wallet: string;
  verificationHash: string;
  timestamp: number;
  isVerified: boolean;
  metadataURI: string;
}

export class SoulboundIdentityService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  async connect(provider: ethers.BrowserProvider): Promise<void> {
    this.provider = provider;
    this.signer = await provider.getSigner();
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.SOULBOUND_IDENTITY_NFT,
      SOULBOUND_IDENTITY_NFT_ABI,
      this.signer
    );
    
    console.log('🔰 SoulboundIdentity Service connected to:', CONTRACT_ADDRESSES.SOULBOUND_IDENTITY_NFT);
  }

  async isVerified(address: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const verified = await this.contract.isVerified(address);
      console.log(`🔍 Verification status for ${address}:`, verified);
      return verified;
    } catch (error) {
      console.error('Error checking verification status:', error);
      return false;
    }
  }

  async getIdentity(address: string): Promise<Identity | null> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const identity = await this.contract.getIdentity(address);
      return {
        wallet: identity.wallet,
        verificationHash: identity.verificationHash,
        timestamp: Number(identity.timestamp),
        isVerified: identity.isVerified,
        metadataURI: identity.metadataURI
      };
    } catch (error) {
      console.error('Error getting identity:', error);
      return null;
    }
  }

  async requestVerification(metadataURI: string, reason: string): Promise<string> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not connected');
    }

    try {
      const signerAddress = await this.signer.getAddress();
      
      // Create a verification hash based on the user's address and current timestamp
      const verificationData = `${signerAddress}-${Date.now()}-${reason}`;
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes(verificationData));

      console.log('🔐 Requesting identity verification:', {
        address: signerAddress,
        verificationHash,
        metadataURI
      });

      // Note: In a real implementation, this would typically require admin approval
      // For demo purposes, we're assuming the user can self-verify
      const tx = await this.contract.mintIdentity(
        signerAddress,
        verificationHash,
        metadataURI
      );

      const receipt = await tx.wait();
      console.log('✅ Identity NFT minted successfully:', receipt.hash);
      
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Failed to mint identity NFT:', error);
      throw new Error(`Identity verification failed: ${error.message || 'Unknown error'}`);
    }
  }

  async mintIdentity(to: string, verificationHash: string, metadataURI: string): Promise<{ txHash: string; tokenId: string }> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      console.log('🔐 Minting identity NFT:', {
        to,
        verificationHash,
        metadataURI
      });

      const tx = await this.contract.mintIdentity(to, verificationHash, metadataURI);
      const receipt = await tx.wait();
      
      // Extract token ID from events
      const mintEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract!.interface.parseLog(log);
          return parsed?.name === 'IdentityMinted';
        } catch {
          return false;
        }
      });

      let tokenId = '1'; // Default fallback
      if (mintEvent) {
        const parsed = this.contract.interface.parseLog(mintEvent);
        tokenId = parsed?.args?.tokenId?.toString() || '1';
      }

      console.log('✅ Identity NFT minted successfully:', { txHash: receipt.hash, tokenId });
      
      return { txHash: receipt.hash, tokenId };
    } catch (error: any) {
      console.error('❌ Failed to mint identity NFT:', error);
      throw new Error(`Identity minting failed: ${error.message || 'Unknown error'}`);
    }
  }

  async updateVerificationStatus(address: string, status: boolean): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const tx = await this.contract.updateVerificationStatus(address, status);
      const receipt = await tx.wait();
      console.log(`✅ Verification status updated for ${address}: ${status}`);
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Failed to update verification status:', error);
      throw new Error(`Status update failed: ${error.message || 'Unknown error'}`);
    }
  }

  async revokeIdentity(address: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const tx = await this.contract.revokeIdentity(address);
      const receipt = await tx.wait();
      console.log(`✅ Identity revoked for ${address}`);
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Failed to revoke identity:', error);
      throw new Error(`Identity revocation failed: ${error.message || 'Unknown error'}`);
    }
  }
}

export const soulboundIdentityService = new SoulboundIdentityService();
