import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';

const { mockDbState, mockSupabase } = vi.hoisted(() => {
  // Set env variables before imports load
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock_anon_key';
  process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN = 'secret_token';
  process.env.INSTAGRAM_CLIENT_SECRET = 'secret_key';

  const state = {
    data: null as any,
    error: null as any,
    queries: [] as any[],
  };

  const mockQueryBuilder: any = {
    select: vi.fn().mockImplementation((...args) => {
      state.queries.push({ method: 'select', args });
      return mockQueryBuilder;
    }),
    eq: vi.fn().mockImplementation((...args) => {
      state.queries.push({ method: 'eq', args });
      return mockQueryBuilder;
    }),
    gt: vi.fn().mockImplementation((...args) => {
      state.queries.push({ method: 'gt', args });
      return mockQueryBuilder;
    }),
    limit: vi.fn().mockImplementation((...args) => {
      state.queries.push({ method: 'limit', args });
      return mockQueryBuilder;
    }),
    order: vi.fn().mockImplementation((...args) => {
      state.queries.push({ method: 'order', args });
      return mockQueryBuilder;
    }),
    single: vi.fn().mockImplementation(() => {
      state.queries.push({ method: 'single' });
      return Promise.resolve({ data: Array.isArray(state.data) ? state.data[0] : state.data, error: state.error });
    }),
    maybeSingle: vi.fn().mockImplementation(() => {
      state.queries.push({ method: 'maybeSingle' });
      return Promise.resolve({ data: Array.isArray(state.data) ? state.data[0] : state.data, error: state.error });
    }),
    insert: vi.fn().mockImplementation((...args) => {
      state.queries.push({ method: 'insert', args });
      return mockQueryBuilder;
    }),
    update: vi.fn().mockImplementation((...args) => {
      state.queries.push({ method: 'update', args });
      return mockQueryBuilder;
    }),
    then: vi.fn().mockImplementation((onfulfilled) => {
      return Promise.resolve({ data: state.data, error: state.error }).then(onfulfilled);
    }),
  };

  const mockSupabase = {
    from: vi.fn().mockImplementation((table) => {
      state.queries.push({ method: 'from', table });
      return mockQueryBuilder;
    }),
  };

  return { mockDbState: state, mockSupabase };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));

// Import webhook route handler
import { GET, POST } from '../app/api/webhooks/instagram/route';
import crypto from 'crypto';

describe('Instagram Webhook Handler', () => {
  let mockFetchResponse: any = {};
  let mockFetchStatus = 200;
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeAll(() => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        status: mockFetchStatus,
        ok: mockFetchStatus >= 200 && mockFetchStatus < 300,
        json: () => Promise.resolve(mockFetchResponse),
      } as Response)
    );
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  beforeEach(() => {
    mockDbState.data = null;
    mockDbState.error = null;
    mockDbState.queries = [];
    mockFetchResponse = {};
    mockFetchStatus = 200;
    process.env = { ...originalEnv };
    process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN = 'secret_token';
    process.env.INSTAGRAM_CLIENT_SECRET = 'secret_key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock_anon_key';
    vi.clearAllMocks();
  });

  describe('GET /api/webhooks/instagram (Verification)', () => {
    it('should verify setup challenge with correct verify token', async () => {
      const req = new Request('http://localhost/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=secret_token&hub.challenge=challenge123');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe('challenge123');
    });

    it('should return 403 on verify token mismatch', async () => {
      const req = new Request('http://localhost/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=challenge123');
      const res = await GET(req);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/webhooks/instagram', () => {
    // Helper to sign payload
    function signPayload(payload: string, secret: string) {
      const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      return `sha256=${hmac}`;
    }

    it('should return 403 on signature mismatch', async () => {
      const payload = JSON.stringify({ object: 'instagram', entry: [] });
      const req = new Request('http://localhost/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=invalidsig'
        },
        body: payload
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('should process comments webhook and match keywords correctly', async () => {
      const mockAccount = { id: 'acc_123', workspace_id: 'ws_123', instagram_user_id: '123456789', access_token: 'tok_123' };
      const mockAutomation = {
        id: 'aut_123',
        workspace_id: 'ws_123',
        instagram_account_id: 'acc_123',
        name: 'Keyword Guide',
        status: 'live',
        trigger_type: 'comment',
        trigger_config: { keywords: ['guide'] },
        action_type: 'send_dm',
        action_config: { message: 'Here is your link!', url: 'https://example.com/guide.pdf' },
        dm_sent_count: 5
      };
      const mockWorkspace = { id: 'ws_123', dm_quota_monthly: 500, dm_sent_current_period: 200, dm_addon_credits: 0 };
      const mockContact = null;

      let callIndex = 0;
      vi.spyOn(mockSupabase, 'from').mockImplementation(() => {
        const mockQB = {
          select: vi.fn().mockImplementation(() => mockQB),
          eq: vi.fn().mockImplementation(() => mockQB),
          gt: vi.fn().mockImplementation(() => mockQB),
          limit: vi.fn().mockImplementation(() => mockQB),
          single: vi.fn().mockImplementation(() => {
            callIndex++;
            if (callIndex === 1) return Promise.resolve({ data: mockAccount, error: null });
            if (callIndex === 3) return Promise.resolve({ data: mockWorkspace, error: null });
            return Promise.resolve({ data: null, error: 'Not found' });
          }),
          maybeSingle: vi.fn().mockImplementation(() => {
            callIndex++;
            if (callIndex === 2) return Promise.resolve({ data: null, error: null }); // deduplication check
            if (callIndex === 4) return Promise.resolve({ data: mockContact, error: null }); // contact lookup
            return Promise.resolve({ data: null, error: null });
          }),
          insert: vi.fn().mockImplementation(() => mockQB),
          update: vi.fn().mockImplementation(() => mockQB),
          then: vi.fn().mockImplementation((onfulfilled) => {
            // Mock automations fetch
            return Promise.resolve({ data: [mockAutomation], error: null }).then(onfulfilled);
          })
        };
        return mockQB as any;
      });

      const payload = JSON.stringify({
        object: 'instagram',
        entry: [
          {
            id: '123456789',
            time: 1600000000,
            changes: [
              {
                field: 'comments',
                value: {
                  id: 'comment_999',
                  text: 'Give me the guide!',
                  from: { id: 'sender_999', username: 'alice' },
                  media: { id: 'media_999' }
                }
              }
            ]
          }
        ]
      });

      mockFetchResponse = { success: true };
      
      const req = new Request('http://localhost/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signPayload(payload, 'secret_key')
        },
        body: payload
      });

      const res = await POST(req);
      if (res.status !== 200) {
        console.log("TEST FAILURE DETAILS - comments match:", await res.json());
      }
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should handle email opt-in and auto email collection', async () => {
      const mockAccount = { id: 'acc_123', workspace_id: 'ws_123', instagram_user_id: '123456789', access_token: 'tok_123' };
      const mockEmailAutomation = {
        id: 'aut_email_123',
        workspace_id: 'ws_123',
        instagram_account_id: 'acc_123',
        name: 'Email Opt-in Magnet',
        status: 'live',
        trigger_type: 'comment',
        trigger_config: { keywords: ['freebie'] },
        action_type: 'email_gate',
        action_config: { message: 'Thanks! Here is your download:', url: 'https://example.com/freebie.pdf' },
        dm_sent_count: 0
      };
      const mockWorkspace = { id: 'ws_123', dm_quota_monthly: 500, dm_sent_current_period: 0, dm_addon_credits: 0 };
      
      let callIndex = 0;
      vi.spyOn(mockSupabase, 'from').mockImplementation(() => {
        const mockQB = {
          select: vi.fn().mockImplementation(() => mockQB),
          eq: vi.fn().mockImplementation(() => mockQB),
          gt: vi.fn().mockImplementation(() => mockQB),
          limit: vi.fn().mockImplementation(() => mockQB),
          single: vi.fn().mockImplementation(() => {
            callIndex++;
            if (callIndex === 1) return Promise.resolve({ data: mockAccount, error: null });
            if (callIndex === 3) return Promise.resolve({ data: mockWorkspace, error: null });
            return Promise.resolve({ data: null, error: 'Not found' });
          }),
          maybeSingle: vi.fn().mockImplementation(() => {
            callIndex++;
            if (callIndex === 2) return Promise.resolve({ data: null, error: null }); // deduplication
            if (callIndex === 4) return Promise.resolve({ data: null, error: null }); // contact (none exists)
            return Promise.resolve({ data: null, error: null });
          }),
          insert: vi.fn().mockImplementation(() => mockQB),
          update: vi.fn().mockImplementation(() => mockQB),
          then: vi.fn().mockImplementation((onfulfilled) => {
            return Promise.resolve({ data: [mockEmailAutomation], error: null }).then(onfulfilled);
          })
        };
        return mockQB as any;
      });

      const payloadWithEmail = JSON.stringify({
        object: 'instagram',
        entry: [
          {
            id: '123456789',
            time: 1600000000,
            changes: [
              {
                field: 'comments',
                value: {
                  id: 'comment_111',
                  text: 'Give me the freebie, my email is bob@example.com',
                  from: { id: 'sender_bob', username: 'bob_user' },
                  media: { id: 'media_999' }
                }
              }
            ]
          }
        ]
      });

      const req = new Request('http://localhost/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signPayload(payloadWithEmail, 'secret_key')
        },
        body: payloadWithEmail
      });

      const res = await POST(req);
      if (res.status !== 200) {
        console.log("TEST FAILURE DETAILS - email collection:", await res.json());
      }
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should prompt for email if none is supplied in comment, then release the link on email reply', async () => {
      const mockAccount = { id: 'acc_123', workspace_id: 'ws_123', instagram_user_id: '123456789', access_token: 'tok_123' };
      const mockWorkspace = { id: 'ws_123', dm_quota_monthly: 500, dm_sent_current_period: 0, dm_addon_credits: 0 };
      const mockEmailAutomation = {
        id: 'aut_email_123',
        workspace_id: 'ws_123',
        instagram_account_id: 'acc_123',
        name: 'Email Opt-in Magnet',
        status: 'live',
        trigger_type: 'comment',
        trigger_config: { keywords: ['freebie'] },
        action_type: 'email_gate',
        action_config: { message: 'Thanks! Here is your download:', url: 'https://example.com/freebie.pdf' },
        dm_sent_count: 0
      };
      
      let callIndex = 0;
      vi.spyOn(mockSupabase, 'from').mockImplementation(() => {
        const mockQB = {
          select: vi.fn().mockImplementation(() => mockQB),
          eq: vi.fn().mockImplementation(() => mockQB),
          gt: vi.fn().mockImplementation(() => mockQB),
          limit: vi.fn().mockImplementation(() => mockQB),
          single: vi.fn().mockImplementation(() => {
            callIndex++;
            if (callIndex === 1) return Promise.resolve({ data: mockAccount, error: null });
            if (callIndex === 3) return Promise.resolve({ data: mockWorkspace, error: null });
            return Promise.resolve({ data: null, error: 'Not found' });
          }),
          maybeSingle: vi.fn().mockImplementation(() => {
            callIndex++;
            if (callIndex === 2) return Promise.resolve({ data: null, error: null }); // deduplication
            if (callIndex === 4) return Promise.resolve({ data: null, error: null }); // contact (none)
            return Promise.resolve({ data: null, error: null });
          }),
          insert: vi.fn().mockImplementation(() => mockQB),
          update: vi.fn().mockImplementation(() => mockQB),
          then: vi.fn().mockImplementation((onfulfilled) => {
            return Promise.resolve({ data: [mockEmailAutomation], error: null }).then(onfulfilled);
          })
        };
        return mockQB as any;
      });

      const payloadWithoutEmail = JSON.stringify({
        object: 'instagram',
        entry: [
          {
            id: '123456789',
            time: 1600000000,
            changes: [
              {
                field: 'comments',
                value: {
                  id: 'comment_222',
                  text: 'Give me the freebie!',
                  from: { id: 'sender_no_email', username: 'john_doe' },
                  media: { id: 'media_999' }
                }
              }
            ]
          }
        ]
      });

      const req = new Request('http://localhost/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signPayload(payloadWithoutEmail, 'secret_key')
        },
        body: payloadWithoutEmail
      });

      const res = await POST(req);
      if (res.status !== 200) {
        console.log("TEST FAILURE DETAILS - email prompt:", await res.json());
      }
      expect(res.status).toBe(200);
    });

    it('should release gated link when user replies to DM with email', async () => {
      const mockAccount = { id: 'acc_123', workspace_id: 'ws_123', instagram_user_id: '123456789', access_token: 'tok_123' };
      const mockContact = { id: 'con_123', workspace_id: 'ws_123', instagram_user_id: 'ig_user_john_doe', email: null, interaction_count: 1 };
      const mockEmailAutomation = {
        id: 'aut_email_123',
        workspace_id: 'ws_123',
        instagram_account_id: 'acc_123',
        name: 'Email Opt-in Magnet',
        status: 'live',
        trigger_type: 'comment',
        action_type: 'email_gate',
        action_config: { message: 'Thanks! Here is your download:', url: 'https://example.com/freebie.pdf' },
        dm_sent_count: 1
      };
      const mockWorkspace = { id: 'ws_123', dm_quota_monthly: 500, dm_sent_current_period: 1, dm_addon_credits: 0 };

      vi.spyOn(mockSupabase, 'from').mockImplementation((table) => {
        const mockQB = {
          select: vi.fn().mockImplementation(() => mockQB),
          eq: vi.fn().mockImplementation(() => mockQB),
          gt: vi.fn().mockImplementation(() => mockQB),
          limit: vi.fn().mockImplementation(() => mockQB),
          order: vi.fn().mockImplementation(() => mockQB),
          single: vi.fn().mockImplementation(() => {
            if (table === 'instagram_accounts') return Promise.resolve({ data: mockAccount, error: null });
            if (table === 'workspaces') return Promise.resolve({ data: mockWorkspace, error: null });
            return Promise.resolve({ data: null, error: 'Not found' });
          }),
          maybeSingle: vi.fn().mockImplementation(() => {
            if (table === 'contacts') return Promise.resolve({ data: mockContact, error: null });
            if (table === 'automation_events') return Promise.resolve({ data: { automation_id: 'aut_email_123' }, error: null });
            if (table === 'automations') return Promise.resolve({ data: mockEmailAutomation, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
          insert: vi.fn().mockImplementation(() => mockQB),
          update: vi.fn().mockImplementation(() => mockQB),
          then: vi.fn().mockImplementation((onfulfilled) => {
            if (table === 'automations') return Promise.resolve({ data: [mockEmailAutomation], error: null }).then(onfulfilled);
            return Promise.resolve({ data: [], error: null }).then(onfulfilled);
          })
        };
        return mockQB as any;
      });

      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('sender_no_email')) {
          return Promise.resolve({
            status: 200,
            ok: true,
            json: () => Promise.resolve({ username: 'john_doe' })
          } as Response);
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ success: true })
        } as Response);
      });

      const dmPayload = JSON.stringify({
        object: 'instagram',
        entry: [
          {
            id: '123456789',
            time: 1600000000,
            messaging: [
              {
                sender: { id: 'sender_no_email' },
                recipient: { id: '123456789' },
                timestamp: 1600000000,
                message: {
                  mid: 'mid_dm_111',
                  text: 'my email is john@example.com'
                }
              }
            ]
          }
        ]
      });

      const req = new Request('http://localhost/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signPayload(dmPayload, 'secret_key')
        },
        body: dmPayload
      });

      const res = await POST(req);
      if (res.status !== 200) {
        console.log("TEST FAILURE DETAILS - email reply:", await res.json());
      }
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should handle follow gate comment webhook and send follow prompt when user is not following', async () => {
      const mockAccount = { id: 'acc_123', workspace_id: 'ws_123', instagram_user_id: '123456789', access_token: 'tok_123' };
      const mockFollowAutomation = {
        id: 'aut_follow_123',
        workspace_id: 'ws_123',
        instagram_account_id: 'acc_123',
        name: 'Follow Gate Magnet',
        status: 'live',
        trigger_type: 'comment',
        action_type: 'follow_gate',
        action_config: { message: 'Thanks! Here is your download:', url: 'https://example.com/freebie.pdf' },
        dm_sent_count: 0
      };
      const mockWorkspace = { id: 'ws_123', dm_quota_monthly: 500, dm_sent_current_period: 0, dm_addon_credits: 0 };

      vi.spyOn(mockSupabase, 'from').mockImplementation((table) => {
        const mockQB = {
          select: vi.fn().mockImplementation(() => mockQB),
          eq: vi.fn().mockImplementation(() => mockQB),
          gt: vi.fn().mockImplementation(() => mockQB),
          limit: vi.fn().mockImplementation(() => mockQB),
          single: vi.fn().mockImplementation(() => {
            if (table === 'instagram_accounts') return Promise.resolve({ data: mockAccount, error: null });
            if (table === 'workspaces') return Promise.resolve({ data: mockWorkspace, error: null });
            return Promise.resolve({ data: null, error: 'Not found' });
          }),
          maybeSingle: vi.fn().mockImplementation(() => {
            return Promise.resolve({ data: null, error: null });
          }),
          insert: vi.fn().mockImplementation(() => mockQB),
          update: vi.fn().mockImplementation(() => mockQB),
          then: vi.fn().mockImplementation((onfulfilled) => {
            return Promise.resolve({ data: [mockFollowAutomation], error: null }).then(onfulfilled);
          })
        };
        return mockQB as any;
      });

      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ is_user_follow_business: false }) // not following
        } as Response);
      });

      const payload = JSON.stringify({
        object: 'instagram',
        entry: [
          {
            id: '123456789',
            time: 1600000000,
            changes: [
              {
                field: 'comments',
                value: {
                  id: 'comment_333',
                  text: 'want it!',
                  from: { id: 'sender_not_following', username: 'john_doe' },
                  media: { id: 'media_999' }
                }
              }
            ]
          }
        ]
      });

      const req = new Request('http://localhost/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signPayload(payload, 'secret_key')
        },
        body: payload
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should release gated link when user clicks Following and follow is verified', async () => {
      const mockAccount = { id: 'acc_123', workspace_id: 'ws_123', instagram_user_id: '123456789', access_token: 'tok_123' };
      const mockContact = { id: 'con_123', workspace_id: 'ws_123', instagram_user_id: 'ig_user_john_doe', email: null, interaction_count: 1 };
      const mockFollowAutomation = {
        id: 'aut_follow_123',
        workspace_id: 'ws_123',
        instagram_account_id: 'acc_123',
        name: 'Follow Gate Magnet',
        status: 'live',
        trigger_type: 'comment',
        action_type: 'follow_gate',
        action_config: { message: 'Thanks! Here is your download:', url: 'https://example.com/freebie.pdf' },
        dm_sent_count: 1
      };
      const mockWorkspace = { id: 'ws_123', dm_quota_monthly: 500, dm_sent_current_period: 1, dm_addon_credits: 0 };

      vi.spyOn(mockSupabase, 'from').mockImplementation((table) => {
        const mockQB = {
          select: vi.fn().mockImplementation(() => mockQB),
          eq: vi.fn().mockImplementation(() => mockQB),
          gt: vi.fn().mockImplementation(() => mockQB),
          limit: vi.fn().mockImplementation(() => mockQB),
          order: vi.fn().mockImplementation(() => mockQB),
          single: vi.fn().mockImplementation(() => {
            if (table === 'instagram_accounts') return Promise.resolve({ data: mockAccount, error: null });
            if (table === 'workspaces') return Promise.resolve({ data: mockWorkspace, error: null });
            return Promise.resolve({ data: null, error: 'Not found' });
          }),
          maybeSingle: vi.fn().mockImplementation(() => {
            if (table === 'contacts') return Promise.resolve({ data: mockContact, error: null });
            if (table === 'automation_events') return Promise.resolve({ data: { automation_id: 'aut_follow_123' }, error: null });
            if (table === 'automations') return Promise.resolve({ data: mockFollowAutomation, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
          insert: vi.fn().mockImplementation(() => mockQB),
          update: vi.fn().mockImplementation(() => mockQB),
          then: vi.fn().mockImplementation((onfulfilled) => {
            if (table === 'automations') return Promise.resolve({ data: [mockFollowAutomation], error: null }).then(onfulfilled);
            return Promise.resolve({ data: [], error: null }).then(onfulfilled);
          })
        };
        return mockQB as any;
      });

      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('sender_following')) {
          // Mock profile fetch which returns username AND following check
          return Promise.resolve({
            status: 200,
            ok: true,
            json: () => Promise.resolve({ username: 'john_doe', is_user_follow_business: true })
          } as Response);
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ success: true })
        } as Response);
      });

      const dmPayload = JSON.stringify({
        object: 'instagram',
        entry: [
          {
            id: '123456789',
            time: 1600000000,
            messaging: [
              {
                sender: { id: 'sender_following' },
                recipient: { id: '123456789' },
                timestamp: 1600000000,
                message: {
                  mid: 'mid_dm_222',
                  text: 'Following',
                  quick_reply: {
                    payload: 'check_follow_aut_follow_123'
                  }
                }
              }
            ]
          }
        ]
      });

      const req = new Request('http://localhost/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signPayload(dmPayload, 'secret_key')
        },
        body: dmPayload
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should execute public comment reply when configured', async () => {
      const mockAccount = { id: 'acc_123', workspace_id: 'ws_123', instagram_user_id: '123456789', access_token: 'tok_123' };
      const mockAutomation = {
        id: 'aut_pub_123',
        workspace_id: 'ws_123',
        instagram_account_id: 'acc_123',
        name: 'Public Reply Test',
        status: 'live',
        trigger_type: 'comment',
        action_type: 'send_dm',
        action_config: { message: 'Inbox check!', url: 'https://example.com', comment_reply: 'Sent you a DM! 📩' },
        dm_sent_count: 0
      };
      const mockWorkspace = { id: 'ws_123', dm_quota_monthly: 500, dm_sent_current_period: 0, dm_addon_credits: 0 };

      vi.spyOn(mockSupabase, 'from').mockImplementation((table) => {
        const mockQB = {
          select: vi.fn().mockImplementation(() => mockQB),
          eq: vi.fn().mockImplementation(() => mockQB),
          gt: vi.fn().mockImplementation(() => mockQB),
          limit: vi.fn().mockImplementation(() => mockQB),
          single: vi.fn().mockImplementation(() => {
            if (table === 'instagram_accounts') return Promise.resolve({ data: mockAccount, error: null });
            if (table === 'workspaces') return Promise.resolve({ data: mockWorkspace, error: null });
            return Promise.resolve({ data: null, error: 'Not found' });
          }),
          maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
          insert: vi.fn().mockImplementation(() => mockQB),
          update: vi.fn().mockImplementation(() => mockQB),
          then: vi.fn().mockImplementation((onfulfilled) => {
            return Promise.resolve({ data: [mockAutomation], error: null }).then(onfulfilled);
          })
        };
        return mockQB as any;
      });

      const fetchSpy = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ success: true })
        } as Response);
      });
      global.fetch = fetchSpy;

      const payload = JSON.stringify({
        object: 'instagram',
        entry: [
          {
            id: '123456789',
            time: 1600000000,
            changes: [
              {
                field: 'comments',
                value: {
                  id: 'comment_999',
                  text: 'info',
                  from: { id: 'sender_id_123', username: 'john_doe' },
                  media: { id: 'media_123' }
                }
              }
            ]
          }
        ]
      });

      const req = new Request('http://localhost/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signPayload(payload, 'secret_key')
        },
        body: payload
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify that the comments replies endpoint was called to post the public reply
      const replyCall = fetchSpy.mock.calls.find(call => call[0].includes('/comment_999/replies'));
      expect(replyCall).toBeDefined();
    });

    it('should trigger a new DM keyword automation successfully from a DM/story webhook', async () => {
      const mockAccount = { id: 'acc_123', workspace_id: 'ws_123', instagram_user_id: '123456789', access_token: 'tok_123' };
      const mockDMAutomation = {
        id: 'aut_dm_123',
        workspace_id: 'ws_123',
        instagram_account_id: 'acc_123',
        name: 'DM Magnet',
        status: 'live',
        trigger_type: 'dm',
        trigger_config: { keywords: ['guide', 'ebook'] },
        action_type: 'send_dm',
        action_config: { message: 'Here is your ebook guide:', url: 'https://example.com/guide.pdf' },
        dm_sent_count: 0
      };
      const mockWorkspace = { id: 'ws_123', dm_quota_monthly: 500, dm_sent_current_period: 0, dm_addon_credits: 0 };
      const mockContact = { id: 'con_123', workspace_id: 'ws_123', instagram_user_id: 'ig_user_john_doe', email: 'john@example.com' };

      vi.spyOn(mockSupabase, 'from').mockImplementation((table) => {
        const mockQB = {
          select: vi.fn().mockImplementation(() => mockQB),
          eq: vi.fn().mockImplementation(() => mockQB),
          gt: vi.fn().mockImplementation(() => mockQB),
          limit: vi.fn().mockImplementation(() => mockQB),
          single: vi.fn().mockImplementation(() => {
            if (table === 'instagram_accounts') return Promise.resolve({ data: mockAccount, error: null });
            if (table === 'workspaces') return Promise.resolve({ data: mockWorkspace, error: null });
            return Promise.resolve({ data: null, error: 'Not found' });
          }),
          maybeSingle: vi.fn().mockImplementation(() => {
            if (table === 'contacts') return Promise.resolve({ data: mockContact, error: null });
            return Promise.resolve({ data: null, error: null });
          }),
          insert: vi.fn().mockImplementation(() => mockQB),
          update: vi.fn().mockImplementation(() => mockQB),
          then: vi.fn().mockImplementation((onfulfilled) => {
            if (table === 'automations') return Promise.resolve({ data: [mockDMAutomation], error: null }).then(onfulfilled);
            if (table === 'instagram_accounts') return Promise.resolve({ data: [mockAccount], error: null }).then(onfulfilled);
            return Promise.resolve({ data: [], error: null }).then(onfulfilled);
          })
        };
        return mockQB as any;
      });

      const fetchSpy = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ username: 'john_doe', is_user_follow_business: true })
        } as Response);
      });
      global.fetch = fetchSpy;

      const dmPayload = JSON.stringify({
        object: 'instagram',
        entry: [
          {
            id: '123456789',
            time: 1600000000,
            messaging: [
              {
                sender: { id: 'sender_dm_user' },
                recipient: { id: '123456789' },
                timestamp: 1600000000,
                message: {
                  mid: 'mid_dm_333',
                  text: 'send me the ebook please'
                }
              }
            ]
          }
        ]
      });

      const req = new Request('http://localhost/api/webhooks/instagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signPayload(dmPayload, 'secret_key')
        },
        body: dmPayload
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify that messages endpoint was called
      const messageCall = fetchSpy.mock.calls.find(call => call[0].includes('/messages'));
      expect(messageCall).toBeDefined();
    });
  });
});
