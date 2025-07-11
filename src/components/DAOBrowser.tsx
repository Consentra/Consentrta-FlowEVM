import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Users, Calendar, ExternalLink, Plus, Coins, AlertCircle, Loader2 } from 'lucide-react';
import { useDAOs } from '@/hooks/useDAOs';
import { useAuth } from '@/hooks/useAuth';

export const DAOBrowser: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { daos, userDAOs, joinDAO, leaveDAO, isUserMember, loading, error } = useDAOs();
  const { user, isConnected } = useAuth();

  const filteredDAOs = daos.filter(dao => 
    dao.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dao.description && dao.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const availableDAOs = filteredDAOs.filter(dao => !isUserMember(dao.id));

  const handleJoinDAO = async (daoId: string, daoName: string) => {
    if (!user || !isConnected) {
      return;
    }
    await joinDAO(daoId);
  };

  const handleLeaveDAO = async (daoId: string, daoName: string) => {
    if (!user || !isConnected) {
      return;
    }
    await leaveDAO(daoId);
  };

  const DAOCard = ({ dao }: { dao: any }) => {
    const isJoined = isUserMember(dao.id);
    
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  DAO
                </Badge>
                {isJoined && (
                  <Badge className="text-xs bg-green-100 text-green-700">
                    Joined
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg mb-1">{dao.name}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {dao.description || 'No description available'}
              </CardDescription>
              {dao.token_address && (
                <div className="flex items-center space-x-1 mt-2 text-xs text-muted-foreground">
                  <Coins className="h-3 w-3" />
                  <span className="font-mono">{dao.token_address.slice(0, 10)}...{dao.token_address.slice(-6)}</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{dao.member_count || 0}</div>
              <div className="text-xs text-gray-500">Members</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-600">{dao.proposal_count || 0}</div>
              <div className="text-xs text-gray-500">Proposals</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{dao.treasury_value || '0'}</div>
              <div className="text-xs text-gray-500">Treasury</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Created {new Date(dao.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {!user || !isConnected ? (
            <Button variant="outline" className="w-full" size="sm" disabled>
              Connect Wallet to Join
            </Button>
          ) : isJoined ? (
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1" size="sm">
                <Users className="mr-1 h-3 w-3" />
                View DAO
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleLeaveDAO(dao.id, dao.name)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Leave
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => handleJoinDAO(dao.id, dao.name)}
              className="w-full"
              size="sm"
            >
              <Plus className="mr-1 h-3 w-3" />
              Join DAO
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading DAOs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">DAO Browser</h2>
          <p className="text-gray-600">Discover and join decentralized organizations</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}. Please refresh the page to try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search DAOs by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All DAOs ({filteredDAOs.length})
          </TabsTrigger>
          <TabsTrigger value="joined">
            My DAOs ({userDAOs.length})
          </TabsTrigger>
          <TabsTrigger value="discover">
            Discover ({availableDAOs.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {filteredDAOs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No DAOs found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDAOs.map(dao => (
                <DAOCard key={dao.id} dao={dao} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="joined" className="space-y-4">
          {userDAOs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {!user || !isConnected 
                  ? "Connect your wallet to see your DAOs"
                  : "You haven't joined any DAOs yet. Explore the Discover tab to find DAOs to join."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userDAOs.map(dao => (
                <DAOCard key={dao.id} dao={dao} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="discover" className="space-y-4">
          {availableDAOs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {!user || !isConnected 
                  ? "Connect your wallet to discover DAOs to join"
                  : "No new DAOs available to join."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableDAOs.map(dao => (
                <DAOCard key={dao.id} dao={dao} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
