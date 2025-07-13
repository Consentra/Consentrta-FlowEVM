
import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/AppSidebar';

import { useTheme } from '@/components/ThemeProvider';

import { useAuth } from '@/hooks/useAuth';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { WalletAuth } from '@/components/WalletAuth';
import { Moon, Sun, Monitor, LogOut, Network } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Outlet, Navigate } from 'react-router-dom';

export const AppLayout: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  const { user, signOut, loading } = useAuth();
  const { isVerified } = useIdentityVerification();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'light':
        return <Sun className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const handleLogout = async () => {
    await signOut();
  };

  const getNetworkStatus = () => {
    if (!user?.address) return 'Not Connected';
    return 'Hyperion Testnet';
  };

  const getNetworkColor = () => {
    if (!user?.address) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="glass border-b sticky top-0 z-40 px-4 sm:px-6">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <SidebarTrigger className="sm:hidden" />
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="flex items-center space-x-3">
                    <img 
                      src="consentra-uploads
/cfc8144b-4936-4355-a021-7bc842b5ec32.png" 
                      alt="Consentra" 
                      className="w-8 h-8 animate-bloom"
                    />
                    <span className="font-display font-bold text-xl bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
                      Consentra
                    </span>
                    <Badge variant="outline" className="text-xs px-2 py-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
                      <Network className="w-3 h-3 mr-1" />
                      Multichain
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${getNetworkColor()}`}></div>
                    <span className="text-sm text-muted-foreground">
                      {getNetworkStatus()}
                    </span>
                  </div>
                  {user && !isVerified && (
                    <Badge variant="outline" className="status-pending text-xs">
                      Identity Verification Required
                    </Badge>
                  )}
                  {user && isVerified && (
                    <Badge className="status-verified text-xs">
                      Verified Identity
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cycleTheme}
                  className="hidden sm:inline-flex"
                  title={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
                >
                  {getThemeIcon()}
                </Button>
                
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                        <span className="hidden sm:inline-block">
                          {user.shortAddress}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        className="flex items-center text-red-600 dark:text-red-400 cursor-pointer"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </header>


          {/* Main Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-auto custom-scrollbar animate-fade-in">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
