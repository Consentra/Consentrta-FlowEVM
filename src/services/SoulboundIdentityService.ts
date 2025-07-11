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
  }

  async mintIdentity(
    to: string,
    verificationHash: string,
    metadataURI: string
  ): Promise<{ tokenId: string; txHash: string }> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const tx = await this.contract.mintIdentity(to, verificationHash, metadataURI);
      const receipt = await tx.wait();
      
      // Extract token ID from the IdentityMinted event
      const identityMintedEvent = receipt.logs.find(
        (log: any) => log.eventName === 'IdentityMinted'
      );
      
      const tokenId = identityMintedEvent?.args?.tokenId?.toString() || '0';
      
      return {
        tokenId,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('Failed to mint identity:', error);
      throw new Error(`Identity minting failed: ${error.message}`);
    }
  }

  async isVerified(wallet: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      return await this.contract.isVerified(wallet);
    } catch (error) {
      console.error('Failed to check verification status:', error);
      return false;
    }
  }

  async getIdentity(wallet: string): Promise<Identity | null> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const identity = await this.contract.getIdentity(wallet);
      return {
        wallet: identity.wallet,
        verificationHash: identity.verificationHash,
        timestamp: Number(identity.timestamp),
        isVerified: identity.isVerified,
        metadataURI: identity.metadataURI
      };
    } catch (error) {
      console.error('Failed to get identity:', error);
      return null;
    }
  }

  async updateVerificationStatus(user: string, status: boolean): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const tx = await this.contract.updateVerificationStatus(user, status);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to update verification status:', error);
      throw new Error(`Verification update failed: ${error.message}`);
    }
  }

  async revokeIdentity(user: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const tx = await this.contract.revokeIdentity(user);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Failed to revoke identity:', error);
      throw new Error(`Identity revocation failed: ${error.message}`);
    }
  }

  async getTokenId(wallet: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      const tokenId = await this.contract.walletToTokenId(wallet);
      return tokenId.toString();
    } catch (error) {
      console.error('Failed to get token ID:', error);
      return '0';
    }
  }

  async getTokenURI(tokenId: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not connected');
    }

    try {
      return await this.contract.tokenURI(tokenId);
    } catch (error) {
      console.error('Failed to get token URI:', error);
      return '';
    }
  }
}

export const soulboundIdentityService = new SoulboundIdentityService();
