"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Sparkles, MessageSquare, ShieldCheck, Mail, Zap, Check, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const { user } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50/30 font-sans text-zinc-800">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white shadow-md shrink-0">
              A
            </div>
            <span className="font-extrabold text-xl tracking-tight text-zinc-900">
              Auto Insta <span className="text-gradient">Flow</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard/home"
                className="px-4 py-2 rounded-xl bg-zinc-150 text-zinc-800 font-bold hover:bg-zinc-200 transition flex items-center gap-1.5 text-sm border border-zinc-250 shadow-sm"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4 text-purple-600" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-md hover:opacity-95 transition text-sm flex items-center justify-center"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-16 flex flex-col gap-24">
        <section className="text-center flex flex-col items-center gap-6 max-w-3xl mx-auto pt-10 animate-scaleUp">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-sm font-semibold mb-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Instagram-Approved DM Automation SaaS
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight text-zinc-900">
            Convert comments and replies into <span className="text-gradient">automated sales</span>
          </h1>
          
          <p className="text-base sm:text-lg text-zinc-500 leading-relaxed max-w-2xl">
            Auto Insta Flow helps content creators and businesses instantly reply to comments, story reactions, and DMs with automated links, captured emails, and follow verification.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            {user ? (
              <Link href="/dashboard/home" className="btn-gradient px-8 py-3.5 flex items-center justify-center gap-2 text-base">
                Manage Your Workspaces <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link href="/login" className="btn-gradient px-8 py-3.5 flex items-center justify-center gap-2 text-base">
                Get Started for Free <Sparkles className="w-5 h-5" />
              </Link>
            )}
            <a href="#features" className="px-6 py-3.5 rounded-xl border border-zinc-250 bg-white text-zinc-700 font-bold hover:bg-zinc-50 transition flex items-center justify-center shadow-sm">
              Learn More
            </a>
          </div>
        </section>

        {/* Features grid */}
        <section id="features" className="flex flex-col gap-12">
          <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Designed to maximize engagement</h2>
            <p className="text-zinc-500 text-sm">Ditch manual copy-pasting. Deliver assets automatically and capture leads in seconds.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl p-8 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900">Comment to DM</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Automatically trigger a personalized direct message containing files or links whenever someone comments keywords on your posts or reels.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl p-8 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-650 shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900">Email Gating</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Require users to drop their email address in the chat flow before unlocking links, growing your list automatically on auto-pilot.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl p-8 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-650 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900">Follow Gating</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Instantly verify if the comment sender is following your account. Prompt them to follow first before receiving the resource.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing plans */}
        <section id="pricing" className="flex flex-col gap-12">
          <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
            <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Simple, transparent pricing</h2>
            <p className="text-zinc-500 text-sm">Scale up as your audience grows. Upgrade or downgrade at any time.</p>
            
            {/* Toggle */}
            <div className="inline-flex p-1 bg-zinc-100 border border-zinc-200 rounded-xl mx-auto mt-4">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${billingCycle === 'monthly' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${billingCycle === 'yearly' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Yearly <span className="bg-pink-100 text-pink-650 px-1.5 py-0.5 rounded text-[9px] font-bold">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {/* Free */}
            <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl p-8 flex flex-col justify-between gap-8 relative overflow-hidden">
              <div className="flex flex-col gap-4">
                <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Free Plan</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-zinc-950">$0</span>
                  <span className="text-zinc-500 text-sm font-semibold">/mo</span>
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed">Perfect for creators getting started with comments automation.</p>
                <hr className="border-zinc-100 my-2" />
                <ul className="flex flex-col gap-3 text-sm text-zinc-650">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> 1 connected account</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> 500 DMs per month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Comment & DM Triggers</li>
                  <li className="flex items-center gap-2 text-zinc-350 line-through"><Check className="w-4 h-4 text-zinc-300 shrink-0" /> Email & Follow Gates</li>
                  <li className="flex items-center gap-2 text-zinc-350 line-through"><Check className="w-4 h-4 text-zinc-300 shrink-0" /> CSV Export & Geo-analytics</li>
                </ul>
              </div>
              <Link href="/login" className="w-full py-2.5 rounded-xl border border-zinc-250 bg-zinc-50 hover:bg-zinc-100 font-bold transition text-sm text-zinc-700 flex items-center justify-center shadow-sm">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white border-2 border-purple-500 shadow-2xl rounded-2xl p-8 flex flex-col justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-pink-500 text-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-bl-xl">
                Popular
              </div>
              <div className="flex flex-col gap-4">
                <div className="text-purple-600 text-xs font-bold uppercase tracking-widest">Pro Plan</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-zinc-950">
                    {billingCycle === 'monthly' ? '$15' : '$12'}
                  </span>
                  <span className="text-zinc-500 text-sm font-semibold">/mo</span>
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed">Ideal for growing creators wanting advanced lead capture.</p>
                <hr className="border-zinc-100 my-2" />
                <ul className="flex flex-col gap-3 text-sm text-zinc-655">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> 2 connected accounts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> 5,000 DMs per month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Unlimited keywords</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Email & Follow Gates</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> CSV Export & link tracking</li>
                </ul>
              </div>
              <Link href="/login" className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-505 font-bold transition text-sm text-white shadow-md flex items-center justify-center">
                Get Pro Now
              </Link>
            </div>

            {/* Growth */}
            <div className="bg-white border border-zinc-200 shadow-xl rounded-2xl p-8 flex flex-col justify-between gap-8 relative overflow-hidden">
              <div className="flex flex-col gap-4">
                <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Growth Plan</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-zinc-950">
                    {billingCycle === 'monthly' ? '$30' : '$24'}
                  </span>
                  <span className="text-zinc-500 text-sm font-semibold">/mo</span>
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed">Built for agencies and top content creation businesses.</p>
                <hr className="border-zinc-100 my-2" />
                <ul className="flex flex-col gap-3 text-sm text-zinc-650">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> 5 connected accounts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> 10,000 DMs per month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> All Pro features included</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Geo-analytics insights</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Priority webhook execution</li>
                </ul>
              </div>
              <Link href="/login" className="w-full py-2.5 rounded-xl border border-zinc-250 bg-zinc-50 hover:bg-zinc-100 font-bold transition text-sm text-zinc-700 flex items-center justify-center shadow-sm">
                Get Growth Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 mt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-450 text-xs font-semibold">
          <div>&copy; {new Date().getFullYear()} Auto Insta Flow. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-700 transition">Terms of Service</a>
            <a href="#" className="hover:text-zinc-700 transition">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-700 transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
