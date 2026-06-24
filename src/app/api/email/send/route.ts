import { NextResponse } from 'next/server';
import { sendEmailNotification, EmailPayload } from '../../../../lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, type, data } = body as EmailPayload;

    if (!to || !type) {
      return NextResponse.json({ error: 'Missing parameters: to and type are required.' }, { status: 400 });
    }

    console.log(`>>> [Email API] Sending email type: "${type}" to: "${to}"`);
    console.log(`>>> [Email API] SMTP Configured: ${process.env.SMTP_USER ? 'SMTP_USER is set' : 'SMTP_USER is MISSING'}, ${process.env.SMTP_PASSWORD ? 'SMTP_PASSWORD is set' : 'SMTP_PASSWORD is MISSING'}`);

    // Await SMTP delivery to prevent serverless execution environment from freezing background promises
    const result = await sendEmailNotification({ to, type, data });
    
    if (!result.success) {
      console.error(">>> [Email API] Email sending failed:", result.error);
      return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
    }

    console.log(">>> [Email API] Email sent successfully.");
    return NextResponse.json({ success: true, status: 'sent' });

  } catch (error: any) {
    console.error(">>> [Email API] Route error:", error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
