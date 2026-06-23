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
            const { data: accounts, error: accError } = await supabase
              .from('instagram_accounts')
              .select('*')
              .eq('instagram_user_id', instagramAccountId)
              .limit(1);

            const account = accounts?.[0];

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

            // Check 24-hour deduplication (Property 9) - Reduced to 10 seconds for testing
            const oneDayAgo = new Date(Date.now() - 10 * 1000).toISOString();
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

            // Global quota check for Free plans
            if (workspace.plan === 'free') {
              const globalQuotaExceeded = await checkGlobalQuotaExceeded(account.instagram_user_id);
              if (globalQuotaExceeded) {
                console.warn(`Global quota exhausted for Instagram account ${account.instagram_user_id}`);
                await supabase.from('automation_events').insert({
                  automation_id: matchedAut.id,
                  workspace_id: account.workspace_id,
                  event_type: 'dm_blocked_quota',
                  instagram_user_id: igUserId,
                  instagram_username: senderUsername,
                  metadata: { text: commentText, reason: 'global_account_limit_exhausted' },
                  occurred_at: new Date().toISOString()
                });
                continue;
              }
            }

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
            let isFollowPrompt = false;
            let quickReplies: any = undefined;

            if (matchedAut.action_type === 'email_gate') {
              if (extractedEmail || hasSavedEmail) {
                isEmailCollected = true;
              } else {
                finalMessage = `Please provide your email address to receive your link:`;
                finalUrl = '';
                isEmailPrompt = true;
              }
            } else if (matchedAut.action_type === 'follow_gate') {
              const isFollowing = await checkInstagramFollowStatus(senderIgId, account.access_token);
              if (!isFollowing) {
                finalMessage = `Nearly there! The link is especially for my followers ✨\n\nRight after you follow me, I'll send you the link so you can dive straight in! 🎉`;
                finalUrl = '';
                isFollowPrompt = true;
                quickReplies = [{ title: 'Following', payload: `check_follow_${matchedAut.id}` }];
              }
            }

            // Send public comment reply if configured
            const publicCommentReply = matchedAut.action_config?.comment_reply;
            if (publicCommentReply) {
              await sendInstagramCommentReply(commentId, publicCommentReply, account.access_token);
            }

            // Send private reply via Meta Graph API (notifying the user on the comment thread)
            const commentReplyText = isFollowPrompt
              ? (matchedAut.action_config?.message || `Nearly there! The link is especially for my followers ✨\n\nRight after you follow me, click the button below so I can verify and send you the link! 🎉`)
              : (isEmailPrompt ? `Please reply to this DM with your email address to receive your link! 📩` : finalMessage);

            let messageBody: any = {};
            if (isFollowPrompt) {
              messageBody = {
                text: commentReplyText,
                quick_replies: [
                  {
                    content_type: 'text',
                    title: 'Following',
                    payload: `check_follow_${matchedAut.id}`
                  }
                ]
              };
            } else if (isEmailPrompt) {
              messageBody = {
                text: commentReplyText
              };
            } else {
              const actionLinks = matchedAut.action_config?.links || (matchedAut.action_config?.url ? [{ url: matchedAut.action_config.url, label: matchedAut.name || 'Download Now' }] : []);
              if (actionLinks.length > 0) {
                const linksText = actionLinks.map((l: any) => `${l.label || 'Link'}: ${l.url}`).join('\n');
                messageBody = {
                  text: `${commentReplyText}\n\n${linksText}`.trim()
                };
              } else {
                messageBody = {
                  text: commentReplyText
                };
              }
            }

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
                message: messageBody
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

            // Quota Deduction (only if not gated, as gates deduct quota when delivering the final link in messaging webhook)
            if (!isFollowPrompt && !isEmailPrompt) {
              await deductWorkspaceQuota(workspace, account.instagram_user_id);
            }

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

            const matchedKeyword = (matchedAut.trigger_config?.keywords || []).find((keyword: string) => {
              const kw = keyword.toLowerCase().trim();
              return kw && commentText.toLowerCase().includes(kw);
            }) || 'default';

            await supabase.from('automation_events').insert({
              automation_id: matchedAut.id,
              workspace_id: account.workspace_id,
              event_type: 'dm_sent',
              instagram_user_id: igUserId,
              instagram_username: senderUsername,
              metadata: {
                text: commentText,
                action: matchedAut.action_type,
                message: (isEmailPrompt || isFollowPrompt) ? commentReplyText : finalMessage,
                url: finalUrl,
                keyword: matchedKeyword
              },
              occurred_at: new Date().toISOString()
            });
          }
        }
      }

      // 2. Handle Messages/DMs Webhook (entry.messaging) - primarily for Email/Follow Gate replies
      if (entry.messaging) {
        for (const messageEvent of entry.messaging) {
          if (messageEvent.message && !messageEvent.message.is_echo) {
            const senderId = messageEvent.sender.id;
            const messageText = messageEvent.message.text || '';
            const quickReplyPayload = messageEvent.message.quick_reply?.payload;

            console.log(`Received DM webhook from sender ID ${senderId}: "${messageText}" (payload: ${quickReplyPayload})`);

            // Fetch the Instagram account details from Supabase using entry.id
            const { data: accounts, error: accError } = await supabase
              .from('instagram_accounts')
              .select('*')
              .eq('instagram_user_id', instagramAccountId)
              .limit(1);

            const account = accounts?.[0];

            if (accError || !account) {
              console.error(`Instagram account ${instagramAccountId} not found in database:`, accError);
              continue;
            }

            // Fetch user profile from Meta Graph API to resolve their username and follow status
            let senderUsername = '';
            let isUserFollowBusiness = false;
            try {
              const profileRes = await fetch(`https://graph.instagram.com/v20.0/${senderId}?fields=username,is_user_follow_business&access_token=${account.access_token}`);
              const profileData = await profileRes.json();
              if (profileRes.ok && profileData) {
                if (profileData.username) {
                  senderUsername = profileData.username;
                }
                if (profileData.is_user_follow_business !== undefined) {
                  isUserFollowBusiness = profileData.is_user_follow_business;
                }
              } else if (profileData && profileData.error) {
                if (profileData.error.code === 230) {
                  console.log(`[Webhook Messaging] User consent required for sender ID ${senderId} to access profile. This is expected behavior from Meta API.`);
                } else {
                  console.warn(`[Webhook Messaging] Meta profile API returned error:`, profileData.error);
                }
              }
            } catch (profileErr) {
              console.error('Error fetching user profile from Meta Graph API:', profileErr);
            }

            if (!senderUsername) {
              console.warn(`Could not resolve username for sender ID ${senderId}. Skipping DM handling.`);
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

            // 1. Check if this message triggers a NEW direct message or story reply automation
            let matchedAut = null;
            let isNewTrigger = false;

            // Story triggers have reply_to.story or telltale mention text
            const isStory = !!(messageEvent.message.reply_to?.story || messageText.toLowerCase().includes("mentioned you in their story") || messageText.toLowerCase().includes("reacted to your story"));
            const targetTriggerType = isStory ? 'story_reply' : 'dm';

            // Only check keyword triggers if NOT a quick reply payload
            if (!quickReplyPayload) {
              const { data: directAutomations } = await supabase
                .from('automations')
                .select('*')
                .eq('instagram_account_id', account.id)
                .eq('status', 'live')
                .eq('trigger_type', targetTriggerType);

              if (directAutomations && directAutomations.length > 0) {
                matchedAut = directAutomations.find(aut => {
                  const keywordsMatch = checkKeywordMatch(messageText, aut.trigger_config?.keywords);
                  const storyMatches = !aut.trigger_config?.post_id || aut.trigger_config.post_id === messageEvent.message.reply_to?.story?.id;
                  return keywordsMatch && storyMatches;
                });
                if (matchedAut) {
                  isNewTrigger = true;
                }
              }
            }

            if (isNewTrigger && matchedAut) {
              // Perform deduplication
              const oneDayAgo = new Date(Date.now() - 10 * 1000).toISOString(); // 10s throttle for safety/testing
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
                console.log(`Deduplicated direct trigger: @${senderUsername} already sent a DM from this automation in the last 24h.`);
                await supabase.from('automation_events').insert({
                  automation_id: matchedAut.id,
                  workspace_id: account.workspace_id,
                  event_type: 'dm_blocked_dedup',
                  instagram_user_id: igUserId,
                  instagram_username: senderUsername,
                  metadata: { text: messageText, reason: '24h throttle' },
                  occurred_at: new Date().toISOString()
                });
                continue;
              }

              // Fetch workspace to check quota
              const { data: workspace } = await supabase
                .from('workspaces')
                .select('*')
                .eq('id', account.workspace_id)
                .single();

              if (!workspace) continue;

              // Global quota check for Free plans
              if (workspace.plan === 'free') {
                const globalQuotaExceeded = await checkGlobalQuotaExceeded(account.instagram_user_id);
                if (globalQuotaExceeded) {
                  console.warn(`Global quota exhausted for Instagram account ${account.instagram_user_id}`);
                  await supabase.from('automation_events').insert({
                    automation_id: matchedAut.id,
                    workspace_id: account.workspace_id,
                    event_type: 'dm_blocked_quota',
                    instagram_user_id: igUserId,
                    instagram_username: senderUsername,
                    metadata: { text: messageText, reason: 'global_account_limit_exhausted' },
                    occurred_at: new Date().toISOString()
                  });
                  continue;
                }
              }

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
                  metadata: { text: messageText },
                  occurred_at: new Date().toISOString()
                });
                continue;
              }

              // Evaluate gates
              let finalMessage = matchedAut.action_config?.message || '';
              let finalUrl = matchedAut.action_config?.url || '';
              let isEmailPrompt = false;
              let isEmailCollected = false;
              let isFollowPrompt = false;
              let quickReplies: any = undefined;

              const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
              const extractedEmail = messageText.match(emailRegex)?.[0];
              const hasSavedEmail = dbContact?.email && dbContact.email.includes('@');

              if (matchedAut.action_type === 'email_gate') {
                if (extractedEmail || hasSavedEmail) {
                  isEmailCollected = true;
                } else {
                  finalMessage = `Please provide your email address to receive your link:`;
                  finalUrl = '';
                  isEmailPrompt = true;
                }
              } else if (matchedAut.action_type === 'follow_gate') {
                const isFollowing = isUserFollowBusiness || await checkInstagramFollowStatus(senderId, account.access_token);
                if (!isFollowing) {
                  finalMessage = `Nearly there! The link is especially for my followers ✨\n\nRight after you follow me, I'll send you the link so you can dive straight in! 🎉`;
                  finalUrl = '';
                  isFollowPrompt = true;
                  quickReplies = [{ title: 'Following', payload: `check_follow_${matchedAut.id}` }];
                }
              }

              // Send response
              if (isFollowPrompt) {
                await sendInstagramDMWithQuickReplies(
                  instagramAccountId,
                  senderId,
                  finalMessage,
                  quickReplies,
                  account.access_token
                );
              } else if (isEmailPrompt) {
                await sendInstagramDM(
                  instagramAccountId,
                  senderId,
                  finalMessage,
                  account.access_token
                );
              } else {
                const actionLinks = matchedAut.action_config?.links || (matchedAut.action_config?.url ? [{ url: matchedAut.action_config.url, label: matchedAut.name || 'Download Now' }] : []);
                if (actionLinks.length > 0) {
                  await sendInstagramLinkButtons(
                    instagramAccountId,
                    senderId,
                    finalMessage || 'Click below for complete details',
                    actionLinks,
                    account.access_token
                  );
                } else {
                  await sendInstagramDM(
                    instagramAccountId,
                    senderId,
                    finalMessage,
                    account.access_token
                  );
                }
              }

              // Quota Deduction
              await deductWorkspaceQuota(workspace, account.instagram_user_id);

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
                  metadata: { text: messageText, email: extractedEmail },
                  occurred_at: new Date().toISOString()
                });
              }

              const matchedKeyword = (matchedAut.trigger_config?.keywords || []).find((keyword: string) => {
                const kw = keyword.toLowerCase().trim();
                return kw && messageText.toLowerCase().includes(kw);
              }) || 'default';

              await supabase.from('automation_events').insert({
                automation_id: matchedAut.id,
                workspace_id: account.workspace_id,
                event_type: 'dm_sent',
                instagram_user_id: igUserId,
                instagram_username: senderUsername,
                metadata: {
                  text: messageText,
                  action: matchedAut.action_type,
                  message: finalMessage,
                  url: finalUrl,
                  keyword: matchedKeyword
                },
                occurred_at: new Date().toISOString()
              });

              continue;
            }

            // 2. Otherwise fallback to checking if it is a reply to an ongoing active Email/Follow Gate automation
            if (!dbContact) {
              console.log(`No existing contact found for @${senderUsername}. Skipping.`);
              continue;
            }

            // Try to find the most recent email-gate or follow-gate prompt sent to this user
            const { data: lastPromptEvent } = await supabase
              .from('automation_events')
              .select('*')
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

            // Fallback: if no recent event is found, fallback to the first active email/follow gate automation
            if (!matchedAut) {
              const { data: automations } = await supabase
                .from('automations')
                .select('*')
                .eq('instagram_account_id', account.id)
                .eq('status', 'live')
                .in('action_type', ['email_gate', 'follow_gate']);

              if (automations && automations.length > 0) {
                matchedAut = automations[0];
              }
            }

            if (!matchedAut) {
              console.log('No matching gate automation found for user:', igUserId);
              continue;
            }

            // Fetch workspace to check quota
            const { data: workspace } = await supabase
              .from('workspaces')
              .select('*')
              .eq('id', account.workspace_id)
              .single();

            if (!workspace) continue;

            // Global quota check for Free plans
            if (workspace.plan === 'free') {
              const globalQuotaExceeded = await checkGlobalQuotaExceeded(account.instagram_user_id);
              if (globalQuotaExceeded) {
                console.warn(`Global quota exhausted for Instagram account ${account.instagram_user_id} on release.`);
                continue;
              }
            }

            const planRemaining = Math.max(0, workspace.dm_quota_monthly - workspace.dm_sent_current_period);
            const addonRemaining = Math.max(0, workspace.dm_addon_credits);
            const totalRemaining = planRemaining + addonRemaining;

            if (totalRemaining <= 0) {
              console.warn(`Quota exhausted for workspace ${account.workspace_id} on release.`);
              continue;
            }

            // --- Case A: Follow Gate ---
            if (matchedAut.action_type === 'follow_gate') {
              const isFollowing = isUserFollowBusiness || await checkInstagramFollowStatus(senderId, account.access_token);

              if (isFollowing) {
                const successMessage = `${matchedAut.action_config?.message || 'Click below for complete details'}`.trim();
                const actionLinks = matchedAut.action_config?.links || (matchedAut.action_config?.url ? [{ url: matchedAut.action_config.url, label: matchedAut.name || 'Download Now' }] : []);

                if (actionLinks.length > 0) {
                  await sendInstagramLinkButtons(
                    instagramAccountId,
                    senderId,
                    successMessage,
                    actionLinks,
                    account.access_token
                  );
                } else {
                  await sendInstagramDM(instagramAccountId, senderId, successMessage, account.access_token);
                }

                // Quota Deduction
                await deductWorkspaceQuota(workspace, account.instagram_user_id);

                // Update Automation dm_sent_count
                await supabase.from('automations').update({
                  dm_sent_count: matchedAut.dm_sent_count + 1
                }).eq('id', matchedAut.id);

                // Log follow verified and DM sent
                await supabase.from('automation_events').insert([
                  {
                    automation_id: matchedAut.id,
                    workspace_id: account.workspace_id,
                    event_type: 'follow_verified',
                    instagram_user_id: igUserId,
                    instagram_username: senderUsername,
                    metadata: { text: messageText, followed: true },
                    occurred_at: new Date().toISOString()
                  },
                  {
                    automation_id: matchedAut.id,
                    workspace_id: account.workspace_id,
                    event_type: 'dm_sent',
                    instagram_user_id: igUserId,
                    instagram_username: senderUsername,
                    metadata: {
                      text: messageText,
                      action: 'follow_gate',
                      message: successMessage,
                      url: actionLinks[0]?.url || '',
                      links: actionLinks
                    },
                    occurred_at: new Date().toISOString()
                  }
                ]);
              } else {
                // Not following yet, repeat prompt!
                const promptMessage = `Nearly there! The link is especially for my followers ✨\n\nRight after you follow me, I'll send you the link so you can dive straight in! 🎉`;
                
                await sendInstagramDMWithQuickReplies(
                  instagramAccountId,
                  senderId,
                  promptMessage,
                  [{ title: 'Following', payload: `check_follow_${matchedAut.id}` }],
                  account.access_token
                );

                // Log DM sent for follow prompt retry
                await supabase.from('automation_events').insert({
                  automation_id: matchedAut.id,
                  workspace_id: account.workspace_id,
                  event_type: 'dm_sent',
                  instagram_user_id: igUserId,
                  instagram_username: senderUsername,
                  metadata: {
                    text: messageText,
                    action: 'follow_gate_prompt_retry',
                    message: promptMessage
                  },
                  occurred_at: new Date().toISOString()
                });
              }
              continue;
            }

            // --- Case B: Email Gate ---
            if (matchedAut.action_type === 'email_gate') {
              const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
              const extractedEmail = messageText.match(emailRegex)?.[0];

              if (extractedEmail) {
                // Update contact email in database
                await supabase.from('contacts').update({
                  email: extractedEmail,
                  last_seen_at: new Date().toISOString(),
                  interaction_count: dbContact.interaction_count + 1
                }).eq('id', dbContact.id);

                const successMessage = `${matchedAut.action_config?.message || 'Click below for complete details'}`.trim();
                const actionLinks = matchedAut.action_config?.links || (matchedAut.action_config?.url ? [{ url: matchedAut.action_config.url, label: matchedAut.name || 'Download Now' }] : []);

                if (actionLinks.length > 0) {
                  await sendInstagramLinkButtons(
                    instagramAccountId,
                    senderId,
                    successMessage,
                    actionLinks,
                    account.access_token
                  );
                } else {
                  await sendInstagramDM(instagramAccountId, senderId, successMessage, account.access_token);
                }

                // Quota Deduction
                await deductWorkspaceQuota(workspace, account.instagram_user_id);

                // Update Automation dm_sent_count
                await supabase.from('automations').update({
                  dm_sent_count: matchedAut.dm_sent_count + 1
                }).eq('id', matchedAut.id);

                // Log events
                await supabase.from('automation_events').insert([
                  {
                    automation_id: matchedAut.id,
                    workspace_id: account.workspace_id,
                    event_type: 'email_collected',
                    instagram_user_id: igUserId,
                    instagram_username: senderUsername,
                    metadata: { text: messageText, email: extractedEmail },
                    occurred_at: new Date().toISOString()
                  },
                  {
                    automation_id: matchedAut.id,
                    workspace_id: account.workspace_id,
                    event_type: 'dm_sent',
                    instagram_user_id: igUserId,
                    instagram_username: senderUsername,
                    metadata: {
                      text: messageText,
                      action: matchedAut.action_type,
                      message: successMessage,
                      url: actionLinks[0]?.url || '',
                      links: actionLinks
                    },
                    occurred_at: new Date().toISOString()
                  }
                ]);
              } else {
                // Invalid email sent, repeat prompt!
                const promptMessage = `Please provide your email address to receive your link:`;
                
                await sendInstagramDM(instagramAccountId, senderId, promptMessage, account.access_token);

                // Log DM sent for email prompt retry
                await supabase.from('automation_events').insert({
                  automation_id: matchedAut.id,
                  workspace_id: account.workspace_id,
                  event_type: 'dm_sent',
                  instagram_user_id: igUserId,
                  instagram_username: senderUsername,
                  metadata: {
                    text: messageText,
                    action: 'email_gate_prompt_retry',
                    message: promptMessage
                  },
                  occurred_at: new Date().toISOString()
                });
              }
              continue;
            }
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

// Helper Functions
async function sendInstagramCommentReply(commentId: string, message: string, accessToken: string) {
  try {
    const res = await fetch(`https://graph.instagram.com/v20.0/${commentId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        message
      })
    });
    if (!res.ok) {
      console.error('Failed to send public comment reply:', await res.text());
    }
    return res;
  } catch (err) {
    console.error('Error sending public comment reply:', err);
  }
}

async function checkInstagramFollowStatus(senderId: string, accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`https://graph.instagram.com/v20.0/${senderId}?fields=is_user_follow_business&access_token=${accessToken}`);
    if (!res.ok) {
      const errText = await res.text();
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.code === 230) {
          console.log(`[Follow Gate] User consent required to check follow status for sender ID ${senderId}. This is standard Meta API behavior before direct messaging is established.`);
          return false;
        }
      } catch (e) {}
      console.error('Failed to check follow status:', errText);
      return false;
    }
    const data = await res.json();
    return data.is_user_follow_business || false;
  } catch (err) {
    console.error('Error checking follow status:', err);
    return false;
  }
}

async function sendInstagramDM(instagramAccountId: string, recipientId: string, text: string, accessToken: string) {
  const res = await fetch(`https://graph.instagram.com/v20.0/${instagramAccountId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text }
    })
  });
  if (!res.ok) {
    console.error('Failed to send DM:', await res.text());
  }
  return res;
}

async function sendInstagramDMWithQuickReplies(
  instagramAccountId: string,
  recipientId: string,
  text: string,
  quickReplies: Array<{ title: string; payload: string }>,
  accessToken: string
) {
  const res = await fetch(`https://graph.instagram.com/v20.0/${instagramAccountId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: {
        text,
        quick_replies: quickReplies.map(qr => ({
          content_type: 'text',
          title: qr.title,
          payload: qr.payload
        }))
      }
    })
  });
  if (!res.ok) {
    console.error('Failed to send DM with quick replies:', await res.text());
  }
  return res;
}

async function sendInstagramLinkButton(
  instagramAccountId: string,
  recipientId: string,
  title: string,
  buttonUrl: string,
  buttonTitle: string,
  accessToken: string
) {
  const res = await fetch(`https://graph.instagram.com/v20.0/${instagramAccountId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [
              {
                title: title,
                buttons: [
                  {
                    type: 'web_url',
                    url: buttonUrl,
                    title: buttonTitle.substring(0, 20)
                  }
                ]
              }
            ]
          }
        }
      }
    })
  });
  if (!res.ok) {
    console.error('Failed to send Link Button template:', await res.text());
    // Fallback to text link
    return sendInstagramDM(instagramAccountId, recipientId, `${title} ${buttonUrl}`, accessToken);
  }
  return res;
}

async function sendInstagramLinkButtons(
  instagramAccountId: string,
  recipientId: string,
  title: string,
  links: { url: string; label: string }[],
  accessToken: string
) {
  if (links.length === 0) {
    return sendInstagramDM(instagramAccountId, recipientId, title, accessToken);
  }

  // Build elements for the generic template
  // Each element can hold at most 3 buttons.
  const elements = [];
  const chunkSize = 3;
  
  for (let i = 0; i < links.length; i += chunkSize) {
    const chunk = links.slice(i, i + chunkSize);
    elements.push({
      title: i === 0 ? title : `${title} (cont.)`,
      buttons: chunk.map((link, idx) => ({
        type: 'web_url',
        url: link.url,
        title: (link.label || `Visit Link ${i + idx + 1}`).substring(0, 20)
      }))
    });
  }

  const res = await fetch(`https://graph.instagram.com/v20.0/${instagramAccountId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: elements
          }
        }
      }
    })
  });

  if (!res.ok) {
    console.error('Failed to send DM with multiple link buttons:', await res.text());
    // Fallback to text link list
    const textLinks = links.map(l => `${l.label || 'Link'}: ${l.url}`).join('\n');
    return sendInstagramDM(instagramAccountId, recipientId, `${title}\n\n${textLinks}`, accessToken);
  }
  return res;
}

async function checkGlobalQuotaExceeded(instagramUserId: string): Promise<boolean> {
  const { data: globalUsage } = await supabase
    .from('instagram_global_usage')
    .select('*')
    .eq('instagram_user_id', instagramUserId)
    .maybeSingle();

  if (globalUsage) {
    const resetDate = new Date(globalUsage.reset_date);
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    if (resetDate >= thisMonthStart && globalUsage.dm_sent_count >= 500) {
      return true;
    }
  }
  return false;
}

async function deductWorkspaceQuota(workspace: any, instagramUserId: string) {
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

  // Update global usage
  const { data: globalUsage } = await supabase
    .from('instagram_global_usage')
    .select('*')
    .eq('instagram_user_id', instagramUserId)
    .maybeSingle();

  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  if (globalUsage) {
    const resetDate = new Date(globalUsage.reset_date);
    if (resetDate < thisMonthStart) {
      // It's a new month, reset the counter
      await supabase.from('instagram_global_usage').update({
        dm_sent_count: 1,
        reset_date: thisMonthStart.toISOString(),
        updated_at: new Date().toISOString()
      }).eq('instagram_user_id', instagramUserId);
    } else {
      // Increment
      await supabase.from('instagram_global_usage').update({
        dm_sent_count: globalUsage.dm_sent_count + 1,
        updated_at: new Date().toISOString()
      }).eq('instagram_user_id', instagramUserId);
    }
  } else {
    // Insert new global usage row
    await supabase.from('instagram_global_usage').insert({
      instagram_user_id: instagramUserId,
      dm_sent_count: 1,
      reset_date: thisMonthStart.toISOString(),
      updated_at: new Date().toISOString()
    });
  }
}
