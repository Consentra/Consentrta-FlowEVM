import { ethers } from 'ethers';
import { 
  CONSENSTRA_DAO_ABI, 
  AI_ORACLE_ABI, 
  SOULBOUND_IDENTITY_ABI, 
  DAO_FACTORY_ABI,
  DAO_INTEGRATION_MODULE_ABI,
  DAO_STORAGE_MODULE_ABI,
  CONTRACT_ADDRESSES,
  getContractInstance,
  voteToNumber,
  proposalIdToBytes32,
  isValidAddress
} from './contractIntegration';
import { AIOracleService } from '@/services/AIOracleService';
import { DAOIntegrationService } from '@/services/DAOIntegrationService';

interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  flow: {
    chainId: 545,
    chainIdHex: '0x221',
    chainName: 'Flow EVM Testnet',
    nativeCurrency: {
      name: 'Flow',
      symbol: 'FLOW',
      decimals: 18,
    },
    rpcUrls: ['https://testnet.evm.nodes.onflow.org'],
    blockExplorerUrls: ['https://evm-testnet.flowscan.io'],
  },
  hyperion: {
    chainId: 133717,
    chainIdHex: '0x20a65',
    chainName: 'Hyperion (Testnet)',
    nativeCurrency: {
      name: 'Metis',
      symbol: 'tMETIS',
      decimals: 18,
    },
    rpcUrls: ['https://hyperion-testnet.metisdevops.link'],
    blockExplorerUrls: ['https://hyperion-testnet-explorer.metisdevops.link'],
  },
};

// Legacy export for backward compatibility
export const FLOW_EVM_TESTNET = SUPPORTED_NETWORKS.flow;

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private aiOracleService: AIOracleService | null = null;
  private daoIntegrationService: DAOIntegrationService | null = null;
  private currentNetwork: NetworkConfig | null = null;

  async connect(): Promise<boolean> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not installed');
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      await this.provider.send('eth_requestAccounts', []);
      this.signer = await this.provider.getSigner();
      
      // Initialize services
      this.aiOracleService = new AIOracleService(this.signer);
      this.daoIntegrationService = new DAOIntegrationService(this.signer);
      
      await this.detectNetwork();
      return true;
    } catch (error) {
      console.error('Failed to connect to blockchain:', error);
      return false;
    }
  }

  async detectNetwork(): Promise<void> {
    if (!this.provider) throw new Error('Provider not connected');

    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);
    
    this.currentNetwork = Object.values(SUPPORTED_NETWORKS).find(
      net => net.chainId === chainId
    ) || null;

    if (!this.currentNetwork) {
      console.warn(`Unsupported network detected: Chain ID ${chainId}`);
    }
  }

  async switchToNetwork(networkKey: string): Promise<void> {
    const network = SUPPORTED_NETWORKS[networkKey];
    if (!network) {
      throw new Error(`Network ${networkKey} not supported`);
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainIdHex }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [network],
        });
      } else {
        throw switchError;
      }
    }
    
    await this.detectNetwork();
  }

  getCurrentNetwork(): NetworkConfig | null {
    return this.currentNetwork;
  }

  isNetworkSupported(): boolean {
    return !!this.currentNetwork;
  }

  async getContract(address: string, abi: any): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error('Signer not available');
    }
    return getContractInstance(address, abi, this.signer);
  }

  getAIOracle(): AIOracleService {
    if (!this.aiOracleService) {
      throw new Error('AI Oracle service not initialized. Connect wallet first.');
    }
    return this.aiOracleService;
  }

  async mintIdentityNFT(
    userAddress: string,
    verificationHash: string,
    metadataURI: string
  ): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      if (!CONTRACT_ADDRESSES.SOULBOUND_IDENTITY || CONTRACT_ADDRESSES.SOULBOUND_IDENTITY === "0x0000000000000000000000000000000000000000") {
        console.warn('Soulbound Identity NFT contract address not configured, using mock transaction');
        return '0x' + Math.random().toString(16).substr(2, 64);
      }

      const identityContract = getContractInstance(
        CONTRACT_ADDRESSES.SOULBOUND_IDENTITY,
        SOULBOUND_IDENTITY_ABI,
        this.signer
      );

      const tx = await identityContract.mint(userAddress, verificationHash, metadataURI);
      const receipt = await tx.wait();

      console.log(`Identity NFT minted successfully. Transaction: ${receipt.hash}`);
      return receipt.hash;
    } catch (error: any) {
      console.error('Failed to mint identity NFT:', error);
      throw new Error(`Failed to mint identity NFT: ${error.message || 'Unknown error'}`);
    }
  }

  async submitAIAnalysis(
    proposalId: string,
    confidenceScore: number,
    predictedOutcome: 'pass' | 'fail',
    reasoning: string,
    summary?: string,
    tags?: string[],
    complexityScore?: number,
    riskScore?: number
  ): Promise<string> {
    try {
      if (!this.aiOracleService) {
        await this.connect();
      }

      const oracle = this.getAIOracle();
      
      const predictionTx = await oracle.submitPrediction(
        proposalId,
        confidenceScore,
        predictedOutcome,
        reasoning
      );

      if (summary && tags && complexityScore !== undefined && riskScore !== undefined) {
        const analysisTx = await oracle.submitAnalysis(
          proposalId,
          summary,
          tags,
          complexityScore,
          riskScore
        );
        return analysisTx;
      }

      return predictionTx;
    } catch (error) {
      console.error('Failed to submit AI analysis:', error);
      throw new Error(`Failed to submit AI analysis: ${error.message || 'Unknown error'}`);
    }
  }

  async getAIPrediction(proposalId: string) {
    try {
      if (!this.aiOracleService) {
        await this.connect();
      }
      return await this.getAIOracle().getPrediction(proposalId);
    } catch (error) {
      console.error('Failed to get AI prediction:', error);
      return null;
    }
  }

  async getAIAnalysis(proposalId: string) {
    try {
      if (!this.aiOracleService) {
        await this.connect();
      }
      return await this.getAIOracle().getAnalysis(proposalId);
    } catch (error) {
      console.error('Failed to get AI analysis:', error);
      return null;
    }
  }

  async isVerified(address: string): Promise<boolean> {
    try {
      if (!CONTRACT_ADDRESSES.SOULBOUND_IDENTITY || CONTRACT_ADDRESSES.SOULBOUND_IDENTITY === "0x0000000000000000000000000000000000000000") {
        console.warn('Identity NFT contract address not configured');
        return false;
      }

      const contract = await this.getContract(CONTRACT_ADDRESSES.SOULBOUND_IDENTITY, SOULBOUND_IDENTITY_ABI);
      return await contract.isVerified(address);
    } catch (error) {
      console.error('Failed to check verification status:', error);
      return false;
    }
  }

  getDAOIntegration(): DAOIntegrationService {
    if (!this.daoIntegrationService) {
      throw new Error('DAO Integration service not initialized. Connect wallet first.');
    }
    return this.daoIntegrationService;
  }

  async createProposal(
    daoAddress: string,
    targets: string[],
    values: string[],
    calldatas: string[],
    description: string,
    title?: string,
    tags?: string[],
    aiConfidenceScore?: number
  ): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      if (!isValidAddress(daoAddress)) {
        throw new Error('Invalid DAO address');
      }

      const daoContract = getContractInstance(daoAddress, CONSENSTRA_DAO_ABI, this.signer);
      
      const userAddress = await this.signer.getAddress();
      const currentBlock = await this.provider!.getBlockNumber();
      const votingPower = await daoContract.getVotes(userAddress, currentBlock - 1);
      const proposalThreshold = await daoContract.proposalThreshold();
      
      if (votingPower < proposalThreshold) {
        throw new Error('Insufficient voting power to create proposals');
      }

      const tx = await daoContract.propose(targets, values, calldatas, description);
      const receipt = await tx.wait();
      
      if (title && tags && aiConfidenceScore !== undefined) {
        try {
          const proposalCreatedEvent = receipt.logs.find((log: any) => 
            log.topics[0] === ethers.id("ProposalCreated(uint256,address,address[],uint256[],string[],string,uint256,uint256,string)")
          );
          
          if (proposalCreatedEvent) {
            const decodedEvent = daoContract.interface.parseLog(proposalCreatedEvent);
            const proposalId = decodedEvent.args.proposalId.toString();
            
            await this.getDAOIntegration().storeProposalMetadata(
              proposalId,
              title,
              description,
              tags,
              aiConfidenceScore,
              userAddress,
              true
            );
          }
        } catch (metadataError) {
          console.warn('Failed to store proposal metadata:', metadataError);
        }
      }

      console.log(`Proposal created successfully. Transaction: ${receipt.hash}`);
      return receipt.hash;
    } catch (error: any) {
      console.error('Failed to create proposal:', error);
      
      if (error.message?.includes('insufficient')) {
        throw new Error('Insufficient voting power to create proposals');
      }
      
      throw new Error(`Failed to create proposal: ${error.message || 'Unknown error'}`);
    }
  }

  async submitVote(
    daoAddress: string,
    proposalId: string,
    support: 0 | 1 | 2,
    reason: string = '',
    automated: boolean = false
  ): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      if (!isValidAddress(daoAddress)) {
        throw new Error('Invalid DAO address');
      }

      const daoContract = getContractInstance(daoAddress, CONSENSTRA_DAO_ABI, this.signer);
      
      const userAddress = await this.signer.getAddress();
      const hasVoted = await daoContract.hasVoted(proposalId, userAddress);
      if (hasVoted) {
        throw new Error('You have already voted on this proposal');
      }

      const state = await daoContract.proposalState(proposalId);
      if (state !== 1) {
        throw new Error('Proposal is not in active state');
      }

      const votingPower = await daoContract.getVotes(userAddress, await this.provider!.getBlockNumber() - 1);

      let tx;
      if (reason || automated) {
        try {
          tx = await daoContract.castVoteWithReasonAndAutomation(proposalId, support, reason, automated);
        } catch {
          tx = await daoContract.castVoteWithReason(proposalId, support, reason || `Vote: ${support === 1 ? 'for' : support === 0 ? 'against' : 'abstain'}`);
        }
      } else {
        tx = await daoContract.castVote(proposalId, support);
      }

      const receipt = await tx.wait();

      try {
        await this.getDAOIntegration().recordVote(
          userAddress,
          proposalId,
          support,
          ethers.formatEther(votingPower),
          reason || `Vote: ${support === 1 ? 'for' : support === 0 ? 'against' : 'abstain'}`,
          automated
        );
      } catch (metadataError) {
        console.warn('Failed to record vote metadata:', metadataError);
      }

      console.log(`Vote cast successfully. Transaction: ${receipt.hash}`);
      return receipt.hash;
    } catch (error: any) {
      console.error('Failed to submit vote:', error);
      
      if (error.message?.includes('already voted')) {
        throw new Error('You have already voted on this proposal');
      } else if (error.message?.includes('not in active state')) {
        throw new Error('Voting period has ended for this proposal');
      } else if (error.message?.includes('insufficient')) {
        throw new Error('Insufficient voting power to cast vote');
      }
      
      throw new Error(`Failed to cast vote: ${error.message || 'Unknown error'}`);
    }
  }

  async createDAO(config: {
    name: string;
    tokenName: string;
    tokenSymbol: string;
    initialSupply: string;
    votingDelay: string;
    votingPeriod: string;
    proposalThreshold: string;
    quorumPercentage: string;
    timelockDelay: string;
  }): Promise<{ dao: string; token: string; timelock: string }> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      const userAddress = await this.signer.getAddress();

      if (!CONTRACT_ADDRESSES.DAO_FACTORY || CONTRACT_ADDRESSES.DAO_FACTORY === "0x0000000000000000000000000000000000000000") {
        console.warn('DAO Factory address not configured, using mock addresses');
        const mockAddresses = {
          dao: '0x' + Math.random().toString(16).substr(2, 40),
          token: '0x' + Math.random().toString(16).substr(2, 40),
          timelock: '0x' + Math.random().toString(16).substr(2, 40),
        };
        
        try {
          const daoCounter = await this.getDAOIntegration().getDAOCounter();
          await this.getDAOIntegration().storeDAO(
            daoCounter + 1,
            mockAddresses.dao,
            mockAddresses.token,
            mockAddresses.timelock,
            config.name,
            userAddress
          );
        } catch (storageError) {
          console.warn('Failed to store DAO in storage module:', storageError);
        }
        
        return mockAddresses;
      }

      const factoryContract = getContractInstance(CONTRACT_ADDRESSES.DAO_FACTORY, DAO_FACTORY_ABI, this.signer);
      
      const tx = await factoryContract.createDAO(
        config.name,
        config.tokenName,
        config.tokenSymbol,
        ethers.parseEther(config.initialSupply),
        config.votingDelay,
        config.votingPeriod,
        ethers.parseEther(config.proposalThreshold),
        config.quorumPercentage,
        config.timelockDelay
      );

      const receipt = await tx.wait();
      
      const daoCreatedEvent = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id("DAOCreated(address,address,address,string)")
      );
      
      if (daoCreatedEvent) {
        const decodedEvent = factoryContract.interface.parseLog(daoCreatedEvent);
        const result = {
          dao: decodedEvent.args.dao,
          token: decodedEvent.args.token,
          timelock: decodedEvent.args.timelock
        };

        try {
          const daoCounter = await this.getDAOIntegration().getDAOCounter();
          await this.getDAOIntegration().storeDAO(
            daoCounter + 1,
            result.dao,
            result.token,
            result.timelock,
            config.name,
            userAddress
          );
        } catch (storageError) {
          console.warn('Failed to store DAO in storage module:', storageError);
        }

        return result;
      }

      throw new Error('DAO creation event not found');
    } catch (error) {
      console.error('Failed to create DAO:', error);
      throw error;
    }
  }

  async executeAIVote(
    proposalId: string,
    voter: string,
    category: string,
    daoContract: string
  ): Promise<{ support: number; reason: string }> {
    try {
      return await this.getDAOIntegration().executeAIVote(proposalId, voter, category, daoContract);
    } catch (error) {
      console.error('Failed to execute AI vote:', error);
      throw error;
    }
  }

  async getEnhancedProposalMetadata(proposalId: string): Promise<any> {
    try {
      return await this.getDAOIntegration().getProposalMetadata(proposalId);
    } catch (error) {
      console.error('Failed to get enhanced proposal metadata:', error);
      return null;
    }
  }

  async getUserStats(address: string): Promise<any> {
    try {
      return await this.getDAOIntegration().getUserStats(address);
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return null;
    }
  }

  async getAllDAOs(offset: number = 0, limit: number = 50): Promise<any[]> {
    try {
      return await this.getDAOIntegration().getAllDAOs(offset, limit);
    } catch (error) {
      console.error('Failed to get all DAOs:', error);
      return [];
    }
  }

  async getUserDAOs(address: string): Promise<number[]> {
    try {
      return await this.getDAOIntegration().getUserDAOs(address);
    } catch (error) {
      console.error('Failed to get user DAOs:', error);
      return [];
    }
  }

  async checkDAOMembership(userAddress: string, daoId: number): Promise<boolean> {
    try {
      return await this.getDAOIntegration().checkMembership(userAddress, daoId);
    } catch (error) {
      console.error('Failed to check DAO membership:', error);
      return false;
    }
  }

  async joinDAO(daoId: number): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }
      const userAddress = await this.signer.getAddress();
      return await this.getDAOIntegration().addMember(userAddress, daoId);
    } catch (error) {
      console.error('Failed to join DAO:', error);
      throw error;
    }
  }

  getAddress(): string | null {
    return this.signer ? 'address' : null;
  }

  async getBalance(): Promise<string> {
    if (!this.provider || !this.signer) {
      throw new Error('Provider or signer not available');
    }

    const address = await this.signer.getAddress();
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async getProposalMetadata(daoAddress: string, proposalId: string): Promise<any> {
    try {
      if (!this.provider) {
        await this.connect();
      }

      const daoContract = getContractInstance(daoAddress, CONSENSTRA_DAO_ABI, this.provider!);
      return await daoContract.getProposalMetadata(proposalId);
    } catch (error) {
      console.error('Failed to get proposal metadata:', error);
      return null;
    }
  }

  async getUserAIConfig(daoAddress: string, userAddress: string): Promise<any> {
    try {
      if (!this.provider) {
        await this.connect();
      }

      const daoContract = getContractInstance(daoAddress, CONSENSTRA_DAO_ABI, this.provider!);
      return await daoContract.getUserAIConfig(userAddress);
    } catch (error) {
      console.error('Failed to get user AI config:', error);
      return null;
    }
  }
}

export const blockchainService = new BlockchainService();

export { CONTRACT_ADDRESSES };
