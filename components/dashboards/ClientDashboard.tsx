
import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';

const AppointmentsSkeleton = () => (
    <div className="space-y-6">
        <div>
            <div className="h-6 bg-muted rounded w-1/4 mb-3 animate-pulse"></div>
            <ul className="space-y-3">
                {[...Array(2)].map((_, i) => (
                    <li key={i} className="p-3 h-16 bg-secondary rounded-md border border-border animate-pulse">
                        <div className="h-5 bg-muted rounded w-2/3 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                    </li>
                ))}
            </ul>
        </div>
        <div>
            <div className="h-6 bg-muted rounded w-1/4 mb-3 animate-pulse"></div>
            <ul className="space-y-3">
                <li className="p-3 h-16 bg-secondary/50 rounded-md border border-border/50 opacity-70 animate-pulse">
                    <div className="h-5 bg-muted/50 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-muted/50 rounded w-1/2"></div>
                </li>
            </ul>
        </div>
    </div>
);


const ClientDashboard: React.FC = () => {
  const { user } = useUser();
  const appointments = useQuery(api.scheduling.getAppointmentsForClient);

  const upcomingAppointments = appointments?.filter(
    (a) => new Date(a.appointmentTime) > new Date()
  );
  const pastAppointments = appointments?.filter(
    (a) => new Date(a.appointmentTime) <= new Date()
  );

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Welcome, {user?.firstName || 'Client'}!
      </h1>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Your Appointments</h2>
        {appointments === undefined && <AppointmentsSkeleton />}
        {appointments && appointments.length === 0 && (
          <p className="text-muted-foreground">
            You don't have any scheduled appointments yet.
          </p>
        )}
        {appointments && appointments.length > 0 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Upcoming</h3>
              {upcomingAppointments && upcomingAppointments.length > 0 ? (
                <ul className="space-y-3">
                  {upcomingAppointments.map((appt) => (
                    <li key={appt._id} className="p-3 bg-secondary rounded-md border border-border">
                      <p className="font-medium">{appt.vehicleDescription}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appt.appointmentTime).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-3">History</h3>
              {pastAppointments && pastAppointments.length > 0 ? (
                <ul className="space-y-3">
                  {pastAppointments.map((appt) => (
                    <li key={appt._id} className="p-3 bg-secondary/50 rounded-md border border-border/50 opacity-70">
                      <p className="font-medium">{appt.vehicleDescription}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appt.appointmentTime).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No past appointments.</p>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ClientDashboard;
