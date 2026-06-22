"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Users, 
  Download, 
  Trash2, 
  Lock, 
  AlertTriangle,
  Mail,
  X,
  ChevronDown
} from 'lucide-react';

export default function ContactsPage() {
  const { workspace, contacts, deleteContact, upgradePlan, accounts, automations, events } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [emailFilter, setEmailFilter] = useState<'all' | 'with_email' | 'without_email'>('all');

  const isFreePlan = workspace?.plan === 'free';

  // Helper to find the latest Instagram account a contact interacted with
  const getContactAccount = (contactInstagramUserId: string) => {
    // Find events for this user
    const userEvents = events.filter(e => e.instagram_user_id === contactInstagramUserId);
    if (userEvents.length === 0) return null;
    
    // Sort events by date descending to find the latest
    const sortedEvents = [...userEvents].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
    const latestEvent = sortedEvents[0];
    
    // Find the automation
    const automation = automations.find(a => a.id === latestEvent.automation_id);
    if (!automation) return null;
    
    // Find the Instagram account
    return accounts.find(acc => acc.id === automation.instagram_account_id) || null;
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    // 1. Text search filter
    const matchesSearch = contact.instagram_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    // 2. Account filter
    if (selectedAccountId !== 'all') {
      const contactAccount = getContactAccount(contact.instagram_user_id);
      if (contactAccount?.id !== selectedAccountId) return false;
    }

    // 3. Email filter
    if (emailFilter === 'with_email' && !contact.email) return false;
    if (emailFilter === 'without_email' && contact.email) return false;

    return true;
  });

  const handleExportCSV = (onlyWithEmail: boolean) => {
    if (isFreePlan) {
      setShowUpgradeModal(true);
      return;
    }

    // Filter contacts based on whether they have email or not
    const targetContacts = filteredContacts.filter(c => onlyWithEmail ? !!c.email : !c.email);

    // Generate CSV content
    const headers = ['ID', 'Instagram Username', 'Email', 'Source Account', 'Created At', 'Updated At'];
    const rows = targetContacts.map(c => {
      const acc = getContactAccount(c.instagram_user_id);
      return [
        c.id,
        `@${c.instagram_username}`,
        c.email || '',
        acc ? `@${acc.username}` : 'N/A',
        c.first_seen_at,
        c.last_seen_at
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = onlyWithEmail 
      ? `autoinstaflow_contacts_with_email_${workspace?.id}.csv` 
      : `autoinstaflow_contacts_without_email_${workspace?.id}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalEmails = contacts.filter(c => !!c.email).length;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Contacts & Leads</h1>
          <p className="text-xs text-zinc-505">View information about users who interacted with your automations and submitted details.</p>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              if (isFreePlan) {
                setShowUpgradeModal(true);
              } else {
                setExportMenuOpen(!exportMenuOpen);
              }
            }}
            className={`px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
              isFreePlan 
                ? 'bg-white border border-zinc-200 text-zinc-450 hover:bg-zinc-50 hover:text-zinc-650 shadow-sm' 
                : 'btn-gradient shadow-md'
            }`}
          >
            {isFreePlan ? <Lock className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            Export CSV
            {!isFreePlan && <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {exportMenuOpen && !isFreePlan && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg py-1.5 z-20 animate-fadeIn">
                <button
                  onClick={() => {
                    handleExportCSV(true);
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-purple-650 transition font-semibold flex items-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5 text-zinc-450" />
                  Export with Email
                </button>
                <button
                  onClick={() => {
                    handleExportCSV(false);
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-purple-650 transition font-semibold flex items-center gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-zinc-450" />
                  Export without Email
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Metrics mini row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Audiences</span>
            <span className="text-2xl font-extrabold text-zinc-900">{contacts.length}</span>
          </div>
          <Users className="w-8 h-8 text-purple-650/20" />
        </div>

        <div className="glass-panel p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Emails Collected</span>
            <span className="text-2xl font-extrabold text-pink-650">{totalEmails}</span>
          </div>
          <Mail className="w-8 h-8 text-pink-650/20" />
        </div>

        <div className="glass-panel p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Lead Conversion Rate</span>
            <span className="text-2xl font-extrabold text-blue-650">
              {contacts.length > 0 ? ((totalEmails / contacts.length) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
          <svg className="w-8 h-8 text-blue-650/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="max-w-md w-full relative flex-1">
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input px-3.5 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider whitespace-nowrap">Source Account:</span>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="glass-input text-xs py-1.5 px-3 min-w-[150px] bg-white text-zinc-800 rounded-lg border border-zinc-200 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Accounts ({accounts.length})</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>@{acc.username}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider whitespace-nowrap">Email Filter:</span>
            <select
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value as any)}
              className="glass-input text-xs py-1.5 px-3 min-w-[150px] bg-white text-zinc-800 rounded-lg border border-zinc-200 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Contacts</option>
              <option value="with_email">With Email</option>
              <option value="without_email">Without Email</option>
            </select>
          </div>
        </div>

        <div className="glass-panel overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-150 text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-50/70">
                  <th className="p-4">Instagram Handle</th>
                  <th className="p-4">Source IG Account</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Date Subscribed</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                {filteredContacts.map(contact => {
                  const acc = getContactAccount(contact.instagram_user_id);
                  return (
                    <tr key={contact.id} className="hover:bg-zinc-50/50 transition">
                      <td className="p-4 font-bold text-zinc-900 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-[10px] text-zinc-500">
                          {contact.instagram_username[0].toUpperCase()}
                        </div>
                        <span>@{contact.instagram_username}</span>
                      </td>
                      <td className="p-4">
                        {acc ? (
                          <span className="bg-purple-50 text-purple-750 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-medium">
                            @{acc.username}
                          </span>
                        ) : (
                          <span className="text-zinc-400">N/A</span>
                        )}
                      </td>
                      <td className="p-4">
                        {contact.email ? (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-zinc-450" />
                            {contact.email}
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-505 font-medium">
                        {new Date(contact.first_seen_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => deleteContact(contact.id)}
                          className="p-1.5 rounded hover:bg-red-50 hover:text-red-650 transition text-zinc-400"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-400 font-semibold">
                      No contacts found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Gated Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel bg-white p-6 max-w-sm w-full flex flex-col gap-4 shadow-xl border border-zinc-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-1.5">
                <Lock className="w-5 h-5 text-purple-650" /> Premium Feature Gated
              </h3>
              <button onClick={() => setShowUpgradeModal(false)} className="text-zinc-450 hover:text-zinc-650 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-505 leading-relaxed">
              Exporting your collected leads & contacts to a CSV spreadsheet is only available to Pro and Growth plan subscribers.
            </p>

            <div className="flex gap-2 justify-end mt-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-3 py-2 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-650 hover:bg-zinc-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  upgradePlan('pro', 'monthly');
                }}
                className="px-3 py-2 rounded-lg btn-gradient text-xs font-bold"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
