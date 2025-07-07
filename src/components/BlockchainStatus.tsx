
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Wallet, ExternalLink, Zap, ChevronDown } from 'lucide-react';
import { useBlockchain } from '@/hooks/useBlockchain';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const BlockchainStatus: React.FC = () => {
  const { 
    isConnected, 
    isCorrectNetwork, 
    account, 
    chainId, 
    currentNetwork,
    connectWallet, 
    switchNetwork,
    supportedNetworks 
  } = useBlockchain();

  if (!isConnected) {
    return (
      <Card className="border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-950/20">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="font-medium text-orange-900 dark:text-orange-100">Wallet Not Connected</p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Connect your wallet to interact with DAOs across multiple chains
              </p>
            </div>
          </div>
          <Button 
            onClick={connectWallet} 
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Card className="border-yellow-200 dark:border-yellow-800/50 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-100">Unsupported Network</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Switch to a supported network to interact with Consentra
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-900/20"
              >
                <Zap className="mr-2 h-4 w-4" />
                Switch Network
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(supportedNetworks).map(([key, network]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => switchNetwork(key)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{network.chainName}</span>
                    <span className="text-xs text-muted-foreground">
                      {network.nativeCurrency.symbol} • Chain ID: {network.chainId}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    );
  }

  const getExplorerUrl = () => {
    if (!currentNetwork) return '#';
    return `${currentNetwork.blockExplorerUrls[0]}/address/${account}`;
  };

  return (
    <Card className="border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-950/20">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              Connected to {currentNetwork?.chainName}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 font-mono">
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
            {currentNetwork?.nativeCurrency.symbol} • Chain ID: {chainId}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20"
              >
                <Zap className="h-4 w-4" />
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(supportedNetworks).map(([key, network]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => switchNetwork(key)}
                  className="cursor-pointer"
                  disabled={network.chainId === chainId}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="font-medium">{network.chainName}</span>
                      <span className="text-xs text-muted-foreground">
                        {network.nativeCurrency.symbol} • Chain ID: {network.chainId}
                      </span>
                    </div>
                    {network.chainId === chainId && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={() => window.open(getExplorerUrl(), '_blank')}
                className="cursor-pointer border-t"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Explorer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
