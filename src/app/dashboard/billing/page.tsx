"use client";

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Check, 
  Sparkles, 
  Zap, 
  CreditCard, 
  Layers, 
  ShoppingBag, 
  PlusCircle, 
  ShieldCheck
} from 'lucide-react';
import { getAccountLimitForPlan } from '@/lib/db';

export default function BillingPage() {
  const { workspace, upgradePlan, purchaseAddon } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [buyFeedback, setBuyFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const handlePlanUpgrade = (plan: 'free' | 'pro' | 'growth') => {
    upgradePlan(plan, billingCycle);
  };

  const handleBuyAddon = (tier: 1 | 2 | 3) => {
    setBuyFeedback(null);
    let credits = 1000;
    let price = 4.99;
    if (tier === 2) {
      credits = 5000;
      price = 9.99;
    } else if (tier === 3) {
      credits = 10000;
      price = 14.99;
    }
    
    purchaseAddon(credits);
    setBuyFeedback({
      success: true,
      msg: `Success! Added +${credits.toLocaleString()} DM credits to your workspace balance.`
    });

    setTimeout(() => {
      setBuyFeedback(null);
    }, 4000);
  };

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      priceMonthly: 0,
      priceYearly: 0,
      quota: 500,
      accounts: 1,
      features: [
        '1 connected account',
        '500 DM actions / mo',
        'Standard keywords matching',
        'Live webhook sandbox simulator'
      ],
      gated: [
        'No email capture gating',
        'No follower validation gate',
        'No CSV contact exports',
        'No geographical audience maps'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      priceMonthly: 15,
      priceYearly: 12,
      quota: 5000,
      accounts: 2,
      features: [
        '2 connected accounts',
        '5,000 DM actions / mo',
        'Email opt-in gate setup',
        'Follower-gate verification',
        'Unlimited custom keywords',
        'CSV list downloads & lead exports'
      ],
      gated: [
        'No geographical audience maps'
      ]
    },
    {
      id: 'growth',
      name: 'Growth Plan',
      priceMonthly: 30,
      priceYearly: 24,
      quota: 10000,
      accounts: 5,
      features: [
        '5 connected accounts',
        '10,000 DM actions / mo',
        'All Pro gating mechanisms',
        'Geographical maps & conversions',
        'Priority execution webhooks',
        'Premium customer support'
      ],
      gated: []
    }
  ];

  const addons = [
    { tier: 1 as const, credits: 1000, price: '$4.99', value: 'Starter Pack' },
    { tier: 2 as const, credits: 5000, price: '$9.99', value: 'Value Pack (Save 20%)', popular: true },
    { tier: 3 as const, credits: 10000, price: '$14.99', value: 'Agency Pack (Save 40%)' }
  ];

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Billing & Plans</h1>
        <p className="text-xs text-zinc-505">Manage your subscription, buy on-demand credit add-ons, and view usage limits.</p>
      </div>

      {/* Active Subscription Summary */}
      <div className="glass-panel p-6 bg-gradient-to-r from-zinc-50 to-purple-50/30 flex flex-col sm:flex-row justify-between gap-6 items-start sm:items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-650 shadow-inner">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Subscription</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-zinc-900 capitalize">{workspace?.plan} Plan</span>
              <span className="bg-purple-100 text-purple-750 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-purple-200">Simulated</span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Account limit: {workspace ? getAccountLimitForPlan(workspace.plan) : 1} profiles. Included monthly DMs: {workspace?.dm_quota_monthly.toLocaleString()}.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end text-xs">
          <span className="text-zinc-550 font-semibold">Stacked Add-On Credits</span>
          <span className="text-sm font-bold text-pink-605">+{workspace?.dm_addon_credits.toLocaleString()} DMs</span>
          <span className="text-[10px] text-zinc-450 mt-0.5">Never expire, consumed after monthly quota</span>
        </div>
      </div>

      {/* Subscription Pricing */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-base font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-5 h-5 text-purple-650" /> Subscription Plans
          </h3>

          {/* Toggle */}
          <div className="inline-flex p-1 bg-zinc-100 border border-zinc-200 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${billingCycle === 'monthly' ? 'bg-purple-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1 ${billingCycle === 'yearly' ? 'bg-purple-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              Yearly billing <span className="bg-pink-50 border border-pink-200 text-pink-700 px-1.5 py-0.5 rounded text-[8px] font-bold">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map(p => {
            const isActive = workspace?.plan === p.id;
            const price = billingCycle === 'monthly' ? p.priceMonthly : p.priceYearly;
            
            return (
              <div 
                key={p.id} 
                className={`glass-panel p-6 flex flex-col justify-between gap-6 relative overflow-hidden transition-all duration-300 ${
                  isActive ? 'border-purple-500 shadow-md bg-purple-50/10' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-purple-600 text-white px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-bl">
                    Current Plan
                  </div>
                )}
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">{p.name}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-zinc-900">${price}</span>
                      <span className="text-zinc-500 text-xs">/mo</span>
                    </div>
                  </div>

                  <hr className="border-zinc-150" />

                  {/* Features */}
                  <ul className="flex flex-col gap-2.5 text-xs text-zinc-650">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {p.gated.map(f => (
                      <li key={f} className="flex items-center gap-2 opacity-35 text-zinc-405">
                        <Check className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={isActive}
                  onClick={() => handlePlanUpgrade(p.id as any)}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold transition ${
                    isActive 
                      ? 'bg-zinc-100 border border-zinc-200 text-zinc-450 cursor-not-allowed' 
                      : 'btn-gradient text-white shadow-md'
                  }`}
                >
                  {isActive ? 'Active Plan' : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add-on Packs */}
      <div className="flex flex-col gap-4 border-t border-zinc-200 pt-8">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="w-5 h-5 text-pink-650" /> On-Demand Credit Add-Ons
          </h3>
          <p className="text-xs text-zinc-500">Quota stacked on top of your subscription. Credits are only consumed once your monthly quota runs out.</p>
        </div>

        {buyFeedback && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-750 text-xs font-semibold">
            {buyFeedback.msg}
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          {addons.map(addon => (
            <div 
              key={addon.tier} 
              className={`glass-panel p-5 flex flex-col justify-between gap-4 relative overflow-hidden transition-all duration-300 ${
                addon.popular ? 'border-pink-300 bg-pink-50/10 shadow-sm' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
              }`}
            >
              {addon.popular && (
                <div className="absolute top-0 right-0 bg-pink-500 text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-bl">
                  Best Value
                </div>
              )}
              
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">{addon.value}</span>
                <span className="text-xl font-extrabold text-zinc-900 mt-1">+{addon.credits.toLocaleString()} DMs</span>
                <span className="text-xs text-pink-650 font-bold mt-0.5">{addon.price} one-off</span>
              </div>

              <button
                onClick={() => handleBuyAddon(addon.tier)}
                className="w-full py-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-600 hover:text-zinc-900 transition flex items-center justify-center gap-1 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Buy Pack
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
