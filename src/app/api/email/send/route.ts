import { NextResponse } from 'next/server';
import { sendEmailNotification, EmailPayload } from '../../../../lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, type, data } = body as EmailPayload;

    if (!to || !type) {
      return NextResponse.json({ error: 'Missing parameters: to and type are required.' }, { status: 400 });
    }

    // Trigger sending asynchronously in the background so we do not block client response
    sendEmailNotification({ to, type, data }).catch(err => {
      console.error(">>> Asynchronous background email sending error:", err);
    });

    // Return immediate success
    return NextResponse.json({ success: true, status: 'queued' });

  } catch (error: any) {
    console.error(">>> Email API route error:", error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
