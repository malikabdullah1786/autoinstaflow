// Types & Pure Business Logic for Auto Insta Flow

export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export type PlanType = 'free' | 'pro' | 'growth';

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  plan: PlanType;
  billing_cycle?: 'monthly' | 'yearly';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  dm_quota_monthly: number;
  dm_sent_current_period: number;
  dm_addon_credits: number;
  quota_period_start: string;
  created_at: string;
}

export interface InstagramAccount {
  id: string;
  workspace_id: string;
  instagram_user_id: string;
  username: string;
  full_name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  media_count?: number;
  access_token: string;
  token_expires_at?: string;
  token_status: 'active' | 'token_invalid' | 'revoked';
  page_id?: string;
  created_at: string;
}

export type TriggerType = 'comment' | 'story_reply' | 'dm';
export type ActionType = 'send_dm' | 'email_gate' | 'follow_gate';

export interface TriggerConfig {
  post_id?: string;
  post_url?: string;
  post_thumbnail?: string;
  keywords?: string[];
}

export interface ActionConfig {
  message: string;
  url: string;
  links?: { url: string; label: string }[];
  gate?: 'email' | 'follow' | null;
  prompt?: string;
  comment_reply?: string;
}

export interface Automation {
  id: string;
  workspace_id: string;
  instagram_account_id: string;
  name: string;
  status: 'live' | 'paused';
  trigger_type: TriggerType;
  trigger_config: TriggerConfig;
  action_type: ActionType;
  action_config: ActionConfig;
  dm_sent_count: number;
  link_click_count: number;
  template_id?: string;
  created_at: string;
  updated_at: string;
}

export type EventType =
  | 'dm_sent'
  | 'dm_failed'
  | 'link_clicked'
  | 'email_collected'
  | 'follow_verified'
  | 'dm_blocked_quota'
  | 'dm_blocked_dedup';

export interface AutomationEvent {
  id: string;
  automation_id: string;
  workspace_id: string;
  event_type: EventType;
  instagram_user_id: string;
  instagram_username: string;
  metadata?: Record<string, any>;
  occurred_at: string;
}

export interface Contact {
  id: string;
  workspace_id: string;
  instagram_user_id: string;
  instagram_username: string;
  email?: string;
  first_seen_at: string;
  last_seen_at: string;
  interaction_count: number;
}

export interface RewindLog {
  id: string;
  workspace_id: string;
  automation_id: string;
  post_id: string;
  comments_found: number;
  dms_sent: number;
  status: 'pending' | 'processing' | 'complete' | 'cancelled';
  initiated_at: string;
  completed_at?: string;
}

export interface Template {
  id: string;
  name: string;
  category: 'featured' | 'engage_audience' | 'sell_earn' | 'capture_leads' | 'book_clients';
  trigger_type: TriggerType;
  trigger_config: TriggerConfig;
  action_type: ActionType;
  action_config: ActionConfig;
  is_system: boolean;
  sort_order: number;
}

// ----------------------------------------------------
// Pure Business Logic (Implementing Correctness Properties)
// ----------------------------------------------------

/**
 * Property 8: Keyword Matching Correctness
 * - Returns true if the keyword list is empty (match everything), OR
 * - Returns true if at least one keyword appears in the comment text (case-insensitive substring match)
 * - Returns false otherwise
 */
export function checkKeywordMatch(commentText: string, keywords?: string[]): boolean {
  if (!keywords || keywords.length === 0) {
    return true;
  }
  const normalizedText = commentText.toLowerCase().trim();
  return keywords.some(keyword => {
    const kw = keyword.toLowerCase().trim();
    if (!kw) return false;
    return normalizedText.includes(kw);
  });
}

/**
 * Property 15: Quota Depletion Order
 * - Plan quota (dm_quota_monthly - dm_sent_current_period) consumed first.
 * - Add-on credits (dm_addon_credits) consumed next.
 * Returns the breakdown of remaining quota.
 */
export function getRemainingQuota(workspace: Workspace): {
  planRemaining: number;
  addonRemaining: number;
  totalRemaining: number;
} {
  const planRemaining = Math.max(0, workspace.dm_quota_monthly - workspace.dm_sent_current_period);
  const addonRemaining = Math.max(0, workspace.dm_addon_credits);
  return {
    planRemaining,
    addonRemaining,
    totalRemaining: planRemaining + addonRemaining,
  };
}

/**
 * Property 16: Add-On Credits Stack Additively
 * Calculates the new add-on balance after purchasing packages.
 */
export function calculateNewAddonCredits(currentAddonCredits: number, purchasedPackSize: number): number {
  return currentAddonCredits + purchasedPackSize;
}

/**
 * Plan account limits (Property 6)
 */
export function getAccountLimitForPlan(plan: PlanType): number {
  switch (plan) {
    case 'free':
      return 1;
    case 'pro':
      return 2;
    case 'growth':
      return 5;
    default:
      return 1;
  }
}

/**
 * Plan DM limits (Property 14)
 */
export function getMonthlyQuotaForPlan(plan: PlanType): number {
  switch (plan) {
    case 'free':
      return 500;
    case 'pro':
      return 5000;
    case 'growth':
      return 10000;
    default:
      return 500;
  }
}
