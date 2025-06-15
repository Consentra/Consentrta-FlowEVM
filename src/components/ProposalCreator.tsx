
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Zap, ArrowRight, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProposals } from '@/hooks/useProposals';
import { useDAOs } from '@/hooks/useDAOs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const ProposalCreator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    daoId: '',
    type: 'general',
    executionTime: '7',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const { createProposal } = useProposals();
  const { daos } = useDAOs();
  const { user, isConnected } = useAuth();
  const navigate = useNavigate();

  const proposalTypes = [
    { value: 'general', label: 'General Proposal', description: 'Standard governance proposal' },
    { value: 'treasury', label: 'Treasury Management', description: 'Fund allocation and spending' },
    { value: 'parameter', label: 'Parameter Change', description: 'Modify DAO parameters' },
    { value: 'membership', label: 'Membership', description: 'Add or remove members' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.daoId) {
        newErrors.daoId = 'Please select a DAO';
      }
      if (!formData.title.trim()) {
        newErrors.title = 'Proposal title is required';
      }
      if (!formData.description.trim()) {
        newErrors.description = 'Detailed description is required';
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
        description: "Please connect your wallet to create a proposal",
        variant: "destructive",
      });
      return;
    }

    if (!validateStep(1)) {
      toast({
        title: "Validation Error",
        description: "Please check all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + parseInt(formData.executionTime));

      const { data, error } = await createProposal({
        title: formData.title,
        description: formData.description,
        dao_id: formData.daoId,
        deadline: deadlineDate,
        category: formData.type,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Proposal Created!",
        description: `"${formData.title}" has been submitted for voting`,
      });

      // Navigate to proposals page
      setTimeout(() => {
        navigate('/proposals');
      }, 2000);

    } catch (error) {
      console.error('Proposal creation error:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedDAO = daos.find(dao => dao.id === formData.daoId);

  if (!user || !isConnected) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Wallet Connection Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to connect your wallet to create proposals.
            </p>
            <Button onClick={() => navigate('/auth')}>
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (daos.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No DAOs Available</h2>
            <p className="text-muted-foreground mb-4">
              You need to be a member of a DAO to create proposals.
            </p>
            <Button onClick={() => navigate('/daos')}>
              Browse DAOs
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
          Create Proposal
        </h1>
        <p className="text-lg text-muted-foreground">
          Submit a new proposal for DAO governance
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
            <FileText className="h-5 w-5 text-primary" />
            <span>
              {step === 1 && 'Proposal Details'}
              {step === 2 && 'Configuration'}
              {step === 3 && 'Review & Submit'}
            </span>
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Provide the basic information for your proposal'}
            {step === 2 && 'Configure proposal type and execution parameters'}
            {step === 3 && 'Review your proposal before submitting'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="daoSelect">Select DAO *</Label>
                <Select value={formData.daoId} onValueChange={(value) => handleInputChange('daoId', value)}>
                  <SelectTrigger className={errors.daoId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Choose a DAO" />
                  </SelectTrigger>
                  <SelectContent>
                    {daos.map((dao) => (
                      <SelectItem key={dao.id} value={dao.id}>
                        <div className="flex items-center space-x-2">
                          <span>{dao.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {dao.member_count} members
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.daoId && <p className="text-sm text-red-500">{errors.daoId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Proposal Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Increase development funding by 20%"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a comprehensive description of your proposal, including rationale, expected outcomes, and implementation details..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Proposal Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {proposalTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.type === type.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleInputChange('type', type.value)}
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="executionTime">Voting Duration (days)</Label>
                <Select value={formData.executionTime} onValueChange={(value) => handleInputChange('executionTime', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Execution Timeline</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Voting will begin immediately after submission and run for {formData.executionTime} days. 
                  If approved, the proposal will be queued for execution.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">DAO:</span>
                  <span>{selectedDAO?.name || 'Not selected'}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Title:</span>
                  <span className="text-right">{formData.title || 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Type:</span>
                  <Badge>{proposalTypes.find(t => t.value === formData.type)?.label}</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Voting Duration:</span>
                  <span>{formData.executionTime} days</span>
                </div>
              </div>

              {formData.description && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium text-sm block mb-2">Description:</span>
                  <p className="text-sm text-muted-foreground">{formData.description}</p>
                </div>
              )}

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium mb-2">⚡ Ready to Submit</p>
                <p className="text-sm text-muted-foreground">
                  Your proposal will be submitted to the blockchain and voting will begin immediately.
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
                <span>{loading ? 'Creating...' : 'Submit Proposal'}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
