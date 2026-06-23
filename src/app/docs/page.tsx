"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  HelpCircle, 
  Settings, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight, 
  Search, 
  Sparkles, 
  ArrowLeft,
  Terminal,
  Layers,
  Users,
  Compass
} from 'lucide-react';

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Sparkles className="w-4 h-4 text-purple-600" />,
      items: [
        { id: 'introduction', label: 'Introduction' },
        { id: 'installation', label: 'Account Setup' },
        { id: 'linking', label: 'Linking Instagram' }
      ]
    },
    {
      id: 'automations',
      title: 'Automations',
      icon: <Settings className="w-4 h-4 text-pink-600" />,
      items: [
        { id: 'triggers', label: 'Triggers & Keywords' },
        { id: 'actions', label: 'Actions & Response' },
        { id: 'templates', label: 'Using Templates' }
      ]
    },
    {
      id: 'gated-flows',
      title: 'Gated Engagement',
      icon: <Layers className="w-4 h-4 text-blue-605" />,
      items: [
        { id: 'follow-gate', label: 'Follow Gate' },
        { id: 'email-gate', label: 'Email Gate' }
      ]
    },
    {
      id: 'management',
      title: 'Workspace & Analytics',
      icon: <Users className="w-4 h-4 text-emerald-600" />,
      items: [
        { id: 'contacts', label: 'Managing Contacts' },
        { id: 'analytics-tracking', label: 'CTR & Metrics' },
        { id: 'limits-billing', label: 'Limits & Quotas' }
      ]
    }
  ];

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-800 font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-100/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-pink-100/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-50/30 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-extrabold text-lg tracking-tight text-zinc-900 flex items-center gap-1">
              Auto Insta Flow <span className="text-purple-650 font-black leading-none text-xl">+</span>
            </span>
          </Link>
          <span className="h-4 w-px bg-zinc-200" />
          <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
            Documentation Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/api-reference" className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> API Reference
          </Link>
          <Link href="/dashboard/support" className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" /> Support
          </Link>
          <Link href="/dashboard/home" className="text-xs font-bold bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex gap-8">
        {/* Left Sidebar */}
        <aside className="w-64 shrink-0 hidden md:block sticky top-28 h-[calc(100vh-140px)] overflow-y-auto pr-2">
          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-55/60 border border-zinc-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-purple-500 focus:bg-white transition placeholder:text-zinc-400 text-zinc-900"
            />
          </div>

          <nav className="flex flex-col gap-6">
            {sections.map((section) => (
              <div key={section.id} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 px-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  {section.icon}
                  <span>{section.title}</span>
                </div>
                <div className="flex flex-col gap-0.5 border-l border-zinc-200 ml-4 pl-3.5 mt-1">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleScrollTo(item.id)}
                      className={`text-left text-xs py-1.5 hover:text-zinc-900 transition-colors duration-150 relative ${
                        activeSection === item.id 
                          ? 'text-purple-650 font-extrabold' 
                          : 'text-zinc-500'
                      }`}
                    >
                      {item.label}
                      {activeSection === item.id && (
                        <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 w-1 h-3 bg-purple-600 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 max-w-4xl overflow-y-auto">
          {/* Header intro */}
          <div className="mb-12 border-b border-zinc-200 pb-8">
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight leading-none mb-3">
              Developer & User Guides
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl">
              Learn how to connect your Instagram accounts, build automation pipelines, configure gated lead magnets, and monitor audience engagement with Auto Insta Flow.
            </p>
          </div>

          {/* Section: Getting Started */}
          <section id="introduction" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-2xl font-extrabold text-zinc-900">Introduction</h2>
            </div>
            <div className="prose prose-sm text-zinc-600 leading-relaxed space-y-4">
              <p>
                <strong>Auto Insta Flow</strong> is an enterprise-grade Instagram automation SaaS platform designed for creators, businesses, and developers. It converts comments, direct messages, and story reactions into interactive, automated flows to drive sales, capture leads, and boost social proof.
              </p>
              <p>
                With Auto Insta Flow, you can listen for live comments on specific posts, reels, or stories, and immediately dispatch customized direct messages (DMs). You can configure rules to require a follow (<strong>Follow Gate</strong>) or email address (<strong>Email Gate</strong>) before releasing links or assets.
              </p>
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-950 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-purple-900">Pro Tip:</strong> We recommend building a dedicated keyword flow like <code>"SEND"</code> or <code>"LINK"</code> on your highest performing reels to immediately see a 10x lift in conversion compared to traditional link-in-bio setups.
                </div>
              </div>
            </div>
          </section>

          <section id="installation" className="mb-16 scroll-mt-24">
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Account Setup</h3>
            <div className="prose prose-sm text-zinc-600 leading-relaxed space-y-4">
              <p>
                Getting started with Auto Insta Flow takes less than 2 minutes. Follow these three steps:
              </p>
              <ol className="list-decimal list-inside space-y-3 pl-2">
                <li>
                  <strong className="text-zinc-900">Sign in with Google:</strong> Authenticate instantly without passwords. We generate a default workspace automatically upon your first login.
                </li>
                <li>
                  <strong className="text-zinc-900">Configure Workspace:</strong> Workspaces separate different clients, accounts, or brands. Isolate all analytics, contacts, and workflows cleanly.
                </li>
                <li>
                  <strong className="text-zinc-900">Select Subscription:</strong> Check your current plan capabilities. Gated features, contact exports, and advanced analytics require a <strong>Pro</strong> or <strong>Growth</strong> tier.
                </li>
              </ol>
            </div>
          </section>

          <section id="linking" className="mb-16 scroll-mt-24">
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Linking Instagram Accounts</h3>
            <div className="prose prose-sm text-zinc-600 leading-relaxed space-y-4">
              <p>
                To enable automation, link your Instagram business profile to your workspace via Facebook Login.
              </p>
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col gap-3">
                <span className="text-xs font-bold text-zinc-800">OAuth Connection Requirements:</span>
                <ul className="list-disc list-inside text-xs text-zinc-600 space-y-1.5 pl-2">
                  <li>Your Instagram account must be converted to a <strong className="text-zinc-800">Creator</strong> or <strong className="text-zinc-800">Business</strong> account.</li>
                  <li>The Instagram account must be linked to an active <strong className="text-zinc-800">Facebook Page</strong> that you admin.</li>
                  <li>Authorize all requested permissions (read comments, manage messages, access stories).</li>
                </ul>
              </div>
              <p>
                Upon completion, we exchange the Meta auth code for a secure, long-lived access token. We auto-refresh these tokens in the background to ensure your automations remain live without interruption. If token authorization expires (due to password changes or Meta policy changes), you'll receive a dashboard alert to reconnect.
              </p>
            </div>
          </section>

          {/* Section: Automations */}
          <section id="triggers" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-pink-600" />
              <h2 className="text-2xl font-extrabold text-zinc-900">Triggers & Keywords</h2>
            </div>
            <div className="prose prose-sm text-zinc-600 leading-relaxed space-y-4">
              <p>
                Automations are activated by specific triggers. Auto Insta Flow supports three trigger types:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-xs font-bold text-zinc-900 block mb-1">Comment Triggers</span>
                  <p className="text-xs text-zinc-500">Fires when someone comments on a selected post or reel. You can restrict this to specific keywords.</p>
                </div>
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-xs font-bold text-zinc-900 block mb-1">Story Replies</span>
                  <p className="text-xs text-zinc-500">Triggers when a follower replies to or reacts with emojis to a live active story (within the 24-hour window).</p>
                </div>
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-xs font-bold text-zinc-900 block mb-1">Direct Messages</span>
                  <p className="text-xs text-zinc-500">Activates on incoming direct messages containing your specified keywords.</p>
                </div>
              </div>
              <h4 className="text-sm font-extrabold text-zinc-900">Keyword Matching Logic</h4>
              <p>
                Keyword matching is <strong className="text-pink-600">case-insensitive</strong>. For example, if you set the keyword trigger to <code>"promo"</code>, comment terms like <code>"PROMO!"</code> or <code>"Promo code please"</code> will successfully trigger the automation. You can set multiple keywords per automation. If no keywords are configured, the trigger fires on *every* comment/reaction.
              </p>
            </div>
          </section>

          <section id="actions" className="mb-16 scroll-mt-24">
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Actions & Responses</h3>
            <div className="prose prose-sm text-zinc-600 leading-relaxed space-y-4">
              <p>
                Once a trigger is activated, Auto Insta Flow executes your chosen response actions.
              </p>
              <table className="min-w-full text-xs text-left border-collapse my-6">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-700 font-bold bg-zinc-50">
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3">Behavior</th>
                    <th className="py-2.5 px-3">Available On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900">Send DM with Link</td>
                    <td className="py-2.5 px-3">Sends the recipient a direct message with text and a custom clickable URL.</td>
                    <td className="py-2.5 px-3 text-zinc-500">All Plans</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900">Follow Gate</td>
                    <td className="py-2.5 px-3">Checks if the user follows your profile. If not, sends a follow prompt before sending the link.</td>
                    <td className="py-2.5 px-3 text-purple-650 font-semibold">Pro, Growth</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900">Email Gate</td>
                    <td className="py-2.5 px-3">Prompts the user for their email in the DM thread, saving it to Contacts before releasing the link.</td>
                    <td className="py-2.5 px-3 text-purple-650 font-semibold">Pro, Growth</td>
                  </tr>
                </tbody>
              </table>
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs leading-relaxed space-y-2">
                <span className="font-bold text-zinc-900 block">Deduplication Protection:</span>
                <p>
                  To prevent spam, Auto Insta Flow incorporates built-in rate safeguards. The platform will not trigger the same automation for the same Instagram account multiple times within a <strong className="text-zinc-900">24-hour window</strong>.
                </p>
              </div>
            </div>
          </section>

          <section id="templates" className="mb-16 scroll-mt-24">
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Using Templates</h3>
            <div className="prose prose-sm text-zinc-600 leading-relaxed space-y-4">
              <p>
                Our Template Library includes 18 pre-built templates organized by operational objectives:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong className="text-zinc-900">Sell & Earn:</strong> Affiliate Links, Discount Codes, Product Promos.</li>
                <li><strong className="text-zinc-900">Capture Leads:</strong> Deliver Lead Magnets, Collect Emails First, Grow Waitlists.</li>
                <li><strong className="text-zinc-900">Engage Audience:</strong> Thank Story Reactor, Thank Commenters, Start Conversations.</li>
              </ul>
              <p>
                Applying a template populates pre-configured triggers, keywords, and action blocks into your editor, which you can customize and save as a standard automation.
              </p>
            </div>
          </section>

          {/* Section: Gated Engagement */}
          <section id="follow-gate" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="text-2xl font-extrabold text-zinc-900">Gated Engagement</h2>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">Follow Gate</h3>
            <div className="prose prose-sm text-zinc-600 leading-relaxed space-y-4">
              <p>
                The <strong>Follow Gate</strong> action prompts non-followers to follow your account before they receive their asset or link:
              </p>
              <ol className="list-decimal list-inside space-y-2.5 pl-2">
                <li>User triggers automation by commenting.</li>
                <li>System checks follow status. If they are already following, the link is sent instantly.</li>
                <li>If they are not following, the system replies in DMs with: <em>"To access this link, follow @username and tap the Following button below!"</em> along with a button option.</li>
                <li>Once the user follows and clicks the button, the system verifies and delivers the URL.</li>
              </ol>
            </div>
          </section>

          <section id="email-gate" className="mb-16 scroll-mt-24">
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Email Gate</h3>
            <div className="prose prose-sm text-zinc-600 leading-relaxed space-y-4">
              <p>
                The <strong>Email Gate</strong> captures verified lead information directly inside Instagram DMs:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Upon trigger, the system replies: <em>"Awesome! Please reply with your email address to receive your guide."</em></li>
                <li>The system detects the user's incoming message, runs a format verification check, and matches the email address.</li>
                <li>The email address is automatically saved to your contacts repository.</li>
                <li>The gated asset URL is delivered in DMs.</li>
              </ul>
            </div>
          </section>

          {/* Section: Workspace & Management */}
          <section id="contacts" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="text-2xl font-extrabold text-zinc-900">Workspace & Contacts Management</h2>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3">Managing Contacts</h3>
            <div className="prose prose-sm text-zinc-600 leading-relaxed space-y-4">
              <p>
                All profiles that interact with your automations are automatically compiled in the <strong>Contacts</strong> tab. This directory records the user's Instagram username, the date of last interaction, their email address (if captured via Email Gate), and the specific automation name they triggered.
              </p>
              <p>
                Paid tier subscribers (Pro & Growth) can click the <strong>"Export CSV"</strong> button to export contacts for external email tools (e.g. Mailchimp, ActiveCampaign, ConvertKit).
              </p>
            </div>
          </section>

          <section id="analytics-tracking" className="mb-16 scroll-mt-24">
            <h3 className="text-xl font-bold text-zinc-900 mb-4">CTR & Performance Metrics</h3>
            <div className="prose prose-sm text-zinc-600 leading-relaxed space-y-4">
              <p>
                Auto Insta Flow tracks performance analytics automatically:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li><strong className="text-zinc-900">DMs Sent:</strong> The total number of direct messages sent out.</li>
                <li><strong className="text-zinc-900">Link Clicks:</strong> Number of clicks registered on custom automation URLs.</li>
                <li><strong className="text-zinc-900">CTR (Click-Through Rate):</strong> Calculated as <code>(Link Clicks / DMs Sent) * 100</code>. A higher CTR indicates engaging content copy and high-intent landing pages.</li>
              </ul>
            </div>
          </section>

          <section id="limits-billing" className="mb-16 scroll-mt-24">
            <h3 className="text-xl font-bold text-zinc-900 mb-4">Limits & Quotas</h3>
            <div className="prose prose-sm text-zinc-600 leading-relaxed space-y-4">
              <p>
                Monthly message limits are based on your subscription:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                  <span className="text-xs font-bold text-zinc-500 block mb-1">Free Plan</span>
                  <span className="text-lg font-black text-zinc-900">500 DMs</span>
                  <span className="text-[10px] text-zinc-400 block mt-1">/ month</span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                  <span className="text-xs font-bold text-purple-600 block mb-1">Pro Plan</span>
                  <span className="text-lg font-black text-zinc-900">5,000 DMs</span>
                  <span className="text-[10px] text-zinc-400 block mt-1">/ month</span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
                  <span className="text-xs font-bold text-pink-600 block mb-1">Growth Plan</span>
                  <span className="text-lg font-black text-zinc-900">10,000 DMs</span>
                  <span className="text-[10px] text-zinc-400 block mt-1">/ month</span>
                </div>
              </div>
              <p>
                If you exhaust your monthly quota, automations are temporarily paused. You can upgrade your plan or purchase <strong>DM Add-On Packs</strong> (1,000 to 5,000 extra messages) that never expire and stack additively.
              </p>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-250 bg-zinc-50 py-8 px-6 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} Auto Insta Flow. All rights reserved. Meta & Instagram are registered trademarks of Meta Platforms Inc.</p>
      </footer>
    </div>
  );
}
