
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Vote, 
  Users, 
  TrendingUp, 
  Clock, 
  Shield, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardData } from '@/hooks/useDashboard';

interface DashboardOverviewProps {
  dashboardData: DashboardData;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ dashboardData }) => {
  const { stats, urgentActions, isVerified, participationRate, voteAccuracy, aiAutomation } = dashboardData;

  return (
    <div className="space-y-8">
      {/* Welcome & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Welcome back!</h2>
          <p className="text-muted-foreground">Your governance overview at a glance</p>
        </div>
        <div className="flex items-center space-x-3">
          {isVerified ? (
            <Badge className="status-verified">
              <Shield className="mr-1 h-3 w-3" />
              Verified Identity
            </Badge>
          ) : (
            <Link to="/verification">
              <Badge variant="outline" className="status-pending hover:bg-orange-50 cursor-pointer">
                <AlertCircle className="mr-1 h-3 w-3" />
                Complete Verification
              </Badge>
            </Link>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Vote className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalVotes}</div>
                <div className="text-sm text-muted-foreground">Total Votes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.activeProposals}</div>
                <div className="text-sm text-muted-foreground">Active Proposals</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.joinedDAOs}</div>
                <div className="text-sm text-muted-foreground">Joined DAOs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.governanceScore}%</div>
                <div className="text-sm text-muted-foreground">Gov Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Urgent Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Action Required
              <Link to="/proposals">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>Proposals requiring your immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {urgentActions.length > 0 ? (
                urgentActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm text-muted-foreground">{action.dao}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={action.urgency === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {action.deadline}
                      </Badge>
                      <Link to={action.link}>
                        <Button size="sm">
                          Vote
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No urgent actions at the moment</p>
                  <p className="text-sm">Check back later for new proposals</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/proposals/create" className="block">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <Plus className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Create Proposal</div>
                  <div className="text-sm text-muted-foreground">Submit a new governance proposal</div>
                </div>
              </Button>
            </Link>
            
            <Link to="/daos" className="block">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <Users className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Browse DAOs</div>
                  <div className="text-sm text-muted-foreground">Discover and join new communities</div>
                </div>
              </Button>
            </Link>

            <Link to="/ai-assistance" className="block">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <TrendingUp className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Setup AI Assistant</div>
                  <div className="text-sm text-muted-foreground">Configure automated voting preferences</div>
                </div>
              </Button>
            </Link>

            {!isVerified && (
              <Link to="/verification" className="block">
                <Button className="w-full justify-start h-auto p-4">
                  <Shield className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Verify Identity</div>
                    <div className="text-sm opacity-90">Get verified to increase voting power</div>
                  </div>
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Participation Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Your Participation
            <Link to="/analytics">
              <Button variant="ghost" size="sm">
                Detailed Analytics <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardTitle>
          <CardDescription>Track your governance engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Participation Rate</span>
                <span>{participationRate}%</span>
              </div>
              <Progress value={participationRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Vote Accuracy</span>
                <span>{voteAccuracy}%</span>
              </div>
              <Progress value={voteAccuracy} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>AI Automation</span>
                <span>{aiAutomation}%</span>
              </div>
              <Progress value={aiAutomation} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
