if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY environment variable is not defined. Email notifications will operate in logs-only mock mode.');
}

export async function sendInvoiceEmail(order: any, items: any[], pdfBuffer: Buffer) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = order.customer_email;
  
  if (!apiKey || apiKey.includes('your_resend_api_key')) {
    console.log(`[MOCK EMAIL] Simulating invoice email dispatch:
      From: Dollysticart <onboarding@resend.dev>
      To: ${toEmail}
      Subject: Your Dollysticart Invoice - Order #${order.id.substring(0, 8).toUpperCase()}
      PDF Attachment: invoice_${order.id.substring(0, 8)}.pdf (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
    return;
  }

  const fromEmail = process.env.EMAIL_FROM || 'Dollysticart <onboarding@resend.dev>';
  const subject = `Your Dollysticart Invoice - Order #${order.id.substring(0, 8).toUpperCase()}`;
  const base64Content = pdfBuffer.toString('base64');

  const payload = {
    from: fromEmail,
    to: toEmail,
    subject: subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f3f4f6;">
        <h2 style="font-family: Georgia, serif; letter-spacing: 2px; margin-bottom: 20px; color: #000000;">DOLLYSTICART</h2>
        <p style="font-size: 14px; color: #333333;">Dear ${order.customer_name},</p>
        <p style="font-size: 14px; color: #333333; line-height: 1.5;">
          Thank you for purchasing fine art from our studio. Your transaction was completed successfully, and your order is now queued for packaging.
        </p>
        
        <div style="margin: 25px 0; padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; font-size: 13px;">
          <h4 style="margin-top: 0; margin-bottom: 10px; text-transform: uppercase; color: #666666; font-size: 10px; letter-spacing: 1px;">Order Information</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #666666; padding-bottom: 5px;">Order Reference:</td>
              <td style="font-family: monospace; font-weight: bold; padding-bottom: 5px;">#${order.id.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="color: #666666; padding-bottom: 5px;">Payment Gateway:</td>
              <td style="padding-bottom: 5px;">Razorpay</td>
            </tr>
            <tr>
              <td style="color: #666666;">Total Paid:</td>
              <td style="font-weight: bold; color: #000000;">INR ${(order.total / 100).toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 14px; color: #333333; line-height: 1.5;">
          We have generated your official invoice receipt and attached it directly to this email as a PDF.
        </p>
        <p style="font-size: 14px; color: #333333; line-height: 1.5;">
          Our shipping division is currently crafting a custom wooden casing to secure your textured canvases during transit. We will email you again with tracking codes once the courier collects the package.
        </p>
        
        <br />
        <p style="font-size: 13px; color: #666666; margin-bottom: 0;">Warm regards,</p>
        <p style="font-size: 14px; font-weight: bold; color: #000000; margin-top: 5px;">Dollysticart Studio</p>
        <p style="font-size: 11px; color: #999999; margin-top: 25px; border-t: 1px solid #e5e7eb; pt: 10px;">
          For support or changes to shipping coordinates, please contact support@dollysticart.com. Bangalore, KA, India.
        </p>
      </div>
    `,
    attachments: [
      {
        content: base64Content,
        filename: `invoice_${order.id.substring(0, 8)}.pdf`,
        type: 'application/pdf',
      },
    ],
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(`Resend API dispatch failed: ${JSON.stringify(errData)}`);
  }

  console.log(`[EMAIL SUCCESS] Invoice email dispatched to ${toEmail} successfully.`);
}
