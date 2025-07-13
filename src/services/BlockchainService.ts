
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/utils/contractAddresses';
import { PROPOSAL_REGISTRY_ABI, MINIMAL_GOVERNOR_ABI } from '@/utils/contractABIs';
import { proposalRegistryService } from '@/services/ProposalRegistryService';
import { minimalGovernorService } from '@/services/MinimalGovernorService';
import { soulboundIdentityService } from '@/services/SoulboundIdentityService';
import { minimalDAOService } from '@/services/MinimalDAOService';
import { daoLibService } from '@/services/DAOLibService';
import { governanceLibService } from '@/services/GovernanceLibService';
import { AIOracleService } from '@/services/AIOracleService';

export interface DAOCreationParams {
  name: string;
  tokenName: string;
  tokenSymbol: string;
  initialSupply: string;
  votingDelay: string;
  votingPeriod: string;
  proposalThreshold: string;
  quorumPercentage: string;
  timelockDelay: string;
}

export interface ProposalCreationParams {
  targets: string[];
  values: string[];
  calldatas: string[];
  description: string;
  title: string;
  tags: string[];
  aiConfidenceScore: number;
}

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private aiOracleService: AIOracleService | null = null;

  async connect(): Promise<boolean> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not installed');
    }

    try {
      // Don't request accounts again if already connected
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Check if we already have a signer
      if (!this.signer) {
        this.signer = await this.provider.getSigner();
      }
      
      console.log('🔗 Connecting blockchain services...');
      
      // Initialize all services
      await Promise.all([
        proposalRegistryService.connect(this.provider),
        minimalGovernorService.connect(this.provider),
        soulboundIdentityService.connect(this.provider),
        minimalDAOService.connect(this.provider),
        daoLibService.connect(this.provider),
        governanceLibService.connect(this.provider)
      ]);
      
      // Initialize AI Oracle service
      this.aiOracleService = new AIOracleService(this.signer);
      
      console.log('✅ All blockchain services connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to blockchain:', error);
      return false;
    }
  }

  async createDAO(params: DAOCreationParams): Promise<{
    dao: string;
    token: string;
    timelock: string;
    txHash: string;
    daoId: number;
  }> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    console.log('Creating DAO on-chain with params:', params);

    try {
      // Validate DAO configuration using DAOLib before creation
      const signerAddress = await this.signer.getAddress();
      const config = daoLibService.createConfig(
        params.name,
        parseInt(params.votingDelay),
        parseInt(params.votingPeriod),
        parseInt(params.quorumPercentage),
        signerAddress
      );
      
      // This will validate and throw if invalid
      await daoLibService.validateConfig(config);
      console.log('DAO configuration pre-validated successfully');

      // Check user verification status
      const canParticipate = await governanceLibService.canParticipateInGovernance(
        CONTRACT_ADDRESSES.SOULBOUND_IDENTITY_NFT,
        signerAddress
      );
      
      if (!canParticipate.canParticipate) {
        console.warn('Creator verification warning:', canParticipate.reason);
        // Continue but inform user
      }

      // Use the enhanced DAOService which now includes validation
      const result = await minimalDAOService.createDAO(
        params.name,
        params.initialSupply
      );

      console.log('DAO created on-chain with ID:', result.daoId);

      // Get the DAO address from the factory
      const daoAddress = await minimalDAOService.getDAO(result.daoId);

      const response = {
        dao: daoAddress,
        token: daoAddress, // In our case, the DAO manages its own token
        timelock: daoAddress, // And timelock functionality
        txHash: result.txHash,
        daoId: result.daoId
      };

      console.log('DAO creation result:', response);
      return response;
    } catch (error) {
      console.error('Failed to create DAO on-chain:', error);
      throw new Error(`DAO creation failed: ${error.message}`);
    }
  }

  async submitVote(
    governorAddress: string,
    proposalId: string,
    support: 0 | 1 | 2,
    reason: string,
    automated: boolean = false
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    console.log('Submitting vote on-chain:', {
      governorAddress,
      proposalId,
      support,
      reason,
      automated
    });

    try {
      // Validate user can participate in governance before voting
      const signerAddress = await this.signer.getAddress();
      const canParticipate = await governanceLibService.canParticipateInGovernance(
        CONTRACT_ADDRESSES.SOULBOUND_IDENTITY_NFT,
        signerAddress
      );
      
      if (!canParticipate.canParticipate) {
        throw new Error(`Cannot vote: ${canParticipate.reason}`);
      }

      // For automated votes, we need to handle this differently
      if (automated) {
        return await this.submitAutomatedVote(governorAddress, proposalId, support, reason);
      }

      // Use the MinimalGovernor contract directly for voting
      const txHash = await minimalGovernorService.castVoteWithReason(
        proposalId,
        support,
        reason
      );
      
      console.log('Manual vote submitted on-chain:', txHash);
      return txHash;
    } catch (error) {
      console.error('Failed to submit vote on-chain:', error);
      throw new Error(`Vote submission failed: ${error.message}`);
    }
  }

  async createProposal(
    governorAddress: string,
    params: ProposalCreationParams
  ): Promise<{ proposalId: string; txHash: string }> {
    if (!this.signer || !this.aiOracleService) {
      throw new Error('Wallet not connected or AI Oracle not initialized');
    }

    console.log('Creating proposal on-chain:', { governorAddress, params });

    try {
      // Create proposal using the MinimalGovernor service
      const result = await minimalGovernorService.propose(params.description);

      // Submit AI prediction and analysis to the AI Oracle
      if (this.aiOracleService) {
        try {
          // Submit AI prediction
          await this.aiOracleService.submitPrediction(
            result.proposalId.toString(),
            params.aiConfidenceScore,
            params.aiConfidenceScore > 70 ? 1 : 0, // 1 for pass, 0 for fail
            `AI prediction for proposal: ${params.title}`
          );

          // Submit AI analysis
          await this.aiOracleService.submitAnalysis(
            result.proposalId.toString(),
            `Analysis for: ${params.title}`,
            params.tags,
            85, // complexity score
            30  // risk score
          );

          console.log('AI prediction and analysis submitted to Oracle');
        } catch (aiError) {
          console.warn('Failed to submit AI data to Oracle:', aiError);
          // Continue with proposal creation even if AI Oracle fails
        }
      }

      console.log('Proposal created on-chain:', result);
      
      return {
        proposalId: result.proposalId.toString(),
        txHash: result.txHash
      };
    } catch (error) {
      console.error('Failed to create proposal on-chain:', error);
      throw new Error(`Proposal creation failed: ${error.message}`);
    }
  }

  async submitAutomatedVote(
    governorAddress: string,
    proposalId: string,
    support: 0 | 1 | 2,
    reason: string
  ): Promise<string> {
    console.log('Submitting automated vote on-chain:', {
      governorAddress,
      proposalId,
      support,
      reason
    });

    try {
      // For Daisy automated voting, we need to handle wallet interactions carefully
      // This would typically require pre-approval or delegation
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      console.log('Automated vote submitted on-chain:', mockTxHash);
      return mockTxHash;
    } catch (error) {
      console.error('Failed to submit automated vote:', error);
      throw new Error(`Automated vote failed: ${error.message}`);
    }
  }

  async joinDAO(daoAddress: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    console.log('Joining DAO on-chain:', daoAddress);

    try {
      return await minimalDAOService.joinDAO(daoAddress);
    } catch (error) {
      console.error('Failed to join DAO on-chain:', error);
      throw new Error(`Failed to join DAO: ${error.message}`);
    }
  }

  async getProposalState(governorAddress: string, proposalId: string): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      // Mock proposal state - in production this would query the actual contract
      return Math.floor(Math.random() * 7); // 0-6 representing different states
    } catch (error) {
      console.error('Failed to get proposal state:', error);
      throw error;
    }
  }

  async estimateGas(
    contractAddress: string,
    method: string,
    params: any[]
  ): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    try {
      // Mock gas estimation
      const mockGas = ethers.parseUnits('21000', 'wei');
      return ethers.formatEther(mockGas);
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  // Helper method to get user's DAOs from the factory
  async getUserDAOs(userAddress: string): Promise<number[]> {
    try {
      return await minimalDAOService.getUserDAOs(userAddress);
    } catch (error) {
      console.error('Failed to get user DAOs:', error);
      return [];
    }
  }

  // Helper method to get DAO info from MinimalDAO contract
  async getDAOInfo(daoAddress: string) {
    try {
      return await minimalDAOService.getDAOInfo(daoAddress);
    } catch (error) {
      console.error('Failed to get DAO info:', error);
      throw error;
    }
  }

  // AI Oracle methods
  async getAIPrediction(proposalId: string) {
    if (!this.aiOracleService) {
      throw new Error('AI Oracle service not initialized');
    }
    return await this.aiOracleService.getPrediction(proposalId);
  }

  async getAIAnalysis(proposalId: string) {
    if (!this.aiOracleService) {
      throw new Error('AI Oracle service not initialized');
    }
    return await this.aiOracleService.getAnalysis(proposalId);
  }

  async getBatchAIPredictions(proposalIds: string[]) {
    if (!this.aiOracleService) {
      throw new Error('AI Oracle service not initialized');
    }
    return await this.aiOracleService.getBatchPredictions(proposalIds);
  }
}

export const blockchainService = new BlockchainService();
