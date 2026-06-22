"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  Menu,
  Home,
  HelpCircle,
  Layers,
  LifeBuoy
} from 'lucide-react';
import { getRemainingQuota, getAccountLimitForPlan } from '@/lib/db';

function ContentLinks({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const typeParam = searchParams ? searchParams.get('type') : null;
  return (
    <>
      <Link
        href="/dashboard/content"
        className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
          pathname === '/dashboard/content' && (!typeParam || typeParam !== 'stories')
            ? 'bg-zinc-100 border border-zinc-950 text-zinc-950 font-bold'
            : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
        }`}
      >
        Posts & Reels
      </Link>
      <Link
        href="/dashboard/content?type=stories"
        className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
          pathname === '/dashboard/content' && typeParam === 'stories'
            ? 'bg-zinc-100 border border-zinc-950 text-zinc-950 font-bold'
            : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
        }`}
      >
        Stories
      </Link>
    </>
  );
}

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
  const [myContentOpen, setMyContentOpen] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

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

  const accountLimit = getAccountLimitForPlan(workspace.plan);

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto pr-1 scrollbar-thin">
      <div className="flex flex-col gap-6">
        {/* Logo */}
        <div className="flex items-center justify-between px-2 pt-1">
          <span className="font-extrabold text-sm tracking-wider text-zinc-950 uppercase font-sans">
            AUTOINSTAFLOW
          </span>
          <button className="text-zinc-350 hover:text-zinc-655 transition">
            <svg className="w-3.5 h-3.5 text-zinc-400 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Account Selector styled like Workspace Card */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 transition text-zinc-800 shadow-sm"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="flex flex-col items-start overflow-hidden text-left">
                <span className="text-xs font-bold text-zinc-800 truncate">My Workspace</span>
                <span className="text-[10px] text-zinc-450 font-semibold uppercase tracking-wide">
                  {workspace.plan === 'free' ? 'Free Plan' : `${workspace.plan} Plan`}
                </span>
              </div>
            </div>
            <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
            </svg>
          </button>
          <div className="flex justify-between items-center px-1 mt-1 text-[9px] text-zinc-400">
            <span>Accounts linked:</span>
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
                  className={`w-full text-left px-2 py-2 rounded-md text-xs transition flex items-center gap-2 ${acc.id === activeAccountId ? 'bg-zinc-950 text-white font-bold' : 'text-zinc-600 hover:bg-zinc-50'}`}
                >
                  {acc.profile_picture_url ? (
                    <img src={acc.profile_picture_url} alt={acc.username} className="w-5 h-5 rounded-full object-cover border border-zinc-200 shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shrink-0" />
                  )}
                  <div className="flex flex-col gap-0 overflow-hidden">
                    <span className="truncate">@{acc.username}</span>
                    {acc.followers_count != null && (
                      <span className={`text-[8px] font-semibold ${acc.id === activeAccountId ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        {acc.followers_count.toLocaleString()} followers
                      </span>
                    )}
                  </div>
                  {acc.token_status !== 'active' && (
                    <span className="ml-auto bg-red-100 text-red-600 px-1 py-0.5 rounded text-[8px] font-bold shrink-0">Fix</span>
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

        {/* New Automation Button */}
        <Link 
          href="/dashboard/automations/new"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#d2ff00] hover:bg-[#c1f000] text-zinc-950 font-extrabold text-xs shadow-sm transition border border-zinc-950/15"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-950 stroke-[3.5]" />
          New Automation
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1">
          {/* Home */}
          <Link
            href="/dashboard/home"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition ${
              pathname === '/dashboard/home'
                ? 'bg-zinc-100 border border-zinc-950 text-zinc-950 font-bold'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
            }`}
          >
            <Home className="w-4 h-4" />
            Home
          </Link>

          {/* Automations */}
          <Link
            href="/dashboard/automations"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition ${
              pathname.startsWith('/dashboard/automations')
                ? 'bg-zinc-100 border border-zinc-950 text-zinc-950 font-bold'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            Automations
          </Link>

          {/* Templates */}
          <Link
            href="/dashboard/templates"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition ${
              pathname === '/dashboard/templates'
                ? 'bg-zinc-100 border border-zinc-950 text-zinc-950 font-bold'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            Templates
          </Link>

          {/* Collapsible My Content */}
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => setMyContentOpen(!myContentOpen)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>My Content</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${myContentOpen ? 'rotate-180' : ''}`} />
            </button>
            {myContentOpen && (
              <div className="flex flex-col gap-0.5 pl-6 ml-4 border-l border-zinc-200 mt-0.5 animate-fadeIn">
                <Suspense fallback={<div className="text-[10px] text-zinc-400 pl-3">Loading links...</div>}>
                  <ContentLinks pathname={pathname} />
                </Suspense>
              </div>
            )}
          </div>

          {/* Contacts */}
          <Link
            href="/dashboard/contacts"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition ${
              pathname === '/dashboard/contacts'
                ? 'bg-zinc-100 border border-zinc-950 text-zinc-950 font-bold'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Contacts
          </Link>

          {/* Rewind */}
          <Link
            href="/dashboard/rewind"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition ${
              pathname === '/dashboard/rewind'
                ? 'bg-zinc-100 border border-zinc-950 text-zinc-950 font-bold'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
            }`}
          >
            <RefreshCcw className="w-4 h-4" />
            Rewind
          </Link>

          {/* Collapsible Analytics */}
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => setAnalyticsOpen(!analyticsOpen)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${analyticsOpen ? 'rotate-180' : ''}`} />
            </button>
            {analyticsOpen && (
              <div className="flex flex-col gap-0.5 pl-6 ml-4 border-l border-zinc-200 mt-0.5 animate-fadeIn">
                <Link
                  href="/dashboard/analytics"
                  className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                    pathname === '/dashboard/analytics'
                      ? 'bg-zinc-100 border border-zinc-950 text-zinc-950 font-bold'
                      : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                  }`}
                >
                  Overview
                </Link>
              </div>
            )}
          </div>

          {/* Support */}
          <Link
            href="/dashboard/support"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition ${
              pathname === '/dashboard/support'
                ? 'bg-zinc-100 border border-zinc-950 text-zinc-950 font-bold'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Support
          </Link>

          {/* Billing & Add-ons */}
          <Link
            href="/dashboard/billing"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition ${
              pathname === '/dashboard/billing'
                ? 'bg-zinc-100 border border-zinc-950 text-zinc-950 font-bold'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Billing & Add-ons
          </Link>

          {/* Sandbox Simulator */}
          <Link
            href="/dashboard/simulator"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition ${
              pathname === '/dashboard/simulator'
                ? 'bg-zinc-100 border border-zinc-950 text-zinc-950 font-bold'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            Sandbox Simulator
          </Link>
        </nav>
      </div>

      {/* Sidebar Footer Metrics */}
      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-3 mt-3">
        {/* DM Quota */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
            <span>DMs sent</span>
            <span className="font-bold text-zinc-850">{totalUsed}/{totalLimit}</span>
          </div>
          <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
            <div className="h-full bg-[#d2ff00] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* IG Accounts Quota */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
            <span>IG accounts</span>
            <span className="font-bold text-zinc-850">{accounts.length}/{accountLimit}</span>
          </div>
          <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
            <div className="h-full bg-[#d2ff00] rounded-full transition-all duration-500" style={{ width: `${(accounts.length / accountLimit) * 100}%` }} />
          </div>
        </div>

        {/* Upgrade Banner / CTA */}
        {workspace.plan === 'free' ? (
          <Link 
            href="/dashboard/billing"
            className="w-full px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100/50 transition flex items-center justify-center gap-1.5 text-xs text-purple-700 font-bold shadow-inner"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-500 shrink-0" /> Upgrade to Pro
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
          <div className="bg-[#0b0c10] text-white px-6 py-2 flex items-center justify-between text-[11px] relative z-30 font-medium">
            <div className="flex items-center gap-2 pr-4">
              <span>Upgrade to unlock every feature and accelerate your growth.</span>
              <Link href="/dashboard/billing" className="bg-[#d2ff00] text-zinc-950 px-2.5 py-0.5 rounded-full font-extrabold text-[10px] hover:bg-[#c1f000] transition">
                Try 14 Days For Free
              </Link>
              <Link href="/dashboard/billing" className="text-white hover:text-zinc-300 underline font-bold ml-2">
                View pricing
              </Link>
            </div>
            <button onClick={dismissUpgradeBanner} className="text-zinc-400 hover:text-white transition">
              <X className="w-3.5 h-3.5" />
            </button>
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
