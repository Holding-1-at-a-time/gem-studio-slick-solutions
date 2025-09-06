
import React, { useEffect } from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import Auth from './components/Auth';
import DashboardController from './components/DashboardController';
import AssessmentPage from './components/assessment/AssessmentPage';
import ReviewPage from './components/review/ReviewPage';
import KnowledgeBasePage from './components/kb/KnowledgeBasePage';
import LandingPage from './components/landing/LandingPage';
import Spinner from './components/ui/Spinner';
import Header from './components/Header';

const RedirectToDashboard = () => {
    useEffect(() => {
        window.location.href = '/dashboard';
    }, []);
    return (
        <div className="flex justify-center items-center h-screen">
            <Spinner size="lg" />
        </div>
    );
};


function App() {
  const { pathname } = window.location;

  // --- Marketing Landing Page at root ---
  if (pathname === '/') {
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <SignedIn>
                <RedirectToDashboard />
            </SignedIn>
            <SignedOut>
                <LandingPage />
            </SignedOut>
        </div>
    )
  }

  // --- Public, unauthenticated pages that don't need the main header ---
  if (pathname.startsWith('/assessment')) {
    return <AssessmentPage />;
  }
  if (pathname.startsWith('/review')) {
    return <ReviewPage />;
  }
  if (pathname.startsWith('/kb')) {
    return <KnowledgeBasePage />;
  }

  // --- Main Application Shell (for /dashboard and other authenticated routes) ---
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <SignedIn>
        <DashboardController />
      </SignedIn>
      <SignedOut>
        {/* Fallback sign-in page for users trying to access protected routes */}
        <Header />
        <main className="container mx-auto p-4 md:p-8">
          <Auth />
        </main>
      </SignedOut>
    </div>
  );
}

export default App;
