
import React from 'react';
import { UserButton } from '@clerk/clerk-react';

const Header: React.FC = () => {
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
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
};

export default Header;
