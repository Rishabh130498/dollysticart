import { createAdminClient } from '@/lib/supabase/admin';

export interface BrevoSender {
  name: string;
  email: string;
}

export interface BrevoRecipient {
  name?: string;
  email: string;
}

export interface BrevoAttachment {
  content: string; // Base64 string
  name: string;
}

export interface SendBrevoOptions {
  eventType: string;
  orderId?: string | null;
  toEmail: string;
  toName?: string;
  templateId?: number | null;
  params?: Record<string, any>;
  subject?: string;
  htmlContent?: string;
  attachments?: BrevoAttachment[];
}

/**
 * Parses email string formatted as "Name <email@domain.com>" or returns fallback sender.
 */
export function getBrevoDefaultSender(): BrevoSender {
  const fromInput = process.env.EMAIL_FROM || process.env.BREVO_SENDER_EMAIL;
  const defaultSender = { name: 'Dollysticart', email: 'letsmaildoly@gmail.com' };
  if (!fromInput) return defaultSender;

  const match = fromInput.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim() || 'Dollysticart',
      email: match[2].trim() || 'letsmaildoly@gmail.com',
    };
  }
  if (fromInput.includes('@')) {
    return { name: 'Dollysticart', email: fromInput.trim() };
  }
  return defaultSender;
}

/**
 * Centralized Idempotent Brevo Email Dispatcher
 */
export async function sendBrevoTransactionalEmail(options: SendBrevoOptions): Promise<{
  success: boolean;
  skipped?: boolean;
  messageId?: string;
  error?: string;
}> {
  const {
    eventType,
    orderId,
    toEmail,
    toName,
    templateId,
    params = {},
    subject = 'Dollysticart Notification',
    htmlContent,
    attachments = [],
  } = options;

  const apiKey = process.env.BREVO_API_KEY;
  const isMockMode = !apiKey || apiKey.includes('your_brevo_api_key');

  const adminDb = createAdminClient();

  // 1. Idempotency Check: Verify if email was already sent for this event and order
  if (orderId) {
    try {
      const { data: existingLog } = await adminDb
        .from('email_logs')
        .select('id, status')
        .eq('event_type', eventType)
        .eq('order_id', orderId)
        .eq('status', 'sent')
        .single();

      if (existingLog) {
        console.log(`[BREVO IDEMPOTENCY] Email event '${eventType}' already sent for order ${orderId}. Skipping duplicate.`);
        return { success: true, skipped: true };
      }
    } catch (e) {
      // Ignore query single error if not found
    }
  }

  const sender = getBrevoDefaultSender();
  let logRecordId: string | null = null;

  // 2. Log Pending Email Record in Database
  try {
    const { data: insertedLog } = await adminDb
      .from('email_logs')
      .insert([
        {
          event_type: eventType,
          order_id: orderId || null,
          customer_email: toEmail,
          brevo_template_id: templateId || null,
          status: 'pending',
          attempt_count: 1,
        },
      ])
      .select('id')
      .single();

    if (insertedLog) {
      logRecordId = insertedLog.id;
    }
  } catch (logErr) {
    console.warn('[BREVO LOG WARNING] Failed to insert pending email log record', logErr);
  }

  // 3. Mock Mode Handling (Development / Offline)
  if (isMockMode) {
    const mockMsgId = `msg_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    console.log(`[MOCK BREVO EMAIL DISPATCH]
      Event: ${eventType}
      Template ID: ${templateId || 'None (HTML Content)'}
      To: ${toName || ''} <${toEmail}>
      Subject: ${subject}
      Params: ${JSON.stringify(params)}
      Attachments: ${attachments.length} file(s)`);

    if (logRecordId) {
      await adminDb
        .from('email_logs')
        .update({
          status: 'sent',
          provider_message_id: mockMsgId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', logRecordId);
    }

    return { success: true, messageId: mockMsgId };
  }

  // 4. Build Brevo Transactional Email Payload
  const payload: Record<string, any> = {
    sender,
    to: [
      {
        email: toEmail,
        name: toName || toEmail.split('@')[0],
      },
    ],
  };

  if (templateId) {
    payload.templateId = templateId;
    payload.params = params;
  } else {
    payload.subject = subject;
    payload.htmlContent = htmlContent || `<p>Hello ${toName || 'Valued Customer'}, thank you for shopping with Dollysticart.</p>`;
    if (Object.keys(params).length > 0) {
      payload.params = params;
    }
  }

  if (attachments.length > 0) {
    payload.attachment = attachments.map((att) => ({
      content: att.content,
      name: att.name,
    }));
  }

  // 5. Execute Brevo API Request
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();

    if (!response.ok) {
      const errorMsg = resData.message || JSON.stringify(resData);
      console.error('[BREVO API ERROR]', errorMsg);

      if (logRecordId) {
        await adminDb
          .from('email_logs')
          .update({
            status: 'failed',
            error_message: errorMsg,
            updated_at: new Date().toISOString(),
          })
          .eq('id', logRecordId);
      }

      return { success: false, error: errorMsg };
    }

    const messageId = resData.messageId || resData.messageIds?.[0] || 'sent';

    if (logRecordId) {
      await adminDb
        .from('email_logs')
        .update({
          status: 'sent',
          provider_message_id: messageId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', logRecordId);
    }

    console.log(`[BREVO EMAIL SUCCESS] Sent '${eventType}' email to ${toEmail}. Message ID: ${messageId}`);
    return { success: true, messageId };
  } catch (err: any) {
    const errorMsg = err.message || 'Network dispatch error';
    console.error('[BREVO DISPATCH ERROR]', err);

    if (logRecordId) {
      await adminDb
        .from('email_logs')
        .update({
          status: 'failed',
          error_message: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq('id', logRecordId);
    }

    return { success: false, error: errorMsg };
  }
}

/**
 * Legacy compatibility export for sendInvoiceEmail
 */
export async function sendInvoiceEmail(order: any, items: any[], pdfBuffer: Buffer) {
  const templateId = process.env.BREVO_TEMPLATE_ORDER_CONFIRMATION 
    ? parseInt(process.env.BREVO_TEMPLATE_ORDER_CONFIRMATION, 10) 
    : null;

  const pdfBase64 = pdfBuffer.toString('base64');
  const invoiceNumber = `INV-${order.id.substring(0, 8).toUpperCase()}`;
  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedItems = items.map((item) => ({
    name: item.products?.name || item.name || 'Artwork Item',
    quantity: item.quantity,
    price: `₹${((item.price_at_purchase || item.regular_price) / 100).toFixed(2)}`,
  }));

  const params = {
    FIRST_NAME: order.customer_name?.split(' ')[0] || order.customer_name || 'Customer',
    CUSTOMER_NAME: order.customer_name,
    ORDER_ID: `#${order.id.substring(0, 8).toUpperCase()}`,
    ORDER_DATE: orderDate,
    INVOICE_NUMBER: invoiceNumber,
    SUBTOTAL: `₹${(order.subtotal / 100).toFixed(2)}`,
    DISCOUNT: order.discount ? `₹${(order.discount / 100).toFixed(2)}` : '₹0.00',
    TAX: '₹0.00',
    SHIPPING: 'FREE',
    TOTAL: `₹${(order.total / 100).toFixed(2)}`,
    PAYMENT_ID: order.razorpay_payment_id || 'N/A',
    PAYMENT_STATUS: (order.payment_status || 'paid').toUpperCase(),
    ITEMS: formattedItems,
  };

  const greeting = order.customer_name?.split(' ')[0] 
    ? `Hello ${order.customer_name.split(' ')[0]} ✨` 
    : order.customer_email 
    ? `Hello ${order.customer_email.split('@')[0]} ✨` 
    : 'Hello Art Lover ✨';

  const itemsHtml = formattedItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 16px; font-size: 13px; color: #1f2937; border-bottom: 1px solid #f3f4f6;">${item.name}</td>
      <td style="padding: 12px 16px; font-size: 13px; color: #4b5563; text-align: center; border-bottom: 1px solid #f3f4f6;">x${item.quantity}</td>
      <td style="padding: 12px 16px; font-size: 13px; color: #111827; font-weight: bold; text-align: right; border-bottom: 1px solid #f3f4f6;">${item.price}</td>
    </tr>`
    )
    .join('');

  return sendBrevoTransactionalEmail({
    eventType: 'order_confirmation',
    orderId: order.id,
    toEmail: order.customer_email,
    toName: order.customer_name,
    templateId,
    params,
    subject: `Receipt & Order Confirmation - ${params.ORDER_ID} | Dollysticart`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #09090b; padding: 32px 24px; text-align: center; border-bottom: 3px solid #d97706;">
          <h1 style="font-family: Georgia, serif; color: #ffffff; font-size: 24px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0;">DOLLYSTICART</h1>
          <p style="color: #a1a1aa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 6px 0 0 0;">PREMIUM ARTWORK & SCRIBBLE COLLECTION</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px 24px;">
          <h2 style="font-size: 20px; font-weight: 700; color: #09090b; margin-top: 0; margin-bottom: 12px;">${greeting}</h2>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
            Thank you so much for choosing Dollysticart! We have received your payment and registered your order <strong>${params.ORDER_ID}</strong>. Your official PDF invoice is attached to this email.
          </p>

          <!-- Order Summary Card -->
          <div style="background-color: #fcfbf9; border: 1px solid #f3f4f6; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; border-b: 1px solid #e5e7eb; pb: 12px; margin-bottom: 12px;">
              <span style="font-size: 12px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Order Reference</span>
              <span style="font-size: 12px; font-weight: bold; color: #09090b; font-family: monospace;">${params.ORDER_ID}</span>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 8px 16px; font-size: 11px; text-transform: uppercase; color: #4b5563; text-align: left;">Item</th>
                  <th style="padding: 8px 16px; font-size: 11px; text-transform: uppercase; color: #4b5563; text-align: center;">Qty</th>
                  <th style="padding: 8px 16px; font-size: 11px; text-transform: uppercase; color: #4b5563; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="margin-top: 16px; border-top: 1px solid #e5e7eb; pt: 12px; text-align: right;">
              <p style="margin: 4px 0; font-size: 13px; color: #4b5563;">Subtotal: <strong>${params.SUBTOTAL}</strong></p>
              <p style="margin: 4px 0; font-size: 13px; color: #4b5563;">Shipping: <strong>${params.SHIPPING}</strong></p>
              <p style="margin: 8px 0 0 0; font-size: 16px; color: #09090b; font-weight: bold;">Total Paid: <span style="color: #d97706;">${params.TOTAL}</span></p>
            </div>
          </div>

          <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 24px;">
            If you have any questions or custom requests regarding your order, simply reply directly to this email or contact us at <a href="mailto:letsmaildoly@gmail.com" style="color: #d97706; text-decoration: underline;">letsmaildoly@gmail.com</a>.
          </p>

          <!-- Signature -->
          <div style="border-top: 1px solid #f3f4f6; pt: 20px; font-size: 13px; color: #374151;">
            <p style="margin: 0; font-weight: bold;">With artistic warmth,</p>
            <p style="margin: 4px 0 0 0; color: #6b7280;">Dollysticart Team 🎨</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 11px; color: #9ca3af;">
          <p style="margin: 0 0 4px 0;">© ${new Date().getFullYear()} Dollysticart. All rights reserved.</p>
          <p style="margin: 0;">Sent with ❤️ to ${order.customer_email}</p>
        </div>
      </div>
    `,
    attachments: [
      {
        content: pdfBase64,
        name: `invoice_${order.id.substring(0, 8)}.pdf`,
      },
    ],
  });
}
