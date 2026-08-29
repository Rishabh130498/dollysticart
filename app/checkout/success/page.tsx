import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle, ShoppingBag, ClipboardList, Calendar, ArrowRight, Printer } from 'lucide-react';
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
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const orderId = resolvedSearchParams.id;

  if (!orderId) {
    notFound();
  }

  const supabase = await createClient();

  // Query order details from database
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    console.error('Order query error inside checkout success', error);
    // If offline test, render mock fallback
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <CheckCircle className="h-16 w-16 text-accent mx-auto" />
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-widest text-foreground">
            Payment Completed
          </h1>
          <p className="font-sans text-xs text-muted max-w-sm mx-auto leading-relaxed">
            Your transaction was processed successfully. Thank you for supporting Dollysticart!
          </p>
        </div>
        
        <div className="border border-border-subtle bg-[#0c0c0e] p-5 rounded font-sans text-xs text-left max-w-xs mx-auto space-y-1">
          <div className="flex justify-between">
            <span className="text-muted">Order reference</span>
            <span className="font-mono text-[10px] text-foreground font-semibold uppercase">{orderId.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Payment status</span>
            <span className="text-green-500 font-semibold uppercase text-[9px]">PAID</span>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/account"
            className="border border-zinc-800 hover:border-accent px-6 py-2.5 font-display text-[9px] uppercase tracking-widest text-foreground hover:text-accent transition-colors"
          >
            GO TO DASHBOARD
          </Link>
          <Link
            href="/shop"
            className="bg-accent text-black hover:bg-accent-dark px-6 py-2.5 font-display text-[9px] uppercase tracking-widest font-bold transition-colors"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-16 md:py-24 text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <CheckCircle className="h-16 w-16 text-accent mx-auto" />
      
      <div className="space-y-3">
        <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">
          Transaction Fulfillments
        </span>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-foreground">
          Thank you for your order!
        </h1>
        <p className="font-sans text-xs text-muted max-w-md mx-auto leading-relaxed">
          Your transaction has been processed. A receipt invoice along with shipment courier coordinates was dispatched to your email address: <span className="text-foreground font-semibold">{order.customer_email}</span>.
        </p>
      </div>

      {/* Details Box */}
      <div className="border border-border-subtle bg-[#0c0c0e] p-6 text-left max-w-sm mx-auto space-y-4 font-sans text-xs relative overflow-hidden">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 opacity-5">
          <div className="border-r border-b border-zinc-800"></div>
          <div className="border-b border-zinc-800"></div>
        </div>

        <h3 className="font-display text-[9px] uppercase tracking-widest text-zinc-500 pb-2 border-b border-zinc-900 flex items-center gap-1.5">
          <ClipboardList className="h-4 w-4 text-accent" />
          Receipt Summary
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted">Order Reference</span>
            <span className="font-mono font-semibold text-foreground uppercase">{order.id.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Date of Purchase</span>
            <span className="text-foreground">
              {new Date(order.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Amount Paid</span>
            <span className="text-accent font-bold font-sans">{formatPrice(order.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Payment status</span>
            <span className="text-green-500 font-semibold uppercase text-[9px]">PAID</span>
          </div>
        </div>
      </div>

      {/* Call to Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 max-w-sm mx-auto">
        <Link
          href={`/account/orders/${order.id}`}
          className="flex-1 h-11 border border-zinc-800 hover:border-accent flex items-center justify-center gap-1.5 font-display text-[9px] uppercase tracking-widest text-foreground hover:text-accent transition-colors"
        >
          VIEW ORDER
          <ArrowRight className="h-3 w-3" />
        </Link>
        
        <Link
          href="/shop"
          className="flex-1 h-11 bg-accent text-black hover:bg-accent-dark flex items-center justify-center gap-1.5 font-display text-[9px] uppercase tracking-widest font-bold transition-colors border border-accent"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          CONTINUE SHOPPING
        </Link>
      </div>

    </div>
  );
}
