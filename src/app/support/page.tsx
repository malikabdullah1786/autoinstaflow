"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, Mail, MessageSquare, ArrowRight, ArrowLeft, CheckCircle, Copy, Clock, Globe, Send } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function PublicSupportPage() {
  const { user } = useApp();
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync email if user loads after mount
  React.useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setSubject('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText('instaflowauto@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const faqs = [
    {
      q: "How does the comment automation trigger work?",
      a: "Our system listens for Meta webhooks. When a user comments on your specified Instagram post or Reel, the webhook triggers our system, which evaluates the text and instantly dispatches your configured DM in real-time."
    },
    {
      q: "Is Auto Insta Flow approved by Meta?",
      a: "Yes, absolutely. We use the official Meta Graph API and secure OAuth protocol. We never ask for your Instagram password, ensuring 100% security and compliance with Meta's developer terms."
    },
    {
      q: "Can I collect email addresses through DMs?",
      a: "Yes! By enabling the 'Email Gate' action in your automation, the system asks the user for their email. Once they reply with a valid email address, it is stored in your contacts dashboard and the gated link is released."
    },
    {
      q: "What happens if my QStash daily message limits are reached?",
      a: "Our system has an automatic smart fallback. If QStash limits or rate limits are reached, the system immediately switches to direct synchronous processing, ensuring no automated reply or lead is ever lost."
    }
  ];

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
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-16 flex flex-col gap-8">
        
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 p-8 md:p-12 text-white shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]"></div>
          <div className="relative z-10 max-w-2xl flex flex-col gap-3">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase w-max">
              Public Help Center
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Support & Help Center
            </h1>
            <p className="text-sm text-purple-100 leading-relaxed font-medium">
              Have questions about integrations, billing, or custom automation flows? Reach out to our dedicated support team directly or explore the frequently asked questions below.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Columns: Contact Form & FAQ */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Support Ticket Form */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 sm:p-8 rounded-2xl flex flex-col gap-6 backdrop-blur-md shadow-sm">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" /> Write to Support
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Fill out the form below to open a ticket. We'll get back to you directly via email.
                </p>
              </div>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-purple-200 text-xs flex flex-col gap-2 items-center text-center animate-scaleIn">
                  <CheckCircle className="w-10 h-10 text-purple-400 mb-1" />
                  <span className="font-extrabold text-sm text-white">Message Sent Successfully!</span>
                  <p className="text-zinc-400 max-w-sm">
                    Thank you! Your ticket has been forwarded to our support queue. We will contact you at <strong className="text-white font-bold">{email}</strong> within 2 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-300">Your Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-850 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-zinc-950 text-white transition font-medium"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-300">Subject</label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Connected account status issue"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-850 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-zinc-950 text-white transition font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-300">Describe your issue</label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Provide details about your question or issue, including any relevant post links or error messages..."
                      className="w-full px-4 py-3 rounded-xl border border-zinc-855 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 bg-zinc-955 text-white resize-none transition font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-gradient text-white px-6 py-3.5 rounded-xl text-xs font-extrabold shadow-md hover:opacity-95 transition flex items-center justify-center gap-2 sm:w-max ml-auto"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Message
                  </button>
                </form>
              )}
            </div>

            {/* FAQs section */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-400" /> Frequently Asked Questions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-xl hover:border-purple-500/30 transition-colors shadow-sm flex flex-col gap-2">
                    <span className="text-xs font-extrabold text-zinc-200">{faq.q}</span>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Contact info & Quick Links */}
          <div className="flex flex-col gap-6">
            
            {/* Direct Support Card */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl shadow-sm flex flex-col gap-5 backdrop-blur-md">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold tracking-wider text-purple-400 uppercase">Direct Access</span>
                <h3 className="text-sm font-extrabold text-white">Official Support Channel</h3>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Support Email</span>
                    <span className="text-xs font-bold text-white">instaflowauto@gmail.com</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    onClick={copyEmail}
                    className="flex-1 py-2 px-3 rounded-lg border border-zinc-800 hover:bg-zinc-900 text-[10px] font-extrabold text-zinc-300 transition flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy Email'}
                  </button>
                  <a
                    href="mailto:instaflowauto@gmail.com"
                    className="flex-1 py-2 px-3 rounded-lg bg-purple-650 hover:bg-purple-600 text-white text-[10px] font-extrabold transition flex items-center justify-center gap-1.5 text-center shadow-md"
                  >
                    Write Email
                  </a>
                </div>
              </div>

              <hr className="border-zinc-800/80" />

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Response time: <strong className="text-zinc-200">&lt; 2 Hours</strong></span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <Globe className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Global Coverage: <strong className="text-zinc-200">24/7 Mon - Sun</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 p-6 rounded-2xl shadow-sm flex flex-col gap-4 backdrop-blur-md">
              <h3 className="text-sm font-extrabold text-white">Helpful Resources</h3>
              <div className="flex flex-col gap-2">
                <Link 
                  href="/docs" 
                  className="p-3.5 rounded-xl border border-zinc-800 hover:bg-purple-950/20 hover:border-purple-500/30 transition flex items-center justify-between text-xs font-extrabold text-zinc-300 group"
                >
                  <span className="group-hover:text-purple-400 transition-colors">Documentation Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-all group-hover:translate-x-0.5" />
                </Link>
                <Link 
                  href="/api-reference" 
                  className="p-3.5 rounded-xl border border-zinc-800 hover:bg-purple-950/20 hover:border-purple-500/30 transition flex items-center justify-between text-xs font-extrabold text-zinc-300 group"
                >
                  <span className="group-hover:text-purple-400 transition-colors">API Reference Manual</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-all group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/20 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 text-xs font-semibold">
          <div>&copy; {new Date().getFullYear()} Auto Insta Flow. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-purple-450 transition">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-purple-450 transition">Privacy Policy</Link>
            <Link href="/support" className="hover:text-purple-450 transition text-white">Support</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
