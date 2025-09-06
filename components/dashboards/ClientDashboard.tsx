
import React from 'react';
import { useUser } from '@clerk/clerk-react';
import Card from '../ui/Card';

const ClientDashboard: React.FC = () => {
  const { user } = useUser();
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Welcome, {user?.firstName || 'Client'}!
      </h1>
      <Card>
        <h2 className="text-xl font-semibold mb-4">Your Dashboard</h2>
        <p className="text-muted-foreground">
          Here you can view your appointment history, vehicle details, and communicate with your detailer.
        </p>
        <p className="mt-4 text-sm text-accent-foreground">
          (Features coming soon)
        </p>
      </Card>
    </div>
  );
};

export default ClientDashboard;
