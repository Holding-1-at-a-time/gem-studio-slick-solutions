
import React from 'react';
import { useUser, useOrganization } from '@clerk/clerk-react';
import AdminDashboard from './dashboards/AdminDashboard';
import DetailerDashboard from './dashboards/DetailerDashboard';
import ClientDashboard from './dashboards/ClientDashboard';
import NoOrganizationDashboard from './dashboards/NoOrganizationDashboard';
import Spinner from './ui/Spinner';
import DashboardLayout from './layout/DashboardLayout';
import Header from './Header';

const DashboardController: React.FC = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { organization, membership, isLoaded: isOrgLoaded } = useOrganization();

  const isLoading = !isUserLoaded || !isOrgLoaded;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Check for the global Admin role from Clerk's public metadata
  if (user?.publicMetadata?.role === 'admin') {
    return <DashboardLayout><AdminDashboard /></DashboardLayout>;
  }

  // If user is not part of an organization, show a simple page.
  if (!organization) {
    return (
        <>
            <Header />
            <main className="container mx-auto p-4 md:p-8">
                <NoOrganizationDashboard />
            </main>
        </>
    );
  }
  
  const role = membership?.role;

  switch (role) {
    case 'org:detailer':
      return <DashboardLayout><DetailerDashboard /></DashboardLayout>;
    case 'org:client':
      return <DashboardLayout><ClientDashboard /></DashboardLayout>;
    default:
      return (
        <DashboardLayout>
            <div className="text-center">
                <h2 className="text-2xl font-bold">Unknown Role</h2>
                <p className="text-muted-foreground">Your role in this organization is not recognized.</p>
            </div>
        </DashboardLayout>
      )
  }
};

export default DashboardController;
