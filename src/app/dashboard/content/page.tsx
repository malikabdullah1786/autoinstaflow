"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { MOCK_IG_ITEMS } from '@/lib/instagramMock';
import { 
  MessageSquare, 
  ArrowRight, 
  Play, 
  Zap, 
  Clock, 
  AlertCircle
} from 'lucide-react';

export default function MyContentPage() {
  const { activeAccountId, automations } = useApp();
  const [activeTab, setActiveTab] = useState<'posts' | 'stories'>('posts');

  const posts = MOCK_IG_ITEMS.filter(item => item.type === 'post' || item.type === 'reel');
  const stories = MOCK_IG_ITEMS.filter(item => item.type === 'story');

  if (!activeAccountId) {
    return (
      <div className="glass-panel p-8 text-center flex flex-col items-center gap-4">
        <AlertCircle className="w-12 h-12 text-zinc-600" />
        <p className="text-zinc-400 text-sm">Please link an Instagram account in the sidebar to view your content feed.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">My Content</h1>
        <p className="text-xs text-zinc-505">View and manage comment & reply automation directly from your posts, reels, and stories.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2.5 text-xs font-bold transition-all relative ${activeTab === 'posts' ? 'text-purple-600 border-b-2 border-purple-600 font-extrabold' : 'text-zinc-500 hover:text-zinc-800'}`}
        >
          Posts & Reels
        </button>
        <button
          onClick={() => setActiveTab('stories')}
          className={`px-4 py-2.5 text-xs font-bold transition-all relative ${activeTab === 'stories' ? 'text-purple-600 border-b-2 border-purple-600 font-extrabold' : 'text-zinc-500 hover:text-zinc-800'}`}
        >
          Active Stories
        </button>
      </div>

      {/* Grid */}
      {activeTab === 'posts' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => {
            const matchedAuto = automations.find(
              aut => aut.instagram_account_id === activeAccountId && 
                     aut.trigger_config.post_id === post.id
            );
            return (
              <div key={post.id} className="glass-panel overflow-hidden flex flex-col justify-between shadow-sm">
                <div className="relative">
                  <img
                    src={post.thumbnail}
                    alt={post.id}
                    className="w-full h-48 object-cover border-b border-zinc-200"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="bg-white/90 backdrop-blur text-[8px] text-zinc-650 font-bold px-2 py-0.5 rounded-full uppercase border border-zinc-200">
                      {post.type}
                    </span>
                    {matchedAuto && (
                      <span className="bg-green-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> Automated
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <p className="text-[11px] text-zinc-700 font-medium line-clamp-2 leading-relaxed">
                    {post.caption}
                  </p>
                  
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-150">
                    <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {post.commentsCount} comments</span>
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="bg-zinc-50/70 p-3 border-t border-zinc-150 text-center">
                  {matchedAuto ? (
                    <Link
                      href={`/dashboard/automations/${matchedAuto.id}`}
                      className="text-xs text-purple-650 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      Manage Automation <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/automations/new?post_id=${post.id}`}
                      className="text-xs text-zinc-550 hover:text-zinc-900 font-bold inline-flex items-center gap-1"
                    >
                      Configure Automation <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map(story => {
            const matchedAuto = automations.find(
              aut => aut.instagram_account_id === activeAccountId && 
                     aut.trigger_config.post_id === story.id
            );
            return (
              <div key={story.id} className="glass-panel overflow-hidden flex flex-col justify-between shadow-sm">
                <div className="relative">
                  <img
                    src={story.thumbnail}
                    alt={story.id}
                    className="w-full h-48 object-cover border-b border-zinc-200"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="bg-pink-650 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> Story
                    </span>
                    {matchedAuto && (
                      <span className="bg-green-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> Automated
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <p className="text-[11px] text-zinc-700 font-medium line-clamp-2 leading-relaxed">
                    {story.caption}
                  </p>
                  
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-150">
                    <span className="text-green-650 font-semibold">Active (Expires in 18h)</span>
                    <span>{new Date(story.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="bg-zinc-50/70 p-3 border-t border-zinc-150 text-center">
                  {matchedAuto ? (
                    <Link
                      href={`/dashboard/automations/${matchedAuto.id}`}
                      className="text-xs text-purple-650 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      Manage Automation <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/automations/new?post_id=${story.id}`}
                      className="text-xs text-zinc-550 hover:text-zinc-900 font-bold inline-flex items-center gap-1"
                    >
                      Configure Automation <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
