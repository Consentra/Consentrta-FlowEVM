
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DashboardStats {
  totalVotes: number;
  activeProposals: number;
  joinedDAOs: number;
  governanceScore: number;
}

export interface UrgentAction {
  id: string;
  title: string;
  dao: string;
  deadline: string;
  urgency: 'high' | 'medium' | 'low';
  link: string;
}

export interface DashboardData {
  stats: DashboardStats;
  urgentActions: UrgentAction[];
  isVerified: boolean;
  participationRate: number;
  voteAccuracy: number;
  aiAutomation: number;
}

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch user profile and verification status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_verified, verification_status')
        .eq('id', user.address)
        .maybeSingle();

      const isVerified = profile?.is_verified || false;

      // Fetch user's total votes
      const { count: totalVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.address);

      // Fetch user's DAO memberships
      const { count: joinedDAOs } = await supabase
        .from('dao_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.address);

      // Fetch active proposals for DAOs user is member of
      const { data: userDAOs } = await supabase
        .from('dao_memberships')
        .select('dao_id')
        .eq('user_id', user.address);

      const daoIds = userDAOs?.map(membership => membership.dao_id) || [];

      let activeProposals = 0;
      if (daoIds.length > 0) {
        const { count } = await supabase
          .from('proposals')
          .select('*', { count: 'exact', head: true })
          .in('dao_id', daoIds)
          .eq('status', 'active');
        activeProposals = count || 0;
      }

      // Fetch urgent proposals requiring action
      const urgentActions: UrgentAction[] = [];
      if (daoIds.length > 0) {
        const { data: urgentProposals } = await supabase
          .from('proposals')
          .select(`
            id,
            title,
            deadline,
            dao_id,
            daos!inner(name)
          `)
          .in('dao_id', daoIds)
          .eq('status', 'active')
          .not('deadline', 'is', null)
          .order('deadline', { ascending: true })
          .limit(3);

        urgentProposals?.forEach((proposal, index) => {
          const deadline = new Date(proposal.deadline);
          const now = new Date();
          const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysLeft > 0) {
            urgentActions.push({
              id: proposal.id,
              title: proposal.title,
              dao: (proposal.daos as any)?.name || 'Unknown DAO',
              deadline: `${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
              urgency: daysLeft <= 2 ? 'high' : daysLeft <= 5 ? 'medium' : 'low',
              link: '/proposals'
            });
          }
        });
      }

      // Calculate governance score based on participation
      const governanceScore = Math.min(100, Math.round(
        ((totalVotes || 0) * 20) + 
        ((joinedDAOs || 0) * 15) + 
        (isVerified ? 30 : 0) + 
        (activeProposals > 0 ? 15 : 0)
      ));

      // Calculate participation metrics
      let participationRate = 75; // Default
      let voteAccuracy = 85; // Default
      let aiAutomation = 0; // Default

      // Fetch AI automation settings
      const { data: aiConfig } = await supabase
        .from('ai_agent_configs')
        .select('auto_voting_enabled, daisy_enabled')
        .eq('user_id', user.address)
        .maybeSingle();

      if (aiConfig) {
        aiAutomation = (aiConfig.auto_voting_enabled ? 50 : 0) + (aiConfig.daisy_enabled ? 50 : 0);
      }

      // Calculate more accurate participation rate
      if (activeProposals > 0) {
        participationRate = Math.round(((totalVotes || 0) / Math.max(activeProposals, 1)) * 100);
      }

      setDashboardData({
        stats: {
          totalVotes: totalVotes || 0,
          activeProposals,
          joinedDAOs: joinedDAOs || 0,
          governanceScore
        },
        urgentActions,
        isVerified,
        participationRate: Math.min(100, participationRate),
        voteAccuracy,
        aiAutomation
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  return {
    dashboardData,
    loading,
    refetch: fetchDashboardData
  };
};
