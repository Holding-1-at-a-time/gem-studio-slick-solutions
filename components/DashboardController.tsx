import React from 'react';
import { useUser, useOrganization } from '@clerk/clerk-react';
import AdminDashboard from './dashboards/AdminDashboard';
import DetailerDashboard from './dashboards/DetailerDashboard';
import ClientDashboard from './dashboards/ClientDashboard';
import NoOrganizationDashboard from './dashboards/NoOrganizationDashboard';
import Spinner from './ui/Spinner';

const DashboardController: React.FC = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  // Fix: Destructure `membership` directly from the `useOrganization` hook to get the current user's role.
  const { organization, membership, isLoaded: isOrgLoaded } = useOrganization();

  const isLoading = !isUserLoaded || !isOrgLoaded;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  // Check for the global Admin role from Clerk's public metadata
  if (user?.publicMetadata?.role === 'admin') {
    return <AdminDashboard />;
  }

  // If user is not part of an organization
  if (!organization) {
    return <NoOrganizationDashboard />;
  }
  
  // Get the user's role within the current active organization
  // Fix: The `organization` object from `useOrganization` does not have a `membership` property.
  // The `membership` object should be destructured from the hook directly.
  const role = membership?.role;

  switch (role) {
    case 'org:detailer':
      return <DetailerDashboard />;
    case 'org:client':
      return <ClientDashboard />;
    default:
      return (
        <div className="text-center">
            <h2 className="text-2xl font-bold">Unknown Role</h2>
            <p className="text-muted-foreground">Your role in this organization is not recognized.</p>
        </div>
      )
  }
};

export default DashboardController;
