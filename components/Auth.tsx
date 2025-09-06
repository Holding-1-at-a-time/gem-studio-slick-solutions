
import React from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import Button from './ui/Button';

const Auth: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center mt-16">
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
        Welcome to Slick Solutions
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
        The all-in-one platform for detailing businesses. Manage your team, invite clients, and streamline your workflow, all in one place.
      </p>
      <div className="flex gap-4">
        <SignInButton mode="modal">
          <Button>Sign In</Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button variant="secondary">Sign Up</Button>
        </SignUpButton>
      </div>
      <div className="mt-16 w-full max-w-4xl p-8 border border-border rounded-lg bg-secondary/20">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="flex flex-col items-center text-center">
                <div className="mb-4 text-primary bg-primary/10 rounded-full p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h3 className="font-semibold mb-2">Admins</h3>
                <p className="text-muted-foreground text-sm">Create and manage tenant organizations for new detailing businesses joining the platform.</p>
            </div>
            <div className="flex flex-col items-center text-center">
                <div className="mb-4 text-primary bg-primary/10 rounded-full p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                </div>
                <h3 className="font-semibold mb-2">Detailers</h3>
                <p className="text-muted-foreground text-sm">Manage your work and invite your clients to the platform for seamless communication.</p>
            </div>
            <div className="flex flex-col items-center text-center">
                <div className="mb-4 text-primary bg-primary/10 rounded-full p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <h3 className="font-semibold mb-2">Clients</h3>
                <p className="text-muted-foreground text-sm">View your appointment history and communicate directly with your detailer.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
