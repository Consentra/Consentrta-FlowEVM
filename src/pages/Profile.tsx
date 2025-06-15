
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, Shield, Edit2, Save, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserProfile {
  id: string;
  wallet_address: string;
  display_name: string;
  email: string;
  bio: string;
  is_verified: boolean;
  identity_nft_id: number | null;
  verification_status: string | null;
  soulbound_nft_token_id: number | null;
}

const Profile = () => {
  const { user } = useAuth();
  const { verificationRecord, isVerified } = useIdentityVerification();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.address)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          display_name: data.display_name || '',
          email: data.email || '',
          bio: data.bio || ''
        });
      } else {
        // Create a basic profile if it doesn't exist
        const newProfile = {
          id: user.address,
          wallet_address: user.address,
          display_name: user.shortAddress,
          email: '',
          bio: '',
          is_verified: false,
          identity_nft_id: null,
          verification_status: 'pending',
          soulbound_nft_token_id: null
        };
        setProfile(newProfile);
        setFormData({
          display_name: newProfile.display_name,
          email: newProfile.email,
          bio: newProfile.bio
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.address,
          wallet_address: user.address,
          ...formData
        });

      if (error) throw error;

      setProfile({ ...profile, ...formData });
      setIsEditing(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        email: profile.email || '',
        bio: profile.bio || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please connect your wallet to view your profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/70">
                {profile.display_name?.charAt(0) || user.shortAddress.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">
              {profile.display_name || user.shortAddress}
            </CardTitle>
            <CardDescription className="flex items-center justify-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span className="font-mono">{user.shortAddress}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              {isVerified ? (
                <Badge className="status-verified">
                  <Shield className="mr-1 h-3 w-3" />
                  Verified Identity
                </Badge>
              ) : (
                <div className="space-y-2 text-center">
                  <Badge variant="outline" className="status-pending">
                    Identity Verification Required
                  </Badge>
                  <Link to="/verification">
                    <Button size="sm" className="btn-gradient">
                      <Shield className="mr-2 h-3 w-3" />
                      Start Verification
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Wallet:</strong> {user.address}</p>
              {profile.soulbound_nft_token_id && (
                <p><strong>Soulbound NFT:</strong> #{profile.soulbound_nft_token_id}</p>
              )}
              {verificationRecord?.nft_transaction_hash && (
                <div className="flex items-center space-x-1">
                  <strong>Transaction:</strong>
                  <a 
                    href={`https://evm-testnet.flowscan.io/tx/${verificationRecord.nft_transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center"
                  >
                    View <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Manage your profile details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                {isEditing ? (
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Enter your display name"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profile.display_name || 'No display name set'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profile.email || 'No email set'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profile.bio || 'No bio set'}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex space-x-3 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
