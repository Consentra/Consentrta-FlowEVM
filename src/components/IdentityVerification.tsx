import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  User, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Camera,
  FileText,
  Smartphone,
  Lock,
  Eye,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VerificationSubmission } from '@/services/IdentityVerificationService';

interface IdentityVerificationProps {
  onVerify: (verified: boolean) => void;
  onSubmit: (data: VerificationSubmission) => Promise<{ success: boolean; error?: string }>;
}

export const IdentityVerification: React.FC<IdentityVerificationProps> = ({ onVerify, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    documentType: 'passport' as 'passport' | 'drivers_license' | 'national_id',
    documentFile: null as File | null,
    selfieFile: null as File | null
  });
  const { toast } = useToast();

  const steps = [
    { id: 1, title: 'Personal Information', icon: User, description: 'Basic identity details' },
    { id: 2, title: 'Document Upload', icon: FileText, description: 'Government-issued ID' },
    { id: 3, title: 'Biometric Verification', icon: Camera, description: 'Selfie verification' },
    { id: 4, title: 'Soulbound NFT Creation', icon: Shield, description: 'Blockchain identity' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: string, file: File) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    toast({
      title: "File Uploaded Successfully",
      description: `${file.name} has been securely uploaded`,
    });
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleVerify = async () => {
    if (!formData.documentFile || !formData.selfieFile) {
      toast({
        title: "Missing Files",
        description: "Please upload both document and selfie files",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const submissionData: VerificationSubmission = {
        fullName: formData.fullName,
        email: formData.email,
        documentType: formData.documentType,
        documentFile: formData.documentFile,
        selfieFile: formData.selfieFile
      };

      const result = await onSubmit(submissionData);
      
      if (result.success) {
        toast({
          title: "Verification Submitted",
          description: "Your documents have been submitted for processing",
        });
        onVerify(true);
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "Failed to submit verification",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
              <p className="text-muted-foreground">
                Provide your legal name and contact information
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Legal Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name as it appears on official documents"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleNextStep} 
              disabled={!formData.fullName || !formData.email}
              className="w-full h-12 btn-gradient"
            >
              Continue to Document Upload
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Document Verification</h3>
              <p className="text-muted-foreground">
                Upload a clear photo of your government-issued ID
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Document Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'passport', label: 'Passport' },
                    { value: 'drivers_license', label: 'Driver\'s License' },
                    { value: 'national_id', label: 'National ID' }
                  ].map(type => (
                    <Button
                      key={type.value}
                      variant={formData.documentType === type.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleInputChange('documentType', type.value)}
                      className="h-12"
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Upload Document</Label>
                <div className="border-2 border-dashed border-primary/20 rounded-xl p-8 text-center hover:border-primary/40 transition-colors">
                  <Upload className="mx-auto h-10 w-10 text-primary/60 mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop your document or click to browse
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('documentFile', file);
                    }}
                    className="hidden"
                    id="document-upload"
                  />
                  <label htmlFor="document-upload">
                    <Button variant="outline" size="sm" asChild className="cursor-pointer">
                      <span>Choose File</span>
                    </Button>
                  </label>
                  {formData.documentFile && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        ✓ {formData.documentFile.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button 
              onClick={handleNextStep} 
              disabled={!formData.documentFile}
              className="w-full h-12 btn-gradient"
            >
              Continue to Biometric Verification
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Camera className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Biometric Verification</h3>
              <p className="text-muted-foreground">
                Take a selfie to verify your identity matches your document
              </p>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-primary/20 rounded-xl p-8 text-center hover:border-primary/40 transition-colors">
                <Smartphone className="mx-auto h-10 w-10 text-primary/60 mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Take a clear selfie photo for biometric verification
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>Look directly at camera</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="h-3 w-3" />
                      <span>Good lighting</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('selfieFile', file);
                    }}
                    className="hidden"
                    id="selfie-upload"
                  />
                  <label htmlFor="selfie-upload">
                    <Button className="btn-gradient cursor-pointer" asChild>
                      <span>
                        <Camera className="mr-2 h-4 w-4" />
                        Take Selfie
                      </span>
                    </Button>
                  </label>
                </div>
                {formData.selfieFile && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      ✓ Selfie captured successfully
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={handleNextStep} 
              disabled={!formData.selfieFile}
              className="w-full h-12 btn-gradient"
            >
              Create Soulbound NFT
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 text-center">
            <div className="mb-6">
              <Shield className="mx-auto h-16 w-16 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Create Soulbound NFT</h3>
              <p className="text-muted-foreground">
                Your verified identity will be permanently recorded on Flow EVM blockchain
              </p>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h4 className="font-semibold text-lg mb-4">Identity Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="font-medium">{formData.fullName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Document:</span>
                  <span className="font-medium capitalize">{formData.documentType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Verification:</span>
                  <Badge className="status-verified">Biometric Verified</Badge>
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>Non-transferable • Sybil-resistant • Blockchain verified</span>
              </div>
            </div>

            <Button 
              onClick={handleVerify} 
              disabled={isProcessing}
              className="w-full h-12 btn-gradient"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting for Verification...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Submit for Verification
                </>
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto glass-card animate-fade-in">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center text-2xl">
          <Shield className="mr-3 h-6 w-6 text-primary" />
          Identity Verification
        </CardTitle>
        <CardDescription className="text-base">
          Complete KYC verification to receive your Soulbound NFT and participate in governance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Progress Steps */}
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center space-y-2">
                <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  currentStep >= step.id 
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg' 
                    : 'bg-background text-muted-foreground border-border'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-medium ${
                    currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`absolute top-6 left-1/2 w-24 h-0.5 -translate-y-1/2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-border'
                  }`} style={{ marginLeft: '24px' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Step {currentStep} of {steps.length}</span>
            <span className="text-muted-foreground">{Math.round((currentStep / steps.length) * 100)}% Complete</span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Security Notice */}
        <div className="glass-card p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Your Privacy is Protected</p>
              <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                All personal data is encrypted end-to-end. Only your verification status is stored on-chain as a non-transferable NFT. 
                Your documents are processed securely and never shared.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
