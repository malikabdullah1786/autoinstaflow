"use client";

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { AlertCircle, Webhook, Plus, ArrowRight } from 'lucide-react';

export default function MyContentPage() {
  const { activeAccountId, accounts, automations } = useApp();
  const activeAccount = accounts.find(a => a.id === activeAccountId);

  if (!activeAccountId || !activeAccount) {
    return (
      <div className="glass-panel p-8 text-center flex flex-col items-center gap-4">
        <AlertCircle className="w-12 h-12 text-zinc-400" />
        <p className="text-zinc-400 text-sm">Please link an Instagram account in the sidebar to view your content.</p>
      </div>
    );
  }

  const accountAutomations = automations.filter(a => a.instagram_account_id === activeAccountId);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">My Content</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Connected as <strong>@{activeAccount.username}</strong> — automations run in real-time via Meta webhooks.
        </p>
      </div>

      {/* Webhook Info Banner */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-purple-100 bg-gradient-to-r from-purple-50/50 to-pink-50/30">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
          <Webhook className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-extrabold text-zinc-900">Content is processed via Meta Webhooks</span>
          <span className="text-xs text-zinc-500 leading-relaxed">
            When someone comments on your post or replies to your story, the Meta platform sends a real-time webhook to your automations. No manual post import is needed — just create an automation and it activates instantly on any incoming interaction.
          </span>
        </div>
      </div>

      {/* Automations for this account */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-zinc-900">Your Automations</h2>
          <Link href="/dashboard/automations/new" className="btn-gradient px-4 py-2 flex items-center gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" /> New Automation
          </Link>
        </div>

        {accountAutomations.length === 0 ? (
          <div className="glass-panel p-10 text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center">
              <Webhook className="w-7 h-7 text-zinc-400" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-zinc-700">No automations yet</p>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Create an automation to start auto-replying to comments, story replies, and DMs from @{activeAccount.username}.
              </p>
            </div>
            <Link href="/dashboard/automations/new" className="btn-gradient px-5 py-2.5 flex items-center gap-1.5 text-sm">
              <Plus className="w-4 h-4" /> Create First Automation
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {accountAutomations.map(auto => (
              <Link
                key={auto.id}
                href={`/dashboard/automations/${auto.id}`}
                className="glass-panel p-4 flex items-center justify-between hover:border-purple-200 transition group"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-zinc-900 group-hover:text-purple-700 transition">{auto.name}</span>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wide">
                    {auto.trigger_type}{' → '}{auto.action_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    auto.status === 'live'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                  }`}>
                    {auto.status === 'live' ? '● LIVE' : 'PAUSED'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-500 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
