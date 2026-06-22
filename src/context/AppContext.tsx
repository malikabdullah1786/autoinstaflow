"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Workspace,
  InstagramAccount,
  Automation,
  AutomationEvent,
  Contact,
  RewindLog,
  Template,
  PlanType,
  TriggerType,
  ActionType,
  ActionConfig,
  checkKeywordMatch,
  getRemainingQuota,
  calculateNewAddonCredits,
  getAccountLimitForPlan,
  getMonthlyQuotaForPlan,
} from '@/lib/db';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface AppContextType {
  user: User | null;
  workspace: Workspace | null;
  accounts: InstagramAccount[];
  automations: Automation[];
  contacts: Contact[];
  events: AutomationEvent[];
  rewindLogs: RewindLog[];
  templates: Template[];
  activeAccountId: string;
  setActiveAccountId: (id: string) => void;
  isBannerDismissed: boolean;
  loading: boolean;
  
  // Actions
  signInGoogle: () => void;
  signInSandbox: () => void;
  signOut: () => void;
  addInstagramAccount: (username: string) => Promise<{ success: boolean; error?: string }>;
  linkRealInstagramAccount: (accountData: {
    instagramUserId: string;
    username: string;
    accessToken: string;
    tokenExpiresAt: string;
  }) => Promise<{ success: boolean; error?: string }>;
  removeInstagramAccount: (accountId: string) => Promise<void>;
  saveAutomation: (automation: Partial<Automation>) => Promise<{ success: boolean; error?: string }>;
  toggleAutomationStatus: (id: string) => Promise<void>;
  deleteAutomation: (id: string) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  simulateInstagramInteraction: (
    commentText: string,
    instagramUsername: string,
    triggerType: TriggerType,
    postInfo?: { post_id: string; post_url: string; post_thumbnail: string },
    options?: { isFollowing?: boolean; email?: string }
  ) => Promise<{ success: boolean; outcome: string; details?: string; messageSent?: string }>;
  runRewind: (
    automationId: string,
    postId: string,
    comments: { username: string; text: string; id: string }[]
  ) => Promise<{ success: boolean; dmsSent: number; error?: string }>;
  purchaseAddon: (packSize: number) => Promise<void>;
  upgradePlan: (plan: PlanType, billingCycle: 'monthly' | 'yearly') => Promise<void>;
  dismissUpgradeBanner: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SYSTEM_TEMPLATES: Template[] = [
  { id: 't1', name: 'Send link on keyword', category: 'featured', trigger_type: 'comment', trigger_config: { keywords: ['link', 'info'] }, action_type: 'send_dm', action_config: { message: "Here is your link: ", url: "https://example.com/item" }, is_system: true, sort_order: 1 },
  { id: 't2', name: 'Send link on story reaction', category: 'engage_audience', trigger_type: 'story_reply', trigger_config: {}, action_type: 'send_dm', action_config: { message: "Thanks for reacting to my story! Here is the link:", url: "https://example.com/story-gift" }, is_system: true, sort_order: 2 },
  { id: 't3', name: 'Require follow before link', category: 'engage_audience', trigger_type: 'comment', trigger_config: { keywords: ['follow'] }, action_type: 'follow_gate', action_config: { message: "Make sure you follow me first! Here is the link:", url: "https://example.com/gate" }, is_system: true, sort_order: 3 },
  { id: 't4', name: 'Auto-reply to DMs', category: 'book_clients', trigger_type: 'dm', trigger_config: { keywords: ['hello', 'hi'] }, action_type: 'send_dm', action_config: { message: "Hello! Thanks for reaching out. How can I help you?", url: "https://example.com/chat" }, is_system: true, sort_order: 4 },
  { id: 't5', name: 'Share affiliate links', category: 'sell_earn', trigger_type: 'comment', trigger_config: { keywords: ['buy', 'shop'] }, action_type: 'send_dm', action_config: { message: "Use code AUTOMATE to shop my favorites here:", url: "https://example.com/affiliate" }, is_system: true, sort_order: 5 },
  { id: 't6', name: 'Send discount codes', category: 'sell_earn', trigger_type: 'comment', trigger_config: { keywords: ['discount', 'code'] }, action_type: 'send_dm', action_config: { message: "Here is your 15% off discount code: SAVE15. Shop now:", url: "https://example.com/shop" }, is_system: true, sort_order: 6 },
  { id: 't7', name: 'Promote products', category: 'sell_earn', trigger_type: 'comment', trigger_config: { keywords: ['product', 'item'] }, action_type: 'send_dm', action_config: { message: "Here is the direct link to the product:", url: "https://example.com/product" }, is_system: true, sort_order: 7 },
  { id: 't8', name: 'Share pricing info', category: 'sell_earn', trigger_type: 'dm', trigger_config: { keywords: ['price', 'cost'] }, action_type: 'send_dm', action_config: { message: "Check out our pricing packages here:", url: "https://example.com/pricing" }, is_system: true, sort_order: 8 },
  { id: 't9', name: 'Thank story reactors', category: 'engage_audience', trigger_type: 'story_reply', trigger_config: {}, action_type: 'send_dm', action_config: { message: "You are the best! Thanks for reacting.", url: "https://example.com/thankyou" }, is_system: true, sort_order: 9 },
  { id: 't10', name: 'Thank commenters', category: 'engage_audience', trigger_type: 'comment', trigger_config: {}, action_type: 'send_dm', action_config: { message: "I appreciate your comment! Let's connect:", url: "https://example.com/connect" }, is_system: true, sort_order: 10 },
  { id: 't11', name: 'Start conversations', category: 'engage_audience', trigger_type: 'dm', trigger_config: { keywords: ['help', 'support'] }, action_type: 'send_dm', action_config: { message: "Sure, let's chat. What questions do you have?", url: "https://example.com/support" }, is_system: true, sort_order: 11 },
  { id: 't12', name: 'Deliver lead magnets', category: 'capture_leads', trigger_type: 'comment', trigger_config: { keywords: ['guide', 'pdf'] }, action_type: 'send_dm', action_config: { message: "Here is the free guide you requested! Download it here:", url: "https://example.com/guide.pdf" }, is_system: true, sort_order: 12 },
  { id: 't13', name: 'Collect emails first', category: 'capture_leads', trigger_type: 'comment', trigger_config: { keywords: ['email', 'join'] }, action_type: 'email_gate', action_config: { message: "Enter your email to receive the download link:", url: "https://example.com/download" }, is_system: true, sort_order: 13 },
  { id: 't14', name: 'Grow waitlist', category: 'capture_leads', trigger_type: 'comment', trigger_config: { keywords: ['waitlist', 'early'] }, action_type: 'email_gate', action_config: { message: "Join our exclusive waitlist for early access:", url: "https://example.com/waitlist" }, is_system: true, sort_order: 14 },
  { id: 't15', name: 'Send booking links', category: 'book_clients', trigger_type: 'comment', trigger_config: { keywords: ['book', 'call'] }, action_type: 'send_dm', action_config: { message: "Schedule a free 15-min discovery call here:", url: "https://example.com/book" }, is_system: true, sort_order: 15 },
  { id: 't16', name: 'Share portfolio', category: 'book_clients', trigger_type: 'dm', trigger_config: { keywords: ['portfolio', 'work'] }, action_type: 'send_dm', action_config: { message: "Take a look at some of my recent work:", url: "https://example.com/portfolio" }, is_system: true, sort_order: 16 },
  { id: 't17', name: 'Promote webinars', category: 'book_clients', trigger_type: 'comment', trigger_config: { keywords: ['webinar', 'register'] }, action_type: 'email_gate', action_config: { message: "Save your seat for our live masterclass:", url: "https://example.com/webinar" }, is_system: true, sort_order: 17 },
  { id: 't18', name: 'Share content', category: 'featured', trigger_type: 'comment', trigger_config: { keywords: ['content', 'video'] }, action_type: 'send_dm', action_config: { message: "Here is the video breakdown link:", url: "https://example.com/video" }, is_system: true, sort_order: 18 }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [rewindLogs, setRewindLogs] = useState<RewindLog[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string>('');
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Initialize state from Supabase or LocalStorage on mount
  useEffect(() => {
    async function initSession() {
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const sbUser = session.user;
            
            // 1. Fetch or create User record in PostgreSQL
            const email = sbUser.email || '';
            const name = sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Instagramo User';
            const avatar_url = sbUser.user_metadata?.avatar_url || '';
            
            let { data: dbUser } = await supabase.from('users').select('*').eq('id', sbUser.id).maybeSingle();
            if (!dbUser) {
              const { data: insertedUser } = await supabase.from('users').upsert({
                id: sbUser.id,
                google_id: sbUser.id,
                email,
                name,
                avatar_url,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'email' }).select().single();
              dbUser = insertedUser;
            }
            
            if (dbUser) {
              setUser(dbUser);
              
              // 2. Fetch or create Workspace record
              const { data: workspacesList } = await supabase.from('workspaces').select('*').eq('owner_id', sbUser.id);
              let dbWorkspace = workspacesList && workspacesList.length > 0 ? workspacesList[0] : null;

              if (!dbWorkspace) {
                const { data: insertedWS } = await supabase.from('workspaces').insert({
                  owner_id: sbUser.id,
                  name: `${dbUser.name}'s Brand`,
                  plan: 'free',
                  dm_quota_monthly: 500,
                  dm_sent_current_period: 0,
                  dm_addon_credits: 0,
                  quota_period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }).select().single();
                dbWorkspace = insertedWS;
              }
              
              if (dbWorkspace) {
                setWorkspace(dbWorkspace);
                
                // 3. Fetch related records
                const [accountsRes, automationsRes, contactsRes, eventsRes, rewindsRes] = await Promise.all([
                  supabase.from('instagram_accounts').select('*').eq('workspace_id', dbWorkspace.id),
                  supabase.from('automations').select('*').eq('workspace_id', dbWorkspace.id),
                  supabase.from('contacts').select('*').eq('workspace_id', dbWorkspace.id),
                  supabase.from('automation_events').select('*').eq('workspace_id', dbWorkspace.id).order('occurred_at', { ascending: false }),
                  supabase.from('rewind_logs').select('*').eq('workspace_id', dbWorkspace.id).order('initiated_at', { ascending: false })
                ]);
                
                if (accountsRes.data) {
                  setAccounts(accountsRes.data);
                  const cachedActiveAcc = localStorage.getItem('inst_active_account');
                  const activeExists = accountsRes.data.some(a => a.id === cachedActiveAcc);
                  if (activeExists && cachedActiveAcc) {
                    setActiveAccountId(cachedActiveAcc);
                  } else if (accountsRes.data.length > 0) {
                    setActiveAccountId(accountsRes.data[0].id);
                  }
                }
                if (automationsRes.data) setAutomations(automationsRes.data);
                if (contactsRes.data) setContacts(contactsRes.data);
                if (eventsRes.data) setEvents(eventsRes.data);
                if (rewindsRes.data) setRewindLogs(rewindsRes.data);
              }
            }
          }
        } catch (e) {
          console.error("Failed initializing Supabase session:", e);
        }
      } else {
        // LocalStorage fallback
        const cachedUser = localStorage.getItem('inst_user');
        const cachedWorkspace = localStorage.getItem('inst_workspace');
        const cachedAccounts = localStorage.getItem('inst_accounts');
        const cachedAutomations = localStorage.getItem('inst_automations');
        const cachedContacts = localStorage.getItem('inst_contacts');
        const cachedEvents = localStorage.getItem('inst_events');
        const cachedRewinds = localStorage.getItem('inst_rewinds');
        const cachedActiveAcc = localStorage.getItem('inst_active_account');
        
        if (cachedUser) setUser(JSON.parse(cachedUser));
        if (cachedWorkspace) setWorkspace(JSON.parse(cachedWorkspace));
        if (cachedAccounts) setAccounts(JSON.parse(cachedAccounts));
        if (cachedAutomations) setAutomations(JSON.parse(cachedAutomations));
        if (cachedContacts) setContacts(JSON.parse(cachedContacts));
        if (cachedEvents) setEvents(JSON.parse(cachedEvents));
        if (cachedRewinds) setRewindLogs(JSON.parse(cachedRewinds));
        if (cachedActiveAcc) setActiveAccountId(cachedActiveAcc);
      }
      
      const cachedDismissed = sessionStorage.getItem('inst_banner_dismissed');
      if (cachedDismissed) setIsBannerDismissed(true);
      setMounted(true);
    }
    
    initSession();
    
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          initSession();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setWorkspace(null);
          setAccounts([]);
          setAutomations([]);
          setContacts([]);
          setEvents([]);
          setRewindLogs([]);
          setActiveAccountId('');
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Save state to LocalStorage when changed (only if Supabase is NOT configured)
  useEffect(() => {
    if (!mounted || isSupabaseConfigured()) return;
    if (user) localStorage.setItem('inst_user', JSON.stringify(user));
    else localStorage.removeItem('inst_user');
  }, [user, mounted]);

  useEffect(() => {
    if (!mounted || isSupabaseConfigured()) return;
    if (workspace) localStorage.setItem('inst_workspace', JSON.stringify(workspace));
    else localStorage.removeItem('inst_workspace');
  }, [workspace, mounted]);

  useEffect(() => {
    if (!mounted || isSupabaseConfigured()) return;
    localStorage.setItem('inst_accounts', JSON.stringify(accounts));
  }, [accounts, mounted]);

  useEffect(() => {
    if (!mounted || isSupabaseConfigured()) return;
    localStorage.setItem('inst_automations', JSON.stringify(automations));
  }, [automations, mounted]);

  useEffect(() => {
    if (!mounted || isSupabaseConfigured()) return;
    localStorage.setItem('inst_contacts', JSON.stringify(contacts));
  }, [contacts, mounted]);

  useEffect(() => {
    if (!mounted || isSupabaseConfigured()) return;
    localStorage.setItem('inst_events', JSON.stringify(events));
  }, [events, mounted]);

  useEffect(() => {
    if (!mounted || isSupabaseConfigured()) return;
    localStorage.setItem('inst_rewinds', JSON.stringify(rewindLogs));
  }, [rewindLogs, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('inst_active_account', activeAccountId);
  }, [activeAccountId, mounted]);

  // Auth Operations
  const signInGoogle = () => {
    if (isSupabaseConfigured()) {
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard/home`
        }
      });
      return;
    }
    
    // Fallback: mock sign-in
    const mockUserId = 'usr_1234567890';
    const mockUser: User = {
      id: mockUserId,
      google_id: 'google_oauth_987654321',
      email: 'creator@autoinstaflow.io',
      name: 'Sarah Jenkins',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      created_at: new Date().toISOString(),
    };
    setUser(mockUser);

    const mockWorkspace: Workspace = {
      id: 'ws_abc123',
      owner_id: mockUserId,
      name: 'Sarah Jenkins Brand',
      plan: 'free',
      dm_quota_monthly: 500,
      dm_sent_current_period: 0,
      dm_addon_credits: 0,
      quota_period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      created_at: new Date().toISOString(),
    };
    setWorkspace(mockWorkspace);
  };

  const signInSandbox = () => {
    // Force mock sign-in bypass for testing
    const mockUserId = 'usr_1234567890';
    const mockUser: User = {
      id: mockUserId,
      google_id: 'google_oauth_987654321',
      email: 'creator@autoinstaflow.io',
      name: 'Sarah Jenkins',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      created_at: new Date().toISOString(),
    };
    setUser(mockUser);

    const mockWorkspace: Workspace = {
      id: 'ws_abc123',
      owner_id: mockUserId,
      name: 'Sarah Jenkins Brand',
      plan: 'free',
      dm_quota_monthly: 500,
      dm_sent_current_period: 0,
      dm_addon_credits: 0,
      quota_period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      created_at: new Date().toISOString(),
    };
    setWorkspace(mockWorkspace);
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setWorkspace(null);
    setAccounts([]);
    setAutomations([]);
    setContacts([]);
    setEvents([]);
    setRewindLogs([]);
    setActiveAccountId('');
    setIsBannerDismissed(false);
    sessionStorage.removeItem('inst_banner_dismissed');
  };

  // Account Linking Operations
  const addInstagramAccount = async (username: string) => {
    if (!workspace) return { success: false, error: 'No active workspace.' };

    const currentCount = accounts.filter(acc => acc.workspace_id === workspace.id).length;
    const limit = getAccountLimitForPlan(workspace.plan);

    if (currentCount >= limit) {
      return {
        success: false,
        error: `Limit reached. Your ${workspace.plan.toUpperCase()} plan allows a maximum of ${limit} connected account(s). Please upgrade to link more accounts.`,
      };
    }

    if (isSupabaseConfigured()) {
      try {
        const instagramUserId = `ig_usr_${Math.floor(Math.random() * 100000000)}`;
        const accessToken = `access_tok_${Math.random().toString(36).substr(2, 18)}`;
        const tokenExpires = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
        const cleanUsername = username.trim().toLowerCase();
        
        // Check if an account with this username already exists in this workspace
        const { data: existingAcc } = await supabase
          .from('instagram_accounts')
          .select('*')
          .eq('workspace_id', workspace.id)
          .eq('username', cleanUsername)
          .maybeSingle();

        let newAcc;
        if (existingAcc) {
          newAcc = {
            id: existingAcc.id,
            workspace_id: workspace.id,
            instagram_user_id: existingAcc.instagram_user_id,
            username: cleanUsername,
            access_token: accessToken,
            token_expires_at: tokenExpires,
            token_status: 'active',
            created_at: existingAcc.created_at,
            updated_at: new Date().toISOString()
          };
        } else {
          newAcc = {
            workspace_id: workspace.id,
            instagram_user_id: instagramUserId,
            username: cleanUsername,
            access_token: accessToken,
            token_expires_at: tokenExpires,
            token_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        const { data, error } = await supabase.from('instagram_accounts').upsert(newAcc).select().single();
        if (error) {
          console.error("Supabase link account error:", error);
          return { success: false, error: error.message };
        }
        
        setAccounts(prev => {
          const filtered = prev.filter(a => a.username.toLowerCase() !== username.toLowerCase());
          return [...filtered, data as InstagramAccount];
        });
        
        if (!activeAccountId || activeAccountId === '') {
          setActiveAccountId((data as InstagramAccount).id);
        }
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || 'Failed to add account.' };
      }
    }

    // Fallback: mock linking
    const existing = accounts.find(acc => acc.username.toLowerCase() === username.toLowerCase() && acc.workspace_id === workspace.id);
    if (existing) {
      const updated = accounts.map(acc => {
        if (acc.id === existing.id) {
          return {
            ...acc,
            token_status: 'active' as const,
            token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        return acc;
      });
      setAccounts(updated);
      return { success: true };
    }

    const newAccount: InstagramAccount = {
      id: `acc_${Math.random().toString(36).substr(2, 9)}`,
      workspace_id: workspace.id,
      instagram_user_id: `ig_usr_${Math.floor(Math.random() * 100000000)}`,
      username,
      access_token: `access_tok_${Math.random().toString(36).substr(2, 18)}`,
      token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      token_status: 'active',
      created_at: new Date().toISOString(),
    };

    const newAccounts = [...accounts, newAccount];
    setAccounts(newAccounts);
    if (!activeAccountId) {
      setActiveAccountId(newAccount.id);
    }
    return { success: true };
  };

  const linkRealInstagramAccount = async (accountData: {
    instagramUserId: string;
    username: string;
    accessToken: string;
    tokenExpiresAt: string;
  }) => {
    if (!workspace) return { success: false, error: 'No active workspace.' };

    const currentCount = accounts.filter(acc => acc.workspace_id === workspace.id).length;
    const limit = getAccountLimitForPlan(workspace.plan);

    if (currentCount >= limit) {
      return {
        success: false,
        error: `Limit reached. Your ${workspace.plan.toUpperCase()} plan allows a maximum of ${limit} connected account(s). Please upgrade to link more accounts.`,
      };
    }

    if (isSupabaseConfigured()) {
      try {
        const cleanUsername = accountData.username.trim().toLowerCase();
        
        // Check if an account with this username already exists in this workspace
        const { data: existingAcc } = await supabase
          .from('instagram_accounts')
          .select('*')
          .eq('workspace_id', workspace.id)
          .eq('username', cleanUsername)
          .maybeSingle();

        let newAcc;
        if (existingAcc) {
          newAcc = {
            id: existingAcc.id,
            workspace_id: workspace.id,
            instagram_user_id: accountData.instagramUserId,
            username: cleanUsername,
            access_token: accountData.accessToken,
            token_expires_at: accountData.tokenExpiresAt,
            token_status: 'active',
            created_at: existingAcc.created_at,
            updated_at: new Date().toISOString()
          };
        } else {
          newAcc = {
            workspace_id: workspace.id,
            instagram_user_id: accountData.instagramUserId,
            username: cleanUsername,
            access_token: accountData.accessToken,
            token_expires_at: accountData.tokenExpiresAt,
            token_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        const { data, error } = await supabase.from('instagram_accounts').upsert(newAcc).select().single();
        if (error) {
          console.error("Supabase link real account error:", error);
          return { success: false, error: error.message };
        }
        
        setAccounts(prev => {
          const filtered = prev.filter(a => a.username.toLowerCase() !== cleanUsername);
          return [...filtered, data as InstagramAccount];
        });
        
        if (!activeAccountId || activeAccountId === '') {
          setActiveAccountId((data as InstagramAccount).id);
        }
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || 'Failed to link real account.' };
      }
    }

    // Fallback: mock linking with these real values in memory
    const cleanUsername = accountData.username.trim().toLowerCase();
    const newAccount: InstagramAccount = {
      id: `acc_${Math.random().toString(36).substr(2, 9)}`,
      workspace_id: workspace.id,
      instagram_user_id: accountData.instagramUserId,
      username: cleanUsername,
      access_token: accountData.accessToken,
      token_expires_at: accountData.tokenExpiresAt,
      token_status: 'active',
      created_at: new Date().toISOString(),
    };

    const newAccounts = [...accounts, newAccount];
    setAccounts(newAccounts);
    if (!activeAccountId) {
      setActiveAccountId(newAccount.id);
    }
    return { success: true };
  };

  const removeInstagramAccount = async (accountId: string) => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('instagram_accounts').delete().eq('id', accountId);
        await supabase.from('automations').update({ status: 'paused' }).eq('instagram_account_id', accountId);
      } catch (e) {
        console.error("Failed to delete account from Supabase:", e);
      }
    }

    setAccounts(accounts.filter(acc => acc.id !== accountId));
    setAutomations(
      automations.map(aut => {
        if (aut.instagram_account_id === accountId) {
          return { ...aut, status: 'paused' as const };
        }
        return aut;
      })
    );

    if (activeAccountId === accountId) {
      const remaining = accounts.filter(acc => acc.id !== accountId);
      setActiveAccountId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  // Automation Operations
  const saveAutomation = async (auto: Partial<Automation>) => {
    if (!workspace) return { success: false, error: 'No workspace active.' };
    if (!activeAccountId) return { success: false, error: 'Please connect and select an Instagram account first.' };

    if (!auto.trigger_type) {
      return { success: false, error: 'A Trigger type must be selected.' };
    }
    if (!auto.action_type || !auto.action_config || !auto.action_config.message) {
      return { success: false, error: 'An Action message must be configured.' };
    }

    if (workspace.plan === 'free') {
      if (auto.action_type === 'email_gate' || auto.action_type === 'follow_gate' || auto.action_config.gate) {
        return { success: false, error: 'GATE_FEATURE_BLOCKED' };
      }
    }

    if (isSupabaseConfigured()) {
      try {
        const payload: any = {
          workspace_id: workspace.id,
          instagram_account_id: activeAccountId,
          name: auto.name || 'Untitled Automation',
          status: auto.status || 'paused',
          trigger_type: auto.trigger_type,
          trigger_config: auto.trigger_config || {},
          action_type: auto.action_type,
          action_config: auto.action_config,
          dm_sent_count: auto.dm_sent_count || 0,
          link_click_count: auto.link_click_count || 0,
          template_id: auto.template_id || null,
          updated_at: new Date().toISOString()
        };
        
        if (auto.id) {
          payload.id = auto.id;
        } else {
          payload.created_at = new Date().toISOString();
        }

        const { data, error } = await supabase.from('automations').upsert(payload).select().single();
        if (error) {
          console.error("Supabase upsert automation error:", error);
          return { success: false, error: error.message };
        }

        const saved = data as Automation;
        setAutomations(prev => {
          const filtered = prev.filter(a => a.id !== saved.id);
          return [...filtered, saved];
        });
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || 'Failed to save automation.' };
      }
    }

    if (auto.id) {
      setAutomations(
        automations.map(a => {
          if (a.id === auto.id) {
            return {
              ...a,
              name: auto.name || a.name,
              status: auto.status || a.status,
              trigger_type: auto.trigger_type || a.trigger_type,
              trigger_config: { ...a.trigger_config, ...auto.trigger_config },
              action_type: auto.action_type || a.action_type,
              action_config: { ...a.action_config, ...auto.action_config },
              updated_at: new Date().toISOString(),
            } as Automation;
          }
          return a;
        })
      );
    } else {
      const newAuto: Automation = {
        id: `auto_${Math.random().toString(36).substr(2, 9)}`,
        workspace_id: workspace.id,
        instagram_account_id: activeAccountId,
        name: auto.name || 'Untitled Automation',
        status: auto.status || 'paused',
        trigger_type: auto.trigger_type,
        trigger_config: auto.trigger_config || {},
        action_type: auto.action_type,
        action_config: auto.action_config as ActionConfig,
        dm_sent_count: 0,
        link_click_count: 0,
        template_id: auto.template_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setAutomations([...automations, newAuto]);
    }

    return { success: true };
  };

  const toggleAutomationStatus = async (id: string) => {
    const target = automations.find(a => a.id === id);
    if (!target) return;
    const newStatus = target.status === 'live' ? 'paused' : 'live';

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('automations').update({ status: newStatus }).eq('id', id);
      } catch (e) {
        console.error("Failed to update status in Supabase:", e);
      }
    }

    setAutomations(
      automations.map(aut => {
        if (aut.id === id) {
          return { ...aut, status: newStatus };
        }
        return aut;
      })
    );
  };

  const deleteAutomation = async (id: string) => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('automations').delete().eq('id', id);
      } catch (e) {
        console.error("Failed to delete automation in Supabase:", e);
      }
    }
    setAutomations(automations.filter(aut => aut.id !== id));
    setEvents(events.filter(ev => ev.automation_id !== id));
  };

  const deleteContact = async (id: string) => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('contacts').delete().eq('id', id);
      } catch (e) {
        console.error("Failed to delete contact in Supabase:", e);
      }
    }
    setContacts(contacts.filter(c => c.id !== id));
  };

  // Helper to simulate Instagram API sending with rate limiting and exponential backoff
  const sendDMWithRetry = async (
    message: string,
    recipient: string
  ): Promise<{ success: boolean; attempts: number; error?: string }> => {
    let attempt = 0;
    const maxRetries = 3;
    while (attempt <= maxRetries) {
      try {
        // Introduce standard delay to respect rate limit policies (Requirement 17.3)
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 10% chance of throwing rate limit error on first attempt (Requirement 17.4)
        if (attempt === 0 && Math.random() < 0.1) {
          throw new Error("Meta API Rate Limit Exceeded (429)");
        }
        
        return { success: true, attempts: attempt + 1 };
      } catch (err: any) {
        attempt++;
        if (attempt > maxRetries) {
          return { success: false, attempts: attempt, error: err.message || "Max retries reached" };
        }
        // Exponential backoff delay (Requirement 7.6)
        const delayMs = Math.pow(2, attempt) * 100;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return { success: false, attempts: attempt, error: "Unknown API error" };
  };

  // Instagram Event Simulator
  const simulateInstagramInteraction = async (
    commentText: string,
    instagramUsername: string,
    triggerType: TriggerType,
    postInfo?: { post_id: string; post_url: string; post_thumbnail: string },
    options?: { isFollowing?: boolean; email?: string }
  ) => {
    if (!workspace) return { success: false, outcome: 'error', details: 'No active workspace.' };
    if (!activeAccountId) return { success: false, outcome: 'error', details: 'No active Instagram account connected.' };

    const activeAcc = accounts.find(a => a.id === activeAccountId);
    if (!activeAcc) return { success: false, outcome: 'error', details: 'Selected account not found.' };

    // Detect if input text is a valid email
    const trimmedInput = commentText.trim();
    const isEmailInput = trimmedInput.includes('@') && trimmedInput.includes('.');
    let isEmailCollected = false;
    let inputEmail = options?.email || '';

    let matchedAut = null;

    if (isEmailInput) {
      // Find any live automation with action_type = 'email_gate'
      const emailGateAut = automations.find(
        aut =>
          aut.instagram_account_id === activeAccountId &&
          aut.status === 'live' &&
          aut.action_type === 'email_gate'
      );
      if (emailGateAut) {
        matchedAut = emailGateAut;
        isEmailCollected = true;
        inputEmail = trimmedInput;
      }
    }

    if (!matchedAut) {
      const matchingAuts = automations.filter(
        aut =>
          aut.instagram_account_id === activeAccountId &&
          aut.status === 'live' &&
          aut.trigger_type === triggerType
      );

      if (matchingAuts.length === 0) {
        return { success: false, outcome: 'no_automation', details: 'No active automations for this trigger type.' };
      }

      matchedAut = matchingAuts.find(aut => {
        if (triggerType === 'comment') {
          const postMatches = !aut.trigger_config.post_id || aut.trigger_config.post_id === postInfo?.post_id;
          const keywordsMatch = checkKeywordMatch(commentText, aut.trigger_config.keywords);
          return postMatches && keywordsMatch;
        } else if (triggerType === 'dm') {
          return checkKeywordMatch(commentText, aut.trigger_config.keywords);
        }
        return true;
      });
    }

    if (!matchedAut) {
      return { success: false, outcome: 'no_keyword_match', details: 'Keywords did not match any active automation.' };
    }

    const igUserId = `ig_user_${instagramUsername.toLowerCase()}`;

    // Query contact from DB or state early to bypass gates when they already complied
    let dbContact: any = null;
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('contacts')
          .select('*')
          .eq('workspace_id', workspace.id)
          .eq('instagram_user_id', igUserId)
          .maybeSingle();
        dbContact = data;
      } catch (err) {
        console.error("Error fetching contact for gate bypass check:", err);
      }
    } else {
      dbContact = contacts.find(c => c.instagram_user_id === igUserId && c.workspace_id === workspace.id) || null;
    }
    const hasSavedEmail = dbContact?.email && dbContact.email.includes('@');

    // Property 9: DM Deduplication Within 24-Hour Window
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSent = events.find(
      ev =>
        ev.automation_id === matchedAut.id &&
        ev.instagram_user_id === igUserId &&
        ev.event_type === 'dm_sent' &&
        new Date(ev.occurred_at) > oneDayAgo
    );

    if (recentSent) {
      if (isSupabaseConfigured()) {
        try {
          const dedupEventPayload = {
            automation_id: matchedAut.id,
            workspace_id: workspace.id,
            event_type: 'dm_blocked_dedup',
            instagram_user_id: igUserId,
            instagram_username: instagramUsername,
            metadata: { text: commentText, reason: '24h throttle' },
            occurred_at: new Date().toISOString()
          };
          const { data } = await supabase.from('automation_events').insert(dedupEventPayload).select().single();
          if (data) {
            setEvents(prev => [data as AutomationEvent, ...prev]);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        const dedupEvent: AutomationEvent = {
          id: `ev_${Math.random().toString(36).substr(2, 9)}`,
          automation_id: matchedAut.id,
          workspace_id: workspace.id,
          event_type: 'dm_blocked_dedup',
          instagram_user_id: igUserId,
          instagram_username: instagramUsername,
          metadata: { text: commentText, reason: '24h throttle' },
          occurred_at: new Date().toISOString(),
        };
        setEvents(prev => [dedupEvent, ...prev]);
      }
      return {
        success: false,
        outcome: 'blocked_dedup',
        details: 'Deduplicated: This user already received a DM from this automation in the last 24 hours.',
      };
    }

    // Property 14: DM Quota Invariant check
    const quota = getRemainingQuota(workspace);
    if (quota.totalRemaining <= 0) {
      if (isSupabaseConfigured()) {
        try {
          const quotaEventPayload = {
            automation_id: matchedAut.id,
            workspace_id: workspace.id,
            event_type: 'dm_blocked_quota',
            instagram_user_id: igUserId,
            instagram_username: instagramUsername,
            metadata: { text: commentText },
            occurred_at: new Date().toISOString()
          };
          const { data } = await supabase.from('automation_events').insert(quotaEventPayload).select().single();
          if (data) {
            setEvents(prev => [data as AutomationEvent, ...prev]);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        const quotaEvent: AutomationEvent = {
          id: `ev_${Math.random().toString(36).substr(2, 9)}`,
          automation_id: matchedAut.id,
          workspace_id: workspace.id,
          event_type: 'dm_blocked_quota',
          instagram_user_id: igUserId,
          instagram_username: instagramUsername,
          metadata: { text: commentText },
          occurred_at: new Date().toISOString(),
        };
        setEvents(prev => [quotaEvent, ...prev]);
      }
      return {
        success: false,
        outcome: 'blocked_quota',
        details: 'Quota exhausted: This workspace has reached its monthly DM limit. Upgrade plan or buy add-ons.',
      };
    }

    // Gated Actions Logic
    let finalMessage = matchedAut.action_config.message;
    let finalUrl = matchedAut.action_config.url;
    let isFollowPrompt = false;
    let isEmailPrompt = false;
    let isFollowVerified = false;

    if (matchedAut.action_type === 'follow_gate') {
      if (options?.isFollowing === false) {
        finalMessage = `Thanks for commenting! Please follow @${activeAcc.username} first to unlock your download link.`;
        finalUrl = '';
        isFollowPrompt = true;
      } else {
        isFollowVerified = true;
      }
    } else if (matchedAut.action_type === 'email_gate') {
      if (isEmailCollected || (inputEmail && inputEmail.includes('@')) || hasSavedEmail) {
        isEmailCollected = true;
        if (hasSavedEmail && !inputEmail && dbContact?.email) {
          inputEmail = dbContact.email;
        }
      } else {
        finalMessage = `Thanks for commenting! Please reply with your email address to receive your link:`;
        finalUrl = '';
        isEmailPrompt = true;
      }
    }

    // Append URL to the success message if this is not a prompt/instructions message
    if (!isFollowPrompt && !isEmailPrompt && finalUrl) {
      finalMessage = `${finalMessage} ${finalUrl}`;
    }

    // Call Retry Helper representing Instagram API send with rate limiting and exponential backoff
    const sendResult = await sendDMWithRetry(finalMessage, instagramUsername);
    if (!sendResult.success) {
      if (isSupabaseConfigured()) {
        try {
          const failEventPayload = {
            automation_id: matchedAut.id,
            workspace_id: workspace.id,
            event_type: 'dm_failed',
            instagram_user_id: igUserId,
            instagram_username: instagramUsername,
            metadata: { text: commentText, error: sendResult.error || 'Transient Error' },
            occurred_at: new Date().toISOString()
          };
          const { data } = await supabase.from('automation_events').insert(failEventPayload).select().single();
          if (data) {
            setEvents(prev => [data as AutomationEvent, ...prev]);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        const failEvent: AutomationEvent = {
          id: `ev_${Math.random().toString(36).substr(2, 9)}`,
          automation_id: matchedAut.id,
          workspace_id: workspace.id,
          event_type: 'dm_failed',
          instagram_user_id: igUserId,
          instagram_username: instagramUsername,
          metadata: { text: commentText, error: sendResult.error || 'Transient Error' },
          occurred_at: new Date().toISOString(),
        };
        setEvents(prev => [failEvent, ...prev]);
      }
      return {
        success: false,
        outcome: 'failed',
        details: `Meta API delivery failed after ${sendResult.attempts} attempts: ${sendResult.error || 'Max retries reached'}. Quota was not consumed.`,
      };
    }

    // Consume Quota (Property 15: Plan before add-on) - Increment atomically upon successful delivery (Requirement 17.1)
    let newDMSentCurrent = workspace.dm_sent_current_period;
    let newAddonCredits = workspace.dm_addon_credits;

    if (newDMSentCurrent < workspace.dm_quota_monthly) {
      newDMSentCurrent += 1;
    } else {
      newAddonCredits -= 1;
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('workspaces').update({
          dm_sent_current_period: newDMSentCurrent,
          dm_addon_credits: newAddonCredits
        }).eq('id', workspace.id);
        
        const contactEmail = isEmailCollected ? inputEmail : (dbContact?.email || undefined);
        
        if (dbContact) {
          const { data: updatedC } = await supabase.from('contacts').update({
            last_seen_at: new Date().toISOString(),
            interaction_count: dbContact.interaction_count + 1,
            email: contactEmail
          }).eq('id', dbContact.id).select().single();
          
          if (updatedC) {
            setContacts(prev => {
              const exists = prev.some(c => c.id === updatedC.id);
              if (exists) {
                return prev.map(c => c.id === updatedC.id ? (updatedC as Contact) : c);
              } else {
                return [...prev, updatedC as Contact];
              }
            });
          }
        } else {
          const { data: insertedC } = await supabase.from('contacts').insert({
            workspace_id: workspace.id,
            instagram_user_id: igUserId,
            instagram_username: instagramUsername,
            email: contactEmail,
            first_seen_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            interaction_count: 1
          }).select().single();
          if (insertedC) {
            setContacts(prev => [...prev, insertedC as Contact]);
          }
        }
        
        await supabase.from('automations').update({
          dm_sent_count: matchedAut.dm_sent_count + 1
        }).eq('id', matchedAut.id);

        // Record special gate events if verified/collected
        if (isFollowVerified) {
          const { data: fvEv } = await supabase.from('automation_events').insert({
            automation_id: matchedAut.id,
            workspace_id: workspace.id,
            event_type: 'follow_verified',
            instagram_user_id: igUserId,
            instagram_username: instagramUsername,
            metadata: { text: commentText },
            occurred_at: new Date().toISOString()
          }).select().single();
          if (fvEv) setEvents(prev => [fvEv as AutomationEvent, ...prev]);
        } else if (isEmailCollected) {
          const { data: ecEv } = await supabase.from('automation_events').insert({
            automation_id: matchedAut.id,
            workspace_id: workspace.id,
            event_type: 'email_collected',
            instagram_user_id: igUserId,
            instagram_username: instagramUsername,
            metadata: { text: commentText, email: inputEmail },
            occurred_at: new Date().toISOString()
          }).select().single();
          if (ecEv) setEvents(prev => [ecEv as AutomationEvent, ...prev]);
        }
        
        const { data: evC } = await supabase.from('automation_events').insert({
          automation_id: matchedAut.id,
          workspace_id: workspace.id,
          event_type: 'dm_sent',
          instagram_user_id: igUserId,
          instagram_username: instagramUsername,
          metadata: {
            text: commentText,
            action: matchedAut.action_type,
            message: finalMessage,
            url: finalUrl,
          },
          occurred_at: new Date().toISOString()
        }).select().single();
        if (evC) {
          setEvents(prev => [evC as AutomationEvent, ...prev]);
        }
      } catch (e: any) {
        console.error("Supabase simulate interaction error:", e);
        return { success: false, outcome: 'error', details: e.message || 'Database transaction failed.' };
      }
    } else {
      // Local Mock Mode
      const existingContact = contacts.find(c => c.instagram_user_id === igUserId && c.workspace_id === workspace.id);
      const contactEmail = isEmailCollected ? inputEmail : (existingContact?.email || undefined);

      if (existingContact) {
        setContacts(
          contacts.map(c => {
            if (c.id === existingContact.id) {
              return {
                ...c,
                instagram_username: instagramUsername,
                last_seen_at: new Date().toISOString(),
                interaction_count: c.interaction_count + 1,
                email: contactEmail
              };
            }
            return c;
          })
        );
      } else {
        const newContact: Contact = {
          id: `con_${Math.random().toString(36).substr(2, 9)}`,
          workspace_id: workspace.id,
          instagram_user_id: igUserId,
          instagram_username: instagramUsername,
          email: contactEmail,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          interaction_count: 1,
        };
        setContacts(prev => [...prev, newContact]);
      }

      if (isFollowVerified) {
        const fvEv: AutomationEvent = {
          id: `ev_${Math.random().toString(36).substr(2, 9)}`,
          automation_id: matchedAut.id,
          workspace_id: workspace.id,
          event_type: 'follow_verified',
          instagram_user_id: igUserId,
          instagram_username: instagramUsername,
          metadata: { text: commentText },
          occurred_at: new Date().toISOString()
        };
        setEvents(prev => [fvEv, ...prev]);
      } else if (isEmailCollected) {
        const ecEv: AutomationEvent = {
          id: `ev_${Math.random().toString(36).substr(2, 9)}`,
          automation_id: matchedAut.id,
          workspace_id: workspace.id,
          event_type: 'email_collected',
          instagram_user_id: igUserId,
          instagram_username: instagramUsername,
          metadata: { text: commentText, email: inputEmail },
          occurred_at: new Date().toISOString()
        };
        setEvents(prev => [ecEv, ...prev]);
      }

      const dmSentEvent: AutomationEvent = {
        id: `ev_${Math.random().toString(36).substr(2, 9)}`,
        automation_id: matchedAut.id,
        workspace_id: workspace.id,
        event_type: 'dm_sent',
        instagram_user_id: igUserId,
        instagram_username: instagramUsername,
        metadata: {
          text: commentText,
          action: matchedAut.action_type,
          message: finalMessage,
          url: finalUrl,
        },
        occurred_at: new Date().toISOString(),
      };
      setEvents(prev => [dmSentEvent, ...prev]);
    }

    setWorkspace({
      ...workspace,
      dm_sent_current_period: newDMSentCurrent,
      dm_addon_credits: newAddonCredits,
    });
    
    setAutomations(
      automations.map(a => {
        if (a.id === matchedAut.id) {
          return { ...a, dm_sent_count: a.dm_sent_count + 1 };
        }
        return a;
      })
    );

    let outcomeText = 'sent';
    let detailsText = `Successfully automated! Sent DM to @${instagramUsername} with message: "${finalMessage}"`;
    if (isFollowPrompt) {
      outcomeText = 'follow_prompt_sent';
      detailsText = `Follow gate active! Sent follow instructions DM to @${instagramUsername}.`;
    } else if (isEmailPrompt) {
      outcomeText = 'email_prompt_sent';
      detailsText = `Email gate active! Sent email request DM to @${instagramUsername}.`;
    }

    return {
      success: true,
      outcome: outcomeText,
      messageSent: finalMessage,
      details: detailsText,
    };
  };

  // Rewind flow executor
  const runRewind = async (
    automationId: string,
    postId: string,
    commentsList: { username: string; text: string; id: string }[]
  ) => {
    if (!workspace) return { success: false, dmsSent: 0, error: 'No workspace active.' };

    const aut = automations.find(a => a.id === automationId);
    if (!aut) return { success: false, dmsSent: 0, error: 'Automation not found.' };

    const matchedComments = commentsList.filter(c => {
      const keywordMatch = checkKeywordMatch(c.text, aut.trigger_config.keywords);
      const igUserId = `ig_user_${c.username.toLowerCase()}`;
      
      const alreadySent = events.some(
        ev =>
          ev.automation_id === aut.id &&
          ev.instagram_user_id === igUserId &&
          ev.event_type === 'dm_sent'
      );

      return keywordMatch && !alreadySent;
    });

    if (matchedComments.length === 0) {
      return { success: true, dmsSent: 0 };
    }

    const quota = getRemainingQuota(workspace);
    let toSendCount = matchedComments.length;

    if (toSendCount > quota.totalRemaining) {
      toSendCount = quota.totalRemaining;
    }

    if (toSendCount === 0) {
      return { success: false, dmsSent: 0, error: 'QUOTA_EXHAUSTED' };
    }

    let newDMSentCurrent = workspace.dm_sent_current_period;
    let newAddonCredits = workspace.dm_addon_credits;
    let actualSent = 0;

    const updatedContacts = [...contacts];
    const newEvents: AutomationEvent[] = [];

    const dbEventsToInsert: any[] = [];
    const dbContactsToUpsert: any[] = [];

    for (let i = 0; i < toSendCount; i++) {
      const comment = matchedComments[i];
      const igUserId = `ig_user_${comment.username.toLowerCase()}`;

      if (newDMSentCurrent < workspace.dm_quota_monthly) {
        newDMSentCurrent += 1;
      } else {
        newAddonCredits -= 1;
      }

      const existing = updatedContacts.find(c => c.instagram_user_id === igUserId && c.workspace_id === workspace.id);
      if (existing) {
        existing.last_seen_at = new Date().toISOString();
        existing.interaction_count += 1;
        dbContactsToUpsert.push({
          id: existing.id,
          workspace_id: workspace.id,
          instagram_user_id: igUserId,
          instagram_username: comment.username,
          last_seen_at: new Date().toISOString(),
          interaction_count: existing.interaction_count
        });
      } else {
        const tempId = isSupabaseConfigured() ? undefined : `con_${Math.random().toString(36).substr(2, 9)}`;
        const newC = {
          id: tempId,
          workspace_id: workspace.id,
          instagram_user_id: igUserId,
          instagram_username: comment.username,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          interaction_count: 1,
        };
        updatedContacts.push(newC as any);
        dbContactsToUpsert.push(newC);
      }

      const eventPayload = {
        automation_id: aut.id,
        workspace_id: workspace.id,
        event_type: 'dm_sent',
        instagram_user_id: igUserId,
        instagram_username: comment.username,
        metadata: {
          text: comment.text,
          rewind: true,
          message: aut.action_config.message,
          url: aut.action_config.url,
        },
        occurred_at: new Date().toISOString(),
      };
      
      dbEventsToInsert.push(eventPayload);
      
      newEvents.push({
        id: `ev_${Math.random().toString(36).substr(2, 9)}`,
        ...eventPayload
      } as AutomationEvent);

      actualSent += 1;
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('workspaces').update({
          dm_sent_current_period: newDMSentCurrent,
          dm_addon_credits: newAddonCredits
        }).eq('id', workspace.id);

        for (const c of dbContactsToUpsert) {
          await supabase.from('contacts').upsert(c, { onConflict: 'workspace_id,instagram_user_id' });
        }

        const { data: insertedEvs } = await supabase.from('automation_events').insert(dbEventsToInsert).select();
        if (insertedEvs) {
          setEvents(prev => [...(insertedEvs as AutomationEvent[]), ...prev]);
        }

        await supabase.from('automations').update({
          dm_sent_count: aut.dm_sent_count + actualSent
        }).eq('id', aut.id);

        const rewindLogPayload = {
          workspace_id: workspace.id,
          automation_id: aut.id,
          post_id: postId,
          comments_found: matchedComments.length,
          dms_sent: actualSent,
          status: 'complete',
          initiated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        };
        const { data: rewindLogRes } = await supabase.from('rewind_logs').insert(rewindLogPayload).select().single();
        if (rewindLogRes) {
          setRewindLogs(prev => [rewindLogRes as RewindLog, ...prev]);
        }

        const { data: refreshedContacts } = await supabase.from('contacts').select('*').eq('workspace_id', workspace.id);
        if (refreshedContacts) {
          setContacts(refreshedContacts);
        }
      } catch (e) {
        console.error("Rewind Supabase execution failed:", e);
      }
    } else {
      setContacts(updatedContacts);
      setEvents(prev => [...newEvents, ...prev]);

      const rewindLog: RewindLog = {
        id: `rew_${Math.random().toString(36).substr(2, 9)}`,
        workspace_id: workspace.id,
        automation_id: aut.id,
        post_id: postId,
        comments_found: matchedComments.length,
        dms_sent: actualSent,
        status: 'complete',
        initiated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
      setRewindLogs(prev => [rewindLog, ...prev]);
    }

    setWorkspace({
      ...workspace,
      dm_sent_current_period: newDMSentCurrent,
      dm_addon_credits: newAddonCredits,
    });

    setAutomations(
      automations.map(a => {
        if (a.id === aut.id) {
          return { ...a, dm_sent_count: a.dm_sent_count + actualSent };
        }
        return a;
      })
    );

    return { success: true, dmsSent: actualSent };
  };

  const purchaseAddon = async (packSize: number) => {
    if (!workspace) return;
    const newAddon = calculateNewAddonCredits(workspace.dm_addon_credits, packSize);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('workspaces').update({ dm_addon_credits: newAddon }).eq('id', workspace.id);
        
        const systemEvent = {
          workspace_id: workspace.id,
          automation_id: null,
          event_type: 'link_clicked',
          instagram_user_id: 'system',
          instagram_username: 'SYSTEM',
          metadata: { type: 'addon_purchase', size: packSize },
          occurred_at: new Date().toISOString()
        };
        const { data } = await supabase.from('automation_events').insert(systemEvent).select().single();
        if (data) {
          setEvents(prev => [data as AutomationEvent, ...prev]);
        }
      } catch (e) {
        console.error("Failed to update workspace in Supabase:", e);
      }
    } else {
      const systemEvent: AutomationEvent = {
        id: `ev_${Math.random().toString(36).substr(2, 9)}`,
        automation_id: '',
        workspace_id: workspace.id,
        event_type: 'link_clicked',
        instagram_user_id: 'system',
        instagram_username: 'SYSTEM',
        metadata: { type: 'addon_purchase', size: packSize },
        occurred_at: new Date().toISOString(),
      };
      setEvents(prev => [systemEvent, ...prev]);
    }

    setWorkspace({
      ...workspace,
      dm_addon_credits: newAddon,
    });
  };

  const upgradePlan = async (plan: PlanType, billingCycle: 'monthly' | 'yearly') => {
    if (!workspace) return;
    const newLimit = getMonthlyQuotaForPlan(plan);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('workspaces').update({
          plan,
          billing_cycle: billingCycle,
          dm_quota_monthly: newLimit
        }).eq('id', workspace.id);
        if (error) {
          console.error("Failed to upgrade workspace plan in Supabase:", error.message, error.details);
          throw new Error(error.message);
        }
      } catch (e) {
        console.error("Failed to upgrade workspace plan in Supabase:", e);
      }
    }

    setWorkspace({
      ...workspace,
      plan,
      billing_cycle: billingCycle,
      dm_quota_monthly: newLimit,
    });
  };

  const dismissUpgradeBanner = () => {
    setIsBannerDismissed(true);
    sessionStorage.setItem('inst_banner_dismissed', 'true');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        workspace,
        accounts,
        automations,
        contacts,
        events,
        rewindLogs,
        templates: SYSTEM_TEMPLATES,
        activeAccountId,
        setActiveAccountId,
        isBannerDismissed,
        loading: !mounted,
        signInGoogle,
        signInSandbox,
        signOut,
        addInstagramAccount,
        linkRealInstagramAccount,
        removeInstagramAccount,
        saveAutomation,
        toggleAutomationStatus,
        deleteAutomation,
        deleteContact,
        simulateInstagramInteraction,
        runRewind,
        purchaseAddon,
        upgradePlan,
        dismissUpgradeBanner,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
