"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { MOCK_IG_ITEMS } from '@/lib/instagramMock';
import { 
  Play, 
  Pause, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  Search, 
  Plus, 
  Sparkles,
  MessageSquare
} from 'lucide-react';

export default function AutomationsPage() {
  const { 
    workspace, 
    accounts, 
    activeAccountId, 
    automations, 
    toggleAutomationStatus, 
    deleteAutomation 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  // Filter automations for active account
  const accountAutomations = automations.filter(a => a.instagram_account_id === activeAccountId);

  // Search filter
  const filteredAutomations = accountAutomations.filter(aut => 
    aut.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    aut.trigger_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate warning banner:
  // "If any Instagram post published within the last 7 days has no associated Automation, 
  // then the Platform shall display a warning banner indicating the number of unautomated recent posts."
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPosts = MOCK_IG_ITEMS.filter(
    item => (item.type === 'post' || item.type === 'reel') && new Date(item.publishedAt) > sevenDaysAgo
  );

  const unautomatedRecentCount = recentPosts.filter(post => {
    return !automations.some(
      aut => aut.instagram_account_id === activeAccountId && aut.trigger_config.post_id === post.id
    );
  }).length;

  const handleDelete = (id: string) => {
    deleteAutomation(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Automations</h1>
          <p className="text-xs text-zinc-500">Build rules to automatically respond to comment triggers, replies, and keywords.</p>
        </div>
        
        {activeAccountId && (
          <Link href="/dashboard/automations/new" className="btn-gradient px-4 py-2 flex items-center gap-1.5 text-xs">
            <Plus className="w-4 h-4" /> Create Automation
          </Link>
        )}
      </div>

      {/* Warning banner for unautomated posts (Requirement 5.5) */}
      {activeAccountId && unautomatedRecentCount > 0 && (
        <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-zinc-900 font-sans">Unautomated Recent Content Detected</span>
              <p className="text-xs text-zinc-500">
                You have <strong className="text-yellow-750">{unautomatedRecentCount}</strong> post(s)/reel(s) published in the last 7 days with no automation configured. You are missing out on potential leads!
              </p>
            </div>
            <Link 
              href="/dashboard/home" 
              className="text-xs font-bold bg-yellow-100 hover:bg-yellow-150 text-yellow-800 px-3 py-1.5 rounded-lg border border-yellow-200 transition whitespace-nowrap shadow-sm"
            >
              Set Up Now
            </Link>
          </div>
        </div>
      )}

      {/* Table & search */}
      {!activeAccountId ? (
        <div className="glass-panel p-8 text-center flex flex-col items-center gap-4">
          <AlertTriangle className="w-12 h-12 text-zinc-400" />
          <p className="text-zinc-500 text-sm">Please select or link an Instagram account to view automations.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search automations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-input pl-9 text-xs"
              />
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-50">
                    <th className="p-4">Automation Name</th>
                    <th className="p-4">Trigger Type</th>
                    <th className="p-4 text-center">DMs Sent</th>
                    <th className="p-4 text-center">Link Clicks</th>
                    <th className="p-4 text-center">CTR</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {filteredAutomations.map(aut => {
                    const ctr = aut.dm_sent_count > 0 ? ((aut.link_click_count / aut.dm_sent_count) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={aut.id} className="hover:bg-zinc-50 transition">
                        <td className="p-4 font-bold text-zinc-900 max-w-xs truncate">{aut.name}</td>
                        <td className="p-4 text-zinc-500">
                          <span className="capitalize">{aut.trigger_type}</span>
                          {aut.trigger_config.keywords && aut.trigger_config.keywords.length > 0 && (
                            <span className="text-[10px] text-zinc-400 block">
                              Keywords: {aut.trigger_config.keywords.join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center text-zinc-700 font-semibold">{aut.dm_sent_count.toLocaleString()}</td>
                        <td className="p-4 text-center text-zinc-700 font-semibold">{aut.link_click_count.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <span className="bg-purple-55 text-purple-700 font-bold px-2 py-0.5 rounded text-[10px] border border-purple-100">
                            {ctr}%
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleAutomationStatus(aut.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition border ${aut.status === 'live' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-150'}`}
                          >
                            {aut.status === 'live' ? (
                              <>
                                <Play className="w-2.5 h-2.5 fill-current" /> Live
                              </>
                            ) : (
                              <>
                                <Pause className="w-2.5 h-2.5 fill-current" /> Paused
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/automations/${aut.id}`}
                              className="p-1.5 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition text-zinc-450"
                              title="Edit Automation"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            
                            {deleteConfirmId === aut.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(aut.id)}
                                  className="text-red-650 font-bold text-[10px] hover:underline px-1"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="text-zinc-500 font-bold text-[10px] hover:underline px-1"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(aut.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition text-zinc-450"
                                title="Delete Automation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAutomations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-500 font-medium">
                        No automations found. Create your first automation from scratch or use a template!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
