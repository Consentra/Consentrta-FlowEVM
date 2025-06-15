import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, Plus, Trash2, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VotingPreference, AIVotingConfig } from '@/types/proposals';

export const VotingPreferences: React.FC = () => {
  const [autoVotingEnabled, setAutoVotingEnabled] = useState(false);
  const [daisyAutomation, setDaisyAutomation] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [confidenceThreshold, setConfidenceThreshold] = useState([75]);
  const [votingDelay, setVotingDelay] = useState([30]); // minutes
  const [preferences, setPreferences] = useState<VotingPreference[]>([
    { id: '1', category: 'Treasury Allocation', stance: 'abstain', weight: 80 },
    { id: '2', category: 'Parameter Changes', stance: 'for', weight: 70 },
    { id: '3', category: 'Community Initiatives', stance: 'for', weight: 90 },
    { id: '4', category: 'Security Updates', stance: 'for', weight: 95 },
  ]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { toast } = useToast();

  // Load saved preferences on component mount
  useEffect(() => {
    const loadSavedPreferences = () => {
      try {
        const saved = localStorage.getItem('votingPreferences');
        if (saved) {
          const config: AIVotingConfig = JSON.parse(saved);
          setAutoVotingEnabled(config.autoVotingEnabled);
          setDaisyAutomation(config.daisyAutomation);
          setConfidenceThreshold([config.confidenceThreshold]);
          setVotingDelay([config.votingDelay]);
          setPreferences(config.preferences);
          
          // Set last saved time from localStorage
          const savedTime = localStorage.getItem('votingPreferences_lastSaved');
          if (savedTime) {
            setLastSaved(new Date(savedTime));
          }
        }
      } catch (error) {
        console.error('Failed to load voting preferences:', error);
        toast({
          title: "Load Error",
          description: "Failed to load saved preferences. Using defaults.",
          variant: "destructive",
        });
      }
    };

    loadSavedPreferences();
  }, [toast]);

  const handlePreferenceChange = (index: number, field: keyof VotingPreference, value: any) => {
    setPreferences(prev => prev.map((pref, i) => 
      i === index ? { ...pref, [field]: value } : pref
    ));
  };

  const addPreference = () => {
    const newPreference: VotingPreference = {
      id: `pref_${Date.now()}`,
      category: '',
      stance: 'abstain',
      weight: 50
    };
    setPreferences(prev => [...prev, newPreference]);
  };

  const removePreference = (index: number) => {
    if (preferences.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "You must have at least one voting preference.",
        variant: "destructive",
      });
      return;
    }
    setPreferences(prev => prev.filter((_, i) => i !== index));
  };

  const validatePreferences = (): boolean => {
    // Check for empty categories
    const emptyCategories = preferences.filter(p => !p.category.trim());
    if (emptyCategories.length > 0) {
      toast({
        title: "Validation Error",
        description: "All preference categories must have a name.",
        variant: "destructive",
      });
      return false;
    }

    // Check for duplicate categories
    const categories = preferences.map(p => p.category.toLowerCase().trim());
    const duplicates = categories.filter((cat, index) => categories.indexOf(cat) !== index);
    if (duplicates.length > 0) {
      toast({
        title: "Validation Error",
        description: "Duplicate categories are not allowed.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const savePreferences = () => {
    if (!validatePreferences()) {
      return;
    }

    try {
      const config: AIVotingConfig = {
        autoVotingEnabled,
        daisyAutomation,
        confidenceThreshold: confidenceThreshold[0],
        votingDelay: votingDelay[0],
        preferences: preferences.filter(p => p.category.trim()) // Remove empty categories
      };

      localStorage.setItem('votingPreferences', JSON.stringify(config));
      const saveTime = new Date();
      localStorage.setItem('votingPreferences_lastSaved', saveTime.toISOString());
      setLastSaved(saveTime);

      toast({
        title: "Preferences Saved",
        description: "Your AI voting preferences have been configured successfully. Daisy will use these settings for automated voting.",
      });

      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('voting-preferences-updated', { detail: config }));
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: "Save Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAutomationDescription = (level: string) => {
    switch (level) {
      case 'conservative':
        return 'Only votes on proposals with high confidence (>85%). Minimal risk approach.';
      case 'aggressive':
        return 'Votes more frequently with lower confidence thresholds. Higher activity.';
      default:
        return 'Balanced approach between safety and activity. Recommended for most users.';
    }
  };

  const isConfigurationValid = () => {
    return preferences.length > 0 && preferences.every(p => p.category.trim());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            Daisy AI Configuration
          </CardTitle>
          <CardDescription>
            Configure Daisy to vote automatically based on your preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Automated Voting</p>
              <p className="text-sm text-gray-500">Allow Daisy to cast votes automatically on your behalf</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={autoVotingEnabled}
                onCheckedChange={setAutoVotingEnabled}
              />
              {autoVotingEnabled && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
          </div>

          {autoVotingEnabled && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Automation Level</Label>
                  <div className="flex space-x-2">
                    {(['conservative', 'balanced', 'aggressive'] as const).map(level => (
                      <Button
                        key={level}
                        variant={daisyAutomation === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDaisyAutomation(level)}
                        className="capitalize"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    {getAutomationDescription(daisyAutomation)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Confidence Threshold: {confidenceThreshold[0]}%</Label>
                  <Slider
                    value={confidenceThreshold}
                    onValueChange={setConfidenceThreshold}
                    max={95}
                    min={50}
                    step={5}
                  />
                  <p className="text-xs text-gray-500">
                    Minimum AI confidence required before casting a vote
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Voting Delay: {votingDelay[0]} minutes</Label>
                  <Slider
                    value={votingDelay}
                    onValueChange={setVotingDelay}
                    max={120}
                    min={5}
                    step={5}
                  />
                  <p className="text-xs text-gray-500">
                    How long to wait before automatically voting after analysis
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Voting Preferences by Category</CardTitle>
          <CardDescription>
            Define how Daisy should vote on different types of proposals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences.map((pref, index) => (
            <div key={pref.id || index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Input
                  value={pref.category}
                  onChange={(e) => handlePreferenceChange(index, 'category', e.target.value)}
                  placeholder="e.g., Treasury Management, Security Updates"
                  className="font-medium"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePreference(index)}
                  className="text-red-500 hover:text-red-700"
                  disabled={preferences.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="space-y-1">
                  <Label className="text-xs">Default Stance</Label>
                  <div className="flex space-x-1">
                    {(['for', 'against', 'abstain'] as const).map(stance => (
                      <Button
                        key={stance}
                        variant={pref.stance === stance ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePreferenceChange(index, 'stance', stance)}
                        className="capitalize text-xs"
                      >
                        {stance}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Confidence Weight: {pref.weight}%</Label>
                  <Slider
                    value={[pref.weight]}
                    onValueChange={([value]) => handlePreferenceChange(index, 'weight', value)}
                    max={100}
                    min={0}
                    step={5}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button variant="outline" onClick={addPreference} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Category Preference
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {lastSaved && (
            <span>Last saved: {lastSaved.toLocaleString()}</span>
          )}
        </div>
        <Button 
          onClick={savePreferences} 
          disabled={!isConfigurationValid()}
          className="flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Save Configuration</span>
        </Button>
      </div>

      {!isConfigurationValid() && (
        <div className="flex items-center space-x-2 text-amber-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Please ensure all categories have names before saving.</span>
        </div>
      )}
    </div>
  );
};
