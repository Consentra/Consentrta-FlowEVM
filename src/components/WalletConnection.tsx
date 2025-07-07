
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle, AlertCircle, ExternalLink, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NetworkConfig {
  chainId: string;
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
    chainId: '0x221', // 545 in hex
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
    chainId: '0x20a65', // 133717 in hex
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

interface WalletConnectionProps {
  onConnect: (connected: boolean) => void;
}

export interface WalletConnectionRef {
  handleConnect: () => void;
}

export const WalletConnection = forwardRef<WalletConnectionRef, WalletConnectionProps>(({ onConnect }, ref) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkConfig | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          onConnect(true);
          await checkNetwork();
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const checkNetwork = async () => {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const network = Object.values(SUPPORTED_NETWORKS).find(net => net.chainId === chainId);
      
      setCurrentNetwork(network || null);
      setIsCorrectNetwork(!!network);
      return !!network;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  };

  const switchToNetwork = async (networkKey: string) => {
    const network = SUPPORTED_NETWORKS[networkKey];
    if (!network) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });
      await checkNetwork();
      toast({
        title: "Network Switched",
        description: `Successfully connected to ${network.chainName}`,
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [network],
          });
          await checkNetwork();
          toast({
            title: "Network Added",
            description: `${network.chainName} added and connected`,
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          toast({
            title: "Network Error",
            description: `Failed to add ${network.chainName}`,
            variant: "destructive",
          });
        }
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to connect your wallet",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        onConnect(true);
        
        const networkCorrect = await checkNetwork();
        if (!networkCorrect) {
          // Don't auto-switch, let user choose
        }
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
    setCurrentNetwork(null);
    onConnect(false);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  useImperativeHandle(ref, () => ({
    handleConnect: connectWallet
  }));

  if (!isConnected) {
    return (
      <Button 
        onClick={connectWallet} 
        disabled={isConnecting}
        size="sm"
        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      >
        <Wallet className="mr-2 h-3 w-3" />
        {isConnecting ? 'Connecting...' : 'Connect'}
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {!isCorrectNetwork && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs px-2"
            >
              <AlertCircle className="mr-1 h-3 w-3" />
              Switch Network
              <ChevronDown className="ml-1 h-2 w-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(SUPPORTED_NETWORKS).map(([key, network]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => switchToNetwork(key)}
                className="cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{network.chainName}</span>
                  <span className="text-xs text-muted-foreground">
                    {network.nativeCurrency.symbol}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      <div className="flex items-center space-x-2 px-2 py-1 bg-card border border-border rounded-md">
        <div className="flex items-center space-x-1">
          {isCorrectNetwork ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <AlertCircle className="h-3 w-3 text-orange-500" />
          )}
          <span className="text-xs text-muted-foreground font-mono">
            {account?.slice(0, 4)}...{account?.slice(-4)}
          </span>
          {currentNetwork && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              {currentNetwork.nativeCurrency.symbol}
            </Badge>
          )}
        </div>
        <Button
          onClick={disconnectWallet}
          variant="ghost"
          size="sm"
          className="h-5 px-1 text-xs hover:bg-destructive/10 hover:text-destructive"
        >
          ×
        </Button>
      </div>
    </div>
  );
});

WalletConnection.displayName = 'WalletConnection';
