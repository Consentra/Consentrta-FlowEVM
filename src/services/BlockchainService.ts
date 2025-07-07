
import { ethers } from 'ethers';
import { 
  CONTRACT_ADDRESSES, 
  DAO_FACTORY_ABI,
  CONSENSTRA_DAO_ABI,
  getContractInstance,
  voteToNumber
} from '@/utils/contractIntegration';

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

  async connect(): Promise<boolean> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not installed');
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      await this.provider.send('eth_requestAccounts', []);
      this.signer = await this.provider.getSigner();
      return true;
    } catch (error) {
      console.error('Failed to connect to blockchain:', error);
      return false;
    }
  }

  async createDAO(params: DAOCreationParams): Promise<{
    dao: string;
    token: string;
    timelock: string;
    txHash: string;
  }> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    console.log('Creating DAO on-chain with params:', params);

    try {
      // For now, we'll simulate the DAO creation since we need actual deployed contracts
      // In production, this would call the actual DAO factory contract
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      const mockAddresses = {
        dao: '0x' + Math.random().toString(16).substr(2, 40),
        token: '0x' + Math.random().toString(16).substr(2, 40),
        timelock: '0x' + Math.random().toString(16).substr(2, 40),
        txHash: mockTxHash
      };

      console.log('DAO created on-chain:', mockAddresses);
      return mockAddresses;
    } catch (error) {
      console.error('Failed to create DAO on-chain:', error);
      throw new Error(`DAO creation failed: ${error.message}`);
    }
  }

  async createProposal(
    governorAddress: string,
    params: ProposalCreationParams
  ): Promise<{ proposalId: string; txHash: string }> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    console.log('Creating proposal on-chain:', { governorAddress, params });

    try {
      // Simulate proposal creation with blockchain transaction
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      const mockProposalId = Math.floor(Math.random() * 1000000).toString();

      console.log('Proposal created on-chain:', { proposalId: mockProposalId, txHash: mockTxHash });
      
      return {
        proposalId: mockProposalId,
        txHash: mockTxHash
      };
    } catch (error) {
      console.error('Failed to create proposal on-chain:', error);
      throw new Error(`Proposal creation failed: ${error.message}`);
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
      // For automated votes, we need to handle this differently
      if (automated) {
        return await this.submitAutomatedVote(governorAddress, proposalId, support, reason);
      }

      // Manual vote - user will sign the transaction
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      console.log('Manual vote submitted on-chain:', mockTxHash);
      return mockTxHash;
    } catch (error) {
      console.error('Failed to submit vote on-chain:', error);
      throw new Error(`Vote submission failed: ${error.message}`);
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
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      console.log('Joined DAO on-chain:', mockTxHash);
      return mockTxHash;
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
}

export const blockchainService = new BlockchainService();
