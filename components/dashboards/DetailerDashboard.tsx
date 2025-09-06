import React, { useState, useEffect, useRef } from 'react';
import { useOrganization } from '@clerk/clerk-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import QRCode from 'qrcode';

const THEME_COLORS = ['#ffffff', '#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6'];

const Analytics: React.FC<{ clerkOrgId: string }> = ({ clerkOrgId }) => {
    const metrics = useQuery(api.analytics.getDashboardMetrics, { clerkOrgId });
    
    const MetricCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
        <Card className="p-4 flex-1">
            <div className="flex items-center gap-4">
                <div className="bg-secondary p-3 rounded-md">{icon}</div>
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </div>
        </Card>
    );

    if (metrics === undefined) return <div className="flex justify-center items-center h-24"><Spinner /></div>
    if (metrics === null) return <p className="text-muted-foreground text-sm text-center col-span-3">Analytics are being generated. Check back in a few minutes.</p>

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
            <MetricCard title="Total Revenue" value={`$${metrics.totalRevenue.toFixed(2)}`} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
            <MetricCard title="Total Appointments" value={metrics.totalAppointments} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>} />
            <MetricCard title="Average Rating" value={metrics.averageRating > 0 ? `${metrics.averageRating} / 5` : 'N/A'} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} />
        </div>
    );
};

const RevenueForecast: React.FC<{ clerkOrgId: string }> = ({ clerkOrgId }) => {
    const forecast = useQuery(api.analytics.getRevenueForecast, { clerkOrgId });

    if (forecast === undefined) return <div className="flex justify-center p-4"><Spinner /></div>;
    if (forecast === null) return null; // Handled by parent

    const maxRevenue = Math.max(...forecast.map(f => f.revenue), 1);

    return (
        <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Revenue Forecast</h2>
            <div className="flex justify-around items-end h-40 gap-2">
                {forecast.map(item => (
                    <div key={item.month} className="flex-1 flex flex-col items-center justify-end">
                        <div className="w-full bg-primary rounded-t-md" style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}></div>
                        <p className="text-xs text-muted-foreground mt-1">{item.month}</p>
                    </div>
                ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">AI-predicted revenue for the next 3 months.</p>
        </Card>
    );
};

const AIInsights: React.FC<{ clerkOrgId: string }> = ({ clerkOrgId }) => {
    const insight = useQuery(api.aiAgents.getLatestInsight, { clerkOrgId });
    return (
        <Card className="p-6 bg-gradient-to-tr from-secondary to-secondary/50">
            <h2 className="text-xl font-semibold mb-2">AI Business Insights</h2>
            {insight === undefined && <div className="flex justify-center p-4"><Spinner /></div>}
            {insight && <p className="text-sm text-muted-foreground italic">"{insight.insight}"</p>}
            {!insight && <p className="text-sm text-muted-foreground">No insights available yet. Check back soon.</p>}
        </Card>
    );
};

const ReportGenerator: React.FC<{ clerkOrgId: string }> = ({ clerkOrgId }) => {
    const generateReport = useAction(api.analytics.generateClientReport);
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        setIsLoading(true);
        try {
            const csvData = await generateReport({ clerkOrgId });
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `client_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to generate report", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button variant="secondary" className="w-full" onClick={handleDownload} disabled={isLoading}>
            {isLoading ? <Spinner size="sm" /> : <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Generate Client Report
            </>}
        </Button>
    );
};


const DetailerDashboard: React.FC = () => {
  const { organization } = useOrganization();
  const updateTheme = useMutation(api.tenants.updateTheme);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!organization) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  const clerkOrgId = organization.id;

  const assessmentUrl = `${window.location.origin}/assessment?tenantId=${clerkOrgId}`;

  useEffect(() => {
    if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, assessmentUrl, { width: 160, margin: 2, color: { dark: '#e0e0e0', light: '#1a1a1a' }}, console.error);
    }
  }, [assessmentUrl]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome, {organization.name} Detailer!</h1>
      <p className="text-muted-foreground mb-8">Here's your business command center, powered by AI.</p>
      
      <Analytics clerkOrgId={clerkOrgId} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <AIInsights clerkOrgId={clerkOrgId} />
            <RevenueForecast clerkOrgId={clerkOrgId} />
        </div>

        <div className="space-y-8">
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Client Self-Assessment Link</h2>
                <div className="flex flex-col items-center gap-4 bg-secondary p-4 rounded-lg">
                    <canvas ref={canvasRef} className="rounded-md"/>
                    <Button size="sm" className="w-full" onClick={() => navigator.clipboard.writeText(assessmentUrl)}>Copy Link</Button>
                </div>
            </Card>
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Customize Brand Color</h2>
                <div className="flex gap-3">
                    {THEME_COLORS.map(color => (
                        <button key={color} onClick={() => updateTheme({ themeColor: color })} className="w-8 h-8 rounded-full border-2 border-border transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background" style={{ backgroundColor: color }} aria-label={`Set theme to ${color}`}/>
                    ))}
                </div>
            </Card>
            <ReportGenerator clerkOrgId={clerkOrgId} />
            <a href="/kb" className="block w-full"><Button variant="secondary" className="w-full">Visit Knowledge Base</Button></a>
        </div>
      </div>
    </div>
  );
};

export default DetailerDashboard;
