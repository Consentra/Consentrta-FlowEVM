
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';

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

const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
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

interface BlockchainState {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  currentNetwork: NetworkConfig | null;
}

export const useBlockchain = () => {
  const [state, setState] = useState<BlockchainState>({
    provider: null,
    signer: null,
    account: null,
    chainId: null,
    isConnected: false,
    isCorrectNetwork: false,
    currentNetwork: null,
  });
  
  const { toast } = useToast();

  const getSupportedNetworkByChainId = (chainId: number): NetworkConfig | null => {
    return Object.values(SUPPORTED_NETWORKS).find(network => network.chainId === chainId) || null;
  };

  const checkConnection = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();
          const account = await signer.getAddress();
          const chainId = Number(network.chainId);
          const currentNetwork = getSupportedNetworkByChainId(chainId);
          
          setState({
            provider,
            signer,
            account,
            chainId,
            isConnected: true,
            isCorrectNetwork: !!currentNetwork,
            currentNetwork,
          });
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to connect your wallet",
        variant: "destructive",
      });
      return false;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await checkConnection();
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
      return false;
    }
  }, [checkConnection, toast]);

  const switchNetwork = useCallback(async (networkKey: string) => {
    const network = SUPPORTED_NETWORKS[networkKey];
    if (!network) {
      toast({
        title: "Network Not Found",
        description: "The requested network is not supported",
        variant: "destructive",
      });
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainIdHex }],
      });
      await checkConnection();
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [network],
          });
          await checkConnection();
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          toast({
            title: "Network Error",
            description: `Failed to add ${network.chainName}`,
            variant: "destructive",
          });
          return false;
        }
      }
      console.error('Error switching network:', switchError);
      toast({
        title: "Network Switch Failed",
        description: `Failed to switch to ${network.chainName}`,
        variant: "destructive",
      });
      return false;
    }
  }, [checkConnection, toast]);

  const getContract = useCallback((address: string, abi: any[]) => {
    if (!state.signer) {
      throw new Error('Wallet not connected');
    }
    return new ethers.Contract(address, abi, state.signer);
  }, [state.signer]);

  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', checkConnection);
      window.ethereum.on('chainChanged', checkConnection);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', checkConnection);
        window.ethereum.removeListener('chainChanged', checkConnection);
      };
    }
  }, [checkConnection]);

  return {
    ...state,
    connectWallet,
    switchNetwork,
    getContract,
    refreshConnection: checkConnection,
    supportedNetworks: SUPPORTED_NETWORKS,
  };
};
