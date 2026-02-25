import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  History, 
  Settings, 
  Bell, 
  LogOut,
  PlusCircle
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={24} />, path: '/dashboard' },
    { name: 'Groups', icon: <Users size={24} />, path: '/groups' },
    { name: 'Activity', icon: <History size={24} />, path: '/activity' },
    { name: 'Settings', icon: <Settings size={24} />, path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-brand-light flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-brand-border flex-col sticky top-0 h-screen">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold text-brand-navy tracking-tight">Ajopay</span>
          </Link>
        </div>

        <nav className="flex-grow px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                location.pathname === item.path
                  ? 'bg-brand-primary/10 text-brand-primary font-bold'
                  : 'text-brand-gray hover:bg-brand-light hover:text-brand-navy'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-brand-border">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-brand-gray hover:text-red-600 transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col pb-20 md:pb-0">
        {/* Desktop Header */}
        <header className="hidden md:flex h-20 bg-white border-b border-brand-border items-center justify-between px-8 sticky top-0 z-30">
          <h1 className="text-xl font-bold text-brand-navy">
            {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-brand-gray hover:bg-brand-light rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-brand-border">
              <div className="text-right">
                <p className="text-sm font-bold text-brand-navy">Franklyn</p>
                <p className="text-xs text-brand-gray">Premium Member</p>
              </div>
              <div className="w-10 h-10 bg-brand-light rounded-full flex items-center justify-center text-brand-navy font-bold">
                F
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-border h-16 flex items-center justify-around px-2 z-50">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              location.pathname === item.path
                ? 'text-brand-primary'
                : 'text-brand-gray'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};
