import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get('mediaId');
    const accountId = searchParams.get('accountId');

    if (!mediaId || !accountId) {
      return NextResponse.json({ error: 'mediaId and accountId parameters are required' }, { status: 400 });
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

    // 2. Fetch comments from Instagram Media Graph API
    const commentsUrl = `https://graph.instagram.com/${mediaId}/comments?fields=id,text,username,from,timestamp&limit=50&access_token=${account.access_token}`;
    
    const commentsRes = await fetch(commentsUrl);
    const commentsData = await commentsRes.json();

    if (commentsData.error) {
      // If there are no comments, or API returns error (e.g. comments disabled), return empty list gracefully
      console.warn("Meta comments fetch failed or returned empty:", commentsData.error);
      return NextResponse.json({
        success: true,
        comments: []
      });
    }

    const comments = (commentsData.data || []).map((c: any) => ({
      id: c.id,
      username: c.from?.username || c.username || 'anonymous',
      text: c.text || '',
      timestamp: c.timestamp || new Date().toISOString()
    }));

    return NextResponse.json({
      success: true,
      comments
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
