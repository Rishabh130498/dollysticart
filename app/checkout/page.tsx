'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { ShoppingBag, Lock, MapPin, Mail, Phone, User, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Price Formatter Helper
function formatPrice(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Shipping details state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Mock Sandbox State
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [sandboxOrderData, setSandboxOrderData] = useState<any>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const initCheckout = async () => {
      setLoading(true);
      
      // 1. Get user session
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        setEmail(currentUser.email || '');
        setName(currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '');
      }

      // 2. Fetch cart contents (Support DB if logged in, else localStorage)
      let items: any[] = [];
      if (currentUser) {
        const { data: dbCart } = await supabase
          .from('cart_items')
          .select('*, products(*, categories(name))')
          .eq('user_id', currentUser.id);
        
        if (dbCart && dbCart.length > 0) {
          items = dbCart.map((item: any) => ({
            productId: item.product_id,
            name: item.products.name,
            slug: item.products.slug,
            quantity: item.quantity,
            regular_price: item.products.regular_price,
            discounted_price: item.products.discounted_price,
            category_name: item.products.categories?.name || 'Uncategorized'
          }));
        }
      } else {
        try {
          items = JSON.parse(localStorage.getItem('dollysticart_cart') || '[]');
        } catch (e) {
          console.error(e);
        }
      }

      setCartItems(items);
      
      // Redirect if cart is empty
      if (items.length === 0) {
        router.push('/cart');
      } else {
        setLoading(false);
      }
    };

    initCheckout();
  }, [supabase, router]);

  // Compute Subtotal
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.discounted_price ?? item.regular_price;
    return sum + (price * item.quantity);
  }, 0);

  // Submit checkout flow
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    // Validations
    if (!name || !email || !phone || !street || !city || !state || !postalCode) {
      setErrorMsg('Please populate all shipping and address fields.');
      setSubmitting(false);
      return;
    }

    try {
      // 1. Send checkout items to order generator API (Never trust client pricing totals!)
      const orderPayload = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        shipping: {
          name,
          email,
          phone,
          street,
          city,
          state,
          postal_code: postalCode
        }
      };

      const res = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || 'Server failed to calculate order totals.');
      }

      // 2. Open payment gateway flow
      if (orderData.isMock) {
        // Toggle Sandbox testing layout directly
        setSandboxOrderData(orderData);
        setShowSandboxModal(true);
      } else {
        // Run Razorpay Overlay SDK
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Dollysticart Studio',
          description: 'Premium Art Purchase',
          order_id: orderData.razorpayOrderId,
          handler: async function (response: any) {
            // Verify payment on the server
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              // Clear Cart locally
              localStorage.removeItem('dollysticart_cart');
              if (user) {
                await supabase.from('cart_items').delete().eq('user_id', user.id);
              }
              window.dispatchEvent(new Event('cart-updated'));
              router.push(`/checkout/success?id=${verifyData.orderId}`);
            } else {
              router.push('/checkout/failed');
            }
          },
          prefill: {
            name: name,
            email: email,
            contact: phone
          },
          theme: {
            color: '#d2ff00' // Brand highlighter accent
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          console.error(response.error);
          router.push('/checkout/failed');
        });
        rzp.open();
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Payment initiation failed. Please try again.');
      setSubmitting(false);
    }
  };

  // Handle Mock Payment completion success/failure toggles
  const handleSandboxPayment = async (status: 'success' | 'failure') => {
    setShowSandboxModal(false);
    if (status === 'failure') {
      router.push('/checkout/failed');
      return;
    }

    try {
      const verifyRes = await fetch('/api/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 10)}`,
          razorpay_order_id: sandboxOrderData.razorpayOrderId,
          razorpay_signature: 'mock_signature'
        })
      });

      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.success) {
        // Clear Cart
        localStorage.removeItem('dollysticart_cart');
        if (user) {
          await supabase.from('cart_items').delete().eq('user_id', user.id);
        }
        window.dispatchEvent(new Event('cart-updated'));
        router.push(`/checkout/success?id=${verifyData.orderId}`);
      } else {
        router.push('/checkout/failed');
      }
    } catch (e) {
      console.error(e);
      router.push('/checkout/failed');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-20 text-center">
        <span className="font-display text-xs tracking-widest text-muted uppercase">LOADING CHECKOUT...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      
      {/* Dynamic SDK Script Injection */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <h1 className="font-display text-2xl md:text-3xl font-extrabold uppercase tracking-wide border-b border-border-subtle pb-6 mb-8 md:mb-12">
        Fulfillment Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        
        {/* Left: Fulfillment Address Forms */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCheckoutSubmit} className="border border-border-subtle bg-[#0c0c0e] p-6 sm:p-8 space-y-6 relative">
            <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground/50 border-b border-zinc-900 pb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              Shipping Information
            </h2>

            {errorMsg && (
              <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 font-sans text-xs">
                {errorMsg}
              </div>
            )}

            {/* Customer Details info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1">
                  <User className="h-3 w-3" /> Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9999999999"
                  className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="font-display text-[9px] uppercase tracking-widest text-muted flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            {/* Address fields */}
            <div className="flex flex-col space-y-1">
              <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                Street Address
              </label>
              <input
                type="text"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. Apt 4B, 12th Main Road, Indiranagar"
                className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bangalore"
                  className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                  State
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Karnataka"
                  className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                  Pin Code / Postal
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="560038"
                  className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="pt-4 border-t border-zinc-900 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto h-12 px-8 flex items-center justify-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest bg-accent text-black border border-accent hover:bg-transparent hover:text-accent hover:border-accent transition-all duration-300 disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                {submitting ? 'VALIDATING PRICING...' : 'CONFIRM AND PAY'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Cart Overview summary */}
        <div className="lg:col-span-5 border border-border-subtle bg-[#0c0c0e] p-6 space-y-6">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground/50 border-b border-zinc-900 pb-3 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-accent" />
            Order Overview
          </h2>

          {/* Cart items list */}
          <div className="divide-y divide-zinc-900 max-h-60 overflow-y-auto pr-2">
            {cartItems.map((item) => {
              const itemPrice = item.discounted_price ?? item.regular_price;
              return (
                <div key={item.productId} className="py-3 flex justify-between gap-4 text-xs font-sans">
                  <div className="min-w-0">
                    <h4 className="font-display text-[11px] font-bold uppercase tracking-wider text-foreground truncate">
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-muted">
                      Qty {item.quantity} &bull; {formatPrice(itemPrice)} each
                    </span>
                  </div>
                  <span className="font-semibold text-foreground shrink-0 font-sans">
                    {formatPrice(itemPrice * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Totals panel */}
          <div className="border-t border-zinc-900 pt-4 space-y-2.5 font-sans text-xs">
            <div className="flex justify-between text-muted">
              <span>Items Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Shipping Delivery</span>
              <span className="text-[10px] uppercase text-accent font-semibold tracking-wider">Free Shipping</span>
            </div>
            
            <div className="flex justify-between text-foreground border-t border-zinc-900 pt-3 text-sm font-bold">
              <span className="font-display uppercase tracking-widest">Total Amount</span>
              <span className="text-accent">{formatPrice(subtotal)}</span>
            </div>
          </div>

          <div className="pt-2 flex gap-2 text-[10px] text-muted leading-relaxed font-sans items-start border-t border-zinc-900">
            <Lock className="h-3.5 w-3.5 text-zinc-700 shrink-0 mt-0.5" />
            <p>
              Your payment credentials are encrypted by Razorpay SSL gateways. We do not store or process card information directly inside Dollysticart.
            </p>
          </div>
        </div>

      </div>

      {/* 5. Custom Sandbox payment modal overlay */}
      {showSandboxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-overlay backdrop-blur-sm" />
          
          <div className="relative w-full max-w-md border border-accent/20 bg-background p-6 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent mb-2">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-md font-bold uppercase tracking-widest text-accent">
                Razorpay Sandbox payment
              </h3>
              <p className="font-sans text-xs text-muted max-w-sm mx-auto leading-relaxed">
                We detected that no Razorpay API keys are configured on the server. You are in local testing sandbox mode. Select an action to simulate payment verification.
              </p>
            </div>

            <div className="p-4 border border-zinc-900 bg-[#0c0c0e] font-sans text-xs text-left space-y-1.5 rounded">
              <div className="flex justify-between text-muted">
                <span>Internal Order Reference</span>
                <span className="font-mono text-[10px] text-foreground">{sandboxOrderData?.orderId.substring(0, 10)}...</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Mock Payment Amount</span>
                <span className="font-semibold text-foreground">{formatPrice(sandboxOrderData?.amount || 0)}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleSandboxPayment('success')}
                className="flex-1 h-11 flex items-center justify-center font-display text-[9px] font-bold uppercase tracking-widest bg-accent text-black hover:bg-accent-dark transition-colors border border-accent"
              >
                SIMULATE SUCCESS
              </button>
              
              <button
                onClick={() => handleSandboxPayment('failure')}
                className="flex-1 h-11 flex items-center justify-center font-display text-[9px] font-bold uppercase tracking-widest border border-zinc-800 hover:border-red-500 hover:text-red-500 text-foreground bg-transparent transition-all"
              >
                SIMULATE FAILURE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
