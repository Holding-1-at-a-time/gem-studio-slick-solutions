
import React from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import Header from './components/Header';
import Auth from './components/Auth';
import DashboardController from './components/DashboardController';

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <SignedIn>
          <DashboardController />
        </SignedIn>
        <SignedOut>
          <Auth />
        </SignedOut>
      </main>
    </div>
  );
}

export default App;
