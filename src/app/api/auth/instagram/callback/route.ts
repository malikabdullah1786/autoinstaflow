import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code, redirectUri } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'Instagram App ID or App Secret is not configured in the server environment (.env).' 
      }, { status: 500 });
    }

    // 1. Exchange authorization code for short-lived User access token from Instagram API
    const tokenUrl = 'https://api.instagram.com/oauth/access_token';
    const formData = new URLSearchParams();
    formData.append('client_id', clientId);
    formData.append('client_secret', clientSecret);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);
    formData.append('code', code);

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("Instagram short-lived token exchange failed:", tokenData);
      return NextResponse.json({ 
        error: `Short-lived exchange error: ${tokenData.error_message || tokenData.error?.message || JSON.stringify(tokenData)}` 
      }, { status: 400 });
    }

    const shortLivedToken = tokenData.access_token;
    const userId = tokenData.user_id;

    // 2. Exchange short-lived token for long-lived User access token (60-day expiry)
    const longLivedUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`;
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();

    if (longLivedData.error || !longLivedData.access_token) {
      console.error("Instagram long-lived token exchange failed:", longLivedData);
      return NextResponse.json({ 
        error: `Long-lived exchange error: ${longLivedData.error?.message || JSON.stringify(longLivedData)}` 
      }, { status: 400 });
    }

    const longLivedToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in || 5184000; // default 60 days
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 3. Fetch Instagram profile info using the long-lived token
    const profileUrl = `https://graph.instagram.com/me?fields=id,username,name,profile_picture_url&access_token=${longLivedToken}`;
    const profileRes = await fetch(profileUrl);
    const profileData = await profileRes.json();

    if (profileData.error) {
      console.error("Instagram profile fetch failed:", profileData);
      return NextResponse.json({ 
        error: `Profile fetch error: ${profileData.error.message || JSON.stringify(profileData)}` 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      instagramUserId: profileData.id,
      username: profileData.username,
      fullName: profileData.name || profileData.username,
      profilePic: profileData.profile_picture_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      accessToken: longLivedToken,
      tokenExpiresAt
    });

  } catch (e: any) {
    console.error("Catch block auth callback error:", e);
    return NextResponse.json({ 
      error: `Auth callback catch error: ${e.message || 'An unexpected error occurred during auth'}` 
    }, { status: 500 });
  }
}
