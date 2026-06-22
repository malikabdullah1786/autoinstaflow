"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  BarChart3, 
  Map, 
  TrendingUp, 
  MousePointer, 
  MessageSquare, 
  Lock, 
  Sparkles,
  ArrowUpRight,
  HelpCircle,
  Globe
} from 'lucide-react';

export default function AnalyticsPage() {
  const { workspace, automations, events, upgradePlan } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'audience'>('overview');

  const isFreePlan = workspace?.plan === 'free';

  // Calculate metrics
  const totalSent = events.filter(e => e.event_type === 'dm_sent').length;
  const totalClicks = events.filter(e => e.event_type === 'link_clicked').length;
  const ctr = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : '0.0';

  // Keyword counts
  const keywordStats: { [kw: string]: number } = {};
  events.forEach(e => {
    if (e.event_type === 'dm_sent' && e.metadata?.keyword) {
      const kw = e.metadata.keyword.toLowerCase();
      keywordStats[kw] = (keywordStats[kw] || 0) + 1;
    }
  });

  const sortedKeywords = Object.entries(keywordStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Audience Mock Stats
  const audienceGeoData = [
    { country: 'United States', visitors: 1420, conversion: '34.2%' },
    { country: 'United Kingdom', visitors: 850, conversion: '28.9%' },
    { country: 'Brazil', visitors: 620, conversion: '41.5%' },
    { country: 'Germany', visitors: 480, conversion: '22.1%' },
    { country: 'India', visitors: 390, conversion: '36.8%' }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Analytics</h1>
        <p className="text-xs text-zinc-505">Track the click rates, keywords performance, and subscriber conversions of your bots.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold transition-all relative ${activeTab === 'overview' ? 'text-purple-600 border-b-2 border-purple-600 font-extrabold' : 'text-zinc-500 hover:text-zinc-800'}`}
        >
          Overview Statistics
        </button>
        <button
          onClick={() => setActiveTab('audience')}
          className={`px-4 py-2.5 text-xs font-bold transition-all relative ${activeTab === 'audience' ? 'text-purple-600 border-b-2 border-purple-600 font-extrabold' : 'text-zinc-500 hover:text-zinc-800'}`}
        >
          Audience Insights
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="flex flex-col gap-6">
          {/* Metrics summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total DM Deliveries</span>
                <span className="text-3xl font-extrabold text-zinc-900">{totalSent.toLocaleString()}</span>
                <span className="text-[10px] text-green-650 flex items-center gap-0.5 mt-1 font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% this week
                </span>
              </div>
              <MessageSquare className="w-10 h-10 text-purple-600/20" />
            </div>

            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Link Click-Throughs</span>
                <span className="text-3xl font-extrabold text-pink-600">{totalClicks.toLocaleString()}</span>
                <span className="text-[10px] text-green-655 flex items-center gap-0.5 mt-1 font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +8.2% this week
                </span>
              </div>
              <MousePointer className="w-10 h-10 text-pink-600/20" />
            </div>

            <div className="glass-panel p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Average CTR</span>
                <span className="text-3xl font-extrabold text-blue-600">{ctr}%</span>
                <span className="text-[10px] text-zinc-500 mt-1 font-semibold">
                  Goal: &gt;25% CTR
                </span>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-650/20" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Keywords */}
            <div className="glass-panel p-6 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-150 pb-2">
                Top Performing Keywords
              </h3>

              <div className="flex flex-col gap-3">
                {sortedKeywords.map(([kw, count], idx) => {
                  const pctWidth = totalSent > 0 ? (count / totalSent) * 100 : 0;
                  return (
                    <div key={kw} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-semibold text-zinc-650">
                        <span className="text-zinc-800 font-bold">#{idx + 1} {kw.toUpperCase()}</span>
                        <span>{count} DMs sent</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${pctWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {sortedKeywords.length === 0 && (
                  <p className="text-xs text-zinc-500 py-6 text-center">No keywords detected yet. Fire a webhook from the dashboard to simulate interactions!</p>
                )}
              </div>
            </div>

            {/* Campaign efficiency info */}
            <div className="glass-panel p-6 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-150 pb-2">
                  Campaign Conversion Insights
                </h3>
                <p className="text-xs text-zinc-505 leading-relaxed mt-1">
                  Automated links deliver up to 5x higher engagement compared to bio links. By configuring follow gating, you turn casual commenters into loyal subscribers instantly.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-purple-50 border border-purple-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-purple-950 leading-normal font-semibold">
                  Pro-Tip: Keep keyword replies short, and use action-oriented titles on your target landing page to increase click rates.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* AUDIENCE INSIGHTS (GATED) */
        <div className="relative">
          {isFreePlan && (
            <div className="absolute inset-0 bg-zinc-100/50 backdrop-blur-[6px] rounded-2xl flex flex-col items-center justify-center text-center p-6 z-30">
              <div className="glass-panel bg-white p-6 max-w-sm w-full flex flex-col gap-4 border border-zinc-200 shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mx-auto shadow-inner">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-extrabold text-zinc-900">Unlock Audience Insights</h3>
                  <p className="text-[11px] text-zinc-505 leading-relaxed">
                    Paid plan subscribers unlock geographical analytics, visitor locations, and conversion tracking per country.
                  </p>
                </div>
                <button
                  onClick={() => upgradePlan('pro', 'monthly')}
                  className="w-full btn-gradient py-2.5 text-xs flex items-center justify-center gap-1.5 font-bold shadow-md"
                >
                  <Sparkles className="w-4 h-4" /> Upgrade to Pro ($15/mo)
                </button>
              </div>
            </div>
          )}

          {/* Blurred/Mocked visual content */}
          <div className={`flex flex-col gap-6 ${isFreePlan ? 'select-none pointer-events-none filter blur-[2px]' : ''}`}>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="glass-panel p-4 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Top Location</span>
                <span className="text-xl font-extrabold text-zinc-900">United States (39%)</span>
              </div>
              <div className="glass-panel p-4 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Active Cities</span>
                <span className="text-xl font-extrabold text-zinc-900">New York, London, Lisbon</span>
              </div>
              <div className="glass-panel p-4 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Mobile Conversion</span>
                <span className="text-xl font-extrabold text-zinc-900">88.4% Mobile Devices</span>
              </div>
            </div>

            <div className="glass-panel p-6 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-150 pb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-purple-650" /> Geography & Conversion Breakdown
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-150 text-[10px] text-zinc-500 font-bold uppercase bg-zinc-50">
                      <th className="p-3">Country Name</th>
                      <th className="p-3">Unique Visitors</th>
                      <th className="p-3 text-right">Conversion Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {audienceGeoData.map(row => (
                      <tr key={row.country} className="hover:bg-zinc-50/50">
                        <td className="p-3 font-semibold text-zinc-900 flex items-center gap-2">
                          <Map className="w-3.5 h-3.5 text-zinc-450" /> {row.country}
                        </td>
                        <td className="p-3">{row.visitors.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-green-600">{row.conversion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
