"use client";

import React, { useState } from 'react';
import { HelpCircle, Mail, MessageSquare, ArrowRight, CheckCircle } from 'lucide-react';

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setSubject('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 4000);
  };

  const faqs = [
    {
      q: "How does the comment automation trigger work?",
      a: "Our system listens for Meta webhooks. When a user writes a comment on your post or reel, the webhook fires, and our system sends the configured DM response within seconds."
    },
    {
      q: "Does Auto Insta Flow support carousel posts?",
      a: "Yes, you can configure comment automation rules to target specific posts (including carousels and reels) or apply rules globally to all your content."
    },
    {
      q: "Can I collect emails using comments and DMs?",
      a: "Yes! By enabling the 'Email Gate' feature in your automations, the system will ask users to submit their email address in the DM flow and store it directly in your contacts list."
    }
  ];

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Support & Help Center</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Have a question or running into an issue? Get help from our documentation or send us a message.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Contact Form & FAQ */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-zinc-700" /> Send a message to Support
            </h2>

            {submitted ? (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <span>Thank you! Your message has been sent to our support team. We'll reply within 24 hours.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-600">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="E.g. Connected account token issue"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-zinc-900 bg-zinc-50/50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-600">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-zinc-900 bg-zinc-50/50 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-zinc-950 text-white px-5 py-3 rounded-xl text-xs font-bold hover:bg-zinc-900 transition w-full sm:w-max ml-auto flex items-center justify-center gap-2"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* FAQs */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-zinc-900">Frequently Asked Questions</h3>
            <div className="flex flex-col gap-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="glass-panel p-4 bg-white border border-zinc-200 rounded-xl">
                  <span className="text-xs font-bold text-zinc-800 block mb-1">{faq.q}</span>
                  <p className="text-xs text-zinc-500 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Links */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-zinc-700" /> Helpful Links
            </h3>
            <div className="flex flex-col gap-2">
              <a 
                href="/docs" 
                target="_blank" 
                className="p-3 rounded-xl border border-zinc-150 hover:bg-zinc-50 transition flex items-center justify-between text-xs font-bold text-zinc-700"
              >
                <span>Documentation</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </a>
              <a 
                href="/api-reference" 
                target="_blank" 
                className="p-3 rounded-xl border border-zinc-150 hover:bg-zinc-50 transition flex items-center justify-between text-xs font-bold text-zinc-700"
              >
                <span>API Reference</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
