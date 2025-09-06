import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Import `useAuth` from clerk-react to satisfy the requirements of ConvexProviderWithClerk.
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import App from './App';

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
const convexUrl = process.env.REACT_APP_CONVEX_URL;

if (!clerkPubKey || !convexUrl) {
  throw new Error("Missing Clerk or Convex environment variables. Make sure REACT_APP_CLERK_PUBLISHABLE_KEY and REACT_APP_CONVEX_URL are set.");
}

const convex = new ConvexReactClient(convexUrl);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      {/* Fix: Pass the `useAuth` hook as a prop to `ConvexProviderWithClerk`. It is a required prop. */}
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>
);
