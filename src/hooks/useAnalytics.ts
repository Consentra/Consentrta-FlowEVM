
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AnalyticsData {
  totalVotes: number;
  activeDAOs: number;
  proposalsThisMonth: number;
  averageParticipation: number;
  votingTrends: Array<{
    month: string;
    votes: number;
    proposals: number;
  }>;
  participationData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  daoPerformance: Array<{
    name: string;
    members: number;
    proposals: number;
    passRate: number;
  }>;
}

export const useAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch total votes
      const { count: totalVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

      // Fetch active DAOs
      const { count: activeDAOs } = await supabase
        .from('daos')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch proposals this month
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const { count: proposalsThisMonth } = await supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentMonth.toISOString());

      // Fetch voting trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: votingData } = await supabase
        .from('votes')
        .select('timestamp')
        .gte('timestamp', sixMonthsAgo.toISOString());

      const { data: proposalData } = await supabase
        .from('proposals')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      // Process voting trends by month
      const monthlyData = new Map();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = months[date.getMonth()];
        monthlyData.set(monthKey, { votes: 0, proposals: 0 });
      }

      // Count votes by month
      votingData?.forEach(vote => {
        const date = new Date(vote.timestamp);
        const monthKey = months[date.getMonth()];
        if (monthlyData.has(monthKey)) {
          monthlyData.get(monthKey).votes++;
        }
      });

      // Count proposals by month
      proposalData?.forEach(proposal => {
        const date = new Date(proposal.created_at);
        const monthKey = months[date.getMonth()];
        if (monthlyData.has(monthKey)) {
          monthlyData.get(monthKey).proposals++;
        }
      });

      const votingTrends = Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        votes: data.votes,
        proposals: data.proposals
      }));

      // Fetch DAO performance data
      const { data: daos } = await supabase
        .from('daos')
        .select('id, name, member_count, proposal_count')
        .eq('is_active', true)
        .order('member_count', { ascending: false })
        .limit(4);

      const daoPerformance = await Promise.all(
        (daos || []).map(async (dao) => {
          const { data: proposals } = await supabase
            .from('proposals')
            .select('status')
            .eq('dao_id', dao.id);

          const passedProposals = proposals?.filter(p => p.status === 'passed').length || 0;
          const totalProposals = proposals?.length || 1;
          const passRate = Math.round((passedProposals / totalProposals) * 100);

          return {
            name: dao.name,
            members: dao.member_count || 0,
            proposals: dao.proposal_count || 0,
            passRate
          };
        })
      );

      // Calculate participation data
      const { data: allProposals } = await supabase
        .from('proposals')
        .select('id, total_votes');

      const totalPossibleVotes = allProposals?.reduce((sum, p) => sum + (p.total_votes || 0), 0) || 1;
      const actualVotes = totalVotes || 0;
      const participationRate = Math.round((actualVotes / totalPossibleVotes) * 100);

      const participationData = [
        { name: 'Active Voters', value: participationRate, color: '#3B82F6' },
        { name: 'Inactive', value: 100 - participationRate, color: '#E5E7EB' }
      ];

      setAnalyticsData({
        totalVotes: totalVotes || 0,
        activeDAOs: activeDAOs || 0,
        proposalsThisMonth: proposalsThisMonth || 0,
        averageParticipation: participationRate,
        votingTrends,
        participationData,
        daoPerformance
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analyticsData,
    loading,
    refetch: fetchAnalytics
  };
};
