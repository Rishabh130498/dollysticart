'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  dispatchOrderShippedEvent,
  dispatchOutForDeliveryEvent,
  dispatchOrderCancelledEvent,
  dispatchRefundCompletedEvent,
} from '@/lib/email/email-events';

export async function updateAdminOrderStatusAction(
  orderId: string,
  newStatus: string,
  trackingInfo?: { courier_name?: string; tracking_number?: string; tracking_url?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || user.email?.toLowerCase() === 'rishabhagarwal.me@gmail.com';
    if (!isAdmin) {
      return { success: false, error: 'Admin permissions required' };
    }

    const adminDb = createAdminClient();

    // Prepare update payload
    const updatePayload: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'refunded') {
      updatePayload.payment_status = 'refunded';
    }

    if (trackingInfo?.courier_name) updatePayload.courier_name = trackingInfo.courier_name;
    if (trackingInfo?.tracking_number) updatePayload.tracking_number = trackingInfo.tracking_number;
    if (trackingInfo?.tracking_url) updatePayload.tracking_url = trackingInfo.tracking_url;

    const { error: updateErr } = await adminDb
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Dispatch corresponding Brevo email events asynchronously
    if (newStatus === 'shipped') {
      await dispatchOrderShippedEvent(orderId, {
        courierName: trackingInfo?.courier_name,
        trackingNumber: trackingInfo?.tracking_number,
        trackingUrl: trackingInfo?.tracking_url,
      });
    } else if (newStatus === 'out_for_delivery') {
      await dispatchOutForDeliveryEvent(orderId);
    } else if (newStatus === 'cancelled') {
      await dispatchOrderCancelledEvent(orderId);
    } else if (newStatus === 'refunded') {
      await dispatchRefundCompletedEvent(orderId);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error updating order status:', err);
    return { success: false, error: err.message || 'Internal server error' };
  }
}
