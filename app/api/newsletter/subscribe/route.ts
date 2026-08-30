import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listIdStr = process.env.BREVO_NEWSLETTER_LIST_ID;
    const listIds = listIdStr ? [parseInt(listIdStr, 10)] : [2];

    if (!apiKey || apiKey.includes('your_brevo_api_key')) {
      console.log(`[MOCK NEWSLETTER SUBSCRIPTION] Subscribed email: ${email} to Brevo Contact List ${JSON.stringify(listIds)}`);
      return NextResponse.json({
        success: true,
        message: 'Subscribed to Dollysticart newsletter successfully (Sandbox mode).',
      });
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        listIds: listIds,
        updateEnabled: true,
      }),
    });

    const resData = await response.json();

    if (!response.ok && response.status !== 400) { // Brevo returns 400 if contact already exists
      const errDetail = resData.message || JSON.stringify(resData);
      console.error('[BREVO NEWSLETTER ERROR]', errDetail);
      return NextResponse.json({ error: 'Failed to register newsletter subscription.' }, { status: 500 });
    }

    console.log(`[BREVO NEWSLETTER SUCCESS] Subscribed email: ${email}`);
    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing to Dollysticart newsletter.',
    });
  } catch (err: any) {
    console.error('[NEWSLETTER ROUTE ERROR]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
