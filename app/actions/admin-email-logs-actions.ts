'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  dispatchOrderConfirmationEvent,
  dispatchPaymentFailedEvent,
  dispatchOrderCancelledEvent,
  dispatchRefundCompletedEvent,
  dispatchOrderShippedEvent,
  dispatchOutForDeliveryEvent,
  dispatchDigitalDownloadEvent,
} from '@/lib/email/email-events';

export async function fetchEmailLogsAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Authentication required' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || user.email?.toLowerCase() === 'rishabhagarwal.me@gmail.com';
    if (!isAdmin) return { success: false, error: 'Admin access required' };

    const adminDb = createAdminClient();
    const { data: logs, error } = await adminDb
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return { success: false, error: error.message };

    return { success: true, data: logs || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function retryFailedEmailAction(logId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };

    const adminDb = createAdminClient();
    const { data: logRow } = await adminDb
      .from('email_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (!logRow) return { success: false, error: 'Log entry not found' };

    // Increment attempt count
    await adminDb.from('email_logs').update({ attempt_count: logRow.attempt_count + 1 }).eq('id', logId);

    if (logRow.order_id) {
      if (logRow.event_type === 'order_confirmation') {
        return await dispatchOrderConfirmationEvent(logRow.order_id);
      } else if (logRow.event_type === 'payment_failed') {
        return await dispatchPaymentFailedEvent(logRow.order_id);
      } else if (logRow.event_type === 'order_cancelled') {
        return await dispatchOrderCancelledEvent(logRow.order_id);
      } else if (logRow.event_type === 'refund_completed') {
        return await dispatchRefundCompletedEvent(logRow.order_id);
      } else if (logRow.event_type === 'order_shipped') {
        return await dispatchOrderShippedEvent(logRow.order_id);
      } else if (logRow.event_type === 'out_for_delivery') {
        return await dispatchOutForDeliveryEvent(logRow.order_id);
      } else if (logRow.event_type === 'digital_download') {
        return await dispatchDigitalDownloadEvent(logRow.order_id);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
