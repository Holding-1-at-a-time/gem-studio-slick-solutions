
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useUser, SignedIn, SignedOut } from '@clerk/clerk-react';
import DashboardController from './components/DashboardController';
import AssessmentPage from './components/assessment/AssessmentPage';
import ReviewPage from './components/review/ReviewPage';
import KnowledgeBasePage from './components/kb/KnowledgeBasePage';
import LandingPage from './components/landing/LandingPage';
import Spinner from './components/ui/Spinner';

// A wrapper to protect routes that require authentication.
const ProtectedRoute = () => {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <Navigate to="/dashboard" />
              </SignedIn>
              <SignedOut>
                <LandingPage />
              </SignedOut>
            </>
          }
        />
        <Route path="/assessment/:tenantId" element={<AssessmentPage />} />
        <Route path="/review/:appointmentId" element={<ReviewPage />} />
        <Route path="/kb" element={<KnowledgeBasePage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardController />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
