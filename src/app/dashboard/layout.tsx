"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  LayoutDashboard, 
  Settings, 
  FileText, 
  Users, 
  RefreshCcw, 
  BarChart3, 
  CreditCard, 
  Plus, 
  LogOut, 
  AlertTriangle, 
  X, 
  ChevronDown,
  Sparkles,
  Zap,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Menu
} from 'lucide-react';
import { getRemainingQuota, getAccountLimitForPlan } from '@/lib/db';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { 
    user, 
    workspace, 
    accounts, 
    activeAccountId, 
    setActiveAccountId, 
    signOut, 
    isBannerDismissed,
    dismissUpgradeBanner,
    events,
    loading
  } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on path change (mobile user flow)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Redirect unauthenticated users to /login
  useEffect(() => {
    if (loading) return;
    if (!user || !workspace) {
      router.push('/login');
    }
  }, [user, workspace, loading, router]);

  // Redirect users who have no connected accounts to /dashboard/connect, unless on billing or simulator (Temporarily disabled to allow viewing layout/other pages)
  // useEffect(() => {
  //   if (loading) return;
  //   if (user && workspace) {
  //     if (accounts.length === 0) {
  //       const allowedPaths = ['/dashboard/connect', '/dashboard/billing', '/dashboard/simulator'];
  //       if (!allowedPaths.includes(pathname)) {
  //         router.push('/dashboard/connect');
  //       }
  //     } else {
  //       if (pathname === '/dashboard/connect') {
  //         router.push('/dashboard/home');
  //       }
  //     }
  //   }
  // }, [user, workspace, accounts.length, pathname, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
          <span className="text-zinc-550 text-xs font-semibold">Loading session...</span>
        </div>
      </div>
    );
  }

  if (!user || !workspace) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
          <span className="text-zinc-555 text-xs font-semibold">Redirecting to login...</span>
        </div>
      </div>
    );
  }

  // Bypass normal sidebar layout for the connect page
  if (pathname === '/dashboard/connect') {
    return <>{children}</>;
  }

  const activeAccount = accounts.find(a => a.id === activeAccountId);
  const quota = getRemainingQuota(workspace);
  const totalLimit = workspace.dm_quota_monthly + workspace.dm_addon_credits;
  const totalUsed = workspace.dm_sent_current_period;
  const pct = Math.min(100, totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0);

  const dmsSentTodayCount = events.filter(e => {
    if (e.event_type !== 'dm_sent') return false;
    const date = new Date(e.occurred_at);
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    return date >= startOfToday;
  }).length;

  const menuItems = [
    { name: 'Home Dashboard', href: '/dashboard/home', icon: LayoutDashboard },
    { name: 'Automations', href: '/dashboard/automations', icon: Settings },
    { name: 'My Content', href: '/dashboard/content', icon: FileText },
    { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
    { name: 'Rewind Engine', href: '/dashboard/rewind', icon: RefreshCcw },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Billing & Add-ons', href: '/dashboard/billing', icon: CreditCard },
  ];

  menuItems.push({ name: 'Sandbox Simulator', href: '/dashboard/simulator', icon: Sparkles });

  const accountLimit = getAccountLimitForPlan(workspace.plan);

  const renderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col gap-6 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shrink-0">
            A
          </div>
          <span className="font-extrabold text-lg tracking-tight text-zinc-900 animate-fadeIn">
            Auto Insta <span className="text-gradient">Flow</span>
          </span>
        </div>

        {/* Account Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition text-zinc-800 shadow-sm"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <svg className="w-4 h-4 text-pink-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span className="truncate">
                {activeAccount ? `@${activeAccount.username}` : 'No Connected Account'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-450 shrink-0" />
          </button>
          <div className="flex justify-between items-center px-1 mt-1.5 text-[10px] text-zinc-400">
            <span>Connected accounts:</span>
            <span className="font-semibold text-zinc-600">{accounts.length} / {accountLimit}</span>
          </div>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 rounded-xl bg-white border border-zinc-200 shadow-2xl z-50 flex flex-col gap-1">
              <div className="text-[10px] font-bold text-zinc-400 px-2 py-1 uppercase tracking-wider">
                Select Instagram Account
              </div>
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => {
                    setActiveAccountId(acc.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition flex items-center justify-between ${acc.id === activeAccountId ? 'bg-purple-600 text-white font-bold' : 'text-zinc-600 hover:bg-zinc-50'}`}
                >
                  <span>@{acc.username}</span>
                  {acc.token_status !== 'active' && (
                    <span className="bg-red-100 text-red-600 px-1 py-0.5 rounded text-[9px] font-bold">Fix Token</span>
                  )}
                </button>
              ))}

              <hr className="border-zinc-100 my-1" />

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setShowLinkModal(true);
                }}
                className="w-full text-left px-2 py-1.5 rounded-md text-xs text-purple-600 hover:bg-purple-50 transition flex items-center gap-1.5 font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Connect Instagram ({accounts.length}/{accountLimit})
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-purple-50 border-l-2 border-purple-500 text-purple-700 font-semibold shadow-inner' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/50'}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-zinc-450'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Metrics */}
      <div className="flex flex-col gap-4 border-t border-zinc-200 pt-4 mt-4">
        {/* DM Quota */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-450 font-bold">DMs Sent Today</span>
            <span className="text-zinc-700 font-extrabold">{dmsSentTodayCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-0.5">
            <span className="text-zinc-455 font-bold">Monthly Quota</span>
            <span className="text-zinc-700 font-extrabold">
              {totalUsed.toLocaleString()} / {totalLimit.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" 
              style={{ width: `${pct}%` }}
            />
          </div>
          {workspace.dm_addon_credits > 0 && (
            <div className="text-[10px] text-pink-600 font-semibold">
              Includes +{workspace.dm_addon_credits.toLocaleString()} Add-On credits
            </div>
          )}
          {pct >= 90 && (
            <div className="text-[10px] text-yellow-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 shrink-0" /> Quota nearly exhausted!
            </div>
          )}
        </div>

        {/* Upgrade Banner / CTA */}
        {workspace.plan === 'free' ? (
          <Link 
            href="/dashboard/billing"
            className="w-full px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100/50 transition flex items-center justify-center gap-1.5 text-xs text-purple-700 font-bold shadow-inner"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-500 shrink-0 animate-bounce" /> Upgrade to Pro
          </Link>
        ) : (
          <Link 
            href="/dashboard/billing"
            className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition flex items-center justify-center gap-1.5 text-xs text-zinc-700 font-bold shadow-sm"
          >
            Buy More DMs
          </Link>
        )}

        {/* Profile Sign-out */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <img 
              src={user.avatar_url} 
              alt={user.name} 
              className="w-8 h-8 rounded-full border border-zinc-200"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs text-zinc-800 font-extrabold truncate">{user.name}</span>
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{workspace.plan} Plan</span>
            </div>
          </div>
          <button 
            onClick={() => {
              signOut();
              router.push('/');
            }} 
            className="text-zinc-400 hover:text-red-500 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50/50 relative font-sans text-zinc-800">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200 sticky top-0 z-40 w-full shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white shadow-md shrink-0">
            A
          </div>
          <span className="font-extrabold text-lg tracking-tight text-zinc-900">
            Auto Insta <span className="text-gradient">Flow</span>
          </span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-500 hover:text-zinc-900 p-1">
          {sidebarOpen ? <X className="w-6 h-6 animate-fadeIn" /> : <Menu className="w-6 h-6 animate-fadeIn" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-zinc-250/60 bg-white/80 backdrop-blur-md flex flex-col p-4 shrink-0 h-screen sticky top-0 hidden md:flex shadow-sm">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-zinc-900/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          {/* Sidebar Drawer */}
          <aside className="relative w-64 max-w-[80vw] bg-white border-r border-zinc-200 flex flex-col p-4 h-full z-50 animate-slideRight">
            <div className="absolute top-4 right-4 md:hidden">
              <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 hover:text-zinc-900 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-full pt-4">
              {renderSidebarContent()}
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Upgrade Banner */}
        {workspace.plan === 'free' && !isBannerDismissed && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 text-purple-800 px-6 py-2.5 flex items-center justify-between text-xs relative z-30 backdrop-blur-md">
            <div className="flex items-center gap-2 pr-4">
              <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
              <span>You are currently on the <strong className="uppercase">Free Plan</strong> (gated: Email Gates, Follow Gates). Upgrade to unlock the full power!</span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Link href="/dashboard/billing" className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg font-bold transition shadow-sm">
                Upgrade
              </Link>
              <button onClick={dismissUpgradeBanner} className="text-zinc-400 hover:text-zinc-700 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Link Account Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white border border-zinc-200 p-6 max-w-sm w-full flex flex-col gap-5 relative overflow-hidden text-center rounded-2xl shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
                  A
                </div>
                <span className="font-extrabold text-sm tracking-tight text-zinc-900">
                  Connect Account
                </span>
              </div>
              <button 
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkError('');
                }} 
                className="text-zinc-400 hover:text-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 mx-auto mt-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-extrabold text-zinc-900">Connect via Meta Login</h3>
              <p className="text-xs text-zinc-500 leading-relaxed px-2">
                Automate comments and DMs by linking your professional Instagram account through secure Meta OAuth.
              </p>
            </div>

            {linkError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold">
                {linkError}
              </div>
            )}

            <button
              onClick={() => {
                const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || '888924804248426';
                const rawRedirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || (window.location.origin + '/dashboard/connect');
                const redirectUri = encodeURIComponent(rawRedirectUri);
                const scope = 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_manage_insights,instagram_business_content_publish';
                const url = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
                window.location.href = url;
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white text-sm font-bold transition shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span>Continue with Instagram</span>
            </button>
            
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-[10px] font-semibold mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
              Meta Secure Authorization
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
