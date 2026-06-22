"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Automation, TriggerType, ActionType, PlanType } from '@/lib/db';
import { 
  Sparkles, 
  ArrowLeft, 
  MessageCircle, 
  Tag, 
  Link2, 
  ShieldCheck, 
  Mail, 
  Zap, 
  Save,
  Lock,
  ChevronRight
} from 'lucide-react';

interface AutomationBuilderProps {
  initialData?: Automation;
}

export const AutomationBuilder: React.FC<AutomationBuilderProps> = ({ initialData }) => {
  const router = useRouter();
  const { workspace, accounts, activeAccountId, saveAutomation, upgradePlan, activeAccountPosts } = useApp();
  
  const [name, setName] = useState(initialData?.name || 'My New Automation');
  const [triggerType, setTriggerType] = useState<TriggerType>(initialData?.trigger_type || 'comment');
  const [actionType, setActionType] = useState<ActionType>(initialData?.action_type || 'send_dm');
  
  // Trigger configs
  const [postId, setPostId] = useState(initialData?.trigger_config.post_id || '');
  const [keywords, setKeywords] = useState<string>(initialData?.trigger_config.keywords?.join(', ') || '');
  
  // Action configs
  const [message, setMessage] = useState(initialData?.action_config.message || 'Hey! Here is the link you requested:');
  const [url, setUrl] = useState(initialData?.action_config.url || 'https://');
  
  // Feedback
  const [validationError, setValidationError] = useState('');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<string | null>(null);

  // Set default post selection if empty and comments triggers
  const igPosts = activeAccountPosts.filter(item => item.type === 'post' || item.type === 'reel');
  const igStories = activeAccountPosts.filter(item => item.type === 'story');

  useEffect(() => {
    // If starting a new post-specific automation, prefill post
    if (!postId) {
      if (triggerType === 'comment' && igPosts.length > 0) {
        setPostId(igPosts[0].id);
      } else if (triggerType === 'story_reply' && igStories.length > 0) {
        setPostId(igStories[0].id);
      }
    }
  }, [triggerType, igPosts, igStories]);

  // Read URL query params on mount for post prefilling (e.g. from Today's Actions)
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialData) {
      const params = new URLSearchParams(window.location.search);
      const postParam = params.get('post_id');
      if (postParam) {
        setPostId(postParam);
        // Find if post exists
        const matched = activeAccountPosts.find(p => p.id === postParam);
        if (matched) {
          setTriggerType(matched.type === 'story' ? 'story_reply' : 'comment');
          setName(`Automation for Post ${postParam}`);
        }
      }
    }
  }, [activeAccountPosts]);

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setShowUpgradePrompt(null);

    if (!activeAccountId) {
      setValidationError('Please connect an Instagram account first.');
      return;
    }

    const keywordList = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k !== '');

    const selectedPost = activeAccountPosts.find(p => p.id === postId);

    // Build payload
    const payload: Partial<Automation> = {
      id: initialData?.id,
      name,
      trigger_type: triggerType,
      trigger_config: {
        post_id: triggerType !== 'dm' ? postId : undefined,
        post_url: triggerType !== 'dm' && selectedPost ? (selectedPost.permalink || selectedPost.url) : undefined,
        post_thumbnail: triggerType !== 'dm' && selectedPost ? selectedPost.thumbnail : undefined,
        keywords: keywordList,
      },
      action_type: actionType,
      action_config: {
        message,
        url,
        gate: actionType === 'email_gate' ? 'email' : actionType === 'follow_gate' ? 'follow' : null,
      },
      status: initialData?.status || 'paused',
    };

    const res = await saveAutomation(payload);

    if (res.success) {
      router.push('/dashboard/automations');
    } else {
      if (res.error === 'GATE_FEATURE_BLOCKED') {
        setShowUpgradePrompt(actionType === 'email_gate' ? 'Email Gates' : 'Follow Gates');
      } else {
        setValidationError(res.error || 'Failed to save automation.');
      }
    }
  };

  const isFreePlan = workspace?.plan === 'free';

  return (
    <div className="flex flex-col gap-6">
      {/* Back Header */}
      <div className="flex items-center gap-3 animate-fadeIn">
        <button 
          onClick={() => router.push('/dashboard/automations')}
          className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-650 hover:bg-zinc-50 shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">
            {initialData ? 'Edit Automation' : 'Build Automation'}
          </h1>
          <p className="text-xs text-zinc-505">Configure your triggers and actions below.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Form Inputs (Left) */}
        <form onSubmit={handleSave} className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Section 1: Name */}
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-150 pb-2">
              1. General Details
            </h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-500">Automation Rule Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Free Ebook Delivery Comment Trigger"
                className="glass-input text-sm"
              />
            </div>
          </div>

          {/* Section 2: Trigger */}
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-150 pb-2">
              2. When this happens... (Trigger)
            </h3>

            {/* Trigger selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-505">Choose trigger event</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'comment', label: 'Comment', desc: 'Comment on a post/reel' },
                  { type: 'dm', label: 'Direct Message', desc: 'Incoming direct message' },
                  { type: 'story_reply', label: 'Story Reply', desc: 'Reply/reaction to story' }
                ].map(item => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setTriggerType(item.type as TriggerType)}
                    className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition ${triggerType === item.type ? 'bg-purple-50 border-purple-300 text-purple-950 shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                  >
                    <span className="text-xs font-bold text-zinc-900">{item.label}</span>
                    <span className="text-[9px] text-zinc-500 leading-normal">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Post Picker (if post-specific) */}
            {triggerType !== 'dm' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-505">
                  {triggerType === 'comment' ? 'On post or reel' : 'On active story'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {(triggerType === 'comment' ? igPosts : igStories).map(post => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => setPostId(post.id)}
                      className={`p-2 rounded-lg border flex gap-3 text-left transition ${postId === post.id ? 'bg-purple-50 border-purple-300 text-purple-950 shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                    >
                      <img
                        src={post.thumbnail}
                        alt="thumbnail"
                        className="w-10 h-10 object-cover rounded border border-zinc-200 shrink-0"
                      />
                      <div className="flex flex-col justify-center min-w-0">
                        <span className="text-[10px] font-bold text-zinc-800 uppercase">{post.type} {post.id.split('_')[1] || post.id}</span>
                        <p className="text-[10px] text-zinc-500 truncate leading-relaxed max-w-[150px]">
                          {post.caption}
                        </p>
                      </div>
                    </button>
                  ))}
                  {((triggerType === 'comment' ? igPosts : igStories).length === 0) && (
                    <div className="col-span-2 flex flex-col gap-2 p-2 w-full">
                      <span className="text-xs text-zinc-500">No posts or reels loaded from your account. You can enter a custom Media ID:</span>
                      <input
                        type="text"
                        value={postId}
                        onChange={(e) => setPostId(e.target.value)}
                        placeholder="e.g. 17894562"
                        className="glass-input text-xs w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Keywords */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-zinc-400" /> Matching Keywords
                </label>
                <span className="text-[9px] text-zinc-400">Leave blank to trigger on all comments</span>
              </div>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. link, info, book (comma separated)"
                className="glass-input text-xs"
              />
            </div>
          </div>

          {/* Section 3: Action */}
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-150 pb-2">
              3. Do this action... (Action)
            </h3>

            {/* Action selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-550">Choose action type</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'send_dm', label: 'Send DM with Link', desc: 'Direct message standard link', gated: false, icon: Link2 },
                  { type: 'email_gate', label: 'Email Gate', desc: 'Prompt for email before link', gated: true, icon: Mail },
                  { type: 'follow_gate', label: 'Follow Gate', desc: 'Require user follow before link', gated: true, icon: ShieldCheck }
                ].map(item => {
                  const Icon = item.icon;
                  const isGated = item.gated && isFreePlan;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setActionType(item.type as ActionType)}
                      className={`p-3 rounded-lg border text-left flex flex-col justify-between gap-2 transition relative overflow-hidden ${actionType === item.type ? 'bg-purple-55 border-purple-300 text-purple-950 shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                    >
                      {isGated && (
                        <div className="absolute top-1.5 right-1.5 bg-purple-100 text-purple-750 p-0.5 px-1.5 rounded text-[8px] flex items-center gap-0.5 font-bold uppercase tracking-wider border border-purple-200">
                          <Lock className="w-2 h-2" /> Pro
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <Icon className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold text-zinc-900">{item.label}</span>
                      </div>
                      <span className="text-[9px] text-zinc-500 leading-normal">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Body & Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-500">Direct Message Body</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hey! Thanks for commenting. Here is the direct link..."
                  className="glass-input text-xs resize-none"
                />
              </div>

              <div className="flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Target URL / Asset Link</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/asset"
                    className="glass-input text-xs"
                  />
                </div>

                <div className="text-[10px] text-zinc-600 leading-relaxed bg-zinc-50 p-2.5 rounded-lg border border-zinc-150">
                  {actionType === 'send_dm' && "The user will immediately receive the message with the clickable link in their Instagram inbox."}
                  {actionType === 'email_gate' && "The bot will reply asking for their email first. Once typed, the email is recorded in your Contacts and the link is delivered."}
                  {actionType === 'follow_gate' && "The bot will verify follow status. If not following, it prompts them to follow first. Once followed, it releases the link."}
                </div>
              </div>
            </div>
          </div>

          {/* Validation & Submit */}
          {validationError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-750 text-xs font-semibold">
              {validationError}
            </div>
          )}

          {/* Upgrade prompt block */}
          {showUpgradePrompt && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-600" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-900">{showUpgradePrompt} Gated</span>
                  <p className="text-[11px] text-zinc-505">Upgrade to Pro or Growth plan to use Gated flows (Email and Follow gating).</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  upgradePlan('pro', 'monthly');
                  setActionType('send_dm'); // reset to normal link
                  router.push('/dashboard/billing');
                }}
                className="bg-purple-600 hover:bg-purple-500 px-3.5 py-1.5 rounded font-bold text-xs text-white transition whitespace-nowrap shadow-md"
              >
                Unlock Gating
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard/automations')}
              className="px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-55 shadow-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-gradient px-5 py-2.5 flex items-center gap-1.5 text-xs font-bold"
            >
              <Save className="w-4 h-4" /> Save Automation
            </button>
          </div>
        </form>

        {/* Live Instagram Feed Mock Preview (Right) */}
        <div className="flex flex-col gap-4 animate-fadeIn">
          <div className="glass-panel p-6 border-zinc-200 bg-white shadow-sm sticky top-24">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              Live DM Flow Preview
            </h3>

            {/* Phone Interface */}
            <div className="border border-zinc-200 bg-white rounded-[32px] overflow-hidden shadow-xl p-3 flex flex-col gap-2 relative max-w-[280px] mx-auto min-h-[380px]">
              {/* Speaker & notch */}
              <div className="w-24 h-4 bg-zinc-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-8 h-1 bg-zinc-200 rounded-full" />
              </div>

              {/* Chat Header */}
              <div className="border-b border-zinc-100 pb-2 px-1 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {activeAccount ? activeAccount.username[0].toUpperCase() : 'B'}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-zinc-900 truncate max-w-[120px]">
                    {activeAccount ? `@${activeAccount.username}` : 'Instagram Bot'}
                  </span>
                  <span className="text-[7px] text-zinc-400 font-medium">Active now</span>
                </div>
              </div>

              {/* Message Bubbles */}
              <div className="flex-1 flex flex-col gap-3 py-4 px-1 text-[10px] overflow-y-auto">
                {/* Trigger bubble */}
                <div className="self-end bg-zinc-100 border border-zinc-150 text-zinc-800 px-3 py-1.5 rounded-2xl rounded-tr-sm max-w-[80%] leading-relaxed shadow-sm">
                  {triggerType === 'comment' && "💬 Comments on post: "}
                  {triggerType === 'story_reply' && "❤️ Reacted to Story: "}
                  {triggerType === 'dm' && "✉️ Message: "}
                  <strong>
                    {keywords ? keywords.split(',')[0].trim() : 'LINK'}
                  </strong>
                </div>

                {/* Gated flow bubbles */}
                {actionType === 'email_gate' && (
                  <>
                    <div className="self-start bg-white border border-zinc-150 text-zinc-800 px-3 py-1.5 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed flex flex-col gap-1 shadow-sm">
                      <span className="font-semibold text-purple-600">Email Gate Active</span>
                      <span>Drop your email address first to unlock the resource download link!</span>
                    </div>
                    <div className="self-end bg-zinc-105 border border-zinc-150 text-zinc-700 px-3 py-1.5 rounded-2xl rounded-tr-sm max-w-[80%] leading-relaxed italic shadow-sm">
                      alex@company.com
                    </div>
                  </>
                )}

                {actionType === 'follow_gate' && (
                  <>
                    <div className="self-start bg-white border border-zinc-150 text-zinc-800 px-3 py-1.5 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed flex flex-col gap-1 shadow-sm">
                      <span className="font-semibold text-purple-600">Follow Gate Active</span>
                      <span>Please follow @{activeAccount?.username || 'us'} first to release the link!</span>
                    </div>
                    <div className="self-start bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1 rounded-full text-[8px] font-bold self-center shadow-inner">
                      Checking follow status...
                    </div>
                  </>
                )}

                {/* Final payload link bubble */}
                <div className="self-start bg-purple-50 border border-purple-200 text-zinc-850 px-3 py-1.5 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed flex flex-col gap-1.5 shadow-sm">
                  <p className="text-zinc-800">{message || "Hey! Here's the link:"}</p>
                  <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-150 text-[8px] text-purple-600 truncate flex items-center gap-1">
                    <Link2 className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate underline font-semibold">{url || "https://example.com/asset"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
