'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowRight, Minus, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Price Formatter Helper
function formatPrice(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
}

// Custom Blank Placeholder for Wishlist items
function WishlistThumbPlaceholder({ label }: { label: string }) {
  return (
    <div className="w-16 h-20 bg-[#0c0c0e] border border-zinc-900 flex items-center justify-center p-2 relative overflow-hidden select-none shrink-0">
      <span className="font-display text-[7px] tracking-widest text-zinc-500 uppercase text-center line-clamp-2">
        {label}
      </span>
    </div>
  );
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const supabase = createClient();

  const loadWishlist = useCallback(async (currentUser: any) => {
    setLoading(true);
    let localItems: any[] = [];
    try {
      localItems = JSON.parse(localStorage.getItem('dollysticart_wishlist') || '[]');
    } catch (e) {
      console.error('Error reading localStorage wishlist', e);
    }

    if (currentUser) {
      // 1. Logged in: Sync guest wishlist items into DB
      if (localItems.length > 0) {
        for (const item of localItems) {
          try {
            // Check if item already exists in DB
            const { data: existing } = await supabase
              .from('wishlists')
              .select('id')
              .eq('user_id', currentUser.id)
              .eq('product_id', item.id)
              .maybeSingle();

            if (!existing) {
              await supabase
                .from('wishlists')
                .insert({
                  user_id: currentUser.id,
                  product_id: item.id
                });
            }
          } catch (err) {
            console.error('Error merging wishlist item', item, err);
          }
        }
        // Clear guest wishlist
        localStorage.removeItem('dollysticart_wishlist');
        window.dispatchEvent(new Event('wishlist-updated'));
      }

      // 2. Fetch all wishlist items from DB
      const { data: dbItems, error } = await supabase
        .from('wishlists')
        .select('*, products(*, categories(name))')
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error fetching DB wishlist', error);
      } else {
        const formatted = (dbItems || []).map((item: any) => ({
          id: item.products.id, // match standard format
          name: item.products.name,
          slug: item.products.slug,
          regular_price: item.products.regular_price,
          discounted_price: item.products.discounted_price,
          category_name: item.products.categories?.name || 'Uncategorized'
        }));
        setWishlistItems(formatted);
      }
    } else {
      // 3. Guest: Use localStorage
      setWishlistItems(localItems);
    }
    
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      await loadWishlist(session?.user || null);
    };

    checkAuth();
    
    const handleWishlistTrigger = () => {
      checkAuth();
    };
    window.addEventListener('wishlist-updated', handleWishlistTrigger);
    return () => window.removeEventListener('wishlist-updated', handleWishlistTrigger);
  }, [supabase, loadWishlist]);

  // Remove item from wishlist
  const removeItem = async (productId: string) => {
    if (user) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (error) {
        console.error(error);
      } else {
        setWishlistItems(items => items.filter(i => i.id !== productId));
        window.dispatchEvent(new Event('wishlist-updated'));
      }
    } else {
      const updated = wishlistItems.filter(i => i.id !== productId);
      localStorage.setItem('dollysticart_wishlist', JSON.stringify(updated));
      setWishlistItems(updated);
      window.dispatchEvent(new Event('wishlist-updated'));
    }
  };

  // Move item to Cart
  const moveToCart = async (product: any) => {
    try {
      // 1. Add to Cart localstorage helper
      let storedCart = JSON.parse(localStorage.getItem('dollysticart_cart') || '[]');
      const existingIdx = storedCart.findIndex((item: any) => item.productId === product.id);
      
      if (existingIdx > -1) {
        storedCart[existingIdx].quantity += 1;
      } else {
        storedCart.push({
          productId: product.id,
          name: product.name,
          slug: product.slug,
          quantity: 1,
          regular_price: product.regular_price,
          discounted_price: product.discounted_price,
          category_name: product.category_name
        });
      }
      localStorage.setItem('dollysticart_cart', JSON.stringify(storedCart));
      window.dispatchEvent(new Event('cart-updated'));

      // 2. Remove from Wishlist
      await removeItem(product.id);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-20 text-center">
        <span className="font-display text-xs tracking-widest text-muted uppercase">LOADING WISHLIST...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10 md:pt-36 md:pb-16">
      <h1 className="font-display text-2xl md:text-3xl font-extrabold uppercase tracking-wide border-b border-border-subtle pb-6 mb-8 md:mb-12">
        My Wishlist
      </h1>

      {wishlistItems.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-900 rounded-lg text-center px-4">
          <Heart className="h-12 w-12 text-zinc-800 mb-4" />
          <span className="font-display text-xs tracking-widest text-muted uppercase">Your wishlist is empty</span>
          <p className="font-sans text-xs text-zinc-600 mt-2 max-w-xs leading-relaxed">
            Aesthetic works you mark as favorite will appear here. Build your customized collection.
          </p>
          <Link 
            href="/shop" 
            className="mt-6 border border-accent bg-accent text-black px-6 py-2.5 font-display text-[9px] uppercase tracking-widest hover:bg-transparent hover:text-accent hover:border-accent transition-all duration-300"
          >
            CONTINUE SHOPPING
          </Link>
        </div>
      ) : (
        /* Wishlist Items List */
        <div className="max-w-4xl mx-auto border border-border-subtle bg-[#0c0c0e] divide-y divide-border-subtle">
          {wishlistItems.map((item) => (
            <div key={item.id} className="flex p-4 sm:p-6 gap-4 sm:gap-6 items-center">
              
              {/* Thumbnail */}
              <WishlistThumbPlaceholder label={item.name} />

              {/* Product specifications */}
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
                
                {/* Price */}
                <div className="flex items-center space-x-2 pt-1 font-sans text-xs">
                  {item.discounted_price ? (
                    <>
                      <span className="text-muted line-through">{formatPrice(item.regular_price)}</span>
                      <span className="text-foreground font-semibold">{formatPrice(item.discounted_price)}</span>
                    </>
                  ) : (
                    <span className="text-foreground">{formatPrice(item.regular_price)}</span>
                  )}
                </div>
              </div>

              {/* Action buttons (Move to Cart & Remove) */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => moveToCart(item)}
                  className="h-9 px-4 flex items-center justify-center gap-1.5 font-display text-[9px] font-bold uppercase tracking-widest bg-accent text-black border border-accent hover:bg-transparent hover:text-accent hover:border-accent transition-all duration-300 shrink-0"
                >
                  <ShoppingBag className="h-3 w-3" />
                  MOVE TO BAG
                </button>
                
                <button
                  onClick={() => removeItem(item.id)}
                  className="h-9 w-9 flex items-center justify-center border border-zinc-800 hover:border-red-500 hover:text-red-500 text-zinc-500 transition-all duration-300 rounded shrink-0"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
