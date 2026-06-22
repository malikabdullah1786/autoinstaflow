import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  checkKeywordMatch,
  getRemainingQuota,
  calculateNewAddonCredits,
  getAccountLimitForPlan,
  getMonthlyQuotaForPlan,
  Workspace
} from '../lib/db';

describe('Auto Insta Flow Business Logic Correctness', () => {
  
  // Property 8: Keyword Matching Correctness
  // "Feature: instagram-automation-platform, Property 8: Keyword matching function matches substrings case-insensitively or matches everything if keywords list is empty"
  it('Property 8: Keyword Matching Correctness', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.array(fc.string()),
        (commentText, keywords) => {
          const result = checkKeywordMatch(commentText, keywords);
          
          if (!keywords || keywords.length === 0) {
            expect(result).toBe(true);
          } else {
            const normalizedText = commentText.toLowerCase().trim();
            const shouldMatch = keywords.some(keyword => {
              const kw = keyword.toLowerCase().trim();
              if (!kw) return false;
              return normalizedText.includes(kw);
            });
            expect(result).toBe(shouldMatch);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 15: Quota Depletion Order
  // "Feature: instagram-automation-platform, Property 15: planRemaining, addonRemaining, totalRemaining calculated accurately"
  it('Property 15: Quota Depletion Order', () => {
    fc.assert(
      fc.property(
        fc.record({
          dm_quota_monthly: fc.integer({ min: 0, max: 100000 }),
          dm_sent_current_period: fc.integer({ min: 0, max: 200000 }),
          dm_addon_credits: fc.integer({ min: 0, max: 100000 }),
        }),
        (quotaData) => {
          const ws = {
            id: 'ws-1',
            owner_id: 'user-1',
            name: 'Workspace 1',
            plan: 'free',
            dm_quota_monthly: quotaData.dm_quota_monthly,
            dm_sent_current_period: quotaData.dm_sent_current_period,
            dm_addon_credits: quotaData.dm_addon_credits,
            quota_period_start: new Date().toISOString(),
            created_at: new Date().toISOString(),
          } as Workspace;

          const remaining = getRemainingQuota(ws);

          const expectedPlanRemaining = Math.max(0, ws.dm_quota_monthly - ws.dm_sent_current_period);
          const expectedAddonRemaining = Math.max(0, ws.dm_addon_credits);

          expect(remaining.planRemaining).toBe(expectedPlanRemaining);
          expect(remaining.addonRemaining).toBe(expectedAddonRemaining);
          expect(remaining.totalRemaining).toBe(expectedPlanRemaining + expectedAddonRemaining);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 16: Add-On Credits Stack Additively
  // "Feature: instagram-automation-platform, Property 16: Add-on credits stack additively upon purchase"
  it('Property 16: Add-On Credits Stack Additively', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        fc.constantFrom(1000, 2000, 3000, 5000),
        (currentAddonCredits, purchasedPackSize) => {
          const newCredits = calculateNewAddonCredits(currentAddonCredits, purchasedPackSize);
          expect(newCredits).toBe(currentAddonCredits + purchasedPackSize);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 6 & 14: Plan limit check
  it('Property 6 & 14: Plan Limit Checks', () => {
    // Free plan
    expect(getAccountLimitForPlan('free')).toBe(1);
    expect(getMonthlyQuotaForPlan('free')).toBe(500);

    // Pro plan
    expect(getAccountLimitForPlan('pro')).toBe(2);
    expect(getMonthlyQuotaForPlan('pro')).toBe(5000);

    // Growth plan
    expect(getAccountLimitForPlan('growth')).toBe(5);
    expect(getMonthlyQuotaForPlan('growth')).toBe(10000);
  });
});
