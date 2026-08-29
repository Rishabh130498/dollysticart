import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronRight, Printer, Calendar, DollarSign, MapPin, ClipboardList } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

// Price Formatter Helper
function formatPrice(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;

  const supabase = await createClient();

  // 1. Verify User Session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    redirect('/account?login=true');
  }

  // 2. Query Order details from DB
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    notFound();
  }

  // 3. Verify Customer Permissions (ensure they own this order or they are admin)
  let isAdmin = false;
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    isAdmin = profile?.role === 'admin';
  } catch (e) {}

  if (order.user_id !== session.user.id && !isAdmin) {
    // Access denied
    redirect('/account');
  }

  // 4. Fetch Order items
  const { data: orderItems, error: itemsErr } = await supabase
    .from('order_items')
    .select('*, products(name, slug)')
    .eq('order_id', orderId);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-muted mb-4">
        <Link href="/account" className="hover:text-accent transition-colors">Account</Link>
        <ChevronRight className="h-3 w-3 text-zinc-700" />
        <span className="text-zinc-500">Orders</span>
        <ChevronRight className="h-3 w-3 text-zinc-700" />
        <span className="text-foreground font-semibold">#{order.id.substring(0, 8)}</span>
      </nav>

      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between border-b border-border-subtle pb-6 gap-4 items-start sm:items-end">
        <div>
          <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">
            Fulfillment Records
          </span>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-foreground">
            Order Details #{order.id.substring(0, 8)}
          </h1>
        </div>

        {/* Print Invoice trigger */}
        <button
          onClick={() => {
            // Simple window print trigger as fallback
            if (typeof window !== 'undefined') window.print();
          }}
          className="h-9 border border-zinc-800 hover:border-accent px-4 py-2 flex items-center gap-2 font-display text-[9px] uppercase tracking-widest text-foreground hover:text-accent transition-colors shrink-0"
        >
          <Printer className="h-3.5 w-3.5" />
          PRINT INVOICE
        </button>
      </div>

      {/* Grid: Order Metadata & Shipping Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans text-xs">
        {/* Core Metadata */}
        <div className="border border-border-subtle bg-[#0c0c0e] p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 text-foreground font-semibold pb-2 border-b border-zinc-900">
            <ClipboardList className="h-4.5 w-4.5 text-accent" />
            <h3 className="font-display text-[9px] uppercase tracking-widest">Metadata</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted">Order Date</span>
              <span className="text-foreground font-medium">
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Fulfillment</span>
              <span className="text-accent uppercase tracking-wider font-semibold text-[9px]">
                {order.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Payment status</span>
              <span className="text-green-500 uppercase tracking-wider font-semibold text-[9px]">
                {order.payment_status}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="border border-border-subtle bg-[#0c0c0e] p-5 space-y-3 md:col-span-2 relative overflow-hidden">
          <div className="flex items-center gap-2 text-foreground font-semibold pb-2 border-b border-zinc-900">
            <MapPin className="h-4.5 w-4.5 text-accent" />
            <h3 className="font-display text-[9px] uppercase tracking-widest">Delivery Address</h3>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{order.customer_name}</p>
            <p className="text-muted leading-relaxed">
              {order.shipping_address?.street || ''}, {order.shipping_address?.city || ''},{' '}
              {order.shipping_address?.state || ''} - {order.shipping_address?.postal_code || ''}
            </p>
            <p className="text-muted pt-1">
              <span className="text-[10px] uppercase text-zinc-600 block sm:inline mr-1">Phone:</span> {order.customer_phone}
            </p>
            <p className="text-muted">
              <span className="text-[10px] uppercase text-zinc-600 block sm:inline mr-1">Email:</span> {order.customer_email}
            </p>
          </div>
        </div>
      </div>

      {/* Purchased Items List */}
      <div className="border border-border-subtle bg-[#0c0c0e]">
        <div className="p-4 sm:p-5 font-display text-[9px] uppercase tracking-widest text-foreground/50 border-b border-border-subtle">
          Purchased Items
        </div>
        
        <div className="divide-y divide-border-subtle">
          {(orderItems || []).map((item: any) => {
            const finalItemPrice = item.price_at_purchase - item.discount_at_purchase;
            return (
              <div key={item.id} className="p-4 sm:p-5 flex justify-between gap-4 items-center">
                <div>
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                    {item.products?.name || 'Uncategorized Product'}
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-sans text-muted mt-1">
                    <span>{formatPrice(finalItemPrice)}</span>
                    <span className="text-zinc-700">&bull;</span>
                    <span>Qty {item.quantity}</span>
                  </div>
                </div>
                
                <span className="font-sans text-xs font-semibold text-foreground shrink-0">
                  {formatPrice(finalItemPrice * item.quantity)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Invoice pricing list */}
        <div className="p-4 sm:p-5 border-t border-border-subtle bg-black/20 flex justify-end font-sans text-xs">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-muted">
                <span>Discount applied</span>
                <span className="text-accent">-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-foreground border-t border-zinc-900 pt-3 text-sm font-bold">
              <span className="font-display uppercase tracking-widest">Total paid</span>
              <span className="text-accent">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Return to Dashboard */}
      <div className="flex justify-center pt-4">
        <Link 
          href="/account"
          className="border border-zinc-800 hover:border-accent px-6 py-2.5 font-display text-[9px] uppercase tracking-widest text-foreground hover:text-accent transition-colors"
        >
          RETURN TO DASHBOARD
        </Link>
      </div>

    </div>
  );
}
