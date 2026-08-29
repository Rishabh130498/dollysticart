import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, ShoppingBag } from 'lucide-react';

export default function CheckoutFailedPage() {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-20 text-center space-y-6 animate-in fade-in duration-300">
      <AlertCircle className="h-16 w-16 text-amber-500 mx-auto animate-pulse" />
      
      <div className="space-y-2">
        <span className="font-display text-[9px] uppercase tracking-[0.25em] text-amber-500 font-semibold">
          Transaction Cancelled
        </span>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">
          Payment Aborted
        </h1>
        <p className="font-sans text-xs text-muted max-w-sm mx-auto leading-relaxed">
          Your payment attempt was declined or terminated by the payment gateway. No funds were debited. You can review your card details and try again.
        </p>
      </div>

      <div className="flex justify-center gap-4 pt-4 max-w-xs mx-auto">
        <Link
          href="/checkout"
          className="flex-1 h-11 border border-zinc-800 hover:border-accent flex items-center justify-center gap-1.5 font-display text-[9px] uppercase tracking-widest text-foreground hover:text-accent transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          RETRY CHECKOUT
        </Link>
        
        <Link
          href="/cart"
          className="flex-1 h-11 bg-accent text-black hover:bg-accent-dark flex items-center justify-center gap-1.5 font-display text-[9px] uppercase tracking-widest font-bold transition-colors border border-accent"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          RETURN TO BAG
        </Link>
      </div>
    </div>
  );
}
