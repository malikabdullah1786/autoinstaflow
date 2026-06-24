"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Mail } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-extrabold text-white shadow-md">
              A
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              Auto Insta Flow <span className="text-purple-500">+</span>
            </span>
          </Link>

          <Link 
            href="/" 
            className="text-xs font-bold text-zinc-400 hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4" /> Legal Agreement
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="text-xs text-zinc-450">
            Last Updated: June 24, 2026
          </p>
        </div>

        <div className="w-full h-[1px] bg-gradient-to-r from-purple-500/20 via-zinc-800 to-transparent"></div>

        <div className="flex flex-col gap-6 text-zinc-350 text-xs leading-relaxed font-medium">
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Auto Insta Flow ("the Service"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not access or use our services.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-white">2. Description of Service</h2>
            <p>
              Auto Insta Flow is a Software-as-a-Service (SaaS) platform that provides Instagram-approved comment and DM automation tools. The Service integrates via the official Meta Graph API and OAuth protocols to automate responses, handle user engagement rules, and manage opt-in email collections based on user comments or direct messages.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-white">3. Instagram Account Security & Meta Compliance</h2>
            <p>
              We comply strictly with Meta's Developer Policies. Auto Insta Flow will never ask you for your Instagram or Facebook password. We connect using official authorization tokens which you can revoke at any time. You are solely responsible for ensuring your Instagram account is set up as a Creator or Business profile as required by Meta for API integration.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-white">4. Subscriptions, Quotas, and Billing</h2>
            <p>
              We offer both Free and Paid Subscription plans. Each plan has specific quotas for DMs processed per billing cycle. Unused quotas do not roll over to the next month. Any queue routing priority is assigned based on subscription tiers, with paid subscribers placed in the high-priority queue. We reserve the right to modify prices or subscription structures with prior notice.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-white">5. Prohibited Activities</h2>
            <p>
              You agree not to use the Service to send spam, distribute malicious or deceptive links, run phishing campaigns, or engage in any behavior that violates Instagram Community Guidelines. Failure to comply will result in immediate suspension or termination of your account without a refund.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-white">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Auto Insta Flow shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the Service, including but not limited to loss of data, loss of business, or suspension of Instagram profiles by Meta due to policy violations.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold text-white">7. Contact & Support</h2>
            <p>
              If you have any questions, concerns, or requests regarding these terms, please contact our support team directly at:
            </p>
            <div className="mt-2 p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3 w-max">
              <Mail className="w-4 h-4 text-purple-400" />
              <span className="font-extrabold text-white">instaflowauto@gmail.com</span>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/20 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 text-xs font-semibold">
          <div>&copy; {new Date().getFullYear()} Auto Insta Flow. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-purple-450 transition text-white">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-purple-450 transition">Privacy Policy</Link>
            <Link href="/support" className="hover:text-purple-450 transition">Support</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
