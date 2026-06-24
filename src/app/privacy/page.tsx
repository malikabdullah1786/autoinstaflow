"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Mail } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfd] text-zinc-800 font-sans selection:bg-purple-500/10 overflow-x-hidden">
      
      {/* Header */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-extrabold text-white shadow-md">
              A
            </div>
            <span className="font-extrabold text-lg tracking-tight text-zinc-900">
              Auto Insta Flow <span className="text-purple-600">+</span>
            </span>
          </Link>

          <Link 
            href="/" 
            className="text-xs font-bold text-zinc-550 hover:text-zinc-900 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 flex flex-col gap-8 animate-fadeIn">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-purple-600 text-xs font-bold tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4" /> Privacy & Security
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900">
            Privacy Policy
          </h1>
          <p className="text-xs text-zinc-500">
            Last Updated: June 24, 2026
          </p>
        </div>

        <div className="w-full h-[1px] bg-gradient-to-r from-purple-500/20 via-zinc-200 to-transparent"></div>

        <div className="flex flex-col gap-6 text-zinc-650 text-xs leading-relaxed font-medium">
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-zinc-900">1. Information We Collect</h2>
            <p>
              We collect information necessary to provide and optimize the Service, including:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-1 text-zinc-600">
              <li><strong>Instagram Profile Metadata:</strong> Handled entirely via official OAuth integration (username, follower counts, profile picture URL). We never access or store passwords.</li>
              <li><strong>Automation Event Data:</strong> Trigger-based data from Meta webhooks (comments written on posts, story replies, direct messages) to match keywords and execute automated dispatches.</li>
              <li><strong>Lead & Contact Info:</strong> Email addresses and user information collected dynamically through your active Email Gate flows when users opt-in.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-zinc-900">2. How We Use Information</h2>
            <p>
              The collected information is utilized solely to operate our core services:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 mt-1 text-zinc-600">
              <li>To trigger, process, and send automated direct message (DM) replies on your behalf.</li>
              <li>To manage contact databases and display captured leads inside your user dashboard.</li>
              <li>To track message counts and maintain monthly subscription usage quotas.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-zinc-900">3. Data Security & Storage</h2>
            <p>
              We prioritize data safety. All database communication (Supabase) is secured with TLS encryption, and tokens are stored in encrypted formats. We use Meta's verified API endpoints, and we never sell, rent, or distribute your automated campaign details or lead database to third parties.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-zinc-900">4. User Rights & Data Deletion</h2>
            <p>
              You have complete control. You can disconnect your Instagram profile or revoke application access tokens at any time through the dashboard or your Facebook/Instagram integration panel. Upon disconnection, we delete sync access tokens from our records immediately.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-zinc-900">5. Cookie Policy</h2>
            <p>
              We use standard session cookies and local storage tokens to keep you logged in and preserve dashboard preference choices. You can configure your browser to reject cookies, though some dashboard components may not load correctly as a result.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-zinc-900">6. Inquiries and Contacts</h2>
            <p>
              For data erasure requests, clarification on collected information, or general inquiries, contact us via email at:
            </p>
            <div className="mt-2 p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center gap-3 w-max">
              <Mail className="w-4 h-4 text-purple-600" />
              <span className="font-extrabold text-zinc-800">instaflowauto@gmail.com</span>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 mt-auto shadow-inner">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 text-xs font-semibold">
          <div>&copy; {new Date().getFullYear()} Auto Insta Flow. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-purple-650 transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-purple-650 transition text-purple-650">Privacy Policy</Link>
            <Link href="/support" className="hover:text-purple-650 transition">Support</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
