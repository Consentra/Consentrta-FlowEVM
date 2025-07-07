
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
import { Bot, Plus, Trash2, Settings, CheckCircle, AlertCircle, Target, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VotingPreference, AIVotingConfig } from '@/types/proposals';

export const VotingPreferences: React.FC = () => {
  const [autoVotingEnabled, setAutoVotingEnabled] = useState(false);
  const [daisyAutomation, setDaisyAutomation] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [confidenceThreshold, setConfidenceThreshold] = useState([75]);
  const [votingDelay, setVotingDelay] = useState([30]); // minutes
  const [preferences, setPreferences] = useState<VotingPreference[]>([
    { id: '1', category: 'Treasury Management', stance: 'abstain', weight: 80 },
    { id: '2', category: 'Protocol Upgrades', stance: 'for', weight: 70 },
    { id: '3', category: 'Community Proposals', stance: 'for', weight: 90 },
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
          setConfidenceThreshold([config.minConfidenceThreshold]);
          setVotingDelay([config.votingDelay]);
          setPreferences(config.preferences);
          
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
    const emptyCategories = preferences.filter(p => !p.category.trim());
    if (emptyCategories.length > 0) {
      toast({
        title: "Validation Error",
        description: "All preference categories must have a name.",
        variant: "destructive",
      });
      return false;
    }

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
        minConfidenceThreshold: confidenceThreshold[0],
        votingDelay: votingDelay[0],
        preferences: preferences.filter(p => p.category.trim())
      };

      localStorage.setItem('votingPreferences', JSON.stringify(config));
      const saveTime = new Date();
      localStorage.setItem('votingPreferences_lastSaved', saveTime.toISOString());
      setLastSaved(saveTime);

      toast({
        title: "Daisy Configuration Saved",
        description: autoVotingEnabled 
          ? "Daisy will now automatically vote based on your preferences and history."
          : "Configuration saved. Enable automated voting to activate Daisy.",
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
        return 'High confidence threshold (85%+). Minimal risk, fewer automated votes.';
      case 'aggressive':
        return 'Lower confidence threshold (60%+). More active voting, higher risk.';
      default:
        return 'Balanced approach (75%+ confidence). Recommended for most users.';
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
            <Bot className="mr-2 h-5 w-5" />
            Daisy Automated Voting
          </CardTitle>
          <CardDescription>
            Configure Daisy to automatically vote based on your preferences and voting history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Enable Daisy Automation</p>
              <p className="text-sm text-muted-foreground">
                Allow Daisy to cast votes automatically on your behalf
              </p>
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
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Automation Level
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
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
                  <p className="text-xs text-muted-foreground">
                    {getAutomationDescription(daisyAutomation)}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Confidence Threshold: {confidenceThreshold[0]}%</Label>
                    <Slider
                      value={confidenceThreshold}
                      onValueChange={setConfidenceThreshold}
                      max={95}
                      min={50}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum confidence required before Daisy votes automatically
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
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Delay before Daisy executes the vote
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-4 w-4" />
            Voting Preferences by Category
          </CardTitle>
          <CardDescription>
            Define how Daisy should vote on different types of proposals. If no preference is set for a category, Daisy will use your voting history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences.map((pref, index) => (
            <div key={pref.id || index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Input
                  value={pref.category}
                  onChange={(e) => handlePreferenceChange(index, 'category', e.target.value)}
                  placeholder="e.g., Treasury Management, Protocol Upgrades"
                  className="font-medium flex-1 mr-2"
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
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Default Vote</Label>
                  <div className="flex space-x-1">
                    {(['for', 'against', 'abstain'] as const).map(stance => (
                      <Button
                        key={stance}
                        variant={pref.stance === stance ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePreferenceChange(index, 'stance', stance)}
                        className="capitalize text-xs flex-1"
                      >
                        {stance}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Preference Strength: {pref.weight}%</Label>
                  <Slider
                    value={[pref.weight]}
                    onValueChange={([value]) => handlePreferenceChange(index, 'weight', value)}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values override AI recommendations more often
                  </p>
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

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <History className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium">Voting History Fallback</h4>
              <p className="text-sm text-muted-foreground mt-1">
                When no preference is set for a proposal category, Daisy will analyze your past voting patterns 
                for similar proposals and vote accordingly. If you have insufficient history, Daisy will notify 
                you of the conflict and require manual decision.
              </p>
            </div>
          </div>
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
          <Bot className="h-4 w-4" />
          <span>Save Daisy Configuration</span>
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
