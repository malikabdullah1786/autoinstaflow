"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Sparkles, 
  Send, 
  Smartphone, 
  User, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  Mail, 
  Zap, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { getRemainingQuota } from '@/lib/db';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: string;
}

export default function SimulatorPage() {
  const { 
    workspace, 
    accounts, 
    activeAccountId, 
    automations, 
    contacts,
    deleteContact,
    simulateInstagramInteraction,
    activeAccountPosts
  } = useApp();

  const activeAccount = accounts.find(a => a.id === activeAccountId);
  const igPosts = activeAccountPosts.filter(item => item.type === 'post' || item.type === 'reel');
  const igStories = activeAccountPosts.filter(item => item.type === 'story');

  // Form State
  const [simUsername, setSimUsername] = useState('john_doe');
  const [simText, setSimText] = useState('LINK');
  const [simTrigger, setSimTrigger] = useState<'comment' | 'dm' | 'story_reply'>('comment');
  const [simPostId, setSimPostId] = useState('');
  const [simIsFollowing, setSimIsFollowing] = useState(true);
  const [simEmail, setSimEmail] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Set default selection when posts load
  React.useEffect(() => {
    if (simTrigger === 'comment' && igPosts.length > 0) {
      setSimPostId(igPosts[0].id);
    } else if (simTrigger === 'story_reply' && igStories.length > 0) {
      setSimPostId(igStories[0].id);
    }
  }, [activeAccountPosts, simTrigger]);

  // Simulation Outcomes
  const [simOutcome, setSimOutcome] = useState<{ success: boolean; outcome: string; details?: string } | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'system',
      text: 'Instagram DM session started. Trigger an automation to begin simulating messages.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccountId) return;
    setLoading(true);
    setSimOutcome(null);

    const logs: string[] = [];
    logs.push(`[${new Date().toLocaleTimeString()}] 🚀 Initiating webhook simulator...`);
    logs.push(`[Trigger] Type: ${simTrigger.toUpperCase()}, Sender: @${simUsername}, Input: "${simText}"`);

    try {
      // Find automation that matches
      const matchedAut = automations.find(a => {
        if (a.instagram_account_id !== activeAccountId) return false;
        if (a.status !== 'live') return false;
        if (a.trigger_type !== simTrigger) return false;

        if (simTrigger === 'comment' || simTrigger === 'story_reply') {
          const matchesPost = !a.trigger_config.post_id || a.trigger_config.post_id === simPostId;
          return matchesPost;
        }
        return true;
      });

      if (!matchedAut) {
        logs.push(`[Error] ❌ No active, live automation matches this trigger event.`);
        setDebugLogs(logs);
        setSimOutcome({
          success: false,
          outcome: 'no_match',
          details: 'No live automation matches this keyword and post. Please verify you created a live automation with the matching keyword.'
        });
        setLoading(false);
        return;
      }

      logs.push(`[Match] Found active automation: "${matchedAut.name}" (ID: ${matchedAut.id})`);
      
      // Check keyword
      const keywords = matchedAut.trigger_config.keywords || [];
      const normalizedText = simText.toLowerCase().trim();
      const isKeywordMatched = keywords.length === 0 || keywords.some(k => normalizedText.includes(k.toLowerCase().trim()));

      if (!isKeywordMatched) {
        logs.push(`[Blocked] ⚠️ Input text "${simText}" did not match keyword rules: [${keywords.join(', ')}]`);
        setDebugLogs(logs);
        setSimOutcome({
          success: false,
          outcome: 'blocked_keyword',
          details: `Keywords did not match configuration for "${matchedAut.name}".`
        });
        setLoading(false);
        return;
      }

      logs.push(`[Passed] Keyword match successful! Checking constraints...`);

      if (!workspace) {
        logs.push(`[Error] ❌ Workspace not initialized.`);
        setDebugLogs(logs);
        setLoading(false);
        return;
      }

      // Quota check
      const quota = getRemainingQuota(workspace);
      logs.push(`[Quota] Remaining DM quota: ${quota.totalRemaining} (Plan: ${quota.planRemaining}, Add-on: ${quota.addonRemaining})`);
      
      // Gate checks
      if (matchedAut.action_type === 'follow_gate') {
        logs.push(`[Gate] Follow Gate check: User following status is ${simIsFollowing ? 'TRUE' : 'FALSE'}`);
      } else if (matchedAut.action_type === 'email_gate') {
        const isEmailValid = simEmail && simEmail.includes('@');
        logs.push(`[Gate] Email Gate check: Email provided is "${simEmail || 'empty'}" (Valid: ${isEmailValid ? 'YES' : 'NO'})`);
      }

      // Call the actual interaction simulator
      const postInfo = activeAccountPosts.find(p => p.id === simPostId);
      const res = await simulateInstagramInteraction(
        simText,
        simUsername.replace('@', '').trim(),
        simTrigger,
        simTrigger === 'comment' ? {
          post_id: simPostId,
          post_url: postInfo?.permalink || postInfo?.url || '',
          post_thumbnail: postInfo?.thumbnail || ''
        } : undefined,
        { isFollowing: simIsFollowing, email: simEmail }
      );

      // Append to Chat
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMsg: ChatMessage = {
        id: `u_${Date.now()}`,
        sender: 'user',
        text: simTrigger === 'comment' ? `[Commented: "${simText}"]` : simText,
        timestamp
      };

      const botMsgText = res.messageSent || res.details || 'Automation completed.';

      const botMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        sender: 'bot',
        text: botMsgText,
        timestamp
      };

      logs.push(`[Webhook] Simulated delivery response outcome: "${res.outcome}"`);
      logs.push(`[Meta API] Sent emulated chat payload response back to recipient.`);
      logs.push(`[Complete] Simulation completed successfully!`);

      setChatHistory(prev => [...prev, userMsg, botMsg]);
      setDebugLogs(logs);
      setSimOutcome(res);
    } catch (err: any) {
      console.error("Simulation error:", err);
      logs.push(`[Error] ❌ Exception: ${err.message || err}`);
      setDebugLogs(logs);
      setSimOutcome({
        success: false,
        outcome: 'error',
        details: err.message || 'Simulation exception occurred.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeAccountId) return;
    
    const messageText = chatInput.trim();
    setChatInput('');

    // Append user message immediately
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp
    };
    setChatHistory(prev => [...prev, userMsg]);

    setLoading(true);
    const logs: string[] = [];
    logs.push(`[${new Date().toLocaleTimeString()}] 🚀 Received DM in simulator chat input...`);
    logs.push(`[Trigger] Type: DM, Sender: @${simUsername}, Input: "${messageText}"`);

    // Call the interaction simulator
    const res = await simulateInstagramInteraction(
      messageText,
      simUsername.replace('@', '').trim(),
      'dm',
      undefined,
      { isFollowing: simIsFollowing, email: messageText.includes('@') ? messageText : simEmail }
    );

    let botReply = '';
    if (res.success) {
      botReply = res.messageSent || res.details || 'Message received.';
      logs.push(`[Success] DM reply generated: "${botReply}"`);
    } else {
      botReply = `System Message: ${res.details || 'No automation matched.'}`;
      logs.push(`[Notice] DM received but no response sent. Details: ${res.details}`);
    }

    const botMsg: ChatMessage = {
      id: `b_${Date.now()}`,
      sender: 'bot',
      text: botReply,
      timestamp
    };

    setChatHistory(prev => [...prev, botMsg]);
    setDebugLogs(logs);
    setSimOutcome(res);
    setLoading(false);
  };

  const clearChat = () => {
    setChatHistory([
      {
        id: 'welcome',
        sender: 'system',
        text: 'Instagram DM session cleared. Ready for next simulation.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setSimOutcome(null);
    setDebugLogs([]);
  };

  const resetContactSession = async () => {
    setLoading(true);
    try {
      const simIgUserId = `ig_user_${simUsername.replace('@', '').trim().toLowerCase()}`;
      const contactToReset = contacts.find(c => c.instagram_user_id === simIgUserId && c.workspace_id === workspace?.id);
      
      const logs = [...debugLogs];
      logs.push(`[Reset] 🔄 Resetting contact session for @${simUsername}...`);
      
      if (contactToReset) {
        await deleteContact(contactToReset.id);
        logs.push(`[Reset] 🗑️ Deleted contact "${contactToReset.instagram_username}" (ID: ${contactToReset.id}) from the database.`);
      } else {
        logs.push(`[Reset] ℹ️ No existing contact record found in database for @${simUsername}.`);
      }
      
      setDebugLogs(logs);
      setSimEmail('');
      clearChat();
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="bg-purple-50 text-purple-650 border border-purple-200 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Sandbox Environment
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
          Automation Webhook Studio
        </h1>
        <p className="text-sm text-zinc-505 max-w-2xl">
          Directly simulate comments, stories, and DM interactions locally. Test follow gates, lead collections, and quota consumption without linking live Instagram production logins.
        </p>
      </div>

      {!activeAccount ? (
        <div className="glass-panel p-10 text-center flex flex-col items-center gap-4 bg-white shadow-sm">
          <AlertCircle className="w-12 h-12 text-zinc-600" />
          <p className="text-zinc-505 text-sm">Please link an Instagram account in the sidebar to activate the Simulator.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Controls (lg:col-span-5) */}
          <div className="lg:col-span-5 glass-panel p-6 flex flex-col gap-5 bg-white shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-650" /> Simulator Controls
            </h2>
            
            <form onSubmit={handleSimulate} className="flex flex-col gap-4">
              {/* Trigger Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Trigger Event Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'comment', label: 'Comment' },
                    { val: 'dm', label: 'Direct Msg' },
                    { val: 'story_reply', label: 'Story Reply' }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setSimTrigger(item.val as any)}
                      className={`py-2 rounded-lg text-xs font-bold border transition ${simTrigger === item.val ? 'bg-purple-600 border-purple-500 text-white shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-850 shadow-sm'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Event Options */}
              {simTrigger === 'comment' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">On Post / Reel</label>
                  {igPosts.length > 0 ? (
                    <select
                      value={simPostId}
                      onChange={(e) => setSimPostId(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-700 focus:outline-none focus:border-purple-500 shadow-sm"
                    >
                      {igPosts.map(post => (
                        <option key={post.id} value={post.id}>
                          {post.type.toUpperCase()}: {post.caption.substring(0, 50)}...
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={simPostId}
                      onChange={(e) => setSimPostId(e.target.value)}
                      placeholder="Enter Post/Media ID (e.g. 17894562)"
                      className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-700 focus:outline-none focus:border-purple-500 shadow-sm"
                    />
                  )}
                </div>
              )}

              {simTrigger === 'story_reply' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">On Live Story</label>
                  {igStories.length > 0 ? (
                    <select
                      value={simPostId}
                      onChange={(e) => setSimPostId(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-700 focus:outline-none focus:border-purple-500 shadow-sm"
                    >
                      {igStories.map(story => (
                        <option key={story.id} value={story.id}>
                          STORY: {story.caption.substring(0, 50)}...
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={simPostId}
                      onChange={(e) => setSimPostId(e.target.value)}
                      placeholder="Enter Story ID (e.g. story_789)"
                      className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-700 focus:outline-none focus:border-purple-500 shadow-sm"
                    />
                  )}
                </div>
              )}

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Sender Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-400">@</span>
                  <input
                    type="text"
                    required
                    value={simUsername}
                    onChange={(e) => setSimUsername(e.target.value)}
                    placeholder="john_doe"
                    className="w-full bg-white border border-zinc-200 rounded-lg py-2.5 pl-7 pr-3 text-xs text-zinc-700 focus:outline-none focus:border-purple-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Comment/Message Text */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-650 uppercase tracking-wider">
                  {simTrigger === 'comment' ? 'Comment Text' : 'Message Text / Reply'}
                </label>
                <input
                  type="text"
                  required
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  placeholder="e.g. LINK"
                  className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs text-zinc-700 focus:outline-none focus:border-purple-500 shadow-sm"
                />
              </div>

              {/* Gate Mocks */}
              <div className="border-t border-zinc-150 pt-4 flex flex-col gap-3">
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider block">Recipient Gateway Mocks</span>
                
                {/* Follow Gate mock */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-650" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-900">Follow Status</span>
                      <span className="text-[9px] text-zinc-500">Is the user following @{activeAccount.username}?</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={simIsFollowing}
                    onChange={(e) => setSimIsFollowing(e.target.checked)}
                    className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500 bg-white w-4 h-4"
                  />
                </div>

                {/* Email Gate mock */}
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-pink-650" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-900">Provided Email</span>
                      <span className="text-[9px] text-zinc-500">Mocks the captured lead address</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    placeholder="e.g. user@gmail.com (Leave empty to trigger request)"
                    className="w-full bg-white border border-zinc-200 rounded p-2 text-[11px] text-zinc-750 focus:outline-none focus:border-purple-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Run button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gradient py-3 font-bold text-xs flex items-center justify-center gap-2 mt-2 shadow-md animate-shimmer"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Fire Simulated Webhook'}
              </button>
            </form>
          </div>

          {/* Middle Column: Chat Mockup Device (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-4 items-center animate-fadeIn">
            {/* Phone Wrapper */}
            <div className="w-full max-w-[290px] aspect-[9/18] rounded-[36px] border-[6px] border-zinc-300 bg-zinc-50 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              
              {/* Speaker notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-300 rounded-full z-20 flex items-center justify-center font-bold text-[8px] text-zinc-500">
                Auto Insta Flow Mock
              </div>

              {/* Instagram App Header */}
              <div className="bg-white pt-8 pb-3 px-4 border-b border-zinc-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                    <User className="w-3 h-3 text-zinc-400" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-[10px] font-bold text-zinc-900">@{activeAccount.username}</span>
                    <span className="text-[8px] text-zinc-450">Active now</span>
                  </div>
                </div>
                <Smartphone className="w-3.5 h-3.5 text-zinc-450" />
              </div>

              {/* Messaging Area */}
              <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5">
                {chatHistory.map((msg) => {
                  if (msg.sender === 'system') {
                    return (
                      <div key={msg.id} className="text-center my-1">
                        <span className="bg-zinc-200 text-[8px] text-zinc-650 px-2 py-1 rounded-md">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div
                        className={`p-2.5 rounded-2xl text-[10px] leading-relaxed ${isUser ? 'bg-purple-600 text-white rounded-tr-none shadow-sm' : 'bg-white text-zinc-850 rounded-tl-none border border-zinc-200 shadow-sm'}`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[7px] text-zinc-450 mt-1 flex items-center gap-0.5">
                        <Clock className="w-2 h-2" /> {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Simulator */}
              <form onSubmit={handleChatSubmit} className="p-2 border-t border-zinc-200 bg-white flex items-center gap-1.5 shrink-0 w-full">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type message & press Enter..."
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-full px-3 py-1.5 text-[9px] text-zinc-700 focus:outline-none focus:border-purple-500"
                />
                <button type="submit" className="p-1 text-purple-605 hover:text-purple-505 transition">
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>

            {/* Clear & Reset Buttons */}
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={clearChat}
                className="text-[11px] font-semibold text-zinc-550 hover:text-zinc-800 transition flex items-center gap-1"
              >
                Clear Chat Screen
              </button>
              <span className="text-zinc-300 text-xs">|</span>
              <button
                type="button"
                onClick={resetContactSession}
                disabled={loading}
                className="text-[11px] font-bold text-purple-650 hover:text-purple-500 transition flex items-center gap-1"
              >
                Reset Contact Session (Clear DB)
              </button>
            </div>
          </div>

          {/* Right Column: Diagnostics & Logs (lg:col-span-3) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Status Panel */}
            <div className="glass-panel p-5 flex flex-col gap-4 bg-white shadow-sm">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Delivery Verdict</h3>
              
              {simOutcome ? (
                <div className="flex flex-col gap-3">
                  <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${simOutcome.success ? 'bg-green-55 border-green-200 text-green-750' : 'bg-red-50 border-red-200 text-red-750'}`}>
                    {simOutcome.success ? (
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    )}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold uppercase tracking-wide">
                        {simOutcome.success ? 'Success' : 'Failed'}
                      </span>
                      <span className="text-[10px] leading-relaxed text-zinc-650">
                        {simOutcome.details || 'Automation execution complete.'}
                      </span>
                    </div>
                  </div>

                  {simOutcome.success && (
                    <div className="text-[10px] text-zinc-550 bg-zinc-50 border border-zinc-200 p-2.5 rounded-lg flex flex-col gap-1.5">
                      <div className="flex justify-between">
                        <span>Workspace Quota:</span>
                        <strong className="text-zinc-900">Consumed (1 DM)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Database Event:</span>
                        <strong className="text-zinc-900">Created</strong>
                      </div>
                      {simEmail && simEmail.includes('@') && (
                        <div className="flex justify-between items-center bg-pink-55/70 p-1.5 rounded mt-1 border border-pink-100">
                          <span className="text-pink-700 font-bold">Leads Captured:</span>
                          <strong className="text-pink-950">+1 (Contacts list updated)</strong>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link 
                      href="/dashboard/contacts" 
                      className="text-[10px] text-center w-full py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded font-bold text-zinc-600 transition shadow-sm"
                    >
                      View Contacts
                    </Link>
                    <Link 
                      href="/dashboard/analytics" 
                      className="text-[10px] text-center w-full py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded font-bold text-zinc-600 transition shadow-sm"
                    >
                      View Analytics
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-zinc-450 text-xs py-4 text-center border border-dashed border-zinc-200 bg-zinc-50/50 rounded-lg">
                  Awaiting simulation request.
                </div>
              )}
            </div>

            {/* Logs Console */}
            <div className="glass-panel p-4 flex flex-col gap-2.5 bg-white shadow-sm">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Debugger Trace</h3>
              
              <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg h-[180px] overflow-y-auto font-mono text-[9px] text-zinc-700 flex flex-col gap-1.5 leading-relaxed shadow-inner">
                {debugLogs.length > 0 ? (
                  debugLogs.map((log, i) => (
                    <div key={i} className={log.includes('Error') || log.includes('Blocked') ? 'text-red-600 font-semibold' : log.includes('Success') || log.includes('Passed') ? 'text-green-600 font-semibold' : 'text-zinc-600'}>
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-400">Console empty. Fire a hook to trace the trigger and logic.</div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
