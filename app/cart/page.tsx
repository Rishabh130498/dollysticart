'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, ShieldCheck, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Price Formatter Helper
function formatPrice(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
}

// Custom Blank Placeholder for Cart thumbnails
function CartThumbPlaceholder({ label }: { label: string }) {
  return (
    <div className="w-12 h-16 bg-[#0c0c0e] border border-zinc-900 flex items-center justify-center p-1 relative overflow-hidden select-none shrink-0">
      <span className="font-display text-[6px] tracking-widest text-zinc-500 uppercase text-center line-clamp-2">
        {label}
      </span>
    </div>
  );
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const router = useRouter();
  const supabase = createClient();

  // Load and merge cart items
  const loadCart = useCallback(async (currentUser: any) => {
    setLoading(true);
    
    let localItems: any[] = [];
    try {
      localItems = JSON.parse(localStorage.getItem('dollysticart_cart') || '[]');
    } catch (e) {
      console.error('Error reading localStorage cart', e);
    }

    if (currentUser) {
      // 1. Logged in user: Merge guest cart into DB if any exists
      if (localItems.length > 0) {
        for (const item of localItems) {
          try {
            // Check if item already exists in DB
            const { data: existing } = await supabase
              .from('cart_items')
              .select('id, quantity')
              .eq('user_id', currentUser.id)
              .eq('product_id', item.productId)
              .maybeSingle();

            if (existing) {
              await supabase
                .from('cart_items')
                .update({ quantity: existing.quantity + item.quantity })
                .eq('id', existing.id);
            } else {
              await supabase
                .from('cart_items')
                .insert({
                  user_id: currentUser.id,
                  product_id: item.productId,
                  quantity: item.quantity
                });
            }
          } catch (err) {
            console.error('Error merging item', item, err);
          }
        }
        // Clear guest cart
        localStorage.removeItem('dollysticart_cart');
        window.dispatchEvent(new Event('cart-updated'));
      }

      // 2. Fetch all cart items from DB
      const { data: dbItems, error } = await supabase
        .from('cart_items')
        .select('*, products(*, categories(name))')
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error fetching DB cart', error);
      } else {
        const formatted = (dbItems || []).map((item: any) => ({
          id: item.id, // DB cart item id
          productId: item.product_id,
          name: item.products.name,
          slug: item.products.slug,
          quantity: item.quantity,
          regular_price: item.products.regular_price,
          discounted_price: item.products.discounted_price,
          category_name: item.products.categories?.name || 'Uncategorized'
        }));
        setCartItems(formatted);
      }
    } else {
      // 3. Guest user: Use LocalStorage
      setCartItems(localItems);
    }
    
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      await loadCart(session?.user || null);
    };

    checkAuth();

    // Listen for custom cart trigger updates
    const handleCartTrigger = () => {
      checkAuth();
    };
    window.addEventListener('cart-updated', handleCartTrigger);
    return () => window.removeEventListener('cart-updated', handleCartTrigger);
  }, [supabase, loadCart]);

  // Handle quantity changes
  const updateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1) return;

    if (user) {
      // Update in Supabase
      const item = cartItems.find(i => i.productId === productId);
      if (item) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQty })
          .eq('user_id', user.id)
          .eq('product_id', productId);
        
        if (error) {
          console.error(error);
        } else {
          setCartItems(items => items.map(i => i.productId === productId ? { ...i, quantity: newQty } : i));
          window.dispatchEvent(new Event('cart-updated'));
        }
      }
    } else {
      // Update in LocalStorage
      const updated = cartItems.map(i => i.productId === productId ? { ...i, quantity: newQty } : i);
      localStorage.setItem('dollysticart_cart', JSON.stringify(updated));
      setCartItems(updated);
      window.dispatchEvent(new Event('cart-updated'));
    }
  };

  // Remove item
  const removeItem = async (productId: string) => {
    if (user) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (error) {
        console.error(error);
      } else {
        setCartItems(items => items.filter(i => i.productId !== productId));
        window.dispatchEvent(new Event('cart-updated'));
      }
    } else {
      const updated = cartItems.filter(i => i.productId !== productId);
      localStorage.setItem('dollysticart_cart', JSON.stringify(updated));
      setCartItems(updated);
      window.dispatchEvent(new Event('cart-updated'));
    }
  };

  // Compute Subtotal
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.discounted_price ?? item.regular_price;
    return sum + (price * item.quantity);
  }, 0);

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-20 text-center">
        <span className="font-display text-xs tracking-widest text-muted uppercase">LOADING CART...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <h1 className="font-display text-2xl md:text-3xl font-extrabold uppercase tracking-wide border-b border-border-subtle pb-6 mb-8 md:mb-12">
        Shopping Bag
      </h1>

      {cartItems.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-900 rounded-lg text-center px-4">
          <ShoppingBag className="h-12 w-12 text-zinc-800 mb-4" />
          <span className="font-display text-xs tracking-widest text-muted uppercase">Your cart is empty</span>
          <p className="font-sans text-xs text-zinc-600 mt-2 max-w-xs leading-relaxed">
            It looks like you haven&rsquo;t added any aesthetic works to your cart yet. Head over to our catalog.
          </p>
          <Link 
            href="/shop" 
            className="mt-6 border border-accent bg-accent text-black px-6 py-2.5 font-display text-[9px] uppercase tracking-widest hover:bg-transparent hover:text-accent hover:border-accent transition-all duration-300"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      ) : (
        /* Cart Contents */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Cart Table List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-border-subtle bg-[#0c0c0e] divide-y divide-border-subtle">
              {cartItems.map((item) => {
                const finalItemPrice = item.discounted_price ?? item.regular_price;
                return (
                  <div key={item.productId} className="flex p-4 sm:p-6 gap-4 sm:gap-6 items-center">
                    
                    {/* Thumbnail */}
                    <CartThumbPlaceholder label={item.name} />

                    {/* Product details info */}
                    <div className="flex-1 min-w-0">
                      <span className="font-display text-[8px] uppercase tracking-widest text-muted block mb-0.5">
                        {item.category_name}
                      </span>
                      <Link 
                        href={`/product/${item.slug}`}
                        className="font-display text-xs font-bold uppercase tracking-wider text-foreground hover:text-accent transition-colors truncate block"
                      >
                        {item.name}
                      </Link>
                      
                      {/* Price per item */}
                      <div className="flex items-center space-x-2 pt-1 font-sans text-xs">
                        {item.discounted_price ? (
                          <>
                            <span className="text-muted line-through">{formatPrice(item.regular_price)}</span>
                            <span className="text-foreground font-semibold">{formatPrice(item.discounted_price)}</span>
                          </>
                        ) : (
                          <span className="text-foreground">{formatPrice(item.regular_price)}</span>
                        )}
                        <span className="text-[10px] text-zinc-600">each</span>
                      </div>
                    </div>

                    {/* Quantity selectors */}
                    <div className="flex items-center border border-zinc-800 bg-background h-8 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-full flex items-center justify-center text-foreground/60 hover:text-accent transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-10 h-full flex items-center justify-center font-sans text-xs text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-full flex items-center justify-center text-foreground/60 hover:text-accent transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Total item cost & Delete */}
                    <div className="flex flex-col items-end space-y-2 shrink-0">
                      <span className="font-sans text-xs font-semibold text-foreground">
                        {formatPrice(finalItemPrice * item.quantity)}
                      </span>
                      
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-zinc-600 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Price Integrity security assurance alert */}
            <div className="flex gap-3 border border-accent/20 bg-accent/5 p-4 text-accent">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1 font-sans text-xs">
                <h4 className="font-display text-[9px] uppercase tracking-widest font-bold">Encrypted Pricing Security Active</h4>
                <p className="text-[11px] text-accent/80 leading-relaxed">
                  To protect database integrity, we do not accept checkout totals from the client browser. When clicking Checkout, our server will directly query active Supabase inventory records to calculate secure billing.
                </p>
              </div>
            </div>
          </div>

          {/* Cart Order Summary sidebar */}
          <div className="lg:col-span-4 border border-border-subtle bg-[#0c0c0e] p-6 space-y-6">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-foreground border-b border-border-subtle pb-4">
              Order Summary
            </h2>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex justify-between text-muted">
                <span>Items count</span>
                <span>{totalQuantity}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Cart Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Shipping Cost</span>
                <span className="text-[10px] uppercase tracking-wider text-accent font-semibold">Calculated next</span>
              </div>
              
              <div className="flex justify-between text-foreground border-t border-border-subtle pt-4 text-sm font-bold">
                <span className="font-display uppercase tracking-widest">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            {/* Checkout action */}
            <div className="space-y-3">
              <Link
                href="/checkout"
                className="w-full h-12 flex items-center justify-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest bg-accent text-black border border-accent hover:bg-transparent hover:text-accent hover:border-accent transition-all duration-300"
              >
                PROCEED TO CHECKOUT
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              
              {!user && (
                <div className="flex gap-2 p-3 bg-zinc-950 border border-zinc-900 rounded font-sans text-[11px] text-muted items-start">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                  <p className="leading-normal">
                    You are checking out as guest. Consider{' '}
                    <Link href="/account?login=true" className="text-accent hover:underline">
                      signing in
                    </Link>{' '}
                    to save order histories to your personal profile.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
