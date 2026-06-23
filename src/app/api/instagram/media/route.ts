import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simple in-memory cache: accountId -> { posts: any[], expiry: number }
const mediaCache = new Map<string, { posts: any[], expiry: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache TTL

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId parameter is required' }, { status: 400 });
    }

    // 1. Get access token and user ID from Supabase
    const { data: account, error: dbError } = await supabase
      .from('instagram_accounts')
      .select('access_token, token_status, instagram_user_id')
      .eq('id', accountId)
      .single();

    if (dbError || !account) {
      return NextResponse.json({ error: 'Account not found in database.' }, { status: 404 });
    }

    if (account.token_status !== 'active') {
      return NextResponse.json({ error: 'Access token is invalid or expired.' }, { status: 400 });
    }

    // A. Bypass network calls for Sandbox/Mock accounts instantly
    if (
      account.access_token.startsWith('access_tok_') ||
      account.access_token.startsWith('mock_') ||
      account.instagram_user_id.startsWith('ig_usr_')
    ) {
      const mockPosts = [
        {
          id: "mock_post_1",
          caption: "🚀 Our biggest product update is finally here! Comment 'UPDATE' to get early access instantly! 🤫👇",
          type: "post",
          mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
          permalink: "https://instagram.com",
          thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
          thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
          commentsCount: 142,
          likeCount: 1250,
          publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
          commentsList: []
        },
        {
          id: "mock_post_2",
          caption: "Want to know how we scaled to 10k users in 30 days? Comment 'SCALE' and I will send you the exact playbook! 📈🔥",
          type: "reel",
          mediaUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800",
          permalink: "https://instagram.com",
          thumbnailUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400",
          thumbnail: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400",
          commentsCount: 89,
          likeCount: 940,
          publishedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
          commentsList: []
        },
        {
          id: "mock_post_3",
          caption: "Free Masterclass: How to automate your Instagram DMs like a pro. Comment 'AUTOMATE' for your invite! 🎓✨",
          type: "post",
          mediaUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
          permalink: "https://instagram.com",
          thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
          thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
          commentsCount: 67,
          likeCount: 520,
          publishedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
          commentsList: []
        }
      ];
      return NextResponse.json({
        success: true,
        posts: mockPosts
      });
    }

    // B. Check in-memory cache for Real accounts
    const cached = mediaCache.get(accountId);
    if (cached && cached.expiry > Date.now()) {
      return NextResponse.json({
        success: true,
        posts: cached.posts
      });
    }

    // 2. Fetch media & stories from Instagram Graph API on graph.instagram.com
    const mediaUrl = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,comments_count,like_count&limit=20&access_token=${account.access_token}`;
    const storiesUrl = `https://graph.instagram.com/me/stories?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${account.access_token}`;

    const [mediaRes, storiesRes] = await Promise.all([
      fetch(mediaUrl),
      fetch(storiesUrl).catch(err => {
        console.error("Failed to fetch stories:", err);
        return null;
      })
    ]);

    const mediaData = await mediaRes.json();
    let storiesData = { data: [] };

    if (storiesRes) {
      try {
        const parsed = await storiesRes.json();
        if (parsed && !parsed.error) {
          storiesData = parsed;
        } else if (parsed && parsed.error) {
          console.warn("Meta stories fetch returned API error:", parsed.error);
        }
      } catch (e) {
        console.error("Failed to parse stories response:", e);
      }
    }

    if (mediaData.error) {
      console.error("Meta media fetch failed:", mediaData.error);
      return NextResponse.json({
        error: mediaData.error.message || 'Failed to fetch media from Meta.'
      }, { status: 400 });
    }

    // Map to a consistent schema
    const posts = (mediaData.data || []).map((item: any) => ({
      id: item.id,
      caption: item.caption || '',
      type: (item.media_product_type?.toLowerCase() === 'reels' || item.media_type?.toLowerCase() === 'video') ? 'reel' : 'post',
      mediaUrl: item.media_url || '',
      permalink: item.permalink || '',
      thumbnailUrl: item.thumbnail_url || item.media_url || '',
      thumbnail: item.thumbnail_url || item.media_url || '',
      commentsCount: item.comments_count || 0,
      likeCount: item.like_count || 0,
      publishedAt: item.timestamp || new Date().toISOString(),
      commentsList: [] // Comments will be filled when simulated or fetched
    }));

    const stories = (storiesData.data || []).map((item: any) => {
      const pubDate = item.timestamp ? new Date(item.timestamp) : new Date();
      const formattedTime = pubDate.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      return {
        id: item.id,
        caption: item.caption || `Story published at ${formattedTime}`,
        type: 'story',
        mediaUrl: item.media_url || '',
        permalink: item.permalink || '',
        thumbnailUrl: item.thumbnail_url || item.media_url || '',
        thumbnail: item.thumbnail_url || item.media_url || '',
        commentsCount: 0,
        likeCount: 0,
        publishedAt: item.timestamp || new Date().toISOString(),
        commentsList: []
      };
    });

    const mappedPosts = [...posts, ...stories];
    mediaCache.set(accountId, {
      posts: mappedPosts,
      expiry: Date.now() + CACHE_TTL_MS
    });

    return NextResponse.json({
      success: true,
      posts: mappedPosts
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
