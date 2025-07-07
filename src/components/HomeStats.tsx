
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Vote, Building, TrendingUp, Network } from 'lucide-react';
import { useHomeData } from '@/hooks/useHomeData';

export const HomeStats: React.FC = () => {
  const { stats, loading } = useHomeData();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-20" />
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      icon: Network,
      value: stats.supportedNetworks,
      label: 'Networks',
      color: 'text-purple-600'
    },
    {
      icon: Building,
      value: stats.totalDAOs,
      label: 'Active DAOs',
      color: 'text-blue-600'
    },
    {
      icon: Vote,
      value: stats.totalProposals,
      label: 'Proposals',
      color: 'text-green-600'
    },
    {
      icon: TrendingUp,
      value: stats.totalVotes,
      label: 'Total Votes',
      color: 'text-orange-600'
    },
    {
      icon: Users,
      value: stats.activeUsers,
      label: 'Members',
      color: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <Icon className={`h-8 w-8 mx-auto mb-2 ${item.color}`} />
              <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{item.label}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
