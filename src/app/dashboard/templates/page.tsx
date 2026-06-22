"use client";

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Layers, ArrowRight, Zap, MessageSquare, Compass, Copy } from 'lucide-react';

export default function TemplatesPage() {
  const { activeAccountId, accounts } = useApp();
  const activeAccount = accounts.find(a => a.id === activeAccountId);

  const templates = [
    {
      id: 'comment-dm',
      name: 'Send Link on Comments',
      description: 'Reply to comments on your posts or reels automatically and send a direct message containing your conversion link.',
      icon: MessageSquare,
      category: 'Comments',
      difficulty: 'Easy',
      badge: 'Popular',
    },
    {
      id: 'story-dm',
      name: 'Reply to Story Mentions',
      description: 'Automatically DM users who mention your account or reply to your Instagram stories, engaging them when interest is highest.',
      icon: Compass,
      category: 'Stories',
      difficulty: 'Medium',
      badge: 'Highly Effective',
    },
    {
      id: 'dm-gate',
      name: 'DM Keyword Auto-Responder',
      description: 'Trigger automated messages and links when someone DMs you a specific keyword (e.g. "START", "PDF", "COUPON").',
      icon: Zap,
      category: 'Direct Messages',
      difficulty: 'Easy',
      badge: 'Lead Gen',
    }
  ];

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Automation Templates</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Launch proven conversation workflows in seconds. Select a template to begin.
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map(tpl => {
          const Icon = tpl.icon;
          return (
            <div 
              key={tpl.id}
              className="glass-panel p-6 flex flex-col justify-between hover:border-zinc-900 transition duration-300 relative group bg-white border border-zinc-200 rounded-2xl shadow-sm"
            >
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-900 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d2ff00]/30 text-zinc-800 border border-[#d2ff00]">
                    {tpl.badge}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-extrabold text-zinc-900 group-hover:text-zinc-950 transition">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-150 pt-4 mt-6">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  {tpl.category} • {tpl.difficulty}
                </span>
                <Link
                  href={activeAccountId ? `/dashboard/automations/new?template=${tpl.id}` : '#'}
                  className="flex items-center gap-1.5 text-xs text-zinc-950 font-bold hover:underline"
                >
                  <span>Use Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
