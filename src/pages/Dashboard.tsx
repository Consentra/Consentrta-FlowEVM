
import React from 'react';
import { DashboardOverview } from '@/components/DashboardOverview';
import { DaisyStatus } from '@/components/DaisyStatus';
import { useDashboard } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { dashboardData, loading } = useDashboard();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-4">
          <div className="md:col-span-3">
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Unable to load dashboard data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary via-logo-blue to-logo-blue-dark bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Your governance activity overview
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-3">
          <DashboardOverview dashboardData={dashboardData} />
        </div>
        <div className="space-y-6">
          <DaisyStatus />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
