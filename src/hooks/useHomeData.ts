
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HomeStats {
  totalDAOs: number;
  totalProposals: number;
  totalVotes: number;
  activeUsers: number;
}

export const useHomeData = () => {
  const [stats, setStats] = useState<HomeStats>({
    totalDAOs: 0,
    totalProposals: 0,
    totalVotes: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchHomeStats = async () => {
    try {
      setLoading(true);

      // Fetch total DAOs
      const { count: daoCount } = await supabase
        .from('daos')
        .select('*', { count: 'exact', head: true });

      // Fetch total proposals
      const { count: proposalCount } = await supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true });

      // Fetch total votes
      const { count: voteCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

      // Fetch active users (users with recent activity)
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalDAOs: daoCount || 0,
        totalProposals: proposalCount || 0,
        totalVotes: voteCount || 0,
        activeUsers: userCount || 0
      });

    } catch (error) {
      console.error('Error fetching home stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeStats();
  }, []);

  return {
    stats,
    loading,
    refetch: fetchHomeStats
  };
};
