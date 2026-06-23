"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  AlertCircle, 
  HelpCircle, 
  LogOut, 
  ShieldCheck,
  CheckCircle
} from 'lucide-react';

import { getAccountLimitForPlan } from '@/lib/db';

export default function ConnectPage() {
  const { 
    user, 
    workspace, 
    accounts, 
    linkRealInstagramAccount,
    addInstagramAccount,
    removeInstagramAccount,
    signOut 
  } = useApp();

  const router = useRouter();
  const accountLimit = workspace ? getAccountLimitForPlan(workspace.plan) : 1;
  const [linkError, setLinkError] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundAccount, setFoundAccount] = useState<{
    username: string;
    name: string;
    profile_picture_url: string;
    followers_count: number;
    media_count: number;
  } | null>(null);

  const [oauthStatus, setOauthStatus] = useState<{
    loading: boolean;
    step: string;
    error: string;
    success: boolean;
  }>({
    loading: false,
    step: '',
    error: '',
    success: false
  });

  // If already connected, redirect to home (Temporarily disabled to allow testing/multiple accounts)
  // useEffect(() => {
  //   if (user && workspace && accounts.length > 0) {
  //     router.push('/dashboard/home');
  //   }
  // }, [user, workspace, accounts, router]);

  // Handle Meta OAuth Callback
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setOauthStatus({
        loading: true,
        step: 'Initiating Meta API handshake...',
        error: '',
        success: false
      });

      const exchangeCode = async () => {
        try {
          setOauthStatus(prev => ({ ...prev, step: 'Exchanging authorization code with Meta servers...' }));
          // IMPORTANT: redirectUri must EXACTLY match what was used when initiating the OAuth flow.
          // Our authorize URL uses the root domain (e.g. https://autoinstaflow-pied.vercel.app/)
          // so we derive that here — NOT /dashboard/connect.
          const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || window.location.origin + '/';
          
          const res = await fetch('/api/auth/instagram/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri })
          });
          const data = await res.json();
          
          if (data.error) {
            setOauthStatus({
              loading: false,
              step: '',
              error: data.error,
              success: false
            });
            setLinkError(data.error);
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }

          setOauthStatus(prev => ({ ...prev, step: `Successfully authorized @${data.username}! Syncing and registering with your Auto Insta Flow workspace...` }));
          
          const linkRes = await linkRealInstagramAccount({
            instagramUserId: data.instagramUserId,
            username: data.username,
            fullName: data.fullName,
            profilePicUrl: data.profilePic,
            followersCount: data.followersCount,
            mediaCount: data.mediaCount,
            accessToken: data.accessToken,
            tokenExpiresAt: data.tokenExpiresAt
          });

          if (linkRes.success) {
            setOauthStatus({
              loading: false,
              step: '',
              error: '',
              success: true
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            router.push('/dashboard/home');
          } else {
            setOauthStatus({
              loading: false,
              step: '',
              error: linkRes.error || 'Failed to save account details in database.',
              success: false
            });
            setLinkError(linkRes.error || 'Failed to save account details in database.');
            window.history.replaceState({}, document.title, window.location.pathname);
          }

        } catch (e: any) {
          const errMsg = e.message || 'An unexpected error occurred during network transfer.';
          setOauthStatus({
            loading: false,
            step: '',
            error: errMsg,
            success: false
          });
          setLinkError(errMsg);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };

      exchangeCode();
    }
  }, [linkRealInstagramAccount]);

  const handleSearchAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const usernameClean = usernameInput.trim().replace('@', '');
    if (!usernameClean) return;

    setIsSearching(true);
    setLinkError('');
    setFoundAccount(null);

    try {
      const res = await fetch('/api/instagram/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameClean })
      });
      const resData = await res.json();
      if (!res.ok || resData.error) {
        setLinkError(resData.error || 'Failed to find account.');
      } else {
        setFoundAccount(resData.data);
      }
    } catch (err: any) {
      setLinkError(err.message || 'An error occurred during account search.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInstagramLogin = () => {
    setLinkError('');
    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || '888924804248426';
    const rawRedirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || (window.location.origin + '/dashboard/connect');
    const redirectUri = encodeURIComponent(rawRedirectUri);
    const scope = 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_manage_insights,instagram_business_content_publish';
    const url = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    window.location.href = url;
  };

  if (oauthStatus.loading) {
    return (
      <div className="min-h-screen bg-zinc-50/30 flex flex-col items-center justify-center font-sans text-zinc-800 p-6">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-100/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-100/30 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md flex flex-col items-center text-center gap-8 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-xl text-white shadow-lg animate-pulse">
              A
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-zinc-900">
              Auto Insta Flow
            </span>
          </div>

          <div className="p-8 w-full bg-white border border-zinc-200 rounded-2xl flex flex-col items-center gap-6 shadow-xl">
            <div className="w-14 h-14 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin mb-2" />
            
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-zinc-900">Meta API Connection</h3>
              <p className="text-xs text-zinc-500 leading-relaxed px-4">
                {oauthStatus.step}
              </p>
            </div>

            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-full w-2/3 rounded-full animate-pulse" />
            </div>

            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
              Please do not close this window
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Top Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white shadow-md">
            A
          </div>
          <span className="font-extrabold text-lg tracking-tight text-zinc-950">
            Auto Insta Flow
          </span>
        </div>

        <button 
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-xl w-full mx-auto">
        <div className="w-full flex flex-col items-center gap-8">
          
          {/* Centered Headers */}
          <div className="text-center flex flex-col gap-3">
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight leading-tight">
              Connect your Creator or <br />Business Instagram
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-lg mx-auto">
              We'll connect through Meta official login - make sure you are logged in in a Creator or Business account in the browser.{' '}
              <a href="#" className="text-purple-600 hover:underline font-bold inline-flex items-center gap-0.5">
                Need Help? <HelpCircle className="w-3.5 h-3.5 inline" />
              </a>
            </p>
          </div>

          {/* Feedback/Error messages */}
          {linkError && (
            <div className="w-full p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error:</span> {linkError}
              </div>
            </div>
          )}

          {/* Connect Wizard Container */}
          <div className="w-full bg-white border border-zinc-200 shadow-xl rounded-2xl p-6 sm:p-8 flex flex-col gap-6 text-center py-8">
            <form onSubmit={handleSearchAccount} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Your Instagram username</label>
                <div className="flex items-center bg-white border border-zinc-300 focus-within:border-purple-300 focus-within:ring-1 focus-within:ring-purple-300 rounded-xl overflow-hidden transition">
                  <span className="pl-4 text-zinc-400 text-sm font-semibold select-none">@</span>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="your_username"
                    className="w-full bg-transparent pl-1.5 pr-4 py-3 text-sm text-zinc-900 outline-none border-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-3.5 btn-gradient hover:opacity-95 disabled:opacity-50 text-white text-sm font-bold transition rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span>Finding account...</span>
                  </>
                ) : (
                  <span>Find account</span>
                )}
              </button>
            </form>

            {!foundAccount && (
              <>
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-zinc-200"></div>
                  <span className="flex-shrink mx-4 text-zinc-400 text-xs font-semibold">Or Connect Directly</span>
                  <div className="flex-grow border-t border-zinc-200"></div>
                </div>

                <button
                  onClick={handleInstagramLogin}
                  className="w-full py-3.5 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-zinc-700 text-sm font-bold transition shadow-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  <span>Connect with Meta OAuth</span>
                </button>
              </>
            )}

            {foundAccount && (
              <div className="flex flex-col gap-5 mt-2">
                {/* Account Found box */}
                <div className="p-4 rounded-xl bg-white border border-purple-200 text-left flex flex-col gap-3 relative overflow-hidden">
                  <div className="flex items-center gap-1.5 text-purple-600 text-xs font-bold">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Account found</span>
                  </div>

                  {/* Profile details */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                        <img 
                          src={foundAccount.profile_picture_url} 
                          alt={foundAccount.name}
                          className="w-full h-full rounded-full border-2 border-white object-cover animate-fadeIn"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-extrabold text-zinc-900">
                        {foundAccount.name}
                      </span>
                      <span className="text-xs text-zinc-500">@{foundAccount.username}</span>
                      <span className="text-[10px] text-zinc-400 font-semibold mt-1">
                        {foundAccount.followers_count.toLocaleString()} followers &bull; {foundAccount.media_count} posts
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleInstagramLogin}
                  className="w-full py-4 rounded-xl btn-gradient hover:opacity-95 text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  <span>Sign in as @{foundAccount.username}</span>
                </button>
              </div>
            )}
            

          </div>

          {accounts.length > 0 && (
            <div className="w-full bg-white border border-zinc-200 shadow-xl rounded-2xl p-6 flex flex-col gap-4 text-zinc-950">
              <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider text-left border-b border-zinc-150 pb-2">
                Connected Accounts ({accounts.length}/{accountLimit})
              </h2>
              <div className="flex flex-col gap-3">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition bg-zinc-50/20">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {acc.profile_picture_url ? (
                        <img src={acc.profile_picture_url} alt={acc.username} className="w-10 h-10 rounded-full object-cover border border-zinc-200 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shrink-0" />
                      )}
                      <div className="flex flex-col text-left overflow-hidden">
                        <span className="text-sm font-extrabold text-zinc-900 truncate">@{acc.username}</span>
                        <span className="text-[10px] text-zinc-450 font-semibold mt-0.5">
                          {acc.followers_count?.toLocaleString() ?? 0} followers
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to disconnect @${acc.username}? This will pause all associated automations.`)) {
                          removeInstagramAccount(acc.id);
                        }
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-bold rounded-xl border border-red-150 transition shadow-sm shrink-0"
                    >
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secure indicator */}
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
            Meta Secure OAuth Authorization
          </div>

        </div>
      </main>



    </div>
  );
}
