import nodemailer from 'nodemailer';

// Helper to determine if SMTP is fully configured in environment
export const isSMTPConfigured = (): boolean => {
  return !!(
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );
};

// Create Nodemailer Transporter
export const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const secure = port === 465; // true for 465, false for other ports (587, 25)

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER || 'instaflowauto@gmail.com',
      pass: process.env.SMTP_PASSWORD || '',
    },
  });
};

// Base HTML Wrapper for consistent premium branding
const wrapEmailTemplate = (content: string, previewText?: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Auto Insta Flow</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #0c0a0f;
          font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #e4e4e7;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #121016;
          border: 1px solid #27252f;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .header {
          background: linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #f97316 100%);
          padding: 35px 40px;
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
          margin: 0;
          display: inline-block;
        }
        .logo-symbol {
          background-color: rgba(255,255,255,0.2);
          padding: 4px 10px;
          border-radius: 8px;
          margin-right: 5px;
        }
        .body {
          padding: 40px;
        }
        .title {
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          margin-top: 0;
          margin-bottom: 20px;
          line-height: 1.3;
        }
        .text {
          font-size: 14px;
          line-height: 1.6;
          color: #a1a1aa;
          margin-bottom: 24px;
        }
        .highlight-box {
          background-color: #191622;
          border: 1px solid #332d4a;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .highlight-title {
          font-size: 12px;
          font-weight: 800;
          color: #7c3aed;
          text-transform: uppercase;
          margin-bottom: 10px;
          letter-spacing: 0.5px;
        }
        .highlight-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #231f33;
        }
        .highlight-item:last-child {
          border-bottom: none;
        }
        .highlight-label {
          font-size: 13px;
          color: #71717a;
          font-weight: 600;
        }
        .highlight-value {
          font-size: 13px;
          color: #f4f4f5;
          font-weight: 700;
        }
        .btn-container {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(90deg, #7c3aed 0%, #db2777 100%);
          color: #ffffff !important;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          padding: 14px 30px;
          border-radius: 12px;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
        }
        .footer {
          background-color: #0e0d13;
          border-top: 1px solid #1f1d27;
          padding: 24px 40px;
          text-align: center;
        }
        .footer-links {
          margin-bottom: 15px;
        }
        .footer-links a {
          color: #71717a;
          text-decoration: none;
          font-size: 11px;
          font-weight: 600;
          margin: 0 10px;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: #7c3aed;
        }
        .footer-text {
          font-size: 11px;
          color: #52525b;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      ${previewText ? `<span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0;">${previewText}</span>` : ''}
      <div class="container">
        <div class="header">
          <h1 class="logo"><span class="logo-symbol">A</span> Auto Insta Flow</h1>
        </div>
        <div class="body">
          ${content}
        </div>
        <div class="footer">
          <div class="footer-links">
            <a href="https://autoinstaflow-pied.vercel.app/terms">Terms of Service</a>
            <a href="https://autoinstaflow-pied.vercel.app/privacy">Privacy Policy</a>
            <a href="https://autoinstaflow-pied.vercel.app/support">Support Help Center</a>
          </div>
          <p class="footer-text">
            &copy; ${new Date().getFullYear()} Auto Insta Flow. All rights reserved.<br>
            Sent with care from instaflowauto@gmail.com
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// 1. Welcome / Login Email Template
const renderWelcomeEmail = (name: string, email: string): string => {
  const content = `
    <h2 class="title">Welcome to Auto Insta Flow, ${name}! 🚀</h2>
    <p class="text">
      We are absolutely thrilled to have you on board. Auto Insta Flow is built to supercharge your Instagram engagement, turn comment loops into high-converting sales pipelines, and automatically collect leads directly via DMs.
    </p>
    
    <div class="highlight-box">
      <div class="highlight-title">Your Account Details</div>
      <div class="highlight-item">
        <span class="highlight-label">Email Address</span>
        <span class="highlight-value">${email}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Subscription Plan</span>
        <span class="highlight-value">Free Tier (500 monthly messages)</span>
      </div>
    </div>

    <p class="text">
      To get started, follow these simple steps inside your dashboard:
      <br>&bull; <strong>Step 1:</strong> Link your Instagram Creator or Business Account.
      <br>&bull; <strong>Step 2:</strong> Create your first automation flow using one of our templates.
      <br>&bull; <strong>Step 3:</strong> Comment on your post and watch the automated DM system in action!
    </p>

    <div class="btn-container">
      <a href="https://autoinstaflow-pied.vercel.app/dashboard" class="btn">Access Your Dashboard</a>
    </div>

    <p class="text" style="margin-bottom: 0;">
      If you have any questions or need onboarding help, reply directly to this email or visit our Support page. Happy automating!
    </p>
  `;
  return wrapEmailTemplate(content, `Welcome to Auto Insta Flow, ${name}! Get ready to automate your Instagram loops.`);
};

// 2. Subscription Plan Activated / Modified Template
const renderPlanActivatedEmail = (name: string, plan: string, cycle: string, quota: number): string => {
  const content = `
    <h2 class="title">Subscription Plan Activated! 💎</h2>
    <p class="text">
      Hello ${name}, your workspace subscription has been updated successfully. Your new limits and priority queues are now active. Thank you for choosing Auto Insta Flow to scale your engagement!
    </p>
    
    <div class="highlight-box">
      <div class="highlight-title">Subscription Summary</div>
      <div class="highlight-item">
        <span class="highlight-label">Active Plan</span>
        <span class="highlight-value" style="text-transform: uppercase; color: #db2777;">${plan} Plan</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Billing Cycle</span>
        <span class="highlight-value" style="text-transform: capitalize;">${cycle}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Monthly DM Quota</span>
        <span class="highlight-value">${quota.toLocaleString()} messages</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Queue Priority</span>
        <span class="highlight-value" style="color: #10b981;">High Priority Processing Queue</span>
      </div>
    </div>

    <p class="text">
      With your active subscription, you now have access to advanced tools such as <strong>Email Gating</strong>, <strong>Follow Gating</strong>, and priority webhook processing speeds.
    </p>

    <div class="btn-container">
      <a href="https://autoinstaflow-pied.vercel.app/dashboard/billing" class="btn">Manage Subscriptions</a>
    </div>

    <p class="text" style="margin-bottom: 0;">
      If you did not request this upgrade or believe there is a billing issue, contact support immediately at instaflowauto@gmail.com.
    </p>
  `;
  return wrapEmailTemplate(content, `Your Auto Insta Flow ${plan} subscription is now active.`);
};

// 3. Instagram Connected Template
const renderInstagramConnectedEmail = (name: string, igUsername: string, followers: number): string => {
  const content = `
    <h2 class="title">Instagram Account Linked Successfully 🔗</h2>
    <p class="text">
      Hello ${name}, a new Instagram profile has been linked to your Auto Insta Flow workspace. Automations can now be set up for this profile directly.
    </p>
    
    <div class="highlight-box">
      <div class="highlight-title">Account Profiles Details</div>
      <div class="highlight-item">
        <span class="highlight-label">Instagram Username</span>
        <span class="highlight-value" style="color: #a855f7;">@${igUsername}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Followers Count</span>
        <span class="highlight-value">${followers.toLocaleString()}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Connection Status</span>
        <span class="highlight-value" style="color: #10b981;">Active Token Verified</span>
      </div>
    </div>

    <p class="text">
      Our webhook integrations have been verified. Any comments, story replies, or direct messages received by this profile containing matching keywords will trigger automatic replies as configured in your flows.
    </p>

    <div class="btn-container">
      <a href="https://autoinstaflow-pied.vercel.app/dashboard/automations/new" class="btn">Set Up An Automation</a>
    </div>
  `;
  return wrapEmailTemplate(content, `@${igUsername} is now connected to your Auto Insta Flow account.`);
};

// 4. Instagram Disconnected Template
const renderInstagramDisconnectedEmail = (name: string, igUsername: string): string => {
  const content = `
    <h2 class="title">Instagram Account Disconnected ⚠️</h2>
    <p class="text">
      Hello ${name}, we are writing to confirm that the Instagram profile <strong>@${igUsername}</strong> has been disconnected from your Auto Insta Flow workspace.
    </p>
    
    <div class="highlight-box">
      <div class="highlight-title">Disconnection Details</div>
      <div class="highlight-item">
        <span class="highlight-label">Instagram Username</span>
        <span class="highlight-value" style="color: #71717a;">@${igUsername}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Automation Status</span>
        <span class="highlight-value" style="color: #f43f5e;">All campaigns paused</span>
      </div>
    </div>

    <p class="text">
      All automated triggers, keyword responses, and DM gates linked to this username have been automatically set to <strong>paused</strong>. Reconnect this account at any time in the connections tab to resume your campaigns.
    </p>

    <div class="btn-container">
      <a href="https://autoinstaflow-pied.vercel.app/dashboard/connect" class="btn">Manage Connections</a>
    </div>
  `;
  return wrapEmailTemplate(content, `@${igUsername} has been disconnected from Auto Insta Flow.`);
};

// 5. Promotional / Campaign Broadcast Template
const renderPromotionalEmail = (title: string, messageHtml: string, ctaText?: string, ctaUrl?: string): string => {
  const content = `
    <h2 class="title">${title}</h2>
    <div class="text">
      ${messageHtml}
    </div>
    
    ${ctaText && ctaUrl ? `
      <div class="btn-container">
        <a href="${ctaUrl}" class="btn">${ctaText}</a>
      </div>
    ` : ''}
  `;
  return wrapEmailTemplate(content, title);
};

// 6. Support Ticket Customer Receipt Template
const renderSupportTicketReceipt = (name: string, subject: string, message: string): string => {
  const content = `
    <h2 class="title">Support Ticket Received 📥</h2>
    <p class="text">
      Hello ${name}, we have received your support request regarding <strong>"${subject}"</strong>. Our team is already reviewing the details and will get back to you within 2 hours.
    </p>
    
    <div class="highlight-box">
      <div class="highlight-title">Your Submitted Message</div>
      <p class="text" style="font-style: italic; white-space: pre-wrap; margin-bottom: 0; color: #d4d4d8;">
        "${message}"
      </p>
    </div>

    <p class="text" style="margin-bottom: 0;">
      If you have additional details to share, simply reply directly to this email. Thank you for your patience!
    </p>
  `;
  return wrapEmailTemplate(content, `Support ticket received: ${subject}`);
};

// 7. Support Ticket Admin Notification Template
const renderSupportTicketAdmin = (senderEmail: string, subject: string, message: string): string => {
  const content = `
    <h2 class="title" style="color: #f59e0b;">New Support Ticket Submitted ⚡</h2>
    <p class="text">
      A new support ticket has been submitted from the platform.
    </p>
    
    <div class="highlight-box">
      <div class="highlight-title">Ticket Details</div>
      <div class="highlight-item">
        <span class="highlight-label">Sender Email</span>
        <span class="highlight-value">${senderEmail}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Subject</span>
        <span class="highlight-value">${subject}</span>
      </div>
    </div>

    <div class="highlight-box" style="background-color: #1a1523; border-color: #4b3e6b;">
      <div class="highlight-title" style="color: #a78bfa;">Message Body</div>
      <p class="text" style="white-space: pre-wrap; margin-bottom: 0; color: #f4f4f5;">
        ${message}
      </p>
    </div>
  `;
  return wrapEmailTemplate(content, `New ticket: ${subject} from ${senderEmail}`);
};

// Consolidated Sender Function
export interface EmailPayload {
  to: string;
  type: 'welcome' | 'plan_activated' | 'instagram_connected' | 'instagram_disconnected' | 'promotional' | 'support_ticket_receipt' | 'support_ticket_admin';
  data: {
    name?: string;
    email?: string;
    plan?: string;
    cycle?: string;
    quota?: number;
    igUsername?: string;
    followersCount?: number;
    promoTitle?: string;
    promoContentHtml?: string;
    promoCtaText?: string;
    promoCtaUrl?: string;
    ticketSubject?: string;
    ticketMessage?: string;
    ticketSenderEmail?: string;
  };
}

export const sendEmailNotification = async (payload: EmailPayload): Promise<{ success: boolean; error?: string }> => {
  const { to, type, data } = payload;
  const fromName = 'Auto Insta Flow';
  const fromEmail = process.env.SMTP_USER || 'instaflowauto@gmail.com';

  let subject = '';
  let html = '';

  switch (type) {
    case 'welcome':
      subject = 'Welcome to Auto Insta Flow! 🚀';
      html = renderWelcomeEmail(data.name || 'User', to);
      break;
    case 'plan_activated':
      subject = `Subscription Activated: ${data.plan?.toUpperCase()} Plan 💎`;
      html = renderPlanActivatedEmail(
        data.name || 'User',
        data.plan || 'pro',
        data.cycle || 'monthly',
        data.quota || 5000
      );
      break;
    case 'instagram_connected':
      subject = `Instagram Linked: @${data.igUsername} 🔗`;
      html = renderInstagramConnectedEmail(
        data.name || 'User',
        data.igUsername || 'unknown',
        data.followersCount || 0
      );
      break;
    case 'instagram_disconnected':
      subject = `Instagram Profile Disconnected: @${data.igUsername} ⚠️`;
      html = renderInstagramDisconnectedEmail(data.name || 'User', data.igUsername || 'unknown');
      break;
    case 'promotional':
      subject = data.promoTitle || 'Important Update from Auto Insta Flow';
      html = renderPromotionalEmail(
        subject,
        data.promoContentHtml || '<p></p>',
        data.promoCtaText,
        data.promoCtaUrl
      );
      break;
    case 'support_ticket_receipt':
      subject = `Support Ticket Received: ${data.ticketSubject} 📥`;
      html = renderSupportTicketReceipt(
        data.name || 'User',
        data.ticketSubject || '',
        data.ticketMessage || ''
      );
      break;
    case 'support_ticket_admin':
      subject = `[Admin Alert] Support Ticket Submitted: ${data.ticketSubject} ⚡`;
      html = renderSupportTicketAdmin(
        data.ticketSenderEmail || '',
        data.ticketSubject || '',
        data.ticketMessage || ''
      );
      break;
    default:
      return { success: false, error: 'Invalid email notification type' };
  }

  // Fallback: If not configured, print to stdout (mock server mode)
  if (!isSMTPConfigured()) {
    console.log(">>> [SMTP MOCK MODE] Sending email...");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Decoded Content:\n${html.substring(0, 500)}...\n[Truncated]`);
    return { success: true };
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Nodemailer send email failed:", error);
    return { success: false, error: error.message || 'SMTP transmission failure.' };
  }
};
