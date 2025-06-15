
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';

interface BlockchainState {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
}

export const useBlockchain = () => {
  const [state, setState] = useState<BlockchainState>({
    provider: null,
    signer: null,
    account: null,
    chainId: null,
    isConnected: false,
    isCorrectNetwork: false,
  });
  
  const { toast } = useToast();

  const FLOW_EVM_TESTNET_CHAIN_ID = 545; // Flow EVM Testnet

  const checkConnection = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();
          const account = await signer.getAddress();
          
          setState({
            provider,
            signer,
            account,
            chainId: Number(network.chainId),
            isConnected: true,
            isCorrectNetwork: Number(network.chainId) === FLOW_EVM_TESTNET_CHAIN_ID,
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

  const switchToFlowEVM = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${FLOW_EVM_TESTNET_CHAIN_ID.toString(16)}` }],
      });
      await checkConnection();
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${FLOW_EVM_TESTNET_CHAIN_ID.toString(16)}`,
              chainName: 'Flow EVM Testnet',
              nativeCurrency: {
                name: 'Flow',
                symbol: 'FLOW',
                decimals: 18,
              },
              rpcUrls: ['https://testnet.evm.nodes.onflow.org'],
              blockExplorerUrls: ['https://evm-testnet.flowscan.io'],
            }],
          });
          await checkConnection();
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          return false;
        }
      }
      return false;
    }
  }, [checkConnection]);

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
    switchToFlowEVM,
    getContract,
    refreshConnection: checkConnection,
  };
};
