import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code, redirectUri } = await req.json();
    console.log(">>> [Instagram OAuth Callback] Input parameters:", { 
      code: code ? code.substring(0, 10) + "..." : null, 
      redirectUri 
    });

    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

    console.log(">>> [Instagram OAuth Callback] Config:", { clientId, hasSecret: !!clientSecret });

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

    console.log(">>> [Instagram OAuth Callback] Sending short-lived token request to:", tokenUrl);
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    const tokenData = await tokenRes.json();
    console.log(">>> [Instagram OAuth Callback] Short-lived token response:", {
      ...tokenData,
      access_token: tokenData.access_token ? tokenData.access_token.substring(0, 15) + "..." : null
    });

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
    console.log(">>> [Instagram OAuth Callback] Exchanging short-lived for long-lived at:", longLivedUrl.split('&access_token=')[0] + '&access_token=...');
    
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();
    console.log(">>> [Instagram OAuth Callback] Long-lived token response:", {
      ...longLivedData,
      access_token: longLivedData.access_token ? longLivedData.access_token.substring(0, 15) + "..." : null
    });

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
    // fields: id, username, name, profile_picture_url, followers_count, media_count, user_id
    const profileUrl = `https://graph.instagram.com/me?fields=id,username,name,profile_picture_url,followers_count,media_count,user_id&access_token=${longLivedToken}`;
    console.log(">>> [Instagram OAuth Callback] Fetching profile info from:", profileUrl.split('&access_token=')[0] + '&access_token=...');
    
    const profileRes = await fetch(profileUrl);
    const profileData = await profileRes.json();
    console.log(">>> [Instagram OAuth Callback] Profile response:", profileData);

    if (profileData.error) {
      console.error("Instagram profile fetch failed:", profileData);
      return NextResponse.json({ 
        error: `Profile fetch error: ${profileData.error.message || JSON.stringify(profileData)}` 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      instagramUserId: profileData.user_id || profileData.id,
      username: profileData.username,
      fullName: profileData.name || profileData.username,
      profilePic: profileData.profile_picture_url || null,
      followersCount: profileData.followers_count || 0,
      mediaCount: profileData.media_count || 0,
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
