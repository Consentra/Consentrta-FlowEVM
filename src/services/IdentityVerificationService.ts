
import { supabase } from '@/integrations/supabase/client';
import { soulboundIdentityService } from '@/services/SoulboundIdentityService';
import { ethers } from 'ethers';

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
  document_type: 'passport' | 'drivers_license' | 'national_id';
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

export class IdentityVerificationService {
  async submitVerification(
    userId: string,
    walletAddress: string,
    data: VerificationSubmission
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Starting identity verification submission:', { userId, walletAddress });

      // Upload documents to storage
      const documentUrl = await this.uploadDocument(userId, 'document', data.documentFile);
      const selfieUrl = await this.uploadDocument(userId, 'selfie', data.selfieFile);

      // Create verification hash for blockchain
      const verificationData = `${data.fullName}:${data.email}:${data.documentType}:${Date.now()}`;
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes(verificationData));

      console.log('Documents uploaded, creating verification record...');

      // Create verification record
      const { data: verificationRecord, error } = await supabase
        .from('identity_verifications')
        .insert({
          user_id: userId,
          full_name: data.fullName,
          email: data.email,
          document_type: data.documentType,
          document_url: documentUrl,
          selfie_url: selfieUrl,
          verification_hash: verificationHash,
          status: 'in_progress'
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create verification record:', error);
        return { success: false, error: 'Failed to create verification record' };
      }

      console.log('Verification record created, attempting NFT mint...');

      // Now attempt to mint the Soulbound NFT
      try {
        // Connect to blockchain service
        if (typeof window.ethereum !== 'undefined') {
          const provider = new ethers.BrowserProvider(window.ethereum);
          await soulboundIdentityService.connect(provider);

          // Create metadata URI (in production, this would be IPFS)
          const metadata = {
            name: `Identity Verification #${verificationRecord.id}`,
            description: 'Soulbound Identity NFT for DAO participation',
            attributes: [
              { trait_type: 'Verification Status', value: 'Verified' },
              { trait_type: 'Document Type', value: data.documentType },
              { trait_type: 'Verification Date', value: new Date().toISOString() }
            ]
          };
          const metadataURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;

          console.log('Minting Soulbound NFT...');

          // Mint the NFT
          const mintResult = await soulboundIdentityService.mintIdentity(
            walletAddress,
            verificationHash,
            metadataURI
          );

          console.log('NFT minted successfully:', mintResult);

          // Update verification record with NFT details
          const { error: updateError } = await supabase
            .from('identity_verifications')
            .update({
              status: 'verified',
              verified_at: new Date().toISOString(),
              nft_token_id: parseInt(mintResult.tokenId),
              nft_transaction_hash: mintResult.txHash
            })
            .eq('id', verificationRecord.id);

          if (updateError) {
            console.error('Failed to update verification record with NFT details:', updateError);
            // NFT was minted but record update failed - this is recoverable
          }

          return { success: true };
        } else {
          console.error('MetaMask not available');
          return { success: false, error: 'MetaMask not available for NFT minting' };
        }
      } catch (nftError) {
        console.error('NFT minting failed:', nftError);
        
        // Update status to show NFT minting failed
        await supabase
          .from('identity_verifications')
          .update({
            status: 'rejected',
            rejection_reason: `NFT minting failed: ${nftError.message}`
          })
          .eq('id', verificationRecord.id);

        return { success: false, error: `NFT minting failed: ${nftError.message}` };
      }
    } catch (error) {
      console.error('Verification submission failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async uploadDocument(userId: string, type: string, file: File): Promise<string> {
    const fileName = `${userId}/${type}_${Date.now()}_${file.name}`;
    
    const { error } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, file);

    if (error) {
      throw new Error(`Failed to upload ${type}: ${error.message}`);
    }

    const { data } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async getVerificationRecord(userId: string): Promise<VerificationRecord | null> {
    const { data, error } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Failed to get verification record:', error);
      return null;
    }

    return data;
  }

  async checkVerificationStatus(userId: string): Promise<{
    isVerified: boolean;
    isPending: boolean;
    isRejected: boolean;
    record: VerificationRecord | null;
  }> {
    const record = await this.getVerificationRecord(userId);
    
    return {
      isVerified: record?.status === 'verified',
      isPending: ['pending', 'in_progress'].includes(record?.status || ''),
      isRejected: record?.status === 'rejected',
      record
    };
  }
}

export const identityVerificationService = new IdentityVerificationService();
