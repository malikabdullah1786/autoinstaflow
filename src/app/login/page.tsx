"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Sparkles, ArrowLeft, ShieldCheck, Mail, Zap, Lock } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, signInGoogle } = useApp();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard/home');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = () => {
    signInGoogle();
    router.push('/dashboard/home');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 text-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
          <span className="text-zinc-500 text-xs font-semibold">Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden bg-zinc-50/30 font-sans">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md flex flex-col gap-6 relative z-10 animate-scaleUp">
        
        {/* Logo and title */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-xl text-white shadow-lg">
            A
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-zinc-900">
            Auto Insta Flow
          </span>
        </div>

        {/* Card Panel */}
        <div className="bg-white border border-zinc-200 shadow-2xl rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
          <div className="text-center flex flex-col gap-1.5">
            <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">Create your account</h2>
            <p className="text-xs text-zinc-500">Get started with automated comments and story replies in minutes.</p>
          </div>

          {/* Social Sign-in Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 rounded-xl bg-white text-zinc-800 border border-zinc-250 font-bold hover:bg-zinc-50 transition flex items-center justify-center gap-3 text-sm shadow-md"
          >
            {/* Google Icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.14-.1.14v3.92l.01.01h.01c-.13.78-.47 1.5-1 2.08l3.12 2.42c1.82-1.68 2.87-4.15 2.87-7.01z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.12-2.42c-.9.6-2.03.96-3.32.96-2.55 0-4.72-1.73-5.5-4.07H1.1l-2.42.01v3.29C2.79 21.52 7.03 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M6.5 15.56c-.2-.6-.31-1.24-.31-1.9s.11-1.3.31-1.9v-3.3H1.1C.4 9.8 0 11.23 0 12.75s.4 2.95 1.1 4.29l5.4-4.29h-.01z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.03 0 2.79 2.48 1.1 6.13l5.4 4.29c.78-2.34 2.95-4.07 5.5-4.07z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Secure disclaimer */}
          <div className="flex items-center gap-2 justify-center text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-zinc-450" />
            <span>Secure authorization via Google OAuth</span>
          </div>

          <hr className="border-zinc-100" />

          {/* Core highlights */}
          <div className="flex flex-col gap-3">
            {[
              { title: 'Comment Triggers', desc: 'Auto-reply to reels and posts in seconds', icon: Zap },
              { title: 'Email Gating', desc: 'Collect emails in chat prior to asset delivery', icon: Mail },
              { title: 'Follower Verification', desc: 'Unlock links only for your loyal followers', icon: ShieldCheck }
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-purple-600 shrink-0 mt-0.5 shadow-sm">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-zinc-800">{item.title}</span>
                    <span className="text-[10px] text-zinc-500 leading-normal">{item.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Back Link */}
        <button
          onClick={() => router.push('/')}
          className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center justify-center gap-1.5 w-max mx-auto transition font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to landing page
        </button>

      </div>
    </div>
  );
}
