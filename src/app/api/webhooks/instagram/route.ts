import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkKeywordMatch } from '../../../../lib/db';
import crypto from 'crypto';

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verify Meta Webhook Signature
function verifySignature(signatureHeader: string | null, rawBody: string, appSecret: string): boolean {
  if (!signatureHeader) return false;
  const elements = signatureHeader.split('=');
  if (elements.length !== 2) return false;
  const signatureHash = elements[1];
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');
  return signatureHash === expectedHash;
}

// Helper to check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

// GET: Handles the Meta Webhook setup challenge and verification request
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'autoinstaflow_secret';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verification successful.');
      return new Response(challenge, { status: 200 });
    }
    
    console.warn('Webhook verification failed: token mismatch.');
    return new Response('Forbidden', { status: 403 });
  } catch (e: any) {
    console.error('Webhook GET verification exception:', e);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// POST: Receives incoming event payloads (comments, DMs) from Meta
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');
    const appSecret = process.env.INSTAGRAM_CLIENT_SECRET;

    // Verify signature if Client Secret is configured
    if (appSecret) {
      const isSignatureValid = verifySignature(signature, rawBody, appSecret);
      if (!isSignatureValid) {
        console.warn('Webhook POST signature verification failed.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    const body = JSON.parse(rawBody);

    if (body.object !== 'instagram') {
      return NextResponse.json({ error: 'Not an Instagram webhook event' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    for (const entry of body.entry) {
      const instagramAccountId = entry.id; // Instagram Account ID of the page

      // 1. Handle Comments Webhook (entry.changes)
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            const { id: commentId, text: commentText, from, media } = change.value;
            if (!from || !from.username || !from.id) continue;

            const senderUsername = from.username;
            const senderIgId = from.id;
            const postId = media?.id;

            console.log(`Received comment webhook: "${commentText}" from @${senderUsername} on post ${postId}`);

            // Fetch the Instagram account details from Supabase
            const { data: account, error: accError } = await supabase
              .from('instagram_accounts')
              .select('*')
              .eq('instagram_user_id', instagramAccountId)
              .single();

            if (accError || !account) {
              console.error(`Instagram account ${instagramAccountId} not found in database:`, accError);
              continue;
            }

            // Fetch live comment automations for this account
            const { data: automations, error: autError } = await supabase
              .from('automations')
              .select('*')
              .eq('instagram_account_id', account.id)
              .eq('status', 'live')
              .eq('trigger_type', 'comment');

            if (autError || !automations) {
              console.error('Error fetching automations:', autError);
              continue;
            }

            // Find matching automation
            const matchedAut = automations.find(aut => {
              const postMatches = !aut.trigger_config?.post_id || aut.trigger_config.post_id === postId;
              const keywordsMatch = checkKeywordMatch(commentText, aut.trigger_config?.keywords);
              return postMatches && keywordsMatch;
            });

            if (!matchedAut) {
              console.log('No matching automation found for comment:', commentText);
              continue;
            }

            const igUserId = `ig_user_${senderUsername.toLowerCase()}`;

            // Check 24-hour deduplication (Property 9)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: recentSent } = await supabase
              .from('automation_events')
              .select('id')
              .eq('automation_id', matchedAut.id)
              .eq('instagram_user_id', igUserId)
              .eq('event_type', 'dm_sent')
              .gt('occurred_at', oneDayAgo)
              .limit(1)
              .maybeSingle();

            if (recentSent) {
              console.log(`Deduplicated: @${senderUsername} already sent a DM from this automation in the last 24h.`);
              await supabase.from('automation_events').insert({
                automation_id: matchedAut.id,
                workspace_id: account.workspace_id,
                event_type: 'dm_blocked_dedup',
                instagram_user_id: igUserId,
                instagram_username: senderUsername,
                metadata: { text: commentText, reason: '24h throttle' },
                occurred_at: new Date().toISOString()
              });
              continue;
            }

            // Fetch workspace to check quota (Property 14)
            const { data: workspace } = await supabase
              .from('workspaces')
              .select('*')
              .eq('id', account.workspace_id)
              .single();

            if (!workspace) continue;

            const planRemaining = Math.max(0, workspace.dm_quota_monthly - workspace.dm_sent_current_period);
            const addonRemaining = Math.max(0, workspace.dm_addon_credits);
            const totalRemaining = planRemaining + addonRemaining;

            if (totalRemaining <= 0) {
              console.warn(`Quota exhausted for workspace ${account.workspace_id}`);
              await supabase.from('automation_events').insert({
                automation_id: matchedAut.id,
                workspace_id: account.workspace_id,
                event_type: 'dm_blocked_quota',
                instagram_user_id: igUserId,
                instagram_username: senderUsername,
                metadata: { text: commentText },
                occurred_at: new Date().toISOString()
              });
              continue;
            }

            // Fetch contact from DB
            const { data: dbContact } = await supabase
              .from('contacts')
              .select('*')
              .eq('workspace_id', account.workspace_id)
              .eq('instagram_user_id', igUserId)
              .maybeSingle();

            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
            const extractedEmail = commentText.match(emailRegex)?.[0];
            const hasSavedEmail = dbContact?.email && dbContact.email.includes('@');

            let finalMessage = matchedAut.action_config?.message || '';
            let finalUrl = matchedAut.action_config?.url || '';
            let isEmailPrompt = false;
            let isEmailCollected = false;

            if (matchedAut.action_type === 'email_gate') {
              if (extractedEmail || hasSavedEmail) {
                isEmailCollected = true;
              } else {
                finalMessage = `Thanks for commenting! Please reply to this DM with your email address to receive your link:`;
                finalUrl = '';
                isEmailPrompt = true;
              }
            }

            if (!isEmailPrompt && finalUrl) {
              finalMessage = `${finalMessage} ${finalUrl}`.trim();
            }

            // Send private reply via Meta Graph API
            const response = await fetch(`https://graph.instagram.com/v20.0/${instagramAccountId}/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${account.access_token}`
              },
              body: JSON.stringify({
                recipient: {
                  comment_id: commentId
                },
                message: {
                  text: finalMessage
                }
              })
            });

            const resData = await response.json();

            if (!response.ok || resData.error) {
              console.error('Meta API private reply failed:', resData.error);
              await supabase.from('automation_events').insert({
                automation_id: matchedAut.id,
                workspace_id: account.workspace_id,
                event_type: 'dm_failed',
                instagram_user_id: igUserId,
                instagram_username: senderUsername,
                metadata: { text: commentText, error: resData.error?.message || 'Meta API error' },
                occurred_at: new Date().toISOString()
              });
              continue;
            }

            // Quota Deduction
            let newDMSentCurrent = workspace.dm_sent_current_period;
            let newAddonCredits = workspace.dm_addon_credits;

            if (newDMSentCurrent < workspace.dm_quota_monthly) {
              newDMSentCurrent += 1;
            } else {
              newAddonCredits -= 1;
            }

            await supabase.from('workspaces').update({
              dm_sent_current_period: newDMSentCurrent,
              dm_addon_credits: newAddonCredits
            }).eq('id', workspace.id);

            // Update/Upsert Contact
            const contactEmail = extractedEmail || dbContact?.email || null;
            if (dbContact) {
              await supabase.from('contacts').update({
                last_seen_at: new Date().toISOString(),
                interaction_count: dbContact.interaction_count + 1,
                email: contactEmail
              }).eq('id', dbContact.id);
            } else {
              await supabase.from('contacts').insert({
                workspace_id: account.workspace_id,
                instagram_user_id: igUserId,
                instagram_username: senderUsername,
                email: contactEmail,
                first_seen_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
                interaction_count: 1
              });
            }

            // Update Automation dm_sent_count
            await supabase.from('automations').update({
              dm_sent_count: matchedAut.dm_sent_count + 1
            }).eq('id', matchedAut.id);

            // Log event
            if (isEmailCollected && extractedEmail) {
              await supabase.from('automation_events').insert({
                automation_id: matchedAut.id,
                workspace_id: account.workspace_id,
                event_type: 'email_collected',
                instagram_user_id: igUserId,
                instagram_username: senderUsername,
                metadata: { text: commentText, email: extractedEmail },
                occurred_at: new Date().toISOString()
              });
            }

            await supabase.from('automation_events').insert({
              automation_id: matchedAut.id,
              workspace_id: account.workspace_id,
              event_type: 'dm_sent',
              instagram_user_id: igUserId,
              instagram_username: senderUsername,
              metadata: {
                text: commentText,
                action: matchedAut.action_type,
                message: finalMessage,
                url: finalUrl
              },
              occurred_at: new Date().toISOString()
            });
          }
        }
      }

      // 2. Handle Messages/DMs Webhook (entry.messaging) - primarily for Email Collection replies
      if (entry.messaging) {
        for (const messageEvent of entry.messaging) {
          if (messageEvent.message && !messageEvent.message.is_echo) {
            const senderId = messageEvent.sender.id;
            const messageText = messageEvent.message.text || '';

            console.log(`Received DM webhook from sender ID ${senderId}: "${messageText}"`);

            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
            const extractedEmail = messageText.match(emailRegex)?.[0];

            if (!extractedEmail) {
              // Not an email submission, so ignore or trigger standard keyword DM automation
              continue;
            }

            // Fetch the Instagram account details from Supabase using entry.id
            const { data: account, error: accError } = await supabase
              .from('instagram_accounts')
              .select('*')
              .eq('instagram_user_id', instagramAccountId)
              .single();

            if (accError || !account) {
              console.error(`Instagram account ${instagramAccountId} not found in database:`, accError);
              continue;
            }

            // Fetch user profile from Meta Graph API to resolve their username
            let senderUsername = '';
            try {
              const profileRes = await fetch(`https://graph.instagram.com/v20.0/${senderId}?fields=username&access_token=${account.access_token}`);
              const profileData = await profileRes.json();
              if (profileData && profileData.username) {
                senderUsername = profileData.username;
              }
            } catch (profileErr) {
              console.error('Error fetching user profile from Meta Graph API:', profileErr);
            }

            if (!senderUsername) {
              console.warn(`Could not resolve username for sender ID ${senderId}. Skipping email capture.`);
              continue;
            }

            const igUserId = `ig_user_${senderUsername.toLowerCase()}`;

            // Fetch contact from DB
            const { data: dbContact } = await supabase
              .from('contacts')
              .select('*')
              .eq('workspace_id', account.workspace_id)
              .eq('instagram_user_id', igUserId)
              .maybeSingle();

            if (!dbContact) {
              console.log(`No existing contact found for @${senderUsername}. Skipping.`);
              continue;
            }

            // Fetch the active email gate automation for this account to release the gated link
            let matchedAut = null;

            // Try to find the most recent email-gate prompt sent to this user
            const { data: lastPromptEvent } = await supabase
              .from('automation_events')
              .select('automation_id')
              .eq('instagram_user_id', igUserId)
              .eq('event_type', 'dm_sent')
              .order('occurred_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lastPromptEvent && lastPromptEvent.automation_id) {
              const { data: aut } = await supabase
                .from('automations')
                .select('*')
                .eq('id', lastPromptEvent.automation_id)
                .eq('status', 'live')
                .maybeSingle();
              if (aut) {
                matchedAut = aut;
              }
            }

            // Fallback: if no recent event is found, fallback to the first active email gate automation
            if (!matchedAut) {
              const { data: automations } = await supabase
                .from('automations')
                .select('*')
                .eq('instagram_account_id', account.id)
                .eq('status', 'live')
                .eq('action_type', 'email_gate');

              if (automations && automations.length > 0) {
                matchedAut = automations[0];
              }
            }

            if (!matchedAut) {
              console.log('No matching email gate automation found for user:', igUserId);
              continue;
            }

            // Update contact email in database
            await supabase.from('contacts').update({
              email: extractedEmail,
              last_seen_at: new Date().toISOString(),
              interaction_count: dbContact.interaction_count + 1
            }).eq('id', dbContact.id);

            // Fetch workspace to check quota
            const { data: workspace } = await supabase
              .from('workspaces')
              .select('*')
              .eq('id', account.workspace_id)
              .single();

            if (!workspace) continue;

            const planRemaining = Math.max(0, workspace.dm_quota_monthly - workspace.dm_sent_current_period);
            const addonRemaining = Math.max(0, workspace.dm_addon_credits);
            const totalRemaining = planRemaining + addonRemaining;

            if (totalRemaining <= 0) {
              console.warn(`Quota exhausted for workspace ${account.workspace_id} on email release.`);
              continue;
            }

            const successMessage = `${matchedAut.action_config?.message || ''} ${matchedAut.action_config?.url || ''}`.trim();

            // Reply directly with the link
            const response = await fetch(`https://graph.instagram.com/v20.0/${instagramAccountId}/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${account.access_token}`
              },
              body: JSON.stringify({
                recipient: {
                  id: senderId
                },
                message: {
                  text: successMessage
                }
              })
            });

            const resData = await response.json();

            if (!response.ok || resData.error) {
              console.error('Meta API DM response failed:', resData.error);
              continue;
            }

            // Quota Deduction
            let newDMSentCurrent = workspace.dm_sent_current_period;
            let newAddonCredits = workspace.dm_addon_credits;

            if (newDMSentCurrent < workspace.dm_quota_monthly) {
              newDMSentCurrent += 1;
            } else {
              newAddonCredits -= 1;
            }

            await supabase.from('workspaces').update({
              dm_sent_current_period: newDMSentCurrent,
              dm_addon_credits: newAddonCredits
            }).eq('id', workspace.id);

            // Update Automation dm_sent_count
            await supabase.from('automations').update({
              dm_sent_count: matchedAut.dm_sent_count + 1
            }).eq('id', matchedAut.id);

            // Log events
            await supabase.from('automation_events').insert({
              automation_id: matchedAut.id,
              workspace_id: account.workspace_id,
              event_type: 'email_collected',
              instagram_user_id: igUserId,
              instagram_username: senderUsername,
              metadata: { text: messageText, email: extractedEmail },
              occurred_at: new Date().toISOString()
            });

            await supabase.from('automation_events').insert({
              automation_id: matchedAut.id,
              workspace_id: account.workspace_id,
              event_type: 'dm_sent',
              instagram_user_id: igUserId,
              instagram_username: senderUsername,
              metadata: {
                text: messageText,
                action: matchedAut.action_type,
                message: successMessage,
                url: matchedAut.action_config?.url || ''
              },
              occurred_at: new Date().toISOString()
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Webhook POST exception handler:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
