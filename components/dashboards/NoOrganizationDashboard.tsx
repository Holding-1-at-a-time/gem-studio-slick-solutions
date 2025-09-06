
import React from 'react';
import { useUser } from '@clerk/clerk-react';
import Card from '../ui/Card';

const NoOrganizationDashboard: React.FC = () => {
  const { user } = useUser();

  return (
    <div className="text-center mt-16">
        <h1 className="text-3xl font-bold tracking-tight mb-4">
            Hello, {user?.firstName || 'User'}!
        </h1>
        <Card className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-2">You're not part of an organization yet.</h2>
            <p className="text-muted-foreground">
            To get started, please wait for an invitation from your detailing service provider. Once invited, you will be able to access your dashboard.
            </p>
        </Card>
    </div>
  );
};

export default NoOrganizationDashboard;
