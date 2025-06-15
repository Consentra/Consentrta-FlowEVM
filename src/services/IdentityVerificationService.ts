
import { supabase } from '@/integrations/supabase/client';
import { blockchainService } from '@/utils/blockchain';

export interface VerificationSubmission {
  fullName: string;
  email: string;
  documentType: 'passport' | 'drivers_license' | 'national_id';
  documentFile: File;
  selfieFile: File;
}

export interface VerificationRecord {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  document_type: string;
  document_url?: string;
  selfie_url?: string;
  verification_hash?: string;
  status: 'pending' | 'in_progress' | 'verified' | 'rejected';
  rejection_reason?: string;
  verified_at?: string;
  nft_token_id?: number;
  nft_transaction_hash?: string;
  created_at: string;
  updated_at: string;
}

class IdentityVerificationService {
  async submitVerification(data: VerificationSubmission): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user from wallet connection
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('Wallet not connected');
      }
      
      const userAddress = accounts[0];

      // Upload documents to Supabase storage
      const documentUrl = await this.uploadDocument(data.documentFile, userAddress, 'document');
      const selfieUrl = await this.uploadDocument(data.selfieFile, userAddress, 'selfie');

      // Generate verification hash
      const verificationHash = await this.generateVerificationHash(data);

      // Create verification record with wallet address as user_id
      const { error } = await supabase
        .from('identity_verifications')
        .insert({
          user_id: userAddress,
          full_name: data.fullName,
          email: data.email,
          document_type: data.documentType,
          document_url: documentUrl,
          selfie_url: selfieUrl,
          verification_hash: verificationHash,
          status: 'pending'
        });

      if (error) throw error;

      // Simulate verification process
      setTimeout(() => {
        this.processVerification(userAddress, verificationHash);
      }, 3000);

      return { success: true };
    } catch (error) {
      console.error('Verification submission failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getVerificationStatus(userId: string): Promise<VerificationRecord | null> {
    try {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get verification status:', error);
      return null;
    }
  }

  private async uploadDocument(file: File, userId: string, type: 'document' | 'selfie'): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('identity-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('identity-documents')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  }

  private async generateVerificationHash(data: VerificationSubmission): Promise<string> {
    const combinedData = `${data.fullName}${data.email}${data.documentType}${Date.now()}`;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(combinedData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async processVerification(userId: string, verificationHash: string): Promise<void> {
    try {
      // Update status to in_progress
      await supabase
        .from('identity_verifications')
        .update({ status: 'in_progress' })
        .eq('user_id', userId)
        .eq('verification_hash', verificationHash);

      // Simulate AI verification process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isVerified = Math.random() > 0.1; // 90% success rate for demo

      if (isVerified) {
        // Mint Soulbound NFT
        const nftResult = await this.mintSoulboundNFT(userId, verificationHash);
        
        // Update verification status
        await supabase
          .from('identity_verifications')
          .update({
            status: 'verified',
            verified_at: new Date().toISOString(),
            nft_token_id: nftResult.tokenId,
            nft_transaction_hash: nftResult.transactionHash
          })
          .eq('user_id', userId)
          .eq('verification_hash', verificationHash);

        // Update profile verification status
        await supabase
          .from('profiles')
          .update({
            verification_status: 'verified',
            is_verified: true,
            soulbound_nft_token_id: nftResult.tokenId,
            verification_completed_at: new Date().toISOString()
          })
          .eq('id', userId);
      } else {
        // Reject verification
        await supabase
          .from('identity_verifications')
          .update({
            status: 'rejected',
            rejection_reason: 'Document verification failed. Please ensure documents are clear and valid.'
          })
          .eq('user_id', userId)
          .eq('verification_hash', verificationHash);
      }
    } catch (error) {
      console.error('Verification processing failed:', error);
      await supabase
        .from('identity_verifications')
        .update({
          status: 'rejected',
          rejection_reason: 'Technical error during verification process.'
        })
        .eq('user_id', userId)
        .eq('verification_hash', verificationHash);
    }
  }

  private async mintSoulboundNFT(userAddress: string, verificationHash: string): Promise<{ tokenId: number; transactionHash: string }> {
    try {
      // Generate metadata for the NFT
      const metadata = {
        name: 'Consentra Identity Verification',
        description: 'Soulbound NFT proving verified identity for DAO participation',
        image: 'https://via.placeholder.com/300x300?text=Verified+Identity',
        attributes: [
          { trait_type: 'Verification Level', value: 'KYC Verified' },
          { trait_type: 'Issue Date', value: new Date().toISOString().split('T')[0] },
          { trait_type: 'Issuer', value: 'Consentra Platform' }
        ]
      };

      // Upload metadata to IPFS (simulated with a mock URI)
      const metadataURI = `https://ipfs.example.com/${verificationHash}`;

      // Mint NFT on blockchain
      const transactionHash = await blockchainService.mintIdentityNFT(
        userAddress,
        verificationHash,
        metadataURI
      );

      // Generate mock token ID
      const tokenId = Math.floor(Math.random() * 1000000) + 1;

      return { tokenId, transactionHash };
    } catch (error) {
      console.error('NFT minting failed:', error);
      throw error;
    }
  }
}

export const identityVerificationService = new IdentityVerificationService();
