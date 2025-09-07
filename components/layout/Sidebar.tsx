
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser, useOrganization } from '@clerk/clerk-react';

// --- Icon Definitions ---
const ICONS = {
    dashboard: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    tenants: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    appointments: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
    kb: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
};

// --- Navigation Configuration ---
const navConfig: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
    admin: [
        { href: '/dashboard', label: 'Tenant Management', icon: ICONS.tenants },
    ],
    'org:detailer': [
        { href: '/dashboard', label: 'Dashboard', icon: ICONS.dashboard },
        { href: '/kb', label: 'Knowledge Base', icon: ICONS.kb },
    ],
    'org:client': [
        { href: '/dashboard', label: 'My Appointments', icon: ICONS.appointments },
        { href: '/kb', label: 'Knowledge Base', icon: ICONS.kb },
    ],
    default: [],
};

// --- Reusable NavLink with Active State ---
const NavLink: React.FC<{ href: string; icon: React.ReactNode; children: React.ReactNode; isActive: boolean }> = ({ href, icon, children, isActive }) => {
    const activeClasses = 'text-primary bg-secondary';
    const inactiveClasses = 'text-muted-foreground hover:text-primary hover:bg-secondary';

    return (
        <Link to={href} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive ? activeClasses : inactiveClasses}`}>
            {icon}
            {children}
        </Link>
    );
};

// --- Main Sidebar Component ---
const Sidebar: React.FC = () => {
    const { user } = useUser();
    const { membership } = useOrganization();
    const { pathname } = useLocation();

    // Determine the user's role
    const role = user?.publicMetadata?.role === 'admin' ? 'admin' : (membership?.role || 'default');
    
    // Get the navigation links for the current role
    const links = navConfig[role] || navConfig.default;

    return (
        <div className="hidden border-r bg-card md:block w-64">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-16 items-center border-b px-6">
                    <div className="flex items-center gap-2 font-semibold">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M12.2 2h-.4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path><path d="M18 2h-1.8c-1.24 0-2.25 1-2.25 2.25v13.5C13.95 19 14.96 20 16.2 20H18a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path><path d="M6 2H4.8c-1.24 0-2.25 1-2.25 2.25v13.5C2.55 19 3.56 20 4.8 20H6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path></svg>
                        <span className="">Slick Solutions</span>
                    </div>
                </div>
                <div className="flex-1">
                    <nav className="grid items-start px-4 text-sm font-medium">
                        {links.map(link => (
                            <NavLink 
                                key={link.href + link.label} 
                                href={link.href} 
                                icon={link.icon}
                                isActive={pathname === link.href}
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
