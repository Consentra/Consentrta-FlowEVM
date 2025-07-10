
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Shield, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const WalletAuth: React.FC = () => {
  const { signIn, loading, user, isConnected } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (user && isConnected) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isConnected, navigate]);

  const handleConnect = async () => {
    const result = await signIn();
    if (!result.error && user) {
      // Navigation will be handled by the useEffect above
    }
  };

  // Don't render the auth form if user is already connected
  if (user && isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-logo-blue/10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-logo-blue/10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-6">
            ← Back to home
          </Link>
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img 
              src="/lovable-uploads/cfc8144b-4936-4355-a021-7bc842b5ec32.png" 
              alt="Consentra" 
              className="w-12 h-12 animate-bloom"
            />
            <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
              Consentra
            </h2>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <p className="text-lg text-muted-foreground font-medium">Decentralized Governance Platform</p>
          </div>
        </div>

        <Card className="glass-card shadow-xl border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display flex items-center justify-center space-x-2">
              <Wallet className="w-6 h-6" />
              <span>Connect Wallet</span>
            </CardTitle>
            <CardDescription className="text-base">
              Connect your wallet to participate in decentralized governance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Why Connect a Wallet?</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Secure wallet-based authentication</li>
                <li>• No passwords or email required</li>
                <li>• Support for multiple wallet types</li>
                <li>• True decentralized identity</li>
              </ul>
            </div>

            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <Button
                            onClick={openConnectModal}
                            className="w-full h-11 btn-flower font-medium text-base"
                          >
                            <Wallet className="mr-2 h-5 w-5" />
                            Connect Wallet
                          </Button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <Button
                            onClick={openChainModal}
                            className="w-full h-11"
                            variant="destructive"
                          >
                            Wrong Network
                          </Button>
                        );
                      }

                      return (
                        <div className="flex gap-2 w-full">
                          <Button
                            onClick={openChainModal}
                            className="flex-1"
                            variant="outline"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 16,
                                  height: 16,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                  marginRight: 8,
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 16, height: 16 }}
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </Button>

                          <Button
                            onClick={openAccountModal}
                            className="flex-1"
                            variant="outline"
                          >
                            {account.displayName}
                            {account.displayBalance
                              ? ` (${account.displayBalance})`
                              : ''}
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>

            <p className="text-center text-xs text-muted-foreground">
              Don't have a wallet?{' '}
              <a 
                href="https://metamask.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Install MetaMask
              </a>{' '}
              or{' '}
              <a 
                href="https://walletconnect.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                use WalletConnect
              </a>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          By connecting, you agree to participate in decentralized governance
        </p>
      </div>
    </div>
  );
};
