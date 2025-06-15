
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink, Copy, Calendar, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VerificationRecord } from '@/services/IdentityVerificationService';

interface SoulboundNFTProps {
  verificationRecord: VerificationRecord;
}

export const SoulboundNFT: React.FC<SoulboundNFTProps> = ({ verificationRecord }) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${label} copied successfully`,
    });
  };

  const openInExplorer = (txHash: string) => {
    window.open(`https://evm-testnet.flowscan.io/tx/${txHash}`, '_blank');
  };

  if (verificationRecord.status !== 'verified' || !verificationRecord.nft_token_id) {
    return null;
  }

  return (
    <Card className="glass-card border-green-200 dark:border-green-800">
      <CardHeader className="text-center">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          Soulbound Identity NFT
        </CardTitle>
        <CardDescription>
          Non-transferable proof of verified identity on Flow EVM
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center">
          <Badge className="status-verified text-lg px-4 py-2">
            ✓ Verified Identity
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Token ID:</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">#{verificationRecord.nft_token_id}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(verificationRecord.nft_token_id!.toString(), 'Token ID')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {verificationRecord.nft_transaction_hash && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Transaction:</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm">
                  {verificationRecord.nft_transaction_hash.slice(0, 8)}...{verificationRecord.nft_transaction_hash.slice(-6)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(verificationRecord.nft_transaction_hash!, 'Transaction Hash')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openInExplorer(verificationRecord.nft_transaction_hash!)}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Verified:</span>
            </div>
            <span className="text-sm">
              {new Date(verificationRecord.verified_at!).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">NFT Properties</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">Soulbound (Non-transferable)</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Standard</span>
              <span className="font-medium">ERC-721</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">Flow EVM Testnet</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Utility</span>
              <span className="font-medium">DAO Governance</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Soulbound Protection</p>
              <p className="text-blue-700 dark:text-blue-300">
                This NFT is permanently bound to your wallet and cannot be transferred, traded, or sold. 
                It serves as immutable proof of your verified identity for DAO participation.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
