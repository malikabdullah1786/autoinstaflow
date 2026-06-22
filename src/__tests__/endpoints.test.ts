import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';

// Use vi.hoisted to ensure db state and mocks are created before module mocks are executed
const { mockDbState, mockSupabase } = vi.hoisted(() => {
  const state = {
    data: null as any,
    error: null as any,
  };

  const mockQueryBuilder: any = {
    select: vi.fn().mockImplementation(() => mockQueryBuilder),
    eq: vi.fn().mockImplementation(() => mockQueryBuilder),
    order: vi.fn().mockImplementation(() => mockQueryBuilder),
    limit: vi.fn().mockImplementation(() => mockQueryBuilder),
    single: vi.fn().mockImplementation(() => Promise.resolve({ data: state.data, error: state.error })),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: state.data, error: state.error })),
    then: vi.fn().mockImplementation((onfulfilled) => {
      return Promise.resolve({ data: state.data, error: state.error }).then(onfulfilled);
    }),
  };

  const mockSupabase = {
    from: vi.fn().mockImplementation(() => mockQueryBuilder),
  };

  return { mockDbState: state, mockSupabase };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));

// Import endpoints after hoisting
import { POST as POST_lookup } from '../app/api/instagram/lookup/route';
import { GET as GET_media } from '../app/api/instagram/media/route';
import { GET as GET_comments } from '../app/api/instagram/comments/route';
import { POST as POST_callback } from '../app/api/auth/instagram/callback/route';

describe('Instagram API Endpoints', () => {
  let mockFetchResponse: any = {};
  let mockFetchStatus = 200;
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeAll(() => {
    global.fetch = vi.fn().mockImplementation((url: any) => {
      const urlStr = String(url || '');
      let responseBody = mockFetchResponse;
      if (urlStr.includes('/me/stories')) {
        responseBody = mockFetchResponse?.stories || { data: [] };
      } else if (urlStr.includes('/me/media')) {
        responseBody = mockFetchResponse?.posts ? { data: mockFetchResponse.posts } : mockFetchResponse;
      }
      return Promise.resolve({
        status: mockFetchStatus,
        ok: mockFetchStatus >= 200 && mockFetchStatus < 300,
        json: () => Promise.resolve(responseBody),
      } as Response);
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  beforeEach(() => {
    mockDbState.data = null;
    mockDbState.error = null;
    mockFetchResponse = {};
    mockFetchStatus = 200;
    process.env = { ...originalEnv };
    delete process.env.INSTAGRAM_MASTER_ACCESS_TOKEN;
    delete process.env.INSTAGRAM_MASTER_BUSINESS_ACCOUNT_ID;
    vi.clearAllMocks();
  });

  describe('POST /api/instagram/lookup', () => {
    it('should return 400 if username is missing', async () => {
      const req = new Request('http://localhost/api/instagram/lookup', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await POST_lookup(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Username is required');
    });

    it('should return simulated mock data if no tokens exist in env or database', async () => {
      mockDbState.data = []; // No accounts in DB
      const req = new Request('http://localhost/api/instagram/lookup', {
        method: 'POST',
        body: JSON.stringify({ username: '@test_user' }),
      });
      const res = await POST_lookup(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isSimulated).toBe(true);
      expect(data.data.username).toBe('test_user');
      expect(data.data.name).toBe('Test User');
    });

    it('should return real Meta Business Discovery data using master env credentials', async () => {
      process.env.INSTAGRAM_MASTER_ACCESS_TOKEN = 'env_token';
      process.env.INSTAGRAM_MASTER_BUSINESS_ACCOUNT_ID = 'env_account_id';

      mockFetchResponse = {
        business_discovery: {
          id: '12345',
          name: 'Real User Name',
          profile_picture_url: 'https://pic.url/user.jpg',
          followers_count: 50000,
          media_count: 120,
        },
      };

      const req = new Request('http://localhost/api/instagram/lookup', {
        method: 'POST',
        body: JSON.stringify({ username: 'real_user' }),
      });
      const res = await POST_lookup(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isSimulated).toBe(false);
      expect(data.data.username).toBe('real_user');
      expect(data.data.name).toBe('Real User Name');
      expect(data.data.followers_count).toBe(50000);
    });

    it('should fall back to database active token if env credentials are not configured', async () => {
      mockDbState.data = [
        {
          access_token: 'db_token',
          instagram_user_id: 'db_account_id',
        },
      ];

      mockFetchResponse = {
        business_discovery: {
          id: '67890',
          name: 'DB Discover Name',
          profile_picture_url: 'https://pic.url/db_user.jpg',
          followers_count: 22000,
          media_count: 85,
        },
      };

      const req = new Request('http://localhost/api/instagram/lookup', {
        method: 'POST',
        body: JSON.stringify({ username: 'db_user' }),
      });
      const res = await POST_lookup(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isSimulated).toBe(false);
      expect(data.data.username).toBe('db_user');
      expect(data.data.name).toBe('DB Discover Name');
    });

    it('should return 400 if Meta Graph API returns an error', async () => {
      process.env.INSTAGRAM_MASTER_ACCESS_TOKEN = 'env_token';
      process.env.INSTAGRAM_MASTER_BUSINESS_ACCOUNT_ID = 'env_account_id';

      mockFetchResponse = {
        error: {
          message: 'Unsupported get request',
        },
      };

      const req = new Request('http://localhost/api/instagram/lookup', {
        method: 'POST',
        body: JSON.stringify({ username: 'real_user' }),
      });
      const res = await POST_lookup(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Unsupported get request');
    });

    it('should return 400 if business discovery data is missing', async () => {
      process.env.INSTAGRAM_MASTER_ACCESS_TOKEN = 'env_token';
      process.env.INSTAGRAM_MASTER_BUSINESS_ACCOUNT_ID = 'env_account_id';

      mockFetchResponse = {
        // no business_discovery key
      };

      const req = new Request('http://localhost/api/instagram/lookup', {
        method: 'POST',
        body: JSON.stringify({ username: 'real_user' }),
      });
      const res = await POST_lookup(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Could not discover business data');
    });
  });

  describe('GET /api/instagram/media', () => {
    it('should return 400 if accountId is missing', async () => {
      const req = new Request('http://localhost/api/instagram/media');
      const res = await GET_media(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('accountId parameter is required');
    });

    it('should return 404 if account is not found in database', async () => {
      mockDbState.data = null;
      const req = new Request('http://localhost/api/instagram/media?accountId=non-existent');
      const res = await GET_media(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('Account not found in database.');
    });

    it('should return 400 if account token status is not active', async () => {
      mockDbState.data = {
        access_token: 'expired_token',
        token_status: 'token_invalid',
        instagram_user_id: 'user_123',
      };
      const req = new Request('http://localhost/api/instagram/media?accountId=acc_123');
      const res = await GET_media(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Access token is invalid or expired.');
    });

    it('should return 400 if Meta API fetch fails', async () => {
      mockDbState.data = {
        access_token: 'valid_token',
        token_status: 'active',
        instagram_user_id: 'user_123',
      };
      mockFetchResponse = {
        error: {
          message: 'Error validating access token',
        },
      };
      const req = new Request('http://localhost/api/instagram/media?accountId=acc_123');
      const res = await GET_media(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Error validating access token');
    });

    it('should return 200 with mapped posts on success', async () => {
      mockDbState.data = {
        access_token: 'valid_token',
        token_status: 'active',
        instagram_user_id: 'user_123',
      };
      mockFetchResponse = {
        data: [
          {
            id: 'post_1',
            caption: 'First post #fun',
            media_product_type: 'FEED',
            media_type: 'IMAGE',
            media_url: 'https://media.url/1.jpg',
            permalink: 'https://instagram.com/p/1',
            comments_count: 10,
            like_count: 100,
            timestamp: '2026-06-20T10:00:00Z',
          },
          {
            id: 'reel_2',
            caption: 'Cool Reel',
            media_product_type: 'REELS',
            media_type: 'VIDEO',
            media_url: 'https://media.url/2.mp4',
            permalink: 'https://instagram.com/p/2',
            thumbnail_url: 'https://media.url/2_thumb.jpg',
            comments_count: 5,
            like_count: 50,
            timestamp: '2026-06-21T11:00:00Z',
          },
        ],
      };
      const req = new Request('http://localhost/api/instagram/media?accountId=acc_123');
      const res = await GET_media(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.posts).toHaveLength(2);
      expect(data.posts[0].id).toBe('post_1');
      expect(data.posts[0].type).toBe('post');
      expect(data.posts[1].id).toBe('reel_2');
      expect(data.posts[1].type).toBe('reel');
      expect(data.posts[1].thumbnail).toBe('https://media.url/2_thumb.jpg');
    });

    it('should return 200 with both mapped posts and stories', async () => {
      mockDbState.data = {
        access_token: 'valid_token',
        token_status: 'active',
        instagram_user_id: 'user_123',
      };
      mockFetchResponse = {
        posts: [
          {
            id: 'post_1',
            caption: 'First post #fun',
            media_product_type: 'FEED',
            media_type: 'IMAGE',
            media_url: 'https://media.url/1.jpg',
            permalink: 'https://instagram.com/p/1',
            comments_count: 10,
            like_count: 100,
            timestamp: '2026-06-20T10:00:00Z',
          }
        ],
        stories: {
          data: [
            {
              id: 'story_9',
              caption: 'My Active Story',
              media_type: 'IMAGE',
              media_url: 'https://media.url/story9.jpg',
              permalink: 'https://instagram.com/stories/9',
              timestamp: '2026-06-22T12:00:00Z'
            }
          ]
        }
      };
      const req = new Request('http://localhost/api/instagram/media?accountId=acc_123');
      const res = await GET_media(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.posts).toHaveLength(2);
      expect(data.posts[0].id).toBe('post_1');
      expect(data.posts[0].type).toBe('post');
      expect(data.posts[1].id).toBe('story_9');
      expect(data.posts[1].type).toBe('story');
    });
  });

  describe('GET /api/instagram/comments', () => {
    it('should return 400 if mediaId or accountId is missing', async () => {
      const req = new Request('http://localhost/api/instagram/comments');
      const res = await GET_comments(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('mediaId and accountId parameters are required');
    });

    it('should return 404 if account not found in DB', async () => {
      mockDbState.data = null;
      const req = new Request('http://localhost/api/instagram/comments?mediaId=m_123&accountId=acc_non');
      const res = await GET_comments(req);
      expect(res.status).toBe(404);
    });

    it('should return 200 with empty array if Meta Graph API returns an error', async () => {
      mockDbState.data = {
        access_token: 'valid_token',
        token_status: 'active',
      };
      mockFetchResponse = {
        error: {
          message: 'Comments disabled',
        },
      };
      const req = new Request('http://localhost/api/instagram/comments?mediaId=m_123&accountId=acc_123');
      const res = await GET_comments(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.comments).toEqual([]);
    });

    it('should return 200 with mapped comments on success', async () => {
      mockDbState.data = {
        access_token: 'valid_token',
        token_status: 'active',
      };
      mockFetchResponse = {
        data: [
          {
            id: 'c_1',
            username: 'alice',
            text: 'I want this!',
            timestamp: '2026-06-22T08:00:00Z',
          },
          {
            id: 'c_2',
            username: 'bob',
            text: 'Interested',
            timestamp: '2026-06-22T08:05:00Z',
          },
        ],
      };
      const req = new Request('http://localhost/api/instagram/comments?mediaId=m_123&accountId=acc_123');
      const res = await GET_comments(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.comments).toHaveLength(2);
      expect(data.comments[0].id).toBe('c_1');
      expect(data.comments[0].username).toBe('alice');
      expect(data.comments[0].text).toBe('I want this!');
    });
  });

  describe('POST /api/auth/instagram/callback', () => {
    it('should return 400 if authorization code is missing', async () => {
      const req = new Request('http://localhost/api/auth/instagram/callback', {
        method: 'POST',
        body: JSON.stringify({ redirectUri: 'http://redirect' }),
      });
      const res = await POST_callback(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Code parameter is required');
    });

    it('should return 500 if Instagram client credentials are not configured', async () => {
      delete process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
      const req = new Request('http://localhost/api/auth/instagram/callback', {
        method: 'POST',
        body: JSON.stringify({ code: 'auth_code', redirectUri: 'http://redirect' }),
      });
      const res = await POST_callback(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain('Instagram App ID or App Secret is not configured');
    });

    it('should return 400 if short-lived access token exchange fails', async () => {
      process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID = 'id_123';
      process.env.INSTAGRAM_CLIENT_SECRET = 'secret_123';

      mockFetchResponse = {
        error: {
          message: 'The authorization code is invalid.',
        },
      };

      const req = new Request('http://localhost/api/auth/instagram/callback', {
        method: 'POST',
        body: JSON.stringify({ code: 'bad_code', redirectUri: 'http://redirect' }),
      });
      const res = await POST_callback(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Short-lived exchange error');
    });

    it('should exchange short-lived, exchange long-lived, fetch profile, and return details on success', async () => {
      process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID = 'id_123';
      process.env.INSTAGRAM_CLIENT_SECRET = 'secret_123';

      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            status: 200,
            ok: true,
            json: () => Promise.resolve({ access_token: 'short_token', user_id: 'user_123' }),
          } as Response);
        } else if (callCount === 2) {
          return Promise.resolve({
            status: 200,
            ok: true,
            json: () => Promise.resolve({ access_token: 'long_token', expires_in: 5184000 }),
          } as Response);
        }
        return Promise.resolve({
          status: 200,
          ok: true,
          json: () => Promise.resolve({
            id: 'user_123',
            username: 'test_username',
            name: 'Test Business User',
            profile_picture_url: 'https://pic.url/user_pic.jpg',
            followers_count: 3500,
            media_count: 42,
          }),
        } as Response);
      });

      const req = new Request('http://localhost/api/auth/instagram/callback', {
        method: 'POST',
        body: JSON.stringify({ code: 'valid_code', redirectUri: 'http://redirect' }),
      });
      const res = await POST_callback(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.instagramUserId).toBe('user_123');
      expect(data.username).toBe('test_username');
      expect(data.fullName).toBe('Test Business User');
      expect(data.profilePic).toBe('https://pic.url/user_pic.jpg');
      expect(data.followersCount).toBe(3500);
      expect(data.mediaCount).toBe(42);
      expect(data.accessToken).toBe('long_token');
    });
  });
});
