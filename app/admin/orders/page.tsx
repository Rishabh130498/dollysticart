'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, ChevronRight, Eye, Calendar, User, DollarSign, Mail, Phone, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { updateAdminOrderStatusAction } from '@/app/actions/admin-order-actions';

// Price Formatter Helper
function formatPrice(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const supabase = createClient();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Update order status trigger using server action
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    let trackingInfo: any = {};

    if (newStatus === 'shipped') {
      const courierName = prompt('Enter Courier Provider Name:', 'BlueDart Express') || 'Express Courier';
      const trackingNumber = prompt('Enter Tracking Number:', 'TRK-' + Math.floor(Math.random() * 1000000)) || '';
      const trackingUrl = prompt('Enter Tracking URL:', 'https://www.bluedart.com') || '';
      trackingInfo = { courier_name: courierName, tracking_number: trackingNumber, tracking_url: trackingUrl };
    } else if (newStatus === 'cancelled' || newStatus === 'refunded') {
      if (!confirm(`Are you sure you want to mark order #${orderId.substring(0, 8)} as ${newStatus}?`)) {
        return;
      }
    }

    setUpdatingId(orderId);
    try {
      const res = await updateAdminOrderStatusAction(orderId, newStatus, trackingInfo);

      if (!res.success) {
        throw new Error(res.error || 'Failed to update order status');
      }

      setOrders(items => items.map(item => item.id === orderId ? {
        ...item,
        status: newStatus,
        payment_status: newStatus === 'refunded' ? 'refunded' : item.payment_status,
        ...trackingInfo
      } : item));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter lists
  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'paid') return order.payment_status === 'paid';
    return order.status === activeFilter;
  });

  if (loading) {
    return (
      <div className="text-center py-20">
        <span className="font-display text-xs tracking-widest text-muted uppercase">LOADING ORDERS LOGS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-border-subtle pb-6">
        <div>
          <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">Fulfillment Panel</span>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-wide">Orders Ledger</h1>
        </div>
      </div>

      {/* Filter options bar */}
      <div className="flex gap-4 border-b border-zinc-900 pb-4 font-display text-[9px] tracking-widest uppercase">
        {[
          { label: 'ALL TRANSACTIONS', filter: 'all' },
          { label: 'PENDING', filter: 'pending' },
          { label: 'PAID RECEIPTS', filter: 'paid' },
          { label: 'SHIPPED COURIERS', filter: 'shipped' },
          { label: 'COMPLETED', filter: 'completed' },
        ].map(opt => (
          <button
            key={opt.filter}
            onClick={() => setActiveFilter(opt.filter)}
            className={`pb-1.5 border-b font-bold transition-all ${
              activeFilter === opt.filter 
                ? 'border-accent text-accent' 
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Orders List Table */}
      {filteredOrders.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-zinc-900">
          <span className="font-display text-xs text-muted tracking-widest uppercase">No orders logged</span>
        </div>
      ) : (
        <div className="border border-border-subtle bg-[#0c0c0e] overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-border-subtle font-display text-[9px] uppercase tracking-widest text-muted bg-black/40">
                <th className="p-4 sm:p-5">Order ID</th>
                <th className="p-4 sm:p-5">Purchase Date</th>
                <th className="p-4 sm:p-5">Customer details</th>
                <th className="p-4 sm:p-5">Total Paid</th>
                <th className="p-4 sm:p-5">Payment / Delivery</th>
                <th className="p-4 sm:p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-950/40 transition-colors">
                  
                  {/* ID */}
                  <td className="p-4 sm:p-5 font-mono font-semibold uppercase">
                    #{order.id.substring(0, 8)}
                  </td>

                  {/* Date */}
                  <td className="p-4 sm:p-5 text-muted">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  {/* Customer details */}
                  <td className="p-4 sm:p-5 space-y-1">
                    <div className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                      {order.customer_name}
                    </div>
                    <span className="text-[10px] text-muted block">{order.customer_email}</span>
                    <span className="text-[10px] text-muted block">{order.customer_phone}</span>
                  </td>

                  {/* Price */}
                  <td className="p-4 sm:p-5 font-mono text-foreground font-semibold">
                    {formatPrice(order.total)}
                  </td>

                  {/* Status tag */}
                  <td className="p-4 sm:p-5 space-y-1.5">
                    <div className="flex gap-2">
                      <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 border font-semibold ${
                        order.payment_status === 'paid'
                          ? 'border-green-500/20 bg-green-500/5 text-green-500'
                          : 'border-amber-500/20 bg-amber-500/5 text-amber-500'
                      }`}>
                        {order.payment_status}
                      </span>
                      
                      <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 border font-semibold ${
                        order.status === 'completed' || order.status === 'shipped'
                          ? 'border-green-500/20 bg-green-500/5 text-green-500'
                          : 'border-zinc-800 bg-background text-muted'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </td>

                  {/* Quick status updates actions */}
                  <td className="p-4 sm:p-5 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      {/* Mark Shipped */}
                      {order.status === 'paid' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'shipped')}
                          disabled={updatingId === order.id}
                          className="h-8 px-3 border border-zinc-800 hover:border-accent text-zinc-400 hover:text-accent font-display text-[8px] uppercase tracking-widest transition-all rounded disabled:opacity-50"
                        >
                          SHIP PACKAGE
                        </button>
                      )}

                      {/* Mark Out for Delivery */}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                          disabled={updatingId === order.id}
                          className="h-8 px-3 border border-zinc-800 hover:border-amber-400 text-zinc-400 hover:text-amber-400 font-display text-[8px] uppercase tracking-widest transition-all rounded disabled:opacity-50"
                        >
                          OUT FOR DELIVERY
                        </button>
                      )}

                      {/* Mark Completed */}
                      {(order.status === 'shipped' || order.status === 'out_for_delivery') && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          disabled={updatingId === order.id}
                          className="h-8 px-3 border border-zinc-800 hover:border-accent text-zinc-400 hover:text-accent font-display text-[8px] uppercase tracking-widest transition-all rounded disabled:opacity-50"
                        >
                          COMPLETE ORDER
                        </button>
                      )}

                      {/* Cancel Order */}
                      {order.status !== 'cancelled' && order.status !== 'completed' && order.status !== 'refunded' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          disabled={updatingId === order.id}
                          className="h-8 px-2.5 border border-zinc-800 hover:border-red-500/50 text-zinc-500 hover:text-red-400 font-display text-[8px] uppercase tracking-widest transition-all rounded disabled:opacity-50"
                          title="Cancel Order & Send Email"
                        >
                          CANCEL
                        </button>
                      )}

                      {/* Mark Refunded */}
                      {order.payment_status === 'paid' && order.status !== 'refunded' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'refunded')}
                          disabled={updatingId === order.id}
                          className="h-8 px-2.5 border border-zinc-800 hover:border-purple-500/50 text-zinc-500 hover:text-purple-400 font-display text-[8px] uppercase tracking-widest transition-all rounded disabled:opacity-50"
                          title="Mark Refunded & Send Email"
                        >
                          REFUND
                        </button>
                      )}

                      {/* Detail Invoice Redirect */}
                      <Link
                        href={`/account/orders/${order.id}`}
                        target="_blank"
                        className="h-8 w-8 flex items-center justify-center border border-zinc-800 hover:border-accent text-zinc-500 hover:text-accent transition-all rounded"
                        title="Open Invoice View"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
