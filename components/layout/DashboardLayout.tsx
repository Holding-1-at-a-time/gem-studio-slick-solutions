
import React from 'react';
import Sidebar from './Sidebar';
import Header from '../Header';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-secondary/20">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header variant="dashboard" />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
