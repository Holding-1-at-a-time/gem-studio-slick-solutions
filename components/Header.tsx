
import React from 'react';
import { UserButton, useOrganization, useUser } from '@clerk/clerk-react';

interface HeaderProps {
    variant?: 'full' | 'dashboard';
}

const Header: React.FC<HeaderProps> = ({ variant = 'full' }) => {
  const { organization } = useOrganization();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';

  if (variant === 'dashboard') {
     let title: string = "Dashboard";
     if (isAdmin) {
        title = "Admin Panel";
     } else if (organization) {
        title = organization.name;
     }
    return (
        <header className="border-b border-border bg-card sticky top-0 z-10">
            <div className="container mx-auto flex h-16 items-center justify-end px-4 md:px-8">
                <UserButton afterSignOutUrl="/" />
            </div>
        </header>
    );
  }

  // Full variant for public/auth pages
  return (
    <header className="border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M12.2 2h-.4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path>
            <path d="M18 2h-1.8c-1.24 0-2.25 1-2.25 2.25v13.5C13.95 19 14.96 20 16.2 20H18a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path>
            <path d="M6 2H4.8c-1.24 0-2.25 1-2.25 2.25v13.5C2.55 19 3.56 20 4.8 20H6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path>
          </svg>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Slick Solutions
          </h1>
        </div>
        {/* Only show UserButton if user might be loaded (e.g., on a page refresh when signed in) */}
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
};

export default Header;
