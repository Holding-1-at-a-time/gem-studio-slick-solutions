
import React, { useState } from 'react';
import { useOrganization } from '@clerk/clerk-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

const DetailerDashboard: React.FC = () => {
  const { organization } = useOrganization();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsLoading(true);
    setFeedback('');

    // In a real app, this would trigger a Convex mutation that calls the Clerk API
    // via an HTTP action to create and send an organization invitation.
    // For this example, we'll simulate the process.
    console.log(`Simulating invitation for ${inviteEmail} to organization ${organization?.name} (${organization?.id})`);
    
    setTimeout(() => {
        setFeedback(`An invitation for ${inviteEmail} would be sent via Clerk. For this demo, please invite users manually through your Clerk dashboard.`);
        setInviteEmail('');
        setIsLoading(false);
    }, 1500);
  };
  
  if (!organization) {
    return <div className="flex justify-center items-center"><Spinner /></div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome, {organization.name} Detailer!</h1>
      <p className="text-muted-foreground mb-6">Manage your appointments and invite clients to the platform.</p>
      
      <Card>
        <h2 className="text-xl font-semibold mb-4">Invite a New Client</h2>
        <p className="text-sm text-muted-foreground mb-4">
            Invited users will be added to your organization, '{organization.name}', with the 'Client' role.
        </p>
        <form onSubmit={handleInvite} className="flex items-start gap-4">
          <div className="flex-grow">
            <Input
              type="email"
              placeholder="client@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isLoading || !inviteEmail}>
            {isLoading ? <Spinner size="sm" /> : 'Send Invite'}
          </Button>
        </form>
        {feedback && <p className="text-sm text-green-400 mt-4">{feedback}</p>}
      </Card>
    </div>
  );
};

export default DetailerDashboard;
