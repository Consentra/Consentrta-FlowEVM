import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Vote, Users, TrendingUp, Shield, Zap, Bot, Blocks, Globe, ArrowRight, Menu, X } from 'lucide-react';
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
            <span className="text-2xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
              Consentra
            </span>
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
        <div className="container mx-auto text-center max-w-5xl">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-lg px-6 py-2" variant="secondary">
            <Blocks className="w-5 h-5 mr-2" />
            Powered by Flow EVM & AI
          </Badge>
          <h1 className="text-6xl md:text-7xl font-display font-bold mb-8 bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent leading-tight">
            Decentralized Governance
            <br />
            <span className="text-4xl md:text-5xl">Made Simple</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-4xl mx-auto">
            Experience the future of DAO governance with AI-powered voting assistance, 
            soulbound identity verification, and truly decentralized decision-making.
          </p>
          
          {/* Dynamic Stats */}
          <HomeStats />
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {user && isConnected ? (
              <Link to="/dashboard">
                <Button size="lg" className="btn-flower shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4">
                  <Users className="mr-3 h-6 w-6" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" className="btn-flower shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4">
                    <Users className="mr-3 h-6 w-6" />
                    Join the Revolution
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 text-lg px-8 py-4">
                    <Vote className="mr-3 h-6 w-6" />
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Decentralization Features */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 to-logo-blue/5">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
              <Globe className="w-4 h-4 mr-2" />
              Truly Decentralized
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">
              No Single Point of Failure
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built on blockchain infrastructure with AI assistance that enhances rather than replaces human decision-making.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-logo-blue-dark rounded-xl flex items-center justify-center mb-4">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="font-display text-xl">AI Companions</CardTitle>
                <CardDescription className="text-base">
                  Ethra explains proposals in plain language, while Daisy automates voting based on your preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Automated voting with transparency</li>
                  <li>• Risk assessment and impact analysis</li>
                  <li>• Natural language explanations</li>
                  <li>• Always under your control</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="font-display text-xl">Soulbound Identity</CardTitle>
                <CardDescription className="text-base">
                  Non-transferable identity NFTs ensure authentic participation without central authority
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Decentralized identity verification</li>
                  <li>• Prevents sybil attacks</li>
                  <li>• Enhanced voting weight</li>
                  <li>• Privacy-preserving</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="font-display text-xl">Community Analytics</CardTitle>
                <CardDescription className="text-base">
                  Transparent governance metrics and community-driven insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Open-source analytics</li>
                  <li>• Community sentiment tracking</li>
                  <li>• Proposal success patterns</li>
                  <li>• Participation metrics</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="font-display text-xl">Multi-DAO Network</CardTitle>
                <CardDescription className="text-base">
                  Participate across multiple DAOs with unified governance tools
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
                  Executable proposals with built-in treasury management and automated execution
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-hover border-primary/20 bg-background/70 backdrop-blur-sm">
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-logo-blue-dark rounded-xl flex items-center justify-center mb-4">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="font-display text-xl">Flow EVM Power</CardTitle>
                <CardDescription className="text-base">
                  High-performance blockchain for fast, low-cost governance operations
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
            Ready to Govern Differently?
          </h2>
          <p className="text-xl md:text-2xl mb-10 opacity-90 max-w-3xl mx-auto">
            Join thousands of users building the future of decentralized governance
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
                Start Your DAO Journey
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
            </div>
            <p className="text-muted-foreground text-center">
              &copy; 2025 Consentra. Empowering decentralized governance.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
