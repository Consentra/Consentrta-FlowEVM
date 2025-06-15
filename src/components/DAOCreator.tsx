
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, Zap, ArrowRight, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDAOs } from '@/hooks/useDAOs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const DAOCreator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    symbol: '',
    totalSupply: '1000000',
    votingDelay: '1',
    votingPeriod: '7',
    proposalThreshold: '1',
    quorumPercentage: '4'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const { createDAO } = useDAOs();
  const { user, isConnected } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'DAO name is required';
      }
      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
      }
      if (!formData.symbol.trim()) {
        newErrors.symbol = 'Token symbol is required';
      }
    }

    if (stepNumber === 2) {
      if (parseInt(formData.votingDelay) < 1) {
        newErrors.votingDelay = 'Voting delay must be at least 1 day';
      }
      if (parseInt(formData.votingPeriod) < 1) {
        newErrors.votingPeriod = 'Voting period must be at least 1 day';
      }
      if (parseInt(formData.quorumPercentage) < 1 || parseInt(formData.quorumPercentage) > 100) {
        newErrors.quorumPercentage = 'Quorum must be between 1-100%';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step) && step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user || !isConnected) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to create a DAO",
        variant: "destructive",
      });
      return;
    }

    if (!validateStep(1) || !validateStep(2)) {
      toast({
        title: "Validation Error",
        description: "Please check all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await createDAO({
        name: formData.name,
        description: formData.description,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "DAO Created Successfully!",
        description: `${formData.name} has been deployed to Flow EVM Testnet`,
      });

      // Navigate to the new DAO
      setTimeout(() => {
        navigate('/daos');
      }, 2000);

    } catch (error) {
      console.error('DAO creation error:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create DAO. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isConnected) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Wallet Connection Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to connect your wallet to create a DAO on Flow EVM Testnet.
            </p>
            <Button onClick={() => navigate('/auth')}>
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
          Create DAO
        </h1>
        <p className="text-lg text-muted-foreground">
          Launch your decentralized autonomous organization
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step >= num 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {num}
            </div>
            {num < 3 && (
              <div className={`w-12 h-0.5 mx-2 transition-colors ${
                step > num ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>
              {step === 1 && 'Basic Information'}
              {step === 2 && 'Governance Settings'}
              {step === 3 && 'Review & Deploy'}
            </span>
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Set up your DAO\'s identity and purpose'}
            {step === 2 && 'Configure voting parameters and governance rules'}
            {step === 3 && 'Review your settings and deploy your DAO'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">DAO Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., DeFi Innovators DAO"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symbol">Token Symbol *</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g., DID"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value)}
                    className={errors.symbol ? 'border-red-500' : ''}
                  />
                  {errors.symbol && <p className="text-sm text-red-500">{errors.symbol}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your DAO's mission, goals, and purpose..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalSupply">Total Token Supply</Label>
                <Input
                  id="totalSupply"
                  type="number"
                  placeholder="1000000"
                  value={formData.totalSupply}
                  onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="votingDelay">Voting Delay (days)</Label>
                  <Input
                    id="votingDelay"
                    type="number"
                    min="1"
                    value={formData.votingDelay}
                    onChange={(e) => handleInputChange('votingDelay', e.target.value)}
                    className={errors.votingDelay ? 'border-red-500' : ''}
                  />
                  {errors.votingDelay && <p className="text-sm text-red-500">{errors.votingDelay}</p>}
                  <p className="text-xs text-muted-foreground">Time before voting starts after proposal creation</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="votingPeriod">Voting Period (days)</Label>
                  <Input
                    id="votingPeriod"
                    type="number"
                    min="1"
                    value={formData.votingPeriod}
                    onChange={(e) => handleInputChange('votingPeriod', e.target.value)}
                    className={errors.votingPeriod ? 'border-red-500' : ''}
                  />
                  {errors.votingPeriod && <p className="text-sm text-red-500">{errors.votingPeriod}</p>}
                  <p className="text-xs text-muted-foreground">Duration of the voting period</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proposalThreshold">Proposal Threshold (%)</Label>
                  <Input
                    id="proposalThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.proposalThreshold}
                    onChange={(e) => handleInputChange('proposalThreshold', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Minimum tokens needed to create proposals</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quorumPercentage">Quorum (%)</Label>
                  <Input
                    id="quorumPercentage"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.quorumPercentage}
                    onChange={(e) => handleInputChange('quorumPercentage', e.target.value)}
                    className={errors.quorumPercentage ? 'border-red-500' : ''}
                  />
                  {errors.quorumPercentage && <p className="text-sm text-red-500">{errors.quorumPercentage}</p>}
                  <p className="text-xs text-muted-foreground">Minimum participation required for valid votes</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">DAO Name:</span>
                  <span>{formData.name}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Token Symbol:</span>
                  <span>{formData.symbol}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Voting Period:</span>
                  <span>{formData.votingPeriod} days</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Quorum:</span>
                  <span>{formData.quorumPercentage}%</span>
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium mb-2">⚡ Ready to Deploy</p>
                <p className="text-sm text-muted-foreground">
                  Your DAO will be deployed to Flow EVM Testnet. Gas fees will be required for deployment.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || loading}
            >
              Back
            </Button>
            
            {step < 3 ? (
              <Button onClick={handleNext} className="flex items-center space-x-2">
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>{loading ? 'Creating...' : 'Deploy DAO'}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
