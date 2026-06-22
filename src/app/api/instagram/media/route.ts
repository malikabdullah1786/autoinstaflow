import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId parameter is required' }, { status: 400 });
    }

    // 1. Get access token from Supabase
    const { data: account, error: dbError } = await supabase
      .from('instagram_accounts')
      .select('access_token, token_status')
      .eq('id', accountId)
      .single();

    if (dbError || !account) {
      return NextResponse.json({ error: 'Account not found in database.' }, { status: 404 });
    }

    if (account.token_status !== 'active') {
      return NextResponse.json({ error: 'Access token is invalid or expired.' }, { status: 400 });
    }

    // 2. Fetch media from Instagram Graph API
    // fields: id, caption, media_type, media_url, permalink, thumbnail_url, timestamp
    const mediaUrl = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,comments_count,like_count&limit=20&access_token=${account.access_token}`;
    
    const mediaRes = await fetch(mediaUrl);
    const mediaData = await mediaRes.json();

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
      type: item.media_type?.toLowerCase() === 'video' ? 'reel' : 'post',
      mediaUrl: item.media_url || '',
      permalink: item.permalink || '',
      thumbnailUrl: item.thumbnail_url || item.media_url || '',
      thumbnail: item.thumbnail_url || item.media_url || '',
      commentsCount: item.comments_count || 0,
      likeCount: item.like_count || 0,
      publishedAt: item.timestamp || new Date().toISOString(),
      commentsList: [] // Comments will be filled when simulated or fetched
    }));

    return NextResponse.json({
      success: true,
      posts
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
