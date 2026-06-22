import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const { accountId, commentId, text, accessToken: payloadAccessToken, igId: payloadIgId } = await req.json();

    if (!commentId || !text) {
      return NextResponse.json({ error: 'commentId and text parameters are required' }, { status: 400 });
    }

    let igId = payloadIgId || null;
    let accessToken = payloadAccessToken || null;

    if (accountId) {
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

      igId = account.instagram_user_id;
      accessToken = account.access_token;
    }

    if (!igId || !accessToken) {
      return NextResponse.json({ error: 'Valid credentials (accountId or direct igId & accessToken) are required' }, { status: 400 });
    }

    // Call Meta Graph API server-side to bypass CORS
    const response = await fetch(`https://graph.instagram.com/v20.0/${igId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        recipient: {
          comment_id: commentId
        },
        message: {
          text: text
        }
      })
    });

    const resData = await response.json();
    if (!response.ok || resData.error) {
      console.error("Meta API private reply failed server-side:", resData.error);
      return NextResponse.json({
        error: resData.error?.message || `HTTP ${response.status}: ${JSON.stringify(resData)}`
      }, { status: response.status || 400 });
    }

    return NextResponse.json({
      success: true,
      data: resData
    });

  } catch (e: any) {
    console.error("Send DM API exception:", e);
    return NextResponse.json({ error: e.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
