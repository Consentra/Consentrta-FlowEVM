
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Vote, 
  Target,
  Activity,
  Percent,
  RefreshCw
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';

export const Analytics: React.FC = () => {
  const { analyticsData, loading, refetch } = useAnalytics();

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Failed to load analytics data
          </p>
        </div>
        <Button onClick={refetch} className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Votes Cast',
      value: analyticsData.totalVotes.toLocaleString(),
      change: '+15.3%',
      icon: Vote,
      trend: 'up'
    },
    {
      title: 'Active DAOs',
      value: analyticsData.activeDAOs.toString(),
      change: '+3',
      icon: Users,
      trend: 'up'
    },
    {
      title: 'Proposals This Month',
      value: analyticsData.proposalsThisMonth.toString(),
      change: '+22.1%',
      icon: Target,
      trend: 'up'
    },
    {
      title: 'Average Participation',
      value: `${analyticsData.averageParticipation}%`,
      change: '+5.2%',
      icon: Percent,
      trend: 'up'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Governance insights and voting analytics
            </p>
          </div>
          <Button 
            onClick={refetch} 
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="glass-card hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">{stat.change}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="voting">Voting Trends</TabsTrigger>
          <TabsTrigger value="participation">Participation</TabsTrigger>
          <TabsTrigger value="daos">DAO Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span>Voting Activity</span>
                </CardTitle>
                <CardDescription>Monthly voting trends across all DAOs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.votingTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="votes" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span>Proposal Creation</span>
                </CardTitle>
                <CardDescription>Proposals created over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.votingTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="proposals" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voting" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Voting Volume Trends</CardTitle>
              <CardDescription>Total votes cast across all proposals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.votingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="votes" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Voter Participation</CardTitle>
                <CardDescription>Active vs inactive voters</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.participationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analyticsData.participationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-4">
                  {analyticsData.participationData.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {entry.name}: {entry.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Participation Insights</CardTitle>
                <CardDescription>Key engagement metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Total votes cast</span>
                  <span className="text-primary font-bold">{analyticsData.totalVotes.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Active DAOs</span>
                  <span className="text-primary font-bold">{analyticsData.activeDAOs}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">This month proposals</span>
                  <span className="text-primary font-bold">{analyticsData.proposalsThisMonth}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Participation rate</span>
                  <span className="text-primary font-bold">{analyticsData.averageParticipation}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="daos" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>DAO Performance Metrics</CardTitle>
              <CardDescription>Compare performance across different DAOs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.daoPerformance.length > 0 ? (
                  analyticsData.daoPerformance.map((dao, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{dao.name}</h3>
                        <Badge variant="outline">{dao.passRate}% pass rate</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Members</span>
                          <p className="font-bold text-lg">{dao.members.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Proposals</span>
                          <p className="font-bold text-lg">{dao.proposals}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success Rate</span>
                          <p className="font-bold text-lg">{dao.passRate}%</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No DAOs found. Create some DAOs to see performance metrics.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
