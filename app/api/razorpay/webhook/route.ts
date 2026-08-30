import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateInvoicePdf } from '@/lib/pdf/invoice';
import { sendInvoiceEmail } from '@/lib/email/brevo';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Validate Webhook Signature if secret is configured
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing Razorpay signature header.' }, { status: 400 });
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('[WEBHOOK SECURITY ERROR] Razorpay signature mismatch.', {
          expected: expectedSignature,
          received: signature,
        });
        return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
      }
    } else {
      console.warn('[WEBHOOK WARNING] RAZORPAY_WEBHOOK_SECRET is not configured on the server. Skipping signature check in test environment.');
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`[RAZORPAY WEBHOOK] Received event: ${event}`);

    // Process payment success events
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const razorpayOrderId = paymentEntity.order_id || payload.payload?.order?.entity?.id;
      const razorpayPaymentId = paymentEntity.id;

      if (!razorpayOrderId) {
        return NextResponse.json({ status: 'ignored', reason: 'No order_id in event payload' });
      }

      const adminDb = createAdminClient();

      // Retrieve database order
      const { data: order, error: orderErr } = await adminDb
        .from('orders')
        .select('*')
        .eq('razorpay_order_id', razorpayOrderId)
        .single();

      if (orderErr || !order) {
        console.warn(`[RAZORPAY WEBHOOK] Order not found for razorpay_order_id: ${razorpayOrderId}`);
        return NextResponse.json({ status: 'ignored', reason: 'Order not found' });
      }

      // Check idempotency (skip if already processed)
      if (order.payment_status === 'paid') {
        return NextResponse.json({ status: 'ok', message: 'Order already marked as paid' });
      }

      // Update order in database to PAID
      const { error: updateErr } = await adminDb
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'paid',
          razorpay_payment_id: razorpayPaymentId || order.razorpay_payment_id,
          razorpay_signature: signature || order.razorpay_signature || 'webhook_verified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateErr) {
        console.error('[RAZORPAY WEBHOOK] Database order update failed', updateErr);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      // Trigger PDF Invoice generation & Email delivery
      try {
        const { data: items } = await adminDb
          .from('order_items')
          .select('*, products(name)')
          .eq('order_id', order.id);

        const pdfBuffer = await generateInvoicePdf(order, items || []);
        await sendInvoiceEmail(order, items || [], pdfBuffer);

        console.log(`[RAZORPAY WEBHOOK] Invoice email sent for order ${order.id}`);
      } catch (notifyErr) {
        console.error('[RAZORPAY WEBHOOK] Non-blocking email dispatch failure', notifyErr);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[RAZORPAY WEBHOOK ERROR]', err);
    return NextResponse.json({ error: 'Internal webhook error.' }, { status: 500 });
  }
}
