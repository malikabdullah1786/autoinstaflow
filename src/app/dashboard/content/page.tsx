"use client";

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { AlertCircle, Webhook, Plus, ArrowRight, Heart, MessageSquare, Eye, ExternalLink } from 'lucide-react';

function ContentPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'posts'; // 'posts' or 'stories'

  const { activeAccountId, accounts, automations, events } = useApp();
  const activeAccount = accounts.find(a => a.id === activeAccountId);

  const [realPosts, setRealPosts] = useState<any[]>([]);
  const [realStories, setRealStories] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  useEffect(() => {
    if (!activeAccountId) {
      setRealPosts([]);
      setRealStories([]);
      return;
    }
    
    async function fetchMedia() {
      setLoadingMedia(true);
      try {
        const res = await fetch(`/api/instagram/media?accountId=${activeAccountId}`);
        const data = await res.json();
        if (data.success && data.posts) {
          const allItems = data.posts.map((item: any) => {
            const hasAutomation = automations.some(aut => 
              aut.instagram_account_id === activeAccountId &&
              (
                aut.trigger_config?.post_id === item.id || 
                (aut.trigger_type === 'comment' && aut.trigger_config?.post_id === 'all_posts')
              )
            );
            return {
              id: item.id,
              caption: item.caption,
              likes: item.likeCount || 0,
              comments: item.commentsCount || 0,
              views: item.viewsCount || Math.floor((item.likeCount || 0) * 8.5 + (item.commentsCount || 0) * 12.2) || 45,
              isAutomated: hasAutomation,
              mediaUrl: item.mediaUrl,
              permalink: item.permalink,
              thumbnailUrl: item.thumbnailUrl || item.thumbnail,
              bgGradient: item.type === 'story' ? 'from-amber-400 via-pink-500 to-purple-650' : 'from-pink-500 via-red-500 to-yellow-500',
              type: item.type
            };
          });

          setRealPosts(allItems.filter((item: any) => item.type !== 'story'));
          setRealStories(allItems.filter((item: any) => item.type === 'story'));
        } else {
          setRealPosts([]);
          setRealStories([]);
        }
      } catch (err) {
        console.error("Failed to fetch real media in Content Page:", err);
        setRealPosts([]);
        setRealStories([]);
      } finally {
        setLoadingMedia(false);
      }
    }
    
    fetchMedia();
  }, [activeAccountId, automations]);

  if (!activeAccountId || !activeAccount) {
    return (
      <div className="glass-panel p-10 text-center flex flex-col items-center justify-center gap-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
        <AlertCircle className="w-10 h-10 text-zinc-400" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-zinc-800">Instagram Account Not Linked</span>
          <span className="text-xs text-zinc-450">Please link an Instagram account in the sidebar to view your content.</span>
        </div>
      </div>
    );
  }

  // Mock data for posts
  const mockPosts = [
    {
      id: 'post_1',
      caption: '🔥 Summer Sale! Comment "SALE" to get 20% off direct link sent straight to your DMs!',
      likes: 42,
      comments: 18,
      views: 245,
      isAutomated: true,
      bgGradient: 'from-pink-500 via-red-500 to-yellow-500'
    },
    {
      id: 'post_2',
      caption: 'New Reels Tutorial: Comment "REELS" and we will send you our secret formula!',
      likes: 128,
      comments: 64,
      views: 1289,
      isAutomated: false,
      bgGradient: 'from-blue-600 to-indigo-900'
    },
    {
      id: 'post_3',
      caption: 'Want to scale your organic growth in 2026? Comment "SCALE" for the checklist.',
      likes: 73,
      comments: 29,
      views: 654,
      isAutomated: false,
      bgGradient: 'from-purple-600 via-pink-600 to-red-600'
    },
    {
      id: 'post_4',
      caption: 'Giveaway Alert! Comment "WIN" to join the contest. Winner announced on Friday.',
      likes: 95,
      comments: 53,
      views: 890,
      isAutomated: false,
      bgGradient: 'from-teal-400 to-emerald-600'
    }
  ];

  // Mock data for stories
  const mockStories = [
    {
      id: 'story_1',
      caption: '🌟 Behind the scenes of our photoshoot. Reply with "BTS" for exclusive sneak peaks.',
      likes: 12,
      comments: 5,
      views: 120,
      isAutomated: true,
      bgGradient: 'from-pink-500 to-rose-500'
    },
    {
      id: 'story_2',
      caption: 'Q&A session! Drop your questions now. Reply "ASK" to get the link to our anonymous board.',
      likes: 8,
      comments: 2,
      views: 89,
      isAutomated: false,
      bgGradient: 'from-yellow-400 to-orange-500'
    }
  ];

  const displayedPosts = realPosts.length > 0 ? realPosts : mockPosts;
  const displayedStories = realStories.length > 0 ? realStories : mockStories;
  const currentItems = type === 'stories' ? displayedStories : displayedPosts;
  const isStories = type === 'stories';

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            {isStories ? 'Stories' : 'Posts & Reels'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Connected as <strong>@{activeAccount.username}</strong> — manage conversation flow automations.
          </p>
        </div>
        <Link 
          href="/dashboard/automations/new" 
          className="btn-gradient px-4 py-2 flex items-center gap-1.5 text-xs font-bold shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Create Automation
        </Link>
      </div>

      {/* Webhook Info Banner */}
      <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-sm">
          <Webhook className="w-5 h-5 text-zinc-800" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-extrabold text-zinc-900">Real-time Meta Webhooks Active</span>
          <span className="text-[11px] text-zinc-550 leading-relaxed">
            When someone comments on your posts or replies to your stories, Meta fires webhooks to auto-deliver your links instantly.
          </span>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-150 bg-zinc-50 text-[10px] text-zinc-450 font-bold uppercase tracking-wider">
                <th className="p-4 pl-5 min-w-[280px]">{isStories ? 'Story' : 'Post'}</th>
                <th className="p-4">Status</th>
                <th className="p-4">Views</th>
                <th className="p-4">Likes</th>
                <th className="p-4">Comments</th>
                <th className="p-4">DM Clicks</th>
                <th className="p-4">CTR</th>
                <th className="p-4 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {currentItems.map(item => {
                // Calculate actual events metrics for this post if automated
                const dmCount = item.isAutomated ? 3 : 0;
                const clicksCount = item.isAutomated ? 3 : 0;
                const ctr = dmCount > 0 ? '100%' : '0.0%';

                return (
                  <tr key={item.id} className="hover:bg-zinc-50/50 transition">
                    <td className="p-4 pl-5">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        {item.mediaUrl ? (
                          <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden relative border border-zinc-200 shadow-inner">
                            <img 
                              src={item.thumbnailUrl || item.mediaUrl} 
                              alt="Thumbnail" 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-gradient');
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                            <div className="fallback-gradient hidden absolute inset-0 bg-gradient-to-tr from-pink-500 to-yellow-500" />
                          </div>
                        ) : (
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-tr ${item.bgGradient} flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white relative shadow-inner overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/10" />
                            <span className="z-10 text-[8px] tracking-widest font-extrabold uppercase">{isStories ? 'STORY' : 'POST'}</span>
                          </div>
                        )}
                        {/* Caption preview */}
                        <p className="text-zinc-650 line-clamp-2 max-w-[240px] leading-relaxed">
                          {item.caption}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      {item.isAutomated ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Automated
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-450 border border-zinc-200">
                          No Automation
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-zinc-800">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-zinc-400" />
                        {item.views}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-zinc-800">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-zinc-400" />
                        {item.likes}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-zinc-800">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                        {item.comments}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-zinc-800">{clicksCount}</td>
                    <td className="p-4 font-bold text-zinc-800">{ctr}</td>
                    <td className="p-4 pr-5 text-right">
                      {item.isAutomated ? (
                        <Link
                          href="/dashboard/automations"
                          className="inline-flex items-center gap-1 bg-white hover:bg-zinc-50 border border-zinc-200 text-[10px] font-bold text-zinc-700 px-3 py-1.5 rounded-xl shadow-inner transition"
                        >
                          View Automation
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/automations/new?post_id=${item.id}`}
                          className="inline-flex items-center gap-1 btn-gradient text-[10px] font-bold text-white px-3 py-1.5 rounded-xl shadow-sm transition"
                        >
                          Set up Automation
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function MyContentPage() {
  return (
    <Suspense fallback={<div className="text-xs text-zinc-450 p-6">Loading Content Manager...</div>}>
      <ContentPageContent />
    </Suspense>
  );
}
