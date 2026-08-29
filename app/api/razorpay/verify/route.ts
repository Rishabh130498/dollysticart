import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateInvoicePdf } from '@/lib/pdf/invoice';
import { sendInvoiceEmail } from '@/lib/email/resend';


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing payment identifiers.' }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // 1. Check if this is a Mock Order (mock flow testing)
    const isMockOrder = razorpay_order_id.startsWith('order_mock_');
    const isMockMode = !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.includes('mock');

    if (!isMockOrder && !isMockMode) {
      // 2. Real Payment Flow: Perform cryptographic signature validation
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return NextResponse.json({ error: 'Razorpay Secret Key is not configured on the server.' }, { status: 500 });
      }

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        console.error('[SECURITY ALERT] Razorpay payment signature mismatch!', {
          expected: expectedSignature,
          received: razorpay_signature,
          orderId: razorpay_order_id
        });
        return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 });
      }
    } else {
      console.log(`[MOCK PAYMENT] Verifying mock order ID: ${razorpay_order_id}`);
    }

    // 3. Retrieve the corresponding order in the database
    const { data: order, error: orderErr } = await adminDb
      .from('orders')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (orderErr || !order) {
      console.error('Order look-up failed for verified payment', orderErr);
      return NextResponse.json({ error: 'Order not found in database.' }, { status: 404 });
    }

    // Prevent double processing (idempotency safety check)
    if (order.payment_status === 'paid') {
      return NextResponse.json({ success: true, message: 'Order is already marked as paid.', orderId: order.id });
    }

    // 4. Update order payment details to PAID
    const { error: updateError } = await adminDb
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'paid',
        razorpay_payment_id,
        razorpay_signature: razorpay_signature || 'mock_signature',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Order update status write failed', updateError);
      return NextResponse.json({ error: 'Fulfillment status write failed.' }, { status: 500 });
    }

    // 5. Trigger invoice PDF compilation and email confirmation
    try {
      // Fetch order items to display on invoice
      const { data: items } = await adminDb
        .from('order_items')
        .select('*, products(name)')
        .eq('order_id', order.id);

      // Generate PDF buffer
      const pdfBuffer = await generateInvoicePdf(order, items || []);

      // Dispatch email notification
      await sendInvoiceEmail(order, items || [], pdfBuffer);
      
      console.log(`[FULFILLMENT SUCCESS] Fulfilling invoice email routing for order ${order.id}`);
    } catch (emailErr) {
      console.error('Non-blocking invoice notification trigger failure', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Order paid and verified successfully.',
      orderId: order.id
    });

  } catch (err: any) {
    console.error('Verification POST fatal failure', err);
    return NextResponse.json({ error: 'Internal validation failure.' }, { status: 500 });
  }
}
