// frontend/src/components/Layout.jsx

import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  HeartHandshake,
  LayoutDashboard,
  Users,
  Bell,
  LogOut,
  User as UserIcon,
  RefreshCw,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Menu,
  Sun,
  Moon,
  ShieldCheck,     // Used for User Management sidebar link
  ClipboardList,   // Used for Audit Logs sidebar link
  Settings as SettingsIcon
} from 'lucide-react';

const Layout = () => {
  const { 
    user, 
    logout, 
    authFetch, 
    token, 
    currency, 
    setCurrency, 
    toast, 
    triggerToast, 
    clearToast,
    theme,
    toggleTheme
  } = useContext(AuthContext);

  const location = useLocation();

  // Notifications, Collapsible Sidebar, and Menu States
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch notifications to populate the dropdown and count badges
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/followups/notifications');
      if (res.status === 200) {
        const data = await res.json();
        setNotifications(data);
        const unread = data.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to retrieve notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [location.pathname, token]);

  // Mark a notification as read and decrement unread count
  const handleMarkAsRead = async (id) => {
    try {
      const res = await authFetch(`/followups/notifications/${id}/read`, {
        method: 'PUT',
      });
      if (res.status === 200) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Failed to mark read:', err.message);
    }
  };

  // Trigger Scanner Check
  const handleTriggerScanner = async () => {
    setScanning(true);
    try {
      const res = await authFetch('/followups/check-overdue', {
        method: 'POST',
      });
      if (res.status === 200) {
        const result = await res.json();
        // Reload notifications list
        await fetchNotifications();
        
        if (result.updatedCount > 0) {
          triggerToast(`Scanner updated ${result.updatedCount} overdue case(s)! Email alerts sent.`, 'success');
        } else {
          triggerToast('Scanner complete. No new overdue cases found.', 'info');
        }
      }
    } catch (err) {
      console.error('Scanner execute error:', err.message);
      triggerToast('Failed to run scheduler scan.', 'error');
    } finally {
      setScanning(false);
    }
  };

  // Database Purge / Clean-Up demo data
  const handlePurgeData = async () => {
    if (!window.confirm('WARNING: This will permanently delete all beneficiaries, assistance records, uploads, and notifications to give you a clean database. User accounts will NOT be deleted. Do you wish to continue?')) {
      return;
    }

    try {
      const res = await authFetch('/analytics/purge-test-data', {
        method: 'POST',
      });
      if (res.status === 200) {
        triggerToast('Database reset successfully! All test data cleaned.', 'success');
        setShowNotifMenu(false);
        // Refresh page or trigger context state updates
        window.location.reload();
      } else {
        triggerToast('Failed to clean database tables.', 'error');
      }
    } catch (err) {
      console.error('Reset database error:', err.message);
      triggerToast('Server error while resetting tables.', 'error');
    }
  };

  // Auto-close Toast after 4.5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Navigation configurations
  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Beneficiary Registry',
      path: '/beneficiaries',
      icon: Users,
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  // Restrict User Management and Audit Trail in sidebar to ADMIN role only
  if (user?.role === 'ADMIN') {
    navItems.push(
      {
        name: 'User Management',
        path: '/users',
        icon: ShieldCheck,
      },
      {
        name: 'Audit Trail',
        path: '/audit-logs',
        icon: ClipboardList,
      }
    );
  }

  // Always append Settings at the end
  navItems.push({
    name: 'Settings',
    path: '/settings',
    icon: SettingsIcon,
  });

  return (
    <div className="flex min-h-screen bg-[#fffdf0] dark:bg-[#040d04] text-slate-800 dark:text-slate-100 relative transition-colors duration-300">
      {/* 1. Sidebar Navigation Panel (Corporate Brand Theme - Collapsible) */}
      <aside className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-primary-600/30 dark:border-success-800/30 bg-gradient-to-b from-primary-500 via-primary-500 to-primary-600 dark:from-[#091709] dark:to-[#040d04] text-success-900 dark:text-slate-100 shadow-2xl transition-all duration-300 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* NGO Brand Title */}
        <div className="flex h-16 items-center gap-3 border-b border-primary-600/30 dark:border-success-800/30 px-6 bg-primary-600/10 dark:bg-[#040d04]/40">
          <div className="flex h-9.5 w-9.5 items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#feab32" />
                  <stop offset="100%" stopColor="#d34300" />
                </linearGradient>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#104210" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="10" fill="url(#logoGrad)" />
              <path d="M7.5 8.5h4.5v1.2H8.7v1.2H12v1.2H8.7v1.2h4.5V15.5H7.5V8.5z" fill="#ffffff" opacity="0.95" />
              <path d="M12.5 8.5h1.2l2.2 4.2V8.5h1.2v7h-1.2l-2.2-4.2v4.2h-1.2v-7z" fill="url(#goldGrad)" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-success-950 dark:text-white leading-none">Evelyn Nwankwo's</h1>
            <span className="text-[10px] font-semibold text-success-900/80 dark:text-slate-400 tracking-wider">FUND INITIATIVE</span>
          </div>
        </div>

        {/* Navigation Links (Updated Colors) */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all btn-animate ${
                  isActive
                    ? 'bg-success-900 dark:bg-primary-500 text-white dark:text-success-950 shadow-lg shadow-success-950/20 dark:shadow-primary-500/20'
                    : 'text-success-900/90 dark:text-slate-400 hover:bg-primary-600/20 dark:hover:bg-success-900/40 hover:text-success-950 dark:hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white dark:text-success-950' : 'text-success-900/80 dark:text-slate-400'}`} />
                <span className="flex-1">{item.name}</span>
                
                {/* Count Badge bubble */}
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold transition-all ${
                    isActive ? 'bg-white text-success-900 dark:bg-success-950 dark:text-primary-500' : 'bg-success-900 text-white dark:bg-primary-500 dark:text-success-950 animate-bounce'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Session Profile & Logout (Dark Mode styled) */}
        <div className="border-t border-primary-600/30 dark:border-success-800/30 p-4 bg-primary-600/10 dark:bg-[#040d04]/20">
          <div className="flex items-center gap-3 rounded-xl bg-primary-600/25 dark:bg-success-900/60 p-3 border border-primary-600/40 dark:border-success-800/40">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-900/20 dark:bg-primary-500/20 text-success-950 dark:text-primary-400 font-bold uppercase border border-success-900/30 dark:border-primary-500/30 shrink-0">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-success-950 dark:text-slate-200">{user?.name}</p>
              <span className="text-[10px] font-semibold text-success-900/80 dark:text-slate-400 uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
            
            <button
              onClick={logout}
              title="Sign Out"
              className="rounded-lg p-1.5 text-success-900 dark:text-slate-400 hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-400 transition-all cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Frame (offset dynamically based on sidebarOpen state) */}
      <div className={`flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 ${
        sidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        
        {/* Ambient blurred backdrop circles for premium wow effect */}
        <div className="absolute top-0 right-0 -z-10 h-[50vh] w-[50vw] rounded-full bg-primary-500/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -z-10 h-[50vh] w-[50vw] rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>

        {/* Sticky Top Header bar */}
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/70 px-8 backdrop-blur-lg">
          {/* Greetings & Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-500 dark:hover:text-primary-400 transition-all cursor-pointer btn-animate shrink-0"
              title="Toggle Sidebar Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
              Welcome back, <strong className="text-primary-500 font-bold">{user?.name || 'Staff Member'}</strong> 🌟
            </span>
          </div>

          {/* Quick Actions & Preferences */}
          <div className="flex items-center gap-6">
            
            {/* Currency Selector Switcher Dropdown */}
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-1">
              <button
                onClick={() => setCurrency('NGN')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  currency === 'NGN' 
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/10' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ₦ NGN
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  currency === 'USD' 
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/10' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                $ USD
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-500 dark:hover:text-primary-400 transition-all cursor-pointer btn-animate shrink-0"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>

            {/* Notification Bell Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-500 dark:hover:text-primary-400 transition-all cursor-pointer"
                title="System Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Popup Dropdown Panel */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl ring-1 ring-black/5 dark:ring-white/5 animate-in fade-in slide-in-from-top-2 duration-150 z-30">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Recent Alerts
                    </span>
                    <button
                      onClick={handleTriggerScanner}
                      disabled={scanning}
                      className="text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 bg-primary-50 dark:bg-primary-950/30 px-2 py-1 rounded-md transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${scanning ? 'animate-spin' : ''}`} />
                      <span>{scanning ? 'Scanning...' : 'Scan Overdue'}</span>
                    </button>
                  </div>

                  {/* Dropdown items scroll grid */}
                  <div className="mt-3 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1 space-y-1">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                        No alerts logged.
                      </p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.isRead) handleMarkAsRead(n.id);
                            setShowNotifMenu(false);
                            window.location.href = '/notifications';
                          }}
                          className={`py-2 px-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer text-left ${
                            !n.isRead ? 'bg-primary-50/25 dark:bg-primary-950/20 font-semibold' : ''
                          }`}
                        >
                          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
 
                  {/* Dropdown Footer */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-805 flex items-center justify-between text-[11px] font-bold">
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifMenu(false)}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-all"
                    >
                      View all alerts
                    </Link>
                    <button
                      onClick={handlePurgeData}
                      className="text-red-500 dark:text-red-400 flex items-center gap-1 transition-all cursor-pointer"
                      title="Purge database data"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Purge Test Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar indicator */}
            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-bold text-sm">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
            </div>
          </div>
        </header>

        {/* Inner Content Area */}
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 3. Screen popup animated Toast alerts */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-2xl dark:shadow-none backdrop-blur-md animate-in slide-in-from-bottom-6 duration-300">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-md ${
            toast.type === 'success' 
              ? 'bg-primary-500 shadow-primary-500/10' 
              : toast.type === 'error'
              ? 'bg-red-500 shadow-red-500/10'
              : 'bg-blue-500 shadow-blue-500/10'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
          </div>
          <div className="pr-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">System Notification</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{toast.message}</p>
          </div>
          <button 
            onClick={clearToast} 
            className="text-slate-400 hover:text-slate-600 dark:text-slate-550 dark:hover:text-slate-350 rounded-lg p-1 transition-all cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Layout;
