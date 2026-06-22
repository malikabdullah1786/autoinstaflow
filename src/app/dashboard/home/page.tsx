"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Sparkles, 
  Zap, 
  MessageSquare, 
  ArrowRight, 
  Activity, 
  Layers, 
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { getAccountLimitForPlan } from '@/lib/db';

export default function HomeDashboard() {
  const router = useRouter();
  const { 
    workspace, 
    accounts, 
    activeAccountId, 
    automations, 
    events, 
    simulateInstagramInteraction 
  } = useApp();

  // Simulator State
  const [simUsername, setSimUsername] = useState('john_doe');
  const [simText, setSimText] = useState('LINK please');
  const [simTrigger, setSimTrigger] = useState<'comment' | 'dm' | 'story_reply'>('comment');
  const [simPostId, setSimPostId] = useState('post_101');
  const [simIsFollowing, setSimIsFollowing] = useState(true);
  const [simEmail, setSimEmail] = useState('');
  const [simOutcome, setSimOutcome] = useState<{ success: boolean; outcome: string; details?: string } | null>(null);

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  const liveAutomations = automations.filter(a => a.instagram_account_id === activeAccountId && a.status === 'live');
  const pausedAutomations = automations.filter(a => a.instagram_account_id === activeAccountId && a.status === 'paused');

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccountId) return;
    
    const res = await simulateInstagramInteraction(
      simText,
      simUsername.replace('@', ''),
      simTrigger,
      simTrigger === 'comment' ? {
        post_id: 'post_101',
        post_url: '',
        post_thumbnail: ''
      } : undefined,
      { isFollowing: simIsFollowing, email: simEmail }
    );
    
    setSimOutcome(res);
  };

  // Metrics
  const activeAutCount = automations.filter(a => a.instagram_account_id === activeAccountId && a.status === 'live').length;
  const totalDMsSentToday = events.filter(
    ev => ev.workspace_id === workspace?.id && 
          ev.event_type === 'dm_sent' && 
          new Date(ev.occurred_at).toDateString() === new Date().toDateString()
  ).length;

  const totalLeadsCaptured = events.filter(
    ev => ev.workspace_id === workspace?.id && ev.event_type === 'email_collected'
  ).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Welcome back, <span className="text-gradient">{workspace?.name}</span>
          </h1>
          <p className="text-sm text-zinc-505">
            {activeAccount ? (
              <span className="flex items-center gap-1.5 mt-1.5">
                <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                Connected as <strong className="text-zinc-800">@{activeAccount.username}</strong>
              </span>
            ) : (
              <span className="text-red-650 font-bold block mt-1.5">Connect an Instagram account in the sidebar to get started!</span>
            )}
          </p>
        </div>

        {activeAccount && (
          <div className="flex items-center gap-3">
            <Link href="/dashboard/automations/new" className="btn-gradient px-4 py-2.5 flex items-center gap-1.5 text-sm">
              <Plus className="w-4 h-4" /> Create Automation
            </Link>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 flex flex-col gap-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Today's DMs Sent</span>
          <span className="text-3xl font-extrabold text-zinc-900">{totalDMsSentToday}</span>
          <span className="text-[10px] text-zinc-450 font-medium">Reset at midnight</span>
        </div>

        <div className="glass-panel p-5 flex flex-col gap-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Live Automations</span>
          <span className="text-3xl font-extrabold text-purple-600">{activeAutCount}</span>
          <span className="text-[10px] text-zinc-450 font-medium">Running in background</span>
        </div>

        <div className="glass-panel p-5 flex flex-col gap-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Leads Captured</span>
          <span className="text-3xl font-extrabold text-pink-600">{totalLeadsCaptured}</span>
          <span className="text-[10px] text-zinc-450 font-medium">Via Email Gating</span>
        </div>

        <div className="glass-panel p-5 flex flex-col gap-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Connected Accounts</span>
          <span className="text-3xl font-extrabold text-blue-600">{accounts.length}</span>
          <span className="text-[10px] text-zinc-450 font-medium">Limit: {workspace ? getAccountLimitForPlan(workspace.plan) : 1}</span>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle Column: Account Status & Automations */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" /> Account Overview
            </h2>
            <p className="text-xs text-zinc-500">
              Your connected Instagram account and automation status.
            </p>
          </div>

          {!activeAccount ? (
            <div className="glass-panel p-8 text-center flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-zinc-400" />
              <p className="text-zinc-500 text-sm">Please link an Instagram account in the sidebar to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Connected Account Card */}
              <div className="glass-panel p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px] shrink-0">
                  <div className="w-full h-full rounded-full bg-zinc-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-extrabold text-zinc-900">@{activeAccount.username}</span>
                  <span className="text-xs text-zinc-500">Instagram Business Account</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-max mt-0.5 ${
                    activeAccount.token_status === 'active'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {activeAccount.token_status === 'active' ? '● Connected' : '⚠ Token Invalid'}
                  </span>
                </div>
              </div>

              {/* Automations Status */}
              {liveAutomations.length === 0 && pausedAutomations.length === 0 ? (
                <div className="glass-panel p-8 text-center flex flex-col items-center gap-4">
                  <Layers className="w-10 h-10 text-zinc-300" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-zinc-700">No automations yet</p>
                    <p className="text-xs text-zinc-400">Create your first automation to start capturing leads automatically.</p>
                  </div>
                  <Link href="/dashboard/automations/new" className="btn-gradient px-5 py-2 flex items-center gap-1.5 text-sm">
                    <Plus className="w-4 h-4" /> Create Automation
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {liveAutomations.map(auto => (
                    <Link
                      key={auto.id}
                      href={`/dashboard/automations/${auto.id}`}
                      className="glass-panel p-4 flex items-center justify-between hover:border-purple-200 transition"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-zinc-900">{auto.name}</span>
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold">{auto.trigger_type}{' → '}{auto.action_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">LIVE</span>
                        <ArrowRight className="w-4 h-4 text-zinc-400" />
                      </div>
                    </Link>
                  ))}
                  {pausedAutomations.map(auto => (
                    <Link
                      key={auto.id}
                      href={`/dashboard/automations/${auto.id}`}
                      className="glass-panel p-4 flex items-center justify-between opacity-60 hover:opacity-80 transition"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-zinc-900">{auto.name}</span>
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold">{auto.trigger_type}{' → '}{auto.action_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">PAUSED</span>
                        <ArrowRight className="w-4 h-4 text-zinc-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Webhook / Web Sandbox Simulator */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 border-purple-100 bg-gradient-to-b from-white to-purple-50/10 shadow-xl">
            <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-600 shrink-0" /> Sandbox Webhook Simulator
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
              Since we are in a sandbox simulation, you can mock an Instagram comment or message to instantly test your live automations and watch metrics update.
            </p>

            {!activeAccount ? (
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center text-xs text-zinc-500 font-medium">
                Connect an account first to unlock testing.
              </div>
            ) : automations.filter(a => a.instagram_account_id === activeAccountId && a.status === 'live').length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-50 border border-yellow-200 text-center text-xs text-yellow-750 font-medium flex flex-col gap-2 items-center">
                <span>You have no LIVE automations to test.</span>
                <Link href="/dashboard/automations/new" className="underline text-purple-650 font-bold">
                  Create one now
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSimulate} className="flex flex-col gap-4">
                {/* Simulator inputs */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Sender Username</label>
                  <input 
                    type="text" 
                    required 
                    value={simUsername}
                    onChange={(e) => setSimUsername(e.target.value)}
                    className="glass-input text-xs" 
                    placeholder="e.g. fashion_influencer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Trigger Event</label>
                    <select 
                      value={simTrigger}
                      onChange={(e) => setSimTrigger(e.target.value as any)}
                      className="glass-input text-xs"
                    >
                      <option value="comment">Comment on Post</option>
                      <option value="dm">Direct Message</option>
                      <option value="story_reply">Story Reply</option>
                    </select>
                  </div>

                  {simTrigger === 'comment' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Post ID / Media ID</label>
                      <input 
                        type="text"
                        required
                        value={simPostId}
                        onChange={(e) => setSimPostId(e.target.value)}
                        className="glass-input text-xs"
                        placeholder="e.g. post_101"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                    {simTrigger === 'comment' ? 'Comment Text' : 'Message Text'}
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={simText}
                    onChange={(e) => setSimText(e.target.value)}
                    className="glass-input text-xs" 
                    placeholder="e.g. Send me the LINK!"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1 pt-2 border-t border-zinc-200">
                  <div className="flex flex-col justify-center">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Follow Status</label>
                    <label className="relative flex items-center gap-2 cursor-pointer py-1.5 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-zinc-350 transition">
                      <input 
                        type="checkbox" 
                        checked={simIsFollowing}
                        onChange={(e) => setSimIsFollowing(e.target.checked)}
                        className="rounded border-zinc-300 text-purple-650 focus:ring-purple-500 bg-white w-3.5 h-3.5"
                      />
                      <span className="text-[10px] text-zinc-600 select-none font-medium">User is Following</span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">User Email (Gates)</label>
                    <input 
                      type="text" 
                      value={simEmail}
                      onChange={(e) => setSimEmail(e.target.value)}
                      className="glass-input text-xs" 
                      placeholder="e.g. user@gmail.com"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold transition text-xs text-white shadow-md"
                >
                  Fire Simulated Hook
                </button>

                {simOutcome && (
                  <div className={`p-3 rounded-lg border text-xs leading-relaxed ${simOutcome.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-250 text-yellow-750'}`}>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {simOutcome.success ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-yellow-600" />}
                      <span>{simOutcome.success ? 'Automation Executed' : 'Hook Blocked / Ignored'}</span>
                    </div>
                    <p className="font-semibold text-zinc-700">{simOutcome.details}</p>
                  </div>
                )}
              </form>
            )}

            {/* Sandbox Activity Feed */}
            <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Simulated Event Log</span>
                <span className="text-[9px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-semibold">Live Feed</span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                {events.filter(ev => ev.automation_id !== '').slice(0, 4).map(ev => (
                  <div key={ev.id} className="p-2 rounded bg-zinc-50 border border-zinc-200 flex justify-between gap-2 text-[10px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-zinc-800">@{ev.instagram_username}</span>
                      <span className="text-zinc-500 truncate max-w-[150px]">"{ev.metadata?.text}"</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`font-bold px-1 rounded uppercase tracking-wider text-[8px] ${
                        ev.event_type === 'dm_sent' ? 'bg-green-50 text-green-700 border border-green-200' : 
                        ev.event_type === 'dm_blocked_quota' ? 'bg-red-50 text-red-700 border border-red-200' : 
                        'bg-yellow-50 text-yellow-700 border border-yellow-250'
                      }`}>{ev.event_type.split('_')[1]}</span>
                      <span className="text-[9px] text-zinc-400">{new Date(ev.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
                {events.filter(ev => ev.automation_id !== '').length === 0 && (
                  <span className="text-[10px] text-zinc-400 text-center py-4">No events triggered yet.</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
