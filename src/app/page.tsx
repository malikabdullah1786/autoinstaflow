"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { 
  Sparkles, 
  MessageSquare, 
  ShieldCheck, 
  Mail, 
  Zap, 
  Check, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Phone, 
  Video, 
  Camera, 
  Smile, 
  Link as LinkIcon 
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useApp();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Floating Dropdown states
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [partnersOpen, setPartnersOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [activeLang, setActiveLang] = useState('EN');

  // Detect Instagram OAuth redirect: ?code= lands here because redirect_uri is the root URL.
  // Forward immediately to /dashboard/connect so the callback handler can process the code.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    if (code) {
      router.replace(`/dashboard/connect?code=${encodeURIComponent(code)}`);
    } else if (error) {
      router.replace(`/dashboard/connect?error=${encodeURIComponent(error)}`);
    }
  }, [router]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleScroll = (id: string) => {
    // Close all dropdowns
    setSolutionsOpen(false);
    setPartnersOpen(false);
    setResourcesOpen(false);
    setLangOpen(false);
    
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: "What is Auto Insta Flow and how does it work?",
      a: "Auto Insta Flow is an Instagram-approved DM automation tool. It connects to your Instagram account via official Meta APIs and monitors comments, story replies, and direct messages. When it detects a trigger keyword or condition (like commenting on a specific Reel), it automatically sends a configured DM response, registers emails, or verifies follows."
    },
    {
      q: "Is Auto Insta Flow safe for my Instagram account?",
      a: "Yes, absolutely. Auto Insta Flow uses the official Meta Graph API and OAuth protocol. We never ask for your Instagram password, and we comply with all Meta policies, making it 100% safe and compliant."
    },
    {
      q: "How much does Auto Insta Flow cost?",
      a: "We offer a Free Plan to get started with basic triggers. Our Pro Plan starts at Rs 1,000/month and Growth Plan at Rs 3,000/month, allowing you to scale up as your audience grows."
    },
    {
      q: "What is the difference between Auto Insta Flow and ManyChat?",
      a: "While ManyChat is a generic chatbot builder, Auto Insta Flow is built specifically for creators, UGC makers, and brands looking to convert comments into sales. It is lightweight, sets up in minutes, and focuses on high-conversion features like email gating, follow gating, and direct integrations."
    },
    {
      q: "Do I need a business or creator Instagram account?",
      a: "Yes, Meta requires a business or creator Instagram account linked to a Facebook Page to run automation. Conversion is free and takes less than a minute inside the Instagram app settings."
    },
    {
      q: "Can I collect emails through Instagram DMs?",
      a: "Yes! With our built-in Email Gate action, the system will ask commenters to reply with their email. Once they send a valid email, it is automatically captured, stored in your dashboard, and the system sends them the gated link."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#ccff00] selection:text-black overflow-x-hidden pb-12">
      
      {/* Dropdown Click Outside Overlay */}
      {(solutionsOpen || partnersOpen || resourcesOpen || langOpen) && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => {
            setSolutionsOpen(false);
            setPartnersOpen(false);
            setResourcesOpen(false);
            setLangOpen(false);
          }}
        />
      )}

      {/* Header / Navbar (Capsule floating styled) */}
      <div className="sticky top-6 z-50 w-full px-4 sm:px-6 max-w-7xl mx-auto">
        <header className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/80 rounded-full px-6 py-3 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative">
          <Link href="/" className="flex items-center gap-1 group">
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
              AutoInstaFlow <span className="text-[#ccff00] font-black leading-none text-lg">+</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-neutral-350 text-sm font-semibold relative">
            
            {/* Solutions Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setSolutionsOpen(!solutionsOpen);
                  setPartnersOpen(false);
                  setResourcesOpen(false);
                  setLangOpen(false);
                }}
                className="hover:text-white transition flex items-center gap-1 cursor-pointer focus:outline-none"
              >
                Solutions <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${solutionsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {solutionsOpen && (
                <div className="absolute top-full left-0 mt-3 bg-neutral-950/95 border border-neutral-800 rounded-2xl p-4 shadow-[0_15px_45px_rgba(0,0,0,0.9)] flex flex-col gap-2 min-w-[220px] z-50 backdrop-blur-md">
                  <button 
                    onClick={() => handleScroll('features')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition font-bold"
                  >
                    Affiliate Links
                  </button>
                  <button 
                    onClick={() => handleScroll('features')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition font-bold"
                  >
                    Email List Building
                  </button>
                  <button 
                    onClick={() => handleScroll('features')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition font-bold"
                  >
                    Story Auto-Replies
                  </button>
                </div>
              )}
            </div>

            {/* Pricing Link */}
            <button 
              onClick={() => handleScroll('pricing')}
              className="hover:text-white transition cursor-pointer focus:outline-none"
            >
              Pricing
            </button>

            {/* Partners Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setPartnersOpen(!partnersOpen);
                  setSolutionsOpen(false);
                  setResourcesOpen(false);
                  setLangOpen(false);
                }}
                className="hover:text-white transition flex items-center gap-1 cursor-pointer focus:outline-none"
              >
                Partners <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${partnersOpen ? 'rotate-180' : ''}`} />
              </button>

              {partnersOpen && (
                <div className="absolute top-full left-0 mt-3 bg-neutral-950/95 border border-neutral-800 rounded-2xl p-4 shadow-[0_15px_45px_rgba(0,0,0,0.9)] flex flex-col gap-2 min-w-[220px] z-50 backdrop-blur-md">
                  <button 
                    onClick={() => handleScroll('testimonials')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition font-bold"
                  >
                    Customer Stories
                  </button>
                  <button 
                    onClick={() => alert("Influencer affiliate program coming soon!")}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-neutral-450 hover:text-neutral-300 hover:bg-neutral-900 transition font-bold"
                  >
                    Influencer Program
                  </button>
                  <button 
                    onClick={() => alert("Agency dashboard and multi-account managers coming soon!")}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-neutral-450 hover:text-neutral-300 hover:bg-neutral-900 transition font-bold"
                  >
                    Agency Solutions
                  </button>
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setResourcesOpen(!resourcesOpen);
                  setSolutionsOpen(false);
                  setPartnersOpen(false);
                  setLangOpen(false);
                }}
                className="hover:text-white transition flex items-center gap-1 cursor-pointer focus:outline-none"
              >
                Resources <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${resourcesOpen ? 'rotate-180' : ''}`} />
              </button>

              {resourcesOpen && (
                <div className="absolute top-full left-0 mt-3 bg-neutral-950/95 border border-neutral-800 rounded-2xl p-4 shadow-[0_15px_45px_rgba(0,0,0,0.9)] flex flex-col gap-2 min-w-[220px] z-50 backdrop-blur-md">
                  <button 
                    onClick={() => handleScroll('faq')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition font-bold"
                  >
                    FAQ Help Center
                  </button>
                  <Link 
                    href="/dashboard/simulator" 
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition font-bold"
                  >
                    Interactive Simulator
                  </Link>
                  <Link 
                    href="/dashboard/connect" 
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition font-bold"
                  >
                    Setup Integration Guide
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-6">
            
            {/* Language Selector Dropdown */}
            <div className="relative hidden sm:inline-block">
              <button 
                onClick={() => {
                  setLangOpen(!langOpen);
                  setSolutionsOpen(false);
                  setPartnersOpen(false);
                  setResourcesOpen(false);
                }}
                className="flex items-center gap-1 text-xs text-neutral-350 font-bold cursor-pointer hover:text-white transition focus:outline-none"
              >
                🌐 {activeLang} <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div className="absolute top-full right-0 mt-3 bg-neutral-950/95 border border-neutral-850 rounded-2xl p-3 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col gap-1 min-w-[120px] z-50 backdrop-blur-md">
                  {['EN', 'ES', 'FR', 'DE'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setActiveLang(lang);
                        setLangOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 transition font-bold"
                    >
                      {lang === 'EN' && 'English'}
                      {lang === 'ES' && 'Español'}
                      {lang === 'FR' && 'Français'}
                      {lang === 'DE' && 'Deutsch'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dashboard Button */}
            {user ? (
              <Link
                href="/dashboard/home"
                className="px-5 py-2 rounded-full bg-[#ccff00] text-black font-extrabold hover:opacity-90 transition text-sm flex items-center gap-1.5 shadow-md"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 rounded-full bg-[#ccff00] text-black font-extrabold hover:opacity-90 transition text-sm flex items-center justify-center shadow-md"
              >
                Dashboard
              </Link>
            )}
          </div>
        </header>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-32">
        
        {/* HERO SECTION */}
        <section className="grid lg:grid-cols-12 gap-12 items-center pt-8">
          <div className="lg:col-span-7 flex flex-col items-start text-left gap-6">
            
            {/* Meta tech provider badge */}
            <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-350">
              <span className="flex items-center gap-1 font-bold text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Meta Tech Provider
              </span>
              <span className="text-neutral-600">|</span>
              <div className="flex items-center -space-x-1.5">
                <div className="w-4 h-4 rounded-full bg-neutral-700 border border-black flex items-center justify-center text-[7px] text-white">A</div>
                <div className="w-4 h-4 rounded-full bg-neutral-600 border border-black flex items-center justify-center text-[7px] text-white">B</div>
                <div className="w-4 h-4 rounded-full bg-neutral-500 border border-black flex items-center justify-center text-[7px] text-white">C</div>
              </div>
              <span className="text-neutral-400 font-medium">Trusted by +14,000 creators & brands</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.08] tracking-tight text-white">
              Instagram DM <br />
              Automation for <br />
              <span className="text-neutral-100">Creators & Brands</span>
            </h1>

            <p className="text-neutral-400 text-base sm:text-lg max-w-xl leading-relaxed">
              Auto-reply to comments, stories, and DMs with your link. Capture emails, grow followers, and track results. Set up in minutes, runs 24/7.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
              {user ? (
                <Link 
                  href="/dashboard/home" 
                  className="px-8 py-4 rounded-xl bg-[#ccff00] text-black font-extrabold text-center hover:opacity-90 transition shadow-[0_0_30px_rgba(204,255,0,0.15)] flex items-center justify-center gap-2"
                >
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link 
                  href="/login" 
                  className="px-8 py-4 rounded-xl bg-[#ccff00] text-black font-extrabold text-center hover:opacity-90 transition shadow-[0_0_30px_rgba(204,255,0,0.15)] flex items-center justify-center gap-2"
                >
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>

          {/* Simulated iPhone Screen */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[310px] aspect-[9/18.5] bg-black rounded-[45px] p-3 shadow-[0_0_80px_rgba(255,255,255,0.06)] border-4 border-neutral-800">
              
              {/* Dynamic Island */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-20 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-neutral-900 border border-neutral-800 absolute right-4"></div>
              </div>
              
              {/* Speaker bar */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-1 bg-neutral-900 rounded-full z-20"></div>

              {/* Screen Content Wrapper */}
              <div className="w-full h-full bg-neutral-50 rounded-[36px] overflow-hidden flex flex-col justify-between text-black font-sans relative border border-neutral-950">
                
                {/* iOS Status Bar */}
                <div className="h-10 px-6 flex items-center justify-between text-[11px] font-semibold text-neutral-800 bg-white shrink-0">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>5G</span>
                    <div className="w-5 h-2.5 border border-neutral-700 rounded-sm p-[1px] flex items-center">
                      <div className="w-3 h-full bg-neutral-700 rounded-2xs"></div>
                    </div>
                  </div>
                </div>

                {/* Chat Header */}
                <div className="px-4 py-2 border-b border-neutral-200 bg-white flex items-center justify-between shrink-0 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 font-bold text-sm select-none cursor-pointer">{"<"}</span>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 p-[1.5px]">
                        <div className="w-full h-full rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-700">
                          YF
                        </div>
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white"></span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold leading-tight">your_follower</span>
                      <span className="text-[9px] text-green-600 font-bold">Active now</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-600">
                    <Phone className="w-3.5 h-3.5" />
                    <Video className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-grow p-4 flex flex-col gap-3 overflow-y-auto text-[11px]">
                  
                  {/* Message 1: Comment Trigger / Keyword */}
                  <div className="self-start max-w-[75%] px-3.5 py-2.5 rounded-2xl bg-neutral-200 text-neutral-900 rounded-bl-xs">
                    LINK
                  </div>
                  
                  {/* Message 2: Bot prompt */}
                  <div className="self-end max-w-[75%] px-3.5 py-2.5 rounded-2xl bg-[#0084ff] text-white rounded-br-xs">
                    Hey! Thanks for asking! Drop your email and I'll send it over.
                  </div>

                  {/* Message 3: User replies email */}
                  <div className="self-start max-w-[75%] px-3.5 py-2.5 rounded-2xl bg-neutral-200 text-neutral-900 rounded-bl-xs">
                    hi@example.com
                  </div>

                  {/* Message 4: Bot sends link + preview card */}
                  <div className="self-end max-w-[80%] flex flex-col gap-1 items-end">
                    <div className="px-3.5 py-2.5 rounded-2xl bg-[#0084ff] text-white rounded-br-xs">
                      You're in! Here's your link:
                    </div>
                    
                    {/* Gated Link Preview Card */}
                    <div className="w-[190px] border border-neutral-200 bg-white rounded-xl overflow-hidden shadow-sm flex flex-col">
                      <div className="p-2.5 flex items-center gap-2 border-b border-neutral-100">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#0084ff] shrink-0">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col overflow-hidden text-left">
                          <span className="font-bold text-[9px] text-neutral-900 truncate">Shop the Look</span>
                          <span className="text-[8px] text-neutral-400 truncate font-semibold">yourstore.com/outfit</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Input Area */}
                <div className="p-3 border-t border-neutral-200 bg-white flex items-center gap-2 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="flex-grow px-3.5 py-2 bg-neutral-100 rounded-full border border-neutral-200 text-neutral-450 text-[10.5px] flex items-center justify-between">
                    <span>Message...</span>
                    <Smile className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* USE CASES SECTION */}
        <section id="features" className="flex flex-col gap-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                Turn comments into customers
              </h2>
              <p className="text-neutral-400 text-sm sm:text-base">
                Every use case your Instagram needs, handled automatically.
              </p>
            </div>
            
            {user ? (
              <Link 
                href="/dashboard/home" 
                className="px-6 py-3 rounded-full bg-[#ccff00] text-black font-extrabold text-sm hover:opacity-90 transition text-center shrink-0"
              >
                Start for Free
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="px-6 py-3 rounded-full bg-[#ccff00] text-black font-extrabold text-sm hover:opacity-90 transition text-center shrink-0"
              >
                Start for Free
              </Link>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Card 1: Affiliate links */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-8 flex flex-col justify-between gap-8 hover:border-neutral-800 transition">
              <div className="flex flex-col gap-4">
                <span className="text-[#ccff00] text-[10px] font-extrabold uppercase tracking-wider">
                  FOR AFFILIATE CREATORS, PRODUCT REVIEWERS, UGC CREATORS
                </span>
                <h3 className="text-2xl font-extrabold text-white">
                  Affiliate & product links
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Someone comments "LINK" on your Reel? They get your affiliate URL in their DMs. You earn commissions while you sleep.
                </p>
                <a href="#pricing" className="text-xs font-bold text-white hover:underline flex items-center gap-1 mt-2">
                  See affiliate solutions <ArrowRight className="w-3 h-3 text-[#ccff00]" />
                </a>
              </div>

              {/* Chat sub-mockup */}
              <div className="bg-neutral-100 rounded-2xl p-4 flex flex-col gap-2.5 text-[10px] text-black font-sans shadow-inner">
                <div className="self-start max-w-[80%] px-3 py-2 rounded-xl bg-neutral-200 text-neutral-800 rounded-bl-2xs">
                  LINK Where did you get that?
                </div>
                <div className="self-end max-w-[80%] px-3 py-2 rounded-xl bg-[#0084ff] text-white rounded-br-2xs text-right">
                  Here's your link! I earn a small commission at no extra cost to you:
                </div>
                <div className="self-end w-[150px] border border-neutral-200 bg-white rounded-lg p-2 flex items-center gap-1.5 shadow-xs">
                  <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-[#0084ff] shrink-0">
                    <LinkIcon className="w-3 h-3" />
                  </div>
                  <div className="flex flex-col overflow-hidden text-left">
                    <span className="font-bold text-[8px] truncate">Shop the Look</span>
                    <span className="text-[7px] text-neutral-450 truncate font-semibold">amazon.com/shop/jacket</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Email List Building */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-8 flex flex-col justify-between gap-8 hover:border-neutral-800 transition">
              <div className="flex flex-col gap-4">
                <span className="text-[#ccff00] text-[10px] font-extrabold uppercase tracking-wider">
                  FOR COACHES, COURSE CREATORS, EDUCATORS
                </span>
                <h3 className="text-2xl font-extrabold text-white">
                  Email list building
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Share a free guide. Collect their email before delivering it. Every post grows your list without a landing page.
                </p>
                <a href="#pricing" className="text-xs font-bold text-white hover:underline flex items-center gap-1 mt-2">
                  See coach solutions <ArrowRight className="w-3 h-3 text-[#ccff00]" />
                </a>
              </div>

              {/* Chat sub-mockup */}
              <div className="bg-neutral-100 rounded-2xl p-4 flex flex-col gap-2.5 text-[10px] text-black font-sans shadow-inner">
                <div className="self-start max-w-[80%] px-3 py-2 rounded-xl bg-neutral-200 text-neutral-800 rounded-bl-2xs">
                  GUIDE
                </div>
                <div className="self-end max-w-[80%] px-3 py-2 rounded-xl bg-[#0084ff] text-white rounded-br-2xs text-right">
                  I'd love to send it! Drop your email and I'll deliver it right here
                </div>
                <div className="self-start max-w-[80%] px-3 py-2 rounded-xl bg-neutral-200 text-neutral-800 rounded-bl-2xs">
                  emma@gmail.com
                </div>
                <div className="self-end max-w-[80%] px-3 py-2 rounded-xl bg-[#0084ff] text-white rounded-br-2xs text-right">
                  Got it! Here's your free guide:
                </div>
                <div className="self-end w-[150px] border border-neutral-200 bg-white rounded-lg p-2 flex items-center gap-1.5 shadow-xs">
                  <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-[#0084ff] shrink-0">
                    <LinkIcon className="w-3 h-3" />
                  </div>
                  <div className="flex flex-col overflow-hidden text-left">
                    <span className="font-bold text-[8px] truncate">Download: 10 Growth Tips</span>
                    <span className="text-[7px] text-neutral-450 truncate font-semibold">autoinstaflow.so/guide</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Story & Comment Replies */}
            <div className="bg-neutral-955 border-2 border-[#ccff00] rounded-3xl p-8 flex flex-col justify-between gap-8 relative shadow-[0_0_40px_rgba(204,255,0,0.06)]">
              <div className="absolute -top-3 right-8 bg-[#ccff00] text-black px-3.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                Popular
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[#ccff00] text-[10px] font-extrabold uppercase tracking-wider">
                  FOR E-COMMERCE BRANDS, DTC, SERVICE BUSINESSES
                </span>
                <h3 className="text-2xl font-extrabold text-white">
                  Story & comment auto-replies
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Reacts to your Story? Comments on your post? They get your offer, discount code, or booking link instantly.
                </p>
                <a href="#pricing" className="text-xs font-bold text-white hover:underline flex items-center gap-1 mt-2">
                  See e-commerce solutions <ArrowRight className="w-3 h-3 text-[#ccff00]" />
                </a>
              </div>

              {/* Chat sub-mockup */}
              <div className="bg-neutral-100 rounded-2xl p-4 flex flex-col gap-2.5 text-[10px] text-black font-sans shadow-inner">
                <div className="self-start max-w-[80%] px-3 py-2 rounded-xl bg-neutral-200 text-neutral-800 rounded-bl-2xs">
                  Love this! Where can I get it?
                </div>
                <div className="self-end max-w-[80%] px-3 py-2 rounded-xl bg-[#0084ff] text-white rounded-br-2xs text-right">
                  Thanks! Here's 15% off your first order:
                </div>
                <div className="self-end w-[150px] border border-neutral-200 bg-white rounded-lg p-2 flex items-center gap-1.5 shadow-xs">
                  <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-[#0084ff] shrink-0">
                    <LinkIcon className="w-3 h-3" />
                  </div>
                  <div className="flex flex-col overflow-hidden text-left">
                    <span className="font-bold text-[8px] truncate">Shop Now - 15% Off</span>
                    <span className="text-[7px] text-neutral-450 truncate font-semibold">yourstore.com/discount</span>
                  </div>
                </div>
                <div className="self-start max-w-[80%] px-3 py-2 rounded-xl bg-neutral-200 text-neutral-800 rounded-bl-2xs">
                  Just ordered! Love it
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section id="testimonials" className="flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              What Creators Say About Auto Insta Flow
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              Real reviews from Instagram creators and brands. All verified on Trustpilot.
            </p>
            
            {/* Stars */}
            <div className="flex items-center justify-center gap-1 mt-2 text-green-500 font-bold text-xs">
              <div className="flex text-[#ccff00]">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="ml-2 text-neutral-300">Rated 4.1/5 on Trustpilot</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Review 1 */}
            <div className="bg-white text-black rounded-3xl p-8 flex flex-col justify-between gap-6 shadow-xl border border-neutral-200">
              <div className="flex flex-col gap-3">
                <div className="flex text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <h4 className="font-extrabold text-lg text-neutral-900">
                  Reliable and easy to set up
                </h4>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  I've been using Auto Insta Flow to send automated messages to my followers, and it's extremely reliable. It's very easy to set up & I love the feature that lets you duplicate previous automations cause it saves a lot of time. The interface is beautiful and everything feels very intuitive. Since I started using it, it has already helped me double my revenue. Honestly, it's one of those tools that just makes your work easier. Highly recommend.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-700">
                  RV
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-neutral-900">Raluca Vazzolla</span>
                  <span className="text-[10px] text-neutral-400 font-bold">ES</span>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white text-black rounded-3xl p-8 flex flex-col justify-between gap-6 shadow-xl border border-neutral-200">
              <div className="flex flex-col gap-3">
                <div className="flex text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <h4 className="font-extrabold text-lg text-neutral-900">
                  Massive time saver...
                </h4>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Saved me a huge amount of time sending and replying to DMs and helped me build a substantial following much quicker. The system matches user keywords instantly and captures email leads perfectly.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-700">
                  IW
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-neutral-900">Ian Wardle</span>
                  <span className="text-[10px] text-neutral-400 font-bold">IE</span>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white text-black rounded-3xl p-8 flex flex-col justify-between gap-6 shadow-xl border border-neutral-200">
              <div className="flex flex-col gap-3">
                <div className="flex text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <h4 className="font-extrabold text-lg text-neutral-900">
                  Great platform.
                </h4>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Great platform. I like how they keep things simple and easy to manage. This platform really helped me a lot to set up automated gates and verify follow status on auto-pilot.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-700">
                  MW
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-neutral-900">Musashi Wisdom</span>
                  <span className="text-[10px] text-neutral-400 font-bold">TN</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="flex flex-col gap-12 border-t border-neutral-900 pt-16">
          <div className="text-center max-w-xl mx-auto flex flex-col gap-3">
            <span className="text-[#ccff00] text-xs font-bold uppercase tracking-wider">PRICING PLANS</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">Simple, transparent pricing</h2>
            <p className="text-neutral-400 text-sm">Scale up as your audience grows. Upgrade or downgrade at any time.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto w-full">
            
            {/* Free */}
            <div className="bg-neutral-950 border border-neutral-900 shadow-xl rounded-3xl p-8 flex flex-col justify-between gap-8 relative hover:border-neutral-850 transition">
              <div className="flex flex-col gap-4">
                <div className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Free Plan</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">Rs 0</span>
                  <span className="text-neutral-500 text-xs font-semibold">/mo</span>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">Perfect for creators getting started with comments automation.</p>
                <hr className="border-neutral-900 my-2" />
                <ul className="flex flex-col gap-3.5 text-xs text-neutral-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ccff00] shrink-0" /> 1 connected account</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ccff00] shrink-0" /> 500 DMs per month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ccff00] shrink-0" /> Comment & DM Triggers</li>
                  <li className="flex items-center gap-2 text-neutral-600 line-through"><Check className="w-4 h-4 text-neutral-700 shrink-0" /> Email & Follow Gates</li>
                  <li className="flex items-center gap-2 text-neutral-600 line-through"><Check className="w-4 h-4 text-neutral-700 shrink-0" /> CSV Export & Analytics</li>
                </ul>
              </div>
              <Link href="/login" className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 font-bold transition text-xs text-white flex items-center justify-center">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-neutral-950 border-2 border-[#ccff00] shadow-2xl rounded-3xl p-8 flex flex-col justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#ccff00] text-black px-3.5 py-1 text-[8px] font-extrabold uppercase tracking-wider rounded-bl-xl">
                Popular
              </div>
              <div className="flex flex-col gap-4">
                <div className="text-[#ccff00] text-xs font-bold uppercase tracking-widest">Pro Plan</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">Rs 1,000</span>
                  <span className="text-neutral-500 text-xs font-semibold">/mo</span>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">Ideal for growing creators wanting advanced lead capture.</p>
                <hr className="border-neutral-900 my-2" />
                <ul className="flex flex-col gap-3.5 text-xs text-neutral-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ccff00] shrink-0" /> 2 connected accounts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ccff00] shrink-0" /> 5,000 DMs per month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ccff00] shrink-0" /> Unlimited keywords</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ccff00] shrink-0" /> Email & Follow Gates</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ccff00] shrink-0" /> CSV Export & link tracking</li>
                </ul>
              </div>
              <Link href="/login" className="w-full py-3 rounded-xl bg-[#ccff00] hover:opacity-90 font-bold transition text-xs text-black flex items-center justify-center">
                Get Pro Now
              </Link>
            </div>

            {/* Growth */}
            <div className="bg-neutral-950 border border-neutral-900 shadow-xl rounded-3xl p-8 flex flex-col justify-between gap-8 relative hover:border-neutral-850 transition">
              <div className="flex flex-col gap-4">
                <div className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Growth Plan</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">Rs 3,000</span>
                  <span className="text-neutral-500 text-xs font-semibold">/mo</span>
                </div>
                <p className="text-neutral-400 text-xs leading-relaxed">Built for agencies and top content creation businesses.</p>
                <hr className="border-neutral-900 my-2" />
                <ul className="flex flex-col gap-3.5 text-xs text-neutral-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ccff00] shrink-0" /> 5 connected accounts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ccff00] shrink-0" /> 10,000 DMs per month</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ccff00] shrink-0" /> All Pro features included</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ccff00] shrink-0" /> Geo-analytics insights</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ccff00] shrink-0" /> Priority webhook execution</li>
                </ul>
              </div>
              <Link href="/login" className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 font-bold transition text-xs text-white flex items-center justify-center">
                Get Growth Now
              </Link>
            </div>

          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="flex flex-col gap-12 border-t border-neutral-900 pt-16">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Instagram DM automation FAQ
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base">
              Common questions about Auto Insta Flow, pricing, and Instagram DM automation.
            </p>
          </div>

          <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden transition"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-white hover:text-[#ccff00] transition gap-4 text-base"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
                  </button>
                  
                  {isOpen && (
                    <div className="px-6 pb-5 text-neutral-450 text-sm leading-relaxed border-t border-neutral-900/60 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* BOTTOM CTA SECTION */}
        <section className="relative rounded-[40px] bg-neutral-950 border border-neutral-900 p-8 sm:p-16 flex flex-col items-center text-center gap-8 overflow-hidden shadow-[0_0_80px_rgba(204,255,0,0.02)]">
          
          {/* Custom green neon wave element */}
          <div className="absolute right-0 bottom-0 w-[300px] h-[300px] bg-[#ccff00]/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white max-w-2xl leading-tight">
            Get started with Auto Insta Flow today
          </h2>
          
          <p className="text-neutral-400 text-sm sm:text-base max-w-lg leading-relaxed">
            Join 14,000+ creators and brands using Auto Insta Flow to turn every comment into a conversation. Get started in under 5 minutes.
          </p>

          {user ? (
            <Link 
              href="/dashboard/home" 
              className="px-8 py-4 rounded-full bg-[#ccff00] text-black font-extrabold text-base hover:opacity-90 transition shadow-[0_0_30px_rgba(204,255,0,0.2)] flex items-center gap-1.5"
            >
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="px-8 py-4 rounded-full bg-[#ccff00] text-black font-extrabold text-base hover:opacity-90 transition shadow-[0_0_30px_rgba(204,255,0,0.2)] flex items-center gap-1.5"
            >
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* Tiny graphic simulation line */}
          <div className="w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-neutral-800 to-transparent mt-4"></div>
          <span className="text-[10px] text-neutral-600 font-semibold tracking-wider uppercase">Instagram-Approved Meta Graph Integrations</span>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-black py-16 mt-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          <div className="col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#ccff00] flex items-center justify-center font-extrabold text-black">
                A
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                AutoInstaFlow <span className="text-[#ccff00]">+</span>
              </span>
            </Link>
            <p className="text-neutral-500 text-xs max-w-xs leading-relaxed">
              Instagram DM automation built for high conversion. We help creators, DTC brands, and UGC makers turn engagement into revenue.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-white text-xs font-bold tracking-wider uppercase">Solutions</span>
            <a href="#features" className="text-neutral-500 text-xs hover:text-white transition">Comment replies</a>
            <a href="#features" className="text-neutral-500 text-xs hover:text-white transition">Email Gating</a>
            <a href="#features" className="text-neutral-500 text-xs hover:text-white transition">Follow Gating</a>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-white text-xs font-bold tracking-wider uppercase">Use Cases</span>
            <a href="#features" className="text-neutral-500 text-xs hover:text-white transition">For Course Creators</a>
            <a href="#features" className="text-neutral-500 text-xs hover:text-white transition">For UGC Reviewers</a>
            <a href="#features" className="text-neutral-500 text-xs hover:text-white transition">For E-commerce</a>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-white text-xs font-bold tracking-wider uppercase">Resources</span>
            <a href="#pricing" className="text-neutral-500 text-xs hover:text-white transition">Pricing Plans</a>
            <a href="#faq" className="text-neutral-500 text-xs hover:text-white transition">FAQ Documentation</a>
            <a href="#testimonials" className="text-neutral-500 text-xs hover:text-white transition">Customer Stories</a>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-500 text-xs font-semibold">
          <div>&copy; {new Date().getFullYear()} Auto Insta Flow. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-neutral-300 transition">Terms of Service</a>
            <a href="#" className="hover:text-neutral-300 transition">Privacy Policy</a>
            <a href="#" className="hover:text-neutral-300 transition">Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
