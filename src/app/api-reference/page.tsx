"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Terminal, 
  Code, 
  HelpCircle, 
  ArrowLeft, 
  Search, 
  Copy, 
  Check, 
  Cpu, 
  Sparkles,
  Link as LinkIcon,
  Globe
} from 'lucide-react';

export default function ApiReferencePage() {
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('auth');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const endpoints = [
    {
      id: 'auth',
      name: 'Authentication',
      description: 'Authenticating your API requests. Currently, all frontend and client dashboard operations require active workspace authorization sessions managed automatically.',
    },
    {
      id: 'get-media',
      name: 'GET /api/instagram/media',
      method: 'GET',
      path: '/api/instagram/media',
      description: 'Fetch the most recent posts, reels, and active stories published by a connected Instagram account.',
      params: [
        { name: 'accountId', type: 'string', required: true, desc: 'The unique ID of the Instagram Account stored in the database.' }
      ],
      response: `{
  "success": true,
  "posts": [
    {
      "id": "1782201916489",
      "caption": "Check out our new automation builder! 🚀 comment SEND to get it.",
      "type": "reel",
      "mediaUrl": "https://video.cdninstagram.com/...",
      "permalink": "https://www.instagram.com/reel/...",
      "thumbnailUrl": "https://scontent.cdninstagram.com/...",
      "commentsCount": 142,
      "likeCount": 1205,
      "publishedAt": "2026-06-23T08:25:36Z"
    }
  ]
}`,
      code: {
        curl: `curl -X GET "https://autoinstaflow.io/api/instagram/media?accountId=acc_12345"`,
        js: `const res = await fetch('/api/instagram/media?accountId=acc_12345');\nconst data = await res.json();\nconsole.log(data.posts);`,
        python: `import requests\n\nres = requests.get('https://autoinstaflow.io/api/instagram/media', params={'accountId': 'acc_12345'})\nposts = res.json()['posts']`
      }
    },
    {
      id: 'get-comments',
      name: 'GET /api/instagram/comments',
      method: 'GET',
      path: '/api/instagram/comments',
      description: 'Fetch the list of comments for a specific Instagram post, reel, or active story.',
      params: [
        { name: 'mediaId', type: 'string', required: true, desc: 'The unique media ID from Meta Graph API.' },
        { name: 'accountId', type: 'string', required: true, desc: 'The database ID of the connected Instagram account.' }
      ],
      response: `[
  {
    "id": "1802931726593817",
    "username": "john_doe",
    "text": "SEND me the link!",
    "timestamp": "2026-06-23T08:26:01Z"
  }
]`,
      code: {
        curl: `curl -X GET "https://autoinstaflow.io/api/instagram/comments?mediaId=1782201916489&accountId=acc_123"`,
        js: `const res = await fetch('/api/instagram/comments?mediaId=1782201916489&accountId=acc_123');\nconst comments = await res.json();`,
        python: `import requests\n\nparams = {'mediaId': '1782201916489', 'accountId': 'acc_123'}\nres = requests.get('https://autoinstaflow.io/api/instagram/comments', params=params)\ncomments = res.json()`
      }
    },
    {
      id: 'send-dm',
      name: 'POST /api/instagram/send-dm',
      method: 'POST',
      path: '/api/instagram/send-dm',
      description: 'Send a private DM reply directly linked to a specific comment ID.',
      params: [
        { name: 'commentId', type: 'string', required: true, desc: 'The comment ID to send the reply to.' },
        { name: 'text', type: 'string', required: true, desc: 'The message body/text to deliver.' },
        { name: 'accountId', type: 'string', required: false, desc: 'Optional. The account ID to pull access tokens from database.' },
        { name: 'accessToken', type: 'string', required: false, desc: 'Optional. Custom Meta user access token.' },
        { name: 'igId', type: 'string', required: false, desc: 'Optional. Direct Instagram profile ID.' }
      ],
      response: `{
  "success": true,
  "data": {
    "recipient_id": "user_98765",
    "message_id": "m_12345abcd"
  }
}`,
      code: {
        curl: `curl -X POST "https://autoinstaflow.io/api/instagram/send-dm" \\
  -H "Content-Type: application/json" \\
  -d '{"commentId": "1802931726593817", "text": "Here is your link: https://example.com", "accountId": "acc_123"}'`,
        js: `const res = await fetch('/api/instagram/send-dm', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    commentId: "1802931726593817",\n    text: "Here is your link: https://example.com",\n    accountId: "acc_123"\n  })\n});\nconst result = await res.json();`,
        python: `import requests\n\npayload = {\n    "commentId": "1802931726593817",\n    "text": "Here is your link: https://example.com",\n    "accountId": "acc_123"\n}\nres = requests.post('https://autoinstaflow.io/api/instagram/send-dm', json=payload)\nprint(res.json())`
      }
    },
    {
      id: 'lookup',
      name: 'POST /api/instagram/lookup',
      method: 'POST',
      path: '/api/instagram/lookup',
      description: 'Query public Creator or Business accounts using Meta Business Discovery APIs.',
      params: [
        { name: 'username', type: 'string', required: true, desc: 'The Instagram username (e.g. "@cristiano" or "cristiano") to fetch details for.' }
      ],
      response: `{
  "success": true,
  "isSimulated": false,
  "data": {
    "username": "creator_username",
    "name": "Jane Doe Creative",
    "profile_picture_url": "https://scontent.cdninstagram.com/...",
    "followers_count": 87400,
    "media_count": 342
  }
}`,
      code: {
        curl: `curl -X POST "https://autoinstaflow.io/api/instagram/lookup" \\
  -H "Content-Type: application/json" \\
  -d '{"username": "cristiano"}'`,
        js: `const res = await fetch('/api/instagram/lookup', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ username: 'cristiano' })\n});\nconst profile = await res.json();`,
        python: `import requests\n\nres = requests.post('https://autoinstaflow.io/api/instagram/lookup', json={'username': 'cristiano'})\nprofile = res.json()`
      }
    },
    {
      id: 'webhooks',
      name: 'Webhook Verification & Receiver',
      description: 'Configuring Meta webhooks to push comments, story responses, and DMs into the system in real time.',
      webhookDetails: true
    }
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-800 font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-50/50 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-blue-50/40 rounded-full blur-[100px] pointer-events-none" />

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
            Developer API Reference
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/docs" className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5" /> Documentation
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
        {/* Navigation Sidebar */}
        <aside className="w-64 shrink-0 hidden md:block sticky top-28 h-[calc(100vh-140px)] overflow-y-auto">
          <div className="flex flex-col gap-6">
            <div className="px-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              API References
            </div>
            <nav className="flex flex-col gap-1 border-l border-zinc-200 pl-3">
              {endpoints.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleScrollTo(item.id)}
                  className={`text-left text-xs py-1.5 block hover:text-zinc-900 transition-colors duration-150 relative truncate ${
                    activeSection === item.id 
                      ? 'text-purple-650 font-extrabold' 
                      : 'text-zinc-500'
                  }`}
                >
                  {item.name}
                  {activeSection === item.id && (
                    <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 w-1 h-3 bg-purple-600 rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Reference Content */}
        <main className="flex-1 max-w-4xl space-y-16">
          <div className="border-b border-zinc-200 pb-8">
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight leading-none mb-3">
              Developer APIs
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl">
              Integrate with the Auto Insta Flow automation engine, fetch public creator insights, scan reels and comments, and handle webhook alerts.
            </p>
          </div>

          {/* Section: Authentication */}
          <section id="auth" className="scroll-mt-24">
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Authentication</h2>
            <p className="text-zinc-650 text-xs leading-relaxed mb-4">
              All backend endpoints check authentication cookies verified via Google and Supabase sessions. For server-to-server calls or webhook events, validation relies on signing verification (such as Meta's Webhook Signature validation header).
            </p>
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
              <span className="text-xs font-bold text-zinc-800 block mb-1">Authorization Headers</span>
              <p className="text-xs text-zinc-500">
                Incoming webhooks require <code>X-Hub-Signature-256</code> computed via your Instagram App Secret.
              </p>
            </div>
          </section>

          {/* Map endpoints */}
          {endpoints.filter(e => e.method).map((ep) => (
            <section key={ep.id} id={ep.id} className="scroll-mt-24 space-y-6">
              <div className="flex flex-col gap-2 border-t border-zinc-200 pt-8">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                    ep.method === 'GET' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-105' 
                      : 'bg-green-50 text-green-700 border border-green-105'
                  }`}>
                    {ep.method}
                  </span>
                  <h2 className="text-xl font-bold text-zinc-900 tracking-tight">{ep.name}</h2>
                </div>
                <p className="text-xs text-zinc-500">{ep.description}</p>
              </div>

              {/* Grid: Code Snippet & Body */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Params and Descriptions */}
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-zinc-800 block mb-2">Request Parameters</span>
                    <div className="divide-y divide-zinc-200 bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden text-xs">
                      {ep.params?.map((p) => (
                        <div key={p.name} className="p-3 flex flex-col gap-1 bg-white">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-purple-650 font-bold">{p.name}</span>
                            <span className="text-[10px] text-zinc-400">
                              {p.type} • {p.required ? <strong className="text-red-500">required</strong> : 'optional'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{p.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-zinc-800 block mb-2">Response Payload (200 OK)</span>
                    <div className="relative">
                      <button 
                        onClick={() => copyToClipboard(ep.response || '', `${ep.id}-res`)}
                        className="absolute right-3 top-3 text-zinc-450 hover:text-white transition"
                      >
                        {copiedText === `${ep.id}-res` ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <pre className="bg-[#0e0e11] border border-zinc-800 text-zinc-300 p-4 rounded-xl text-[10px] overflow-x-auto font-mono max-h-80 select-all">
                        {ep.response}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Right: Code Console Tabs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <span className="text-xs font-bold text-zinc-800">Request Example</span>
                    <div className="flex gap-1.5 bg-zinc-100 p-1 rounded-lg">
                      {(['curl', 'js', 'python'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition ${
                            activeTab === tab 
                              ? 'bg-zinc-900 text-white' 
                              : 'text-zinc-500 hover:text-zinc-800'
                          }`}
                        >
                          {tab === 'curl' ? 'cURL' : tab === 'js' ? 'JS' : 'Python'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => copyToClipboard(ep.code?.[activeTab] || '', `${ep.id}-code`)}
                      className="absolute right-3 top-3 text-zinc-500 hover:text-white transition z-10"
                    >
                      {copiedText === `${ep.id}-code` ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="bg-[#0e0e11] border border-zinc-800 text-zinc-300 p-4 rounded-xl text-[10px] overflow-x-auto font-mono min-h-40 max-h-80 select-all">
                      {ep.code?.[activeTab]}
                    </pre>
                  </div>
                </div>
              </div>
            </section>
          ))}

          {/* Webhook details */}
          <section id="webhooks" className="scroll-mt-24 border-t border-zinc-200 pt-8 space-y-4">
            <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-600" /> Webhook Setup & Integration
            </h2>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Auto Insta Flow relies on Real-Time Graph API Webhooks to process events on Instagram instantly. Setup requires completing the challenge handshake, and validating the signature on incoming payloads.
            </p>

            <div className="space-y-4">
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-zinc-850 block border-b border-zinc-200 pb-1.5">1. Challenge Handshake (GET /api/webhooks/instagram)</span>
                <p className="text-xs text-zinc-650 leading-relaxed">
                  Meta calls your webhook endpoint with verification query params. You must compare the token and return the challenge query parameter as plain text.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] text-zinc-500 font-mono">
                  <div><strong>hub.mode:</strong> Must equal <code>"subscribe"</code></div>
                  <div><strong>hub.verify_token:</strong> Compare with <code>INSTAGRAM_WEBHOOK_VERIFY_TOKEN</code></div>
                  <div><strong>hub.challenge:</strong> Echo back in response body with 200 OK.</div>
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-zinc-850 block border-b border-zinc-200 pb-1.5">2. Event Receiver (POST /api/webhooks/instagram)</span>
                <p className="text-xs text-zinc-650 leading-relaxed">
                  Meta sends JSON events (comments, stories, DMs) in real time. Validate payloads using the SHA256 signature in the <code>x-hub-signature-256</code> header.
                </p>
                <pre className="bg-[#0e0e11] border border-zinc-800 text-zinc-350 p-4 rounded-xl text-[9px] overflow-x-auto font-mono">
{`// Header: x-hub-signature-256 = sha256=abcdef12345...
{
  "entry": [
    {
      "id": "instagram_business_account_id",
      "time": 1782201916,
      "changes": [
        {
          "field": "comments",
          "value": {
            "id": "1802931726593817",
            "text": "GIVE ME THE EBOOK!",
            "from": {
              "id": "sender_user_id",
              "username": "john_doe"
            },
            "media": {
              "id": "1782201916489",
              "media_product_type": "REELS"
            }
          }
        }
      ]
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-50 py-8 px-6 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} Auto Insta Flow. All rights reserved. Meta & Instagram are registered trademarks of Meta Platforms Inc.</p>
      </footer>
    </div>
  );
}
