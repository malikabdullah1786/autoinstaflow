"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AutomationBuilder } from '@/components/AutomationBuilder';
import { Automation, TriggerType, ActionType } from '@/lib/db';
import { 
  Sparkles, 
  ArrowLeft, 
  Layers, 
  MessageSquare, 
  Mail, 
  ShieldCheck, 
  Link2,
  ChevronRight,
  BookOpen,
  DollarSign,
  Users,
  Compass,
  ArrowRight
} from 'lucide-react';

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  category: 'featured' | 'engage' | 'sell' | 'leads';
  triggerType: TriggerType;
  actionType: ActionType;
  keywords: string;
  message: string;
  url: string;
}

const TEMPLATES: TemplateItem[] = [
  // Featured
  {
    id: 'tpl_free_ebook',
    name: 'Free Ebook Delivery',
    description: 'Send a link to your free PDF ebook whenever someone comments "EBOOK".',
    category: 'featured',
    triggerType: 'comment',
    actionType: 'send_dm',
    keywords: 'ebook, pdf, guide',
    message: 'Thanks for your interest! Here is the direct link to download your free guide:',
    url: 'https://autoinstaflow-demo.s3.amazonaws.com/guides/setup-guide.pdf'
  },
  {
    id: 'tpl_email_optin',
    name: 'Email Opt-in Magnet',
    description: 'Grow your email list by requiring an email address before sending the asset.',
    category: 'featured',
    triggerType: 'comment',
    actionType: 'email_gate',
    keywords: 'download, pdf, freebie',
    message: 'Thanks! Your email has been validated. Here is the link to download the PDF:',
    url: 'https://autoinstaflow-demo.s3.amazonaws.com/downloads/freebie.pdf'
  },
  {
    id: 'tpl_follow_discount',
    name: 'Follower-Only Discount',
    description: 'Reward new followers. Checks follow status and delivers a 10% coupon code link.',
    category: 'featured',
    triggerType: 'comment',
    actionType: 'follow_gate',
    keywords: 'coupon, discount, shop',
    message: 'Awesome! Verified that you follow us. Here is your 10% discount checkout link:',
    url: 'https://my-store.com/checkout?code=FOLLOWER10'
  },
  // Engage
  {
    id: 'tpl_coffee_spots',
    name: 'Lisbon Coffee Spots Map',
    description: 'Recommend your favorite city spots instantly upon commenting "COFFEE".',
    category: 'engage',
    triggerType: 'comment',
    actionType: 'send_dm',
    keywords: 'coffee, cafe, lisbon',
    message: 'Here is my curated Google Maps list of the best Lisbon coffee spots:',
    url: 'https://maps.google.com/list/lisbon-coffee'
  },
  {
    id: 'tpl_quiz_reply',
    name: 'Interactive Quiz Results',
    description: 'Send results of your story quiz when a user replies with a keyword.',
    category: 'engage',
    triggerType: 'story_reply',
    actionType: 'send_dm',
    keywords: 'result, quiz, score',
    message: 'You nailed it! Here is the complete breakdown and answer key for today\'s quiz:',
    url: 'https://my-blog.com/quiz-answers'
  },
  {
    id: 'tpl_feedback_survey',
    name: 'Audience Feedback Survey',
    description: 'Gather feedback. Send a Typeform link to any DM that mentions "survey".',
    category: 'engage',
    triggerType: 'dm',
    actionType: 'send_dm',
    keywords: 'survey, feedback, review',
    message: 'Help us improve! Fill out this 2-minute survey to let us know how we can do better:',
    url: 'https://typeform.com/autoinstaflow-feedback'
  },
  // Sell & Earn
  {
    id: 'tpl_webinar_ticket',
    name: 'Webinar Ticket Booking',
    description: 'Promote your live training. Direct users to the registration page.',
    category: 'sell',
    triggerType: 'comment',
    actionType: 'send_dm',
    keywords: 'webinar, ticket, live',
    message: 'Register for our upcoming automation masterclass. Spots are filling up fast:',
    url: 'https://zoom.us/webinar/register/autoinstaflow'
  },
  {
    id: 'tpl_consult_call',
    name: 'Book a Strategy Call',
    description: 'Let prospective clients book a 1-on-1 discovery call directly on Calendly.',
    category: 'sell',
    triggerType: 'dm',
    actionType: 'send_dm',
    keywords: 'book, call, consultation',
    message: 'Let\'s talk strategy! Choose a slot that works best for you on my calendar:',
    url: 'https://calendly.com/strategy-meeting'
  },
  {
    id: 'tpl_premium_course',
    name: 'Course Access Gate',
    description: 'Promote your Teachable/Skool course. Deliver checkout link with a follow gate.',
    category: 'sell',
    triggerType: 'comment',
    actionType: 'follow_gate',
    keywords: 'course, learn, skool',
    message: 'Verified! Get instant access to our advanced course community here:',
    url: 'https://skool.com/advanced-academy/join'
  },
  // Capture Leads
  {
    id: 'tpl_cheatsheet_lead',
    name: 'Marketing Cheat Sheet',
    description: 'Provide a quick checklist cheat sheet gated by email collection.',
    category: 'leads',
    triggerType: 'comment',
    actionType: 'email_gate',
    keywords: 'sheet, checklist, hack',
    message: 'Here is the marketing checklist cheat sheet we promised:',
    url: 'https://my-agency.com/downloads/cheatsheet.pdf'
  },
  {
    id: 'tpl_resource_hub',
    name: 'All-in-One Resource Vault',
    description: 'Unlock your Notion template resource vault after email validation.',
    category: 'leads',
    triggerType: 'comment',
    actionType: 'email_gate',
    keywords: 'vault, notion, hub',
    message: 'Enjoy the Notion Resource Hub! Save it to your workspace:',
    url: 'https://notion.so/workspace/resource-vault'
  }
];

export default function NewAutomationPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<'all' | 'featured' | 'engage' | 'sell' | 'leads'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  const handleStartScratch = () => {
    // Scratch mock template
    const scratchTpl: TemplateItem = {
      id: 'scratch',
      name: 'Custom Automation',
      description: 'Start from scratch',
      category: 'featured',
      triggerType: 'comment',
      actionType: 'send_dm',
      keywords: '',
      message: 'Hey! Here is the link you requested:',
      url: 'https://'
    };
    setSelectedTemplate(scratchTpl);
  };

  const filteredTemplates = activeCategory === 'all' 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === activeCategory);

  // If a template has been selected, load the AutomationBuilder form
  if (selectedTemplate) {
    const mockInitialAutomation = {
      id: '',
      workspace_id: '',
      instagram_account_id: '',
      name: selectedTemplate.name,
      trigger_type: selectedTemplate.triggerType,
      trigger_config: {
        keywords: selectedTemplate.keywords ? selectedTemplate.keywords.split(',').map(k => k.trim()) : [],
      },
      action_type: selectedTemplate.actionType,
      action_config: {
        message: selectedTemplate.message,
        url: selectedTemplate.url,
        gate: selectedTemplate.actionType === 'email_gate' ? 'email' as const : selectedTemplate.actionType === 'follow_gate' ? 'follow' as const : null,
      },
      status: 'paused' as const,
      dm_sent_count: 0,
      link_click_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => setSelectedTemplate(null)}
          className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1.5 w-max mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Templates Library
        </button>
        <AutomationBuilder initialData={mockInitialAutomation} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Title block */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.push('/dashboard/automations')}
          className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 shadow-sm transition animate-fadeIn"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Templates Library</h1>
          <p className="text-xs text-zinc-500">Launch a pre-configured automation in seconds or build custom logic.</p>
        </div>
      </div>

      {/* Start Scratch & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Category switcher */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Templates', icon: Compass },
            { id: 'featured', label: 'Featured', icon: Sparkles },
            { id: 'engage', label: 'Engage Audience', icon: MessageSquare },
            { id: 'sell', label: 'Sell & Earn', icon: DollarSign },
            { id: 'leads', label: 'Capture Leads', icon: Users }
          ].map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition ${activeCategory === cat.id ? 'bg-purple-600 text-white border-purple-550 shadow-md' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 shadow-sm'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleStartScratch}
          className="px-4 py-2.5 rounded-lg border border-purple-200 hover:bg-purple-55 text-purple-750 font-bold bg-white shadow-sm transition text-xs flex items-center gap-1.5 self-stretch sm:self-auto text-center justify-center"
        >
          Start from scratch <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(tpl => (
          <div 
            key={tpl.id} 
            onClick={() => setSelectedTemplate(tpl)}
            className="glass-panel p-6 flex flex-col justify-between gap-4 cursor-pointer hover:border-purple-500/30 hover:shadow-md transition"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] bg-zinc-100 border border-zinc-200 text-zinc-650 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {tpl.category}
                </span>
                <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                  {tpl.actionType === 'email_gate' && <Mail className="w-3 h-3 text-purple-600" />}
                  {tpl.actionType === 'follow_gate' && <ShieldCheck className="w-3 h-3 text-pink-655" />}
                  {tpl.actionType === 'send_dm' && <Link2 className="w-3 h-3 text-blue-600" />}
                  {tpl.actionType.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mt-1">{tpl.name}</h3>
              <p className="text-[11px] text-zinc-500 leading-normal">{tpl.description}</p>
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-purple-600 font-bold pt-2 border-t border-zinc-100">
              <span>Setup in 1 click</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
