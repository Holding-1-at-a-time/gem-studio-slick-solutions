
import React, { useState } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

const TenantsSkeleton = () => (
    <ul className="space-y-3">
        {[...Array(3)].map((_, i) => (
            <li key={i} className="p-3 h-12 bg-secondary rounded-md border border-border flex justify-between items-center animate-pulse">
                <div className="h-5 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
            </li>
        ))}
    </ul>
);

const AdminDashboard: React.FC = () => {
  const [newTenantName, setNewTenantName] = useState('');
  const createTenant = useAction(api.tenants.createTenant);
  const allTenants = useQuery(api.tenants.getAllTenants);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName) return;

    setIsLoading(true);
    setError('');
    try {
      await createTenant({ name: newTenantName });
      setNewTenantName('');
    } catch (err) {
      console.error(err);
      setError('Failed to create tenant. Check the Convex function logs for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Tenant</h2>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <Input
                placeholder="Detailing Business Name"
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !newTenantName}>
                {isLoading ? <Spinner size="sm" /> : 'Create Tenant'}
              </Button>
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
               <p className="text-xs text-muted-foreground mt-2">
                This will create an organization in Clerk and a corresponding tenant record in Convex.
              </p>
            </form>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">All Tenants</h2>
            {allTenants === undefined && <TenantsSkeleton />}
            {allTenants && allTenants.length === 0 && (
              <p className="text-muted-foreground">No tenants created yet.</p>
            )}
            {allTenants && allTenants.length > 0 && (
              <ul className="space-y-3">
                {allTenants.map((tenant) => (
                  <li key={tenant._id} className="p-3 bg-secondary rounded-md border border-border flex justify-between items-center">
                    <span className="font-medium">{tenant.name}</span>
                    <span className="text-xs text-muted-foreground">Clerk Org ID: {tenant.clerkOrgId.substring(0,15)}...</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
