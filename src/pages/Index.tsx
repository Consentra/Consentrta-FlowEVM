
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Vote, Users, TrendingUp, Shield, Zap, Bot, Blocks, Globe, ArrowRight, Menu, X, Star, CheckCircle, Network, Layers } from 'lucide-react';
import { HomeStats } from '@/components/HomeStats';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isConnected } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-logo-blue/10">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 relative">
              <img 
                src="/lovable-uploads/cfc8144b-4936-4355-a021-7bc842b5ec32.png" 
                alt="Consentra Logo" 
                className="w-full h-full object-contain animate-bloom"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
                Consentra
              </span>
              <Badge variant="outline" className="text-xs px-2 py-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
                Multichain
              </Badge>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user && isConnected ? (
              <Link to="/dashboard">
                <Button className="btn-flower font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="font-medium hover:bg-primary/10">Connect Wallet</Button>
                </Link>
                <Link to="/auth">
                  <Button className="btn-flower font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-4 space-y-3">
              {user && isConnected ? (
                <Link to="/dashboard" className="block">
                  <Button className="w-full btn-flower font-medium">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth" className="block">
                    <Button variant="ghost" className="w-full font-medium">Connect Wallet</Button>
                  </Link>
                  <Link to="/auth" className="block">
                    <Button className="w-full btn-flower font-medium">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center max-w-6xl">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-lg px-6 py-2" variant="secondary">
            <Network className="w-5 h-5 mr-2" />
            Cross-Chain DAO Platform
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent leading-tight">
            Governance Across
            <br />
            <span className="text-4xl md:text-6xl">Multiple Blockchains</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-4xl mx-auto">
            The first multichain DAO platform powered by AI assistants Ethra & Daisy. Experience seamless governance 
            across Flow EVM and Hyperion networks with soulbound identity verification.
          </p>
          
          {/* Supported Networks */}
          <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-3 bg-background/50 backdrop-blur-sm rounded-lg p-6 border border-primary/20">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-lg">Flow EVM</div>
                <div className="text-sm text-muted-foreground">High-performance & Developer-friendly</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3 bg-background/50 backdrop-blur-sm rounded-lg p-6 border border-primary/20">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                <Layers className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-lg">Hyperion</div>
                <div className="text-sm text-muted-foreground">Scalable & Cost-effective</div>
              </div>
            </div>
          </div>
          
          {/* Dynamic Stats */}
          <HomeStats />
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {user && isConnected ? (
              <Link to="/dashboard">
                <Button size="lg" className="btn-flower shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4">
                  <Globe className="mr-3 h-6 w-6" />
                  Continue Your Journey
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" className="btn-flower shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4">
                    <Network className="mr-3 h-6 w-6" />
                    Join Multichain Governance
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 text-lg px-8 py-4">
                    <Vote className="mr-3 h-6 w-6" />
                    Connect Wallet
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Multichain Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
              <Globe className="w-4 h-4 mr-2" />
              Multichain Advantage
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">
              Why Choose Multichain?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Access the best of multiple blockchain ecosystems while maintaining unified governance and identity.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <Network className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="font-display text-2xl">Network Flexibility</CardTitle>
                <CardDescription className="text-base">
                  Choose the best network for each DAO based on performance, cost, and community preferences
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="font-display text-2xl">Unified Identity</CardTitle>
                <CardDescription className="text-base">
                  Single soulbound identity works across all supported networks for seamless participation
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="font-display text-2xl">Cost Optimization</CardTitle>
                <CardDescription className="text-base">
                  Automatically choose the most cost-effective network for different types of governance activities
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Assistants Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 to-logo-blue/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              <Bot className="w-4 h-4 mr-2" />
              AI-Powered Multichain Governance
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">
              Your AI Governance Team
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ethra analyzes proposals across all networks, while Daisy automates your voting preferences seamlessly across chains.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-logo-blue-dark rounded-xl flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="font-display text-2xl">Ethra - Cross-Chain Analyst</CardTitle>
                <CardDescription className="text-base">
                  AI governance analyst that understands proposals across Flow EVM and Hyperion networks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-3">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Cross-chain proposal analysis</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Network-specific risk assessment</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Gas fee optimization recommendations</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Plain language explanations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="font-display text-2xl">Daisy - Multichain Automator</CardTitle>
                <CardDescription className="text-base">
                  Smart voting automation that works seamlessly across all supported blockchain networks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-3">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Cross-chain automated voting</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Network-aware decision making</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Preference-based voting across chains</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Always under your control</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              <Blocks className="w-4 h-4 mr-2" />
              Next-Gen Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">
              Built for the Future
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Advanced governance tools designed for the multichain future of decentralized organizations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="font-display text-xl">Cross-Chain Identity</CardTitle>
                <CardDescription className="text-base">
                  Soulbound NFTs that verify your identity across all supported blockchain networks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="font-display text-xl">Multichain Analytics</CardTitle>
                <CardDescription className="text-base">
                  Comprehensive governance metrics and insights across all networks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="font-display text-xl">Network Bridges</CardTitle>
                <CardDescription className="text-base">
                  Seamlessly participate in DAOs across different blockchain ecosystems
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <Vote className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="font-display text-xl">Smart Proposals</CardTitle>
                <CardDescription className="text-base">
                  Cross-chain executable proposals with unified treasury management
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-logo-blue-dark rounded-xl flex items-center justify-center mb-4">
                  <Network className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="font-display text-xl">Network Agnostic</CardTitle>
                <CardDescription className="text-base">
                  Single interface for governance across multiple blockchain networks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                  <Blocks className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="font-display text-xl">Open Multichain</CardTitle>
                <CardDescription className="text-base">
                  Transparent, community-governed platform supporting multiple networks
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 flower-gradient text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Ready for Multichain Governance?
          </h2>
          <p className="text-xl md:text-2xl mb-10 opacity-90 max-w-3xl mx-auto">
            Join the next generation of decentralized governance across multiple blockchain networks with AI-powered assistance and unified identity verification
          </p>
          {user && isConnected ? (
            <Link to="/dashboard">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100 font-medium shadow-xl text-lg px-8 py-4">
                Continue Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100 font-medium shadow-xl text-lg px-8 py-4">
                Start Multichain Governance
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/lovable-uploads/cfc8144b-4936-4355-a021-7bc842b5ec32.png" 
                alt="Consentra" 
                className="w-8 h-8"
              />
              <span className="font-display font-bold text-xl bg-gradient-to-r from-primary to-logo-blue-dark bg-clip-text text-transparent">
                Consentra
              </span>
              <Badge variant="outline" className="text-xs px-2 py-1">
                Multichain
              </Badge>
            </div>
            <p className="text-muted-foreground text-center">
              &copy; 2025 Consentra. Empowering multichain governance with AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
