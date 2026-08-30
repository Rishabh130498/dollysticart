import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  dispatchOrderConfirmationEvent,
  dispatchPaymentFailedEvent,
  dispatchRefundCompletedEvent,
  dispatchDigitalDownloadEvent,
} from '@/lib/email/email-events';

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

    const adminDb = createAdminClient();

    // 1. Process payment success events (payment.captured / order.paid)
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const razorpayOrderId = paymentEntity.order_id || payload.payload?.order?.entity?.id;
      const razorpayPaymentId = paymentEntity.id;

      if (!razorpayOrderId) {
        return NextResponse.json({ status: 'ignored', reason: 'No order_id in event payload' });
      }

      const { data: order } = await adminDb
        .from('orders')
        .select('*')
        .eq('razorpay_order_id', razorpayOrderId)
        .single();

      if (!order) {
        console.warn(`[RAZORPAY WEBHOOK] Order not found for razorpay_order_id: ${razorpayOrderId}`);
        return NextResponse.json({ status: 'ignored', reason: 'Order not found' });
      }

      // Idempotency check
      if (order.payment_status === 'paid') {
        return NextResponse.json({ status: 'ok', message: 'Order already marked as paid' });
      }

      // Update order to PAID
      await adminDb
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'paid',
          razorpay_payment_id: razorpayPaymentId || order.razorpay_payment_id,
          razorpay_signature: signature || order.razorpay_signature || 'webhook_verified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Trigger Email Events (Order Confirmation + Invoice + Digital Download if applicable)
      await dispatchOrderConfirmationEvent(order.id);
      await dispatchDigitalDownloadEvent(order.id);
    }

    // 2. Process genuine payment failure events (payment.failed)
    else if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const razorpayOrderId = paymentEntity.order_id;
      const failureReason = paymentEntity.error_description || 'Payment authorization failed.';

      if (razorpayOrderId) {
        const { data: order } = await adminDb
          .from('orders')
          .select('*')
          .eq('razorpay_order_id', razorpayOrderId)
          .single();

        if (order && order.payment_status !== 'paid') {
          await adminDb
            .from('orders')
            .update({
              payment_status: 'failed',
              status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          // Dispatch genuine payment failure email (only on actual provider failure)
          await dispatchPaymentFailedEvent(order.id, failureReason);
        }
      }
    }

    // 3. Process refund events (refund.processed / refund.created)
    else if (event === 'refund.processed' || event === 'refund.created') {
      const refundEntity = payload.payload?.refund?.entity || {};
      const razorpayPaymentId = refundEntity.payment_id;
      const refundAmount = refundEntity.amount; // in paise

      if (razorpayPaymentId) {
        const { data: order } = await adminDb
          .from('orders')
          .select('*')
          .eq('razorpay_payment_id', razorpayPaymentId)
          .single();

        if (order) {
          await adminDb
            .from('orders')
            .update({
              payment_status: 'refunded',
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          await dispatchRefundCompletedEvent(order.id, refundAmount);
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[RAZORPAY WEBHOOK ERROR]', err);
    return NextResponse.json({ error: 'Internal webhook error.' }, { status: 500 });
  }
}
