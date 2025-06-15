
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    proposals: boolean;
    voting: boolean;
    results: boolean;
  };
  privacy: {
    publicProfile: boolean;
    showVotingHistory: boolean;
    analyticsOptIn: boolean;
  };
  ai: {
    enableDaisy: boolean;
    autoVoting: boolean;
    analysisLevel: 'basic' | 'detailed' | 'comprehensive';
  };
}

export interface UserProfile {
  displayName: string;
  email: string;
  bio: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    push: false,
    proposals: true,
    voting: true,
    results: false
  },
  privacy: {
    publicProfile: true,
    showVotingHistory: false,
    analyticsOptIn: true
  },
  ai: {
    enableDaisy: true,
    autoVoting: false,
    analysisLevel: 'detailed'
  }
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<UserProfile>({
    displayName: '',
    email: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettings = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, email, bio')
        .eq('id', user.address)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile({
          displayName: profileData.display_name || '',
          email: profileData.email || '',
          bio: profileData.bio || ''
        });
      }

      // Fetch notification settings
      const { data: notificationData, error: notificationError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.address)
        .maybeSingle();

      if (notificationError) throw notificationError;

      // Fetch AI agent config
      const { data: aiData, error: aiError } = await supabase
        .from('ai_agent_configs')
        .select('*')
        .eq('user_id', user.address)
        .maybeSingle();

      if (aiError) throw aiError;

      // Update settings with fetched data
      setSettings(prev => ({
        notifications: {
          email: notificationData?.email ?? prev.notifications.email,
          push: false, // Not stored in DB yet
          proposals: notificationData?.proposal_alerts ?? prev.notifications.proposals,
          voting: notificationData?.voting_reminders ?? prev.notifications.voting,
          results: notificationData?.ai_summaries ?? prev.notifications.results
        },
        privacy: {
          publicProfile: true, // Not stored in DB yet
          showVotingHistory: false, // Not stored in DB yet
          analyticsOptIn: true // Not stored in DB yet
        },
        ai: {
          enableDaisy: aiData?.daisy_enabled ?? prev.ai.enableDaisy,
          autoVoting: aiData?.auto_voting_enabled ?? prev.ai.autoVoting,
          analysisLevel: (aiData?.daisy_automation_level as 'basic' | 'detailed' | 'comprehensive') ?? prev.ai.analysisLevel
        }
      }));

    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: profile.displayName,
          email: profile.email,
          bio: profile.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.address);

      if (profileError) throw profileError;

      // Update notification settings
      const { error: notificationError } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.address,
          email: settings.notifications.email,
          proposal_alerts: settings.notifications.proposals,
          voting_reminders: settings.notifications.voting,
          ai_summaries: settings.notifications.results,
          updated_at: new Date().toISOString()
        });

      if (notificationError) throw notificationError;

      // Update AI agent config
      const { error: aiError } = await supabase
        .from('ai_agent_configs')
        .upsert({
          user_id: user.address,
          daisy_enabled: settings.ai.enableDaisy,
          auto_voting_enabled: settings.ai.autoVoting,
          daisy_automation_level: settings.ai.analysisLevel,
          updated_at: new Date().toISOString()
        });

      if (aiError) throw aiError;

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });

    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: "Could not save your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (category: keyof UserSettings, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const updateProfile = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    settings,
    profile,
    loading,
    saving,
    updateSettings,
    updateProfile,
    saveSettings
  };
};
