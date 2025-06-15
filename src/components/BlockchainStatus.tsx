
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Wallet, ExternalLink, Zap } from 'lucide-react';
import { useBlockchain } from '@/hooks/useBlockchain';

export const BlockchainStatus: React.FC = () => {
  const { isConnected, isCorrectNetwork, account, chainId, connectWallet, switchToFlowEVM } = useBlockchain();

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
                Connect your wallet to interact with DAOs and vote on proposals
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
              <p className="font-medium text-yellow-900 dark:text-yellow-100">Wrong Network</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Switch to Flow EVM Testnet to interact with Consentra
              </p>
            </div>
          </div>
          <Button 
            onClick={switchToFlowEVM} 
            size="sm" 
            variant="outline"
            className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-900/20"
          >
            <Zap className="mr-2 h-4 w-4" />
            Switch Network
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-950/20">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              Connected to Flow EVM Testnet
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 font-mono">
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
            Chain ID: {chainId}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`https://evm-testnet.flowscan.io/address/${account}`, '_blank')}
            className="text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/20"
            title="View on Flow Explorer"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
