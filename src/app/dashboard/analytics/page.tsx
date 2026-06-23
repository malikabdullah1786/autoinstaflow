"use client";

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  TrendingUp, 
  MousePointer, 
  MessageSquare, 
  Sparkles,
  ArrowUpRight,
  Mail,
  UserCheck
} from 'lucide-react';
import { AutomationEvent } from '@/lib/db';


// Component for the SVG Line Chart
function SVGChart({ data }: { data: { date: string; sent: number; clicks: number }[] }) {
  const width = 500;
  const height = 180;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const maxVal = Math.max(...data.map(d => Math.max(d.sent, d.clicks)), 10);
  
  // Generate points
  const pointsSent = data.map((d, i) => {
    const x = paddingLeft + (i * (width - paddingLeft - paddingRight)) / (data.length - 1);
    const y = height - paddingBottom - (d.sent / maxVal) * (height - paddingTop - paddingBottom);
    return { x, y };
  });

  const pointsClicks = data.map((d, i) => {
    const x = paddingLeft + (i * (width - paddingLeft - paddingRight)) / (data.length - 1);
    const y = height - paddingBottom - (d.clicks / maxVal) * (height - paddingTop - paddingBottom);
    return { x, y };
  });

  const sentLine = pointsSent.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const clicksLine = pointsClicks.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const sentArea = pointsSent.length > 0
    ? `${sentLine} L ${pointsSent[pointsSent.length - 1].x.toFixed(1)} ${(height - paddingBottom).toFixed(1)} L ${pointsSent[0].x.toFixed(1)} ${(height - paddingBottom).toFixed(1)} Z`
    : '';

  const clicksArea = pointsClicks.length > 0
    ? `${clicksLine} L ${pointsClicks[pointsClicks.length - 1].x.toFixed(1)} ${(height - paddingBottom).toFixed(1)} L ${pointsClicks[0].x.toFixed(1)} ${(height - paddingBottom).toFixed(1)} Z`
    : '';

  // Grid lines
  const gridLines = [0.25, 0.5, 0.75, 1].map((ratio) => {
    const val = Math.round(ratio * maxVal);
    const y = height - paddingBottom - ratio * (height - paddingTop - paddingBottom);
    return { y, val };
  });

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
            <span className="text-zinc-650">DMs Sent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-500 inline-block"></span>
            <span className="text-zinc-650">Link Clicks</span>
          </div>
        </div>
        <span className="text-[10px] text-zinc-400 font-semibold">7-Day Engagement Trend</span>
      </div>
      <div className="relative w-full h-[180px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#db2777" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#db2777" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((gl, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={gl.y}
                x2={width - paddingRight}
                y2={gl.y}
                stroke="#e4e4e7"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={gl.y + 3}
                className="text-[9px] font-extrabold text-zinc-400 text-right fill-current"
                textAnchor="end"
              >
                {gl.val}
              </text>
            </g>
          ))}

          {/* Areas */}
          {sentArea && <path d={sentArea} fill="url(#purpleGrad)" />}
          {clicksArea && <path d={clicksArea} fill="url(#pinkGrad)" />}

          {/* Lines */}
          {sentLine && (
            <path
              d={sentLine}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {clicksLine && (
            <path
              d={clicksLine}
              fill="none"
              stroke="#db2777"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Delivery dots */}
          {pointsSent.map((p, idx) => (
            <circle
              key={`s-${idx}`}
              cx={p.x}
              cy={p.y}
              r="3"
              className="fill-white stroke-purple-600 stroke-[2] transition-all hover:r-[4px]"
            />
          ))}

          {/* Click dots */}
          {pointsClicks.map((p, idx) => (
            <circle
              key={`c-${idx}`}
              cx={p.x}
              cy={p.y}
              r="2.5"
              className="fill-white stroke-pink-500 stroke-[1.5] transition-all hover:r-[3.5px]"
            />
          ))}

          {/* X Axis Labels */}
          {data.map((d, i) => {
            const x = paddingLeft + (i * (width - paddingLeft - paddingRight)) / (data.length - 1);
            return (
              <text
                key={i}
                x={x}
                y={height - 6}
                className="text-[9px] font-bold text-zinc-500 fill-current text-center"
                textAnchor="middle"
              >
                {d.date}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { automations, events } = useApp();

  const activeEvents = events;

  // Calculate metrics
  const totalSent = activeEvents.filter(e => e.event_type === 'dm_sent').length;
  const totalClicks = activeEvents.filter(e => e.event_type === 'link_clicked').length;
  const ctr = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : '0.0';

  // Specialized Gate Conversion metrics
  const totalEmailGates = activeEvents.filter(e => e.event_type === 'dm_sent' && e.metadata?.action === 'email_gate').length;
  const totalEmailsCollected = activeEvents.filter(e => e.event_type === 'email_collected').length;
  const emailCaptureRate = totalEmailGates > 0 ? ((totalEmailsCollected / totalEmailGates) * 100).toFixed(1) : '0.0';

  const totalFollowGates = activeEvents.filter(e => e.event_type === 'dm_sent' && e.metadata?.action === 'follow_gate').length;
  const totalFollowsVerified = activeEvents.filter(e => e.event_type === 'follow_verified').length;
  const followVerifyRate = totalFollowGates > 0 ? ((totalFollowsVerified / totalFollowGates) * 100).toFixed(1) : '0.0';

  // Keyword counts
  const keywordStats = useMemo(() => {
    const stats: { [kw: string]: number } = {};
    activeEvents.forEach(e => {
      if (e.event_type === 'dm_sent') {
        let kw = e.metadata?.keyword;
        // Fallback keyword matching for historical or live events lacking the metadata key
        if (!kw && e.automation_id && automations) {
          const aut = automations.find(a => a.id === e.automation_id);
          if (aut?.trigger_config?.keywords && aut.trigger_config.keywords.length > 0) {
            const text = (e.metadata?.text || '').toLowerCase();
            kw = aut.trigger_config.keywords.find(k => text.includes(k.toLowerCase())) || aut.trigger_config.keywords[0];
          }
        }
        if (kw) {
          const normalized = kw.toUpperCase().trim();
          stats[normalized] = (stats[normalized] || 0) + 1;
        }
      }
    });
    return stats;
  }, [activeEvents, automations]);

  const sortedKeywords = useMemo(() => {
    return Object.entries(keywordStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [keywordStats]);

  // Daily dynamic data calculation for the Line Chart
  const dailyChartData = useMemo(() => {
    const days = 7;
    return Array.from({ length: days }).map((_, idx) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - (days - 1 - idx));
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      const sentCount = activeEvents.filter(
        e => e.event_type === 'dm_sent' && e.occurred_at.startsWith(targetDateStr)
      ).length;
      
      const clickCount = activeEvents.filter(
        e => e.event_type === 'link_clicked' && e.occurred_at.startsWith(targetDateStr)
      ).length;

      return {
        date: targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        sent: sentCount,
        clicks: clickCount
      };
    });
  }, [activeEvents]);

  // Campaign breakdowns
  const campaignStats = useMemo(() => {
    return automations.map(aut => {
      const sent = activeEvents.filter(e => e.automation_id === aut.id && e.event_type === 'dm_sent').length;
      const clicks = activeEvents.filter(e => e.automation_id === aut.id && e.event_type === 'link_clicked').length;
      const autCtr = sent > 0 ? ((clicks / sent) * 100).toFixed(1) : '0.0';
      return {
        id: aut.id,
        name: aut.name,
        triggerType: aut.trigger_type,
        actionType: aut.action_type,
        sent,
        clicks,
        ctr: autCtr
      };
    });
  }, [automations, activeEvents]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header with Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Analytics</h1>
          <p className="text-xs text-zinc-550">Track the click rates, keywords performance, and subscriber conversions of your bots.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Main metrics summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total DM Deliveries</span>
              <span className="text-3xl font-extrabold text-zinc-900">{totalSent.toLocaleString()}</span>
              <span className="text-[10px] text-green-650 flex items-center gap-0.5 mt-1 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% this week
              </span>
            </div>
            <MessageSquare className="w-10 h-10 text-purple-600/20" />
          </div>

          <div className="glass-panel p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Link Click-Throughs</span>
              <span className="text-3xl font-extrabold text-pink-600">{totalClicks.toLocaleString()}</span>
              <span className="text-[10px] text-green-650 flex items-center gap-0.5 mt-1 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" /> +8.2% this week
              </span>
            </div>
            <MousePointer className="w-10 h-10 text-pink-600/20" />
          </div>

          <div className="glass-panel p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Average CTR</span>
              <span className="text-3xl font-extrabold text-blue-600">{ctr}%</span>
              <span className="text-[10px] text-zinc-500 mt-1 font-bold">
                Goal: &gt;25% CTR
              </span>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-600/20" />
          </div>
        </div>

        {/* Gated Conversion Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Email Gate Capture Rate</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-extrabold text-zinc-900">{emailCaptureRate}%</span>
                <span className="text-[10px] text-zinc-400 font-semibold">({totalEmailsCollected} / {totalEmailGates} leads)</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-100 rounded-full mt-2 overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${emailCaptureRate}%` }} />
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Follow Gate Verify Rate</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-extrabold text-zinc-900">{followVerifyRate}%</span>
                <span className="text-[10px] text-zinc-400 font-semibold">({totalFollowsVerified} / {totalFollowGates} verified)</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-100 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${followVerifyRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Chart Panel */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2.5">
            Engagement Volume Over Time
          </h3>
          <SVGChart data={dailyChartData} />
        </div>

        {/* Keywords and Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Keywords */}
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">
              Top Performing Keywords
            </h3>

            <div className="flex flex-col gap-4">
              {sortedKeywords.map(([kw, count], idx) => {
                const pctWidth = totalSent > 0 ? (count / totalSent) * 100 : 0;
                return (
                  <div key={kw} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-zinc-650">
                      <span className="text-zinc-800 font-bold">#{idx + 1} {kw.toUpperCase()}</span>
                      <span className="text-zinc-500">{count} matches ({pctWidth.toFixed(0)}%)</span>
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
                <p className="text-xs text-zinc-500 py-8 text-center">
                  No keywords detected yet. Send test interactions to populate stats!
                </p>
              )}
            </div>
          </div>

          {/* Campaign efficiency info */}
          <div className="glass-panel p-6 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2">
                Campaign Conversion Insights
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                Automated Instagram replies achieve 5x the conversion rate of traditional profile link-in-bio setups. Connecting Gates turns passive commenters into high-intent subscribers instantly.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-100 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-purple-950 leading-normal font-semibold">
                Pro-Tip: Keep your keyword replies brief, and use a clear Call to Action (CTA) on your landing page to sustain the highest click rates.
              </p>
            </div>
          </div>
        </div>

        {/* Campaign Performance Breakdown Table */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-2 flex items-center justify-between">
            <span>Automation Performance Breakdown</span>
            <span className="text-[10px] text-zinc-400 lowercase font-medium">({automations.length} campaigns configured)</span>
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-150 text-[10px] text-zinc-500 font-bold uppercase bg-zinc-50">
                  <th className="p-3">Campaign Name</th>
                  <th className="p-3">Trigger Type</th>
                  <th className="p-3">Action Gate</th>
                  <th className="p-3 text-right">DMs Sent</th>
                  <th className="p-3 text-right">Clicks</th>
                  <th className="p-3 text-right">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {campaignStats.map(camp => (
                  <tr key={camp.id} className="hover:bg-zinc-50/50">
                    <td className="p-3 font-bold text-zinc-900">{camp.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-[10px] rounded-md font-semibold text-zinc-700 capitalize">
                        {camp.triggerType}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] rounded-md font-semibold capitalize ${
                        camp.actionType === 'email_gate' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                          : camp.actionType === 'follow_gate'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-zinc-50 text-zinc-650'
                      }`}>
                        {camp.actionType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">{camp.sent}</td>
                    <td className="p-3 text-right font-medium">{camp.clicks}</td>
                    <td className="p-3 text-right font-bold text-zinc-950">{camp.ctr}%</td>
                  </tr>
                ))}
                {campaignStats.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-zinc-500">
                      No active automations found. Create one from the Dashboard page!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
