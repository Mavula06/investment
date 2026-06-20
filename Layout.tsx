import { ReactNode, useState, useEffect } from 'react';
import { Profile, Notification } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  History,
  Settings,
  Shield,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Crown,
} from 'lucide-react';

type View = 'dashboard' | 'plans' | 'investments' | 'transactions' | 'settings' | 'admin';

interface LayoutProps {
  children: ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  profile: Profile;
  notifications: Notification[];
}

export default function Layout({
  children,
  currentView,
  onViewChange,
  profile,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      if (!profile) return;
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };
    fetchUnread();
  }, [profile]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'plans', label: 'Investment Plans', icon: TrendingUp },
    { id: 'investments', label: 'My Investments', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
    ...(profile.is_admin ? [{ id: 'admin', label: 'Admin Panel', icon: Shield }] : []),
  ] as const;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      < aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-dark-800 border-r border-dark-600 transform transition-transform duration-300 ease-out lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-dark-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-dark-900" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-xl text-gradient-gold">Prestige</h1>
                  <p className="text-xs text-gray-500">Wealth Investments</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-r from-gold-500/20 to-transparent text-gold-500 border border-gold-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-dark-700'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'text-gold-500' : 'text-gray-500 group-hover:text-white'}`}
                  />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-gold-500" />}
                </button>
              );
            })}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-dark-600">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-dark-900 font-bold">
                {profile.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
                <p className="text-xs text-gray-500">${profile.balance.toLocaleString()} balance</p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-dark-600 transition-colors text-gray-400 hover:text-red-400"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-xl border-b border-dark-600">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-400" />
              </button>
              <div>
                <h2 className="font-display font-bold text-xl lg:text-2xl text-white capitalize">
                  {currentView === 'plans' ? 'Investment Plans' : currentView.charAt(0).toUpperCase() + currentView.slice(1)}
                </h2>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Manage your investment portfolio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2.5 rounded-xl bg-dark-700 border border-dark-600 hover:border-gold-500/30 transition-all duration-300"
                >
                  <Bell className="w-5 h-5 text-gray-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold-500 text-dark-900 text-xs font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Balance card */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500/20 to-transparent border border-gold-500/30">
                <Wallet className="w-5 h-5 text-gold-500" />
                <div>
                  <p className="text-xs text-gray-500">Available</p>
                  <p className="text-sm font-bold text-white">
                    ${profile.balance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
