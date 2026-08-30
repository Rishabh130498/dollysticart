import { createAdminClient } from '@/lib/supabase/admin';
import { sendBrevoTransactionalEmail, sendInvoiceEmail } from './brevo';
import { generateInvoicePdf } from '@/lib/pdf/invoice';
import { generateDigitalDownloadSignedUrls } from '@/lib/storage/digital-downloads';

/**
 * Parses configurable template ID from environment variables with fallback
 */
function getTemplateId(envVarName: string): number | null {
  const val = process.env[envVarName];
  if (!val) return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
}

function getGreeting(name?: string, email?: string): string {
  if (name && name.trim().length > 0) {
    const firstName = name.trim().split(' ')[0];
    return `Hello ${firstName} ✨`;
  }
  if (email && email.includes('@')) {
    const handle = email.split('@')[0];
    return `Hello ${handle} ✨`;
  }
  return `Hello Art Lover ✨`;
}

/**
 * 1. ORDER CONFIRMATION + PAYMENT CONFIRMATION + INVOICE (Combined Email)
 * Triggered after Razorpay payment verification on backend.
 */
export async function dispatchOrderConfirmationEvent(orderId: string) {
  try {
    const adminDb = createAdminClient();

    const { data: order, error: orderErr } = await adminDb
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) return { success: false, error: 'Order not found' };

    const { data: items } = await adminDb
      .from('order_items')
      .select('*, products(name)')
      .eq('order_id', orderId);

    // Generate PDF Invoice
    const pdfBuffer = await generateInvoicePdf(order, items || []);

    // Check if order contains digital products
    const digitalAssets = await generateDigitalDownloadSignedUrls(orderId);
    let downloadUrl = '';
    if (digitalAssets.length > 0) {
      downloadUrl = digitalAssets[0].signedUrl;
    }

    // Call Brevo invoice dispatcher
    return await sendInvoiceEmail(order, items || [], pdfBuffer);
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH ERROR] Order Confirmation Event failed for order ${orderId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * 2. PAYMENT FAILED EMAIL
 * Triggered ONLY when Razorpay emits genuine payment.failed event.
 */
export async function dispatchPaymentFailedEvent(orderId: string, failureReason = 'Payment transaction failed or was declined by issuing bank.') {
  try {
    const adminDb = createAdminClient();
    const { data: order } = await adminDb.from('orders').select('*').eq('id', orderId).single();
    if (!order) return { success: false, error: 'Order not found' };

    const templateId = getTemplateId('BREVO_TEMPLATE_PAYMENT_FAILED');
    const greeting = getGreeting(order.customer_name, order.customer_email);
    const params = {
      FIRST_NAME: order.customer_name?.split(' ')[0] || order.customer_name,
      CUSTOMER_NAME: order.customer_name,
      ORDER_ID: `#${order.id.substring(0, 8).toUpperCase()}`,
      TOTAL: `₹${(order.total / 100).toFixed(2)}`,
      FAILURE_REASON: failureReason,
      RETRY_URL: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout`,
    };

    return await sendBrevoTransactionalEmail({
      eventType: 'payment_failed',
      orderId: order.id,
      toEmail: order.customer_email,
      toName: order.customer_name,
      templateId,
      params,
      subject: `Payment Notice for Order ${params.ORDER_ID} | Dollysticart`,
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #fee2e2; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #09090b; padding: 28px 24px; text-align: center; border-bottom: 3px solid #dc2626;">
            <h1 style="font-family: Georgia, serif; color: #ffffff; font-size: 22px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">DOLLYSTICART</h1>
            <p style="color: #fca5a5; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 4px 0 0 0;">PAYMENT PROCESSING UPDATE</p>
          </div>
          <div style="padding: 28px 24px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #09090b; margin-top: 0;">${greeting}</h2>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
              We attempted to process your payment of <strong>${params.TOTAL}</strong> for order <strong>${params.ORDER_ID}</strong>, but the transaction could not be completed.
            </p>
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; margin: 20px 0; font-size: 13px; color: #991b1b;">
              <strong>Note:</strong> ${failureReason}
            </div>
            <p style="font-size: 13px; color: #4b5563; line-height: 1.5;">
              No charges were made to your bank account. You can safely retry your checkout below:
            </p>
            <div style="margin: 24px 0; text-align: center;">
              <a href="${params.RETRY_URL}" style="background-color: #09090b; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: bold; font-size: 13px; border-radius: 4px; display: inline-block;">RETRY PAYMENT &rarr;</a>
            </div>
            <div style="border-top: 1px solid #f3f4f6; pt: 16px; font-size: 12px; color: #9ca3af; text-align: center;">
              Sent with care to ${order.customer_email}
            </div>
          </div>
        </div>
      `,
    });
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH ERROR] Payment Failed Event failed for order ${orderId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * 3. ORDER CANCELLED EMAIL
 * Triggered when order status changes to 'cancelled'.
 */
export async function dispatchOrderCancelledEvent(orderId: string) {
  try {
    const adminDb = createAdminClient();
    const { data: order } = await adminDb.from('orders').select('*').eq('id', orderId).single();
    if (!order) return { success: false, error: 'Order not found' };

    const templateId = getTemplateId('BREVO_TEMPLATE_ORDER_CANCELLED');
    const greeting = getGreeting(order.customer_name, order.customer_email);
    const params = {
      FIRST_NAME: order.customer_name?.split(' ')[0] || order.customer_name,
      CUSTOMER_NAME: order.customer_name,
      ORDER_ID: `#${order.id.substring(0, 8).toUpperCase()}`,
      TOTAL: `₹${(order.total / 100).toFixed(2)}`,
    };

    return await sendBrevoTransactionalEmail({
      eventType: 'order_cancelled',
      orderId: order.id,
      toEmail: order.customer_email,
      toName: order.customer_name,
      templateId,
      params,
      subject: `Order Cancellation Confirmation - ${params.ORDER_ID} | Dollysticart`,
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #09090b; padding: 28px 24px; text-align: center; border-bottom: 3px solid #6b7280;">
            <h1 style="font-family: Georgia, serif; color: #ffffff; font-size: 22px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">DOLLYSTICART</h1>
            <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 4px 0 0 0;">ORDER STATUS UPDATE</p>
          </div>
          <div style="padding: 28px 24px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #09090b; margin-top: 0;">${greeting}</h2>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
              As requested, your order <strong>${params.ORDER_ID}</strong> has been cancelled.
            </p>
            <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
              If any payment was processed for this order, a full refund has been initiated to your original payment method.
            </p>
            <div style="border-top: 1px solid #f3f4f6; pt: 16px; margin-top: 24px; font-size: 12px; color: #9ca3af; text-align: center;">
              Sent with warmth to ${order.customer_email}
            </div>
          </div>
        </div>
      `,
    });
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH ERROR] Order Cancelled Event failed for order ${orderId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * 4. REFUND COMPLETED EMAIL
 * Triggered when payment_status changes to 'refunded'.
 */
export async function dispatchRefundCompletedEvent(orderId: string, refundAmount?: number) {
  try {
    const adminDb = createAdminClient();
    const { data: order } = await adminDb.from('orders').select('*').eq('id', orderId).single();
    if (!order) return { success: false, error: 'Order not found' };

    const templateId = getTemplateId('BREVO_TEMPLATE_REFUND_COMPLETED');
    const amt = refundAmount || order.total;
    const greeting = getGreeting(order.customer_name, order.customer_email);

    const params = {
      FIRST_NAME: order.customer_name?.split(' ')[0] || order.customer_name,
      CUSTOMER_NAME: order.customer_name,
      ORDER_ID: `#${order.id.substring(0, 8).toUpperCase()}`,
      REFUND_AMOUNT: `₹${(amt / 100).toFixed(2)}`,
      PAYMENT_ID: order.razorpay_payment_id || 'N/A',
    };

    return await sendBrevoTransactionalEmail({
      eventType: 'refund_completed',
      orderId: order.id,
      toEmail: order.customer_email,
      toName: order.customer_name,
      templateId,
      params,
      subject: `Refund Confirmation - Order ${params.ORDER_ID} | Dollysticart`,
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #09090b; padding: 28px 24px; text-align: center; border-bottom: 3px solid #10b981;">
            <h1 style="font-family: Georgia, serif; color: #ffffff; font-size: 22px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">DOLLYSTICART</h1>
            <p style="color: #6ee7b7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 4px 0 0 0;">REFUND PROCESSED</p>
          </div>
          <div style="padding: 28px 24px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #09090b; margin-top: 0;">${greeting}</h2>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
              Your refund of <strong style="color: #059669;">${params.REFUND_AMOUNT}</strong> for order <strong>${params.ORDER_ID}</strong> has been successfully processed.
            </p>
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 14px; margin: 20px 0; font-size: 13px; color: #065f46;">
              <strong>Transaction Ref ID:</strong> ${params.PAYMENT_ID}<br/>
              The amount will reflect on your bank/card statement in 5–7 business days.
            </div>
            <div style="border-top: 1px solid #f3f4f6; pt: 16px; font-size: 12px; color: #9ca3af; text-align: center;">
              Sent with warmth to ${order.customer_email}
            </div>
          </div>
        </div>
      `,
    });
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH ERROR] Refund Completed Event failed for order ${orderId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * 5. ORDER SHIPPED + TRACKING EMAIL (Physical Products Only)
 * Triggered when status changes to 'shipped'.
 */
export async function dispatchOrderShippedEvent(
  orderId: string,
  courierDetails?: { courierName?: string; trackingNumber?: string; trackingUrl?: string }
) {
  try {
    const adminDb = createAdminClient();
    const { data: order } = await adminDb.from('orders').select('*').eq('id', orderId).single();
    if (!order) return { success: false, error: 'Order not found' };

    const templateId = getTemplateId('BREVO_TEMPLATE_ORDER_SHIPPED');
    const greeting = getGreeting(order.customer_name, order.customer_email);
    const courierName = courierDetails?.courierName || order.courier_name || 'Express Courier';
    const trackingNumber = courierDetails?.trackingNumber || order.tracking_number || 'TRK-' + Date.now().toString().substring(5);
    const trackingUrl = courierDetails?.trackingUrl || order.tracking_url || '#';

    const params = {
      FIRST_NAME: order.customer_name?.split(' ')[0] || order.customer_name,
      CUSTOMER_NAME: order.customer_name,
      ORDER_ID: `#${order.id.substring(0, 8).toUpperCase()}`,
      COURIER_NAME: courierName,
      TRACKING_NUMBER: trackingNumber,
      TRACKING_URL: trackingUrl,
    };

    return await sendBrevoTransactionalEmail({
      eventType: 'order_shipped',
      orderId: order.id,
      toEmail: order.customer_email,
      toName: order.customer_name,
      templateId,
      params,
      subject: `Your Art Package Has Shipped! - Order ${params.ORDER_ID} 📦`,
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #09090b; padding: 28px 24px; text-align: center; border-bottom: 3px solid #d97706;">
            <h1 style="font-family: Georgia, serif; color: #ffffff; font-size: 22px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">DOLLYSTICART</h1>
            <p style="color: #f59e0b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 4px 0 0 0;">SHIPMENT DISPATCH NOTICE</p>
          </div>
          <div style="padding: 28px 24px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #09090b; margin-top: 0;">${greeting}</h2>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
              Exciting news! Your textured artwork package for order <strong>${params.ORDER_ID}</strong> has been carefully packed and handed over to <strong>${courierName}</strong>.
            </p>
            <div style="background-color: #fcfbf9; border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Courier Partner:</strong> ${courierName}</p>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #374151;"><strong>Tracking Number:</strong> <span style="font-family: monospace; font-weight: bold;">${trackingNumber}</span></p>
              <div style="margin-top: 16px;">
                <a href="${trackingUrl}" style="background-color: #09090b; color: #ffffff; text-decoration: none; padding: 10px 20px; font-weight: bold; font-size: 12px; border-radius: 4px; display: inline-block;">TRACK YOUR PACKAGE &rarr;</a>
              </div>
            </div>
            <div style="border-top: 1px solid #f3f4f6; pt: 16px; font-size: 12px; color: #9ca3af; text-align: center;">
              Sent with love from Dollysticart 🎨
            </div>
          </div>
        </div>
      `,
    });
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH ERROR] Order Shipped Event failed for order ${orderId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * 6. OUT FOR DELIVERY EMAIL (Physical Products Only)
 * Triggered when status changes to 'out_for_delivery'.
 */
export async function dispatchOutForDeliveryEvent(orderId: string) {
  try {
    const adminDb = createAdminClient();
    const { data: order } = await adminDb.from('orders').select('*').eq('id', orderId).single();
    if (!order) return { success: false, error: 'Order not found' };

    const templateId = getTemplateId('BREVO_TEMPLATE_OUT_FOR_DELIVERY');
    const greeting = getGreeting(order.customer_name, order.customer_email);
    const params = {
      FIRST_NAME: order.customer_name?.split(' ')[0] || order.customer_name,
      CUSTOMER_NAME: order.customer_name,
      ORDER_ID: `#${order.id.substring(0, 8).toUpperCase()}`,
      TRACKING_NUMBER: order.tracking_number || 'N/A',
      TRACKING_URL: order.tracking_url || '#',
    };

    return await sendBrevoTransactionalEmail({
      eventType: 'out_for_delivery',
      orderId: order.id,
      toEmail: order.customer_email,
      toName: order.customer_name,
      templateId,
      params,
      subject: `Arriving Today! - Order ${params.ORDER_ID} 🚚`,
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #09090b; padding: 28px 24px; text-align: center; border-bottom: 3px solid #f59e0b;">
            <h1 style="font-family: Georgia, serif; color: #ffffff; font-size: 22px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">DOLLYSTICART</h1>
            <p style="color: #fbbf24; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 4px 0 0 0;">OUT FOR DELIVERY TODAY</p>
          </div>
          <div style="padding: 28px 24px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #09090b; margin-top: 0;">${greeting}</h2>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
              Your artwork package for order <strong>${params.ORDER_ID}</strong> is out for delivery today with our courier delivery executive!
            </p>
            <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
              Please ensure someone is available at your delivery address to receive your artwork.
            </p>
            <div style="border-top: 1px solid #f3f4f6; pt: 16px; margin-top: 24px; font-size: 12px; color: #9ca3af; text-align: center;">
              Sent with love from Dollysticart 🎨
            </div>
          </div>
        </div>
      `,
    });
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH ERROR] Out for Delivery Event failed for order ${orderId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * 7. DIGITAL DOWNLOAD EMAIL
 * Triggered after payment verification for digital products.
 */
export async function dispatchDigitalDownloadEvent(orderId: string) {
  try {
    const adminDb = createAdminClient();
    const { data: order } = await adminDb.from('orders').select('*').eq('id', orderId).single();
    if (!order) return { success: false, error: 'Order not found' };

    const digitalAssets = await generateDigitalDownloadSignedUrls(orderId);
    if (digitalAssets.length === 0) return { success: true, skipped: true };

    const templateId = getTemplateId('BREVO_TEMPLATE_DIGITAL_DOWNLOAD');
    const downloadUrl = digitalAssets[0].signedUrl;
    const greeting = getGreeting(order.customer_name, order.customer_email);

    const params = {
      FIRST_NAME: order.customer_name?.split(' ')[0] || order.customer_name,
      CUSTOMER_NAME: order.customer_name,
      ORDER_ID: `#${order.id.substring(0, 8).toUpperCase()}`,
      DOWNLOAD_URL: downloadUrl,
      EXPIRES_DAYS: digitalAssets[0].expiresInDays || 7,
      ACCOUNT_URL: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/account`,
    };

    return await sendBrevoTransactionalEmail({
      eventType: 'digital_download',
      orderId: order.id,
      toEmail: order.customer_email,
      toName: order.customer_name,
      templateId,
      params,
      subject: `Your Digital Artwork Download - Order ${params.ORDER_ID} 🖼️`,
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #09090b; padding: 28px 24px; text-align: center; border-bottom: 3px solid #8b5cf6;">
            <h1 style="font-family: Georgia, serif; color: #ffffff; font-size: 22px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">DOLLYSTICART</h1>
            <p style="color: #c4b5fd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 4px 0 0 0;">DIGITAL ASSET DOWNLOAD</p>
          </div>
          <div style="padding: 28px 24px;">
            <h2 style="font-size: 18px; font-weight: 700; color: #09090b; margin-top: 0;">${greeting}</h2>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
              Your high-resolution digital artwork download link for order <strong>${params.ORDER_ID}</strong> is ready!
            </p>
            <div style="margin: 24px 0; text-align: center;">
              <a href="${downloadUrl}" style="background-color: #09090b; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: bold; font-size: 13px; border-radius: 4px; display: inline-block;">
                DOWNLOAD DIGITAL ARTWORK &rarr;
              </a>
            </div>
            <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">
              This link is active for ${params.EXPIRES_DAYS} days. You also have <strong>lifetime access</strong> to re-generate download links anytime by logging into your <a href="${params.ACCOUNT_URL}" style="color: #8b5cf6; font-weight: bold; text-decoration: underline;">Customer Account</a>.
            </p>
            <div style="border-top: 1px solid #f3f4f6; pt: 16px; margin-top: 24px; font-size: 12px; color: #9ca3af; text-align: center;">
              Sent with love from Dollysticart 🎨
            </div>
          </div>
        </div>
      `,
    });
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH ERROR] Digital Download Event failed for order ${orderId}:`, err);
    return { success: false, error: err.message };
  }
}
