'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, ArrowRight, Minus, Plus, Check } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  regular_price: number;
  discounted_price: number | null;
  category_name: string;
  images?: string[];
}

function formatPrice(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
}


// Custom Blank Placeholder for Gallery items
function GalleryPlaceholder({ label, index }: { label: string; index: number }) {
  return (
    <div className="w-full aspect-[4/5] bg-[#0c0c0e] border border-zinc-900 flex flex-col items-center justify-center p-6 select-none relative group overflow-hidden">
      {/* Editorial Grid Lines */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-10">
        <div className="border-r border-b border-zinc-800"></div>
        <div className="border-r border-b border-zinc-800"></div>
        <div className="border-b border-zinc-800"></div>
        <div className="border-r border-b border-zinc-800"></div>
        <div className="border-r border-b border-zinc-800"></div>
        <div className="border-b border-zinc-800"></div>
      </div>
      
      <span className="font-display text-[9px] tracking-[0.2em] text-zinc-500 uppercase text-center max-w-[80%]">
        {label}
      </span>
      <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest mt-1">
        IMAGE VIEW {index + 1}
      </span>
    </div>
  );
}

export default function ProductDetailsClient({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  
  const router = useRouter();

  // Mock list of 3 images for the gallery placeholders
  const images = product.images || [`${product.name} Primary`, `${product.name} Detail 1`, `${product.name} Room View`];

  useEffect(() => {
    // Check if item is already in wishlist
    try {
      const storedWishlist = JSON.parse(localStorage.getItem('dollysticart_wishlist') || '[]');
      setIsWishlisted(storedWishlist.some((item: any) => item.id === product.id));
    } catch (e) {
      console.error(e);
    }
  }, [product.id]);

  // Adjust quantity
  const handleQuantityChange = (type: 'inc' | 'dec') => {
    if (type === 'inc') {
      setQuantity(q => q + 1);
    } else if (type === 'dec' && quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  // Add to Wishlist
  const toggleWishlist = () => {
    try {
      let storedWishlist = JSON.parse(localStorage.getItem('dollysticart_wishlist') || '[]');
      if (isWishlisted) {
        storedWishlist = storedWishlist.filter((item: any) => item.id !== product.id);
        setIsWishlisted(false);
      } else {
        storedWishlist.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          regular_price: product.regular_price,
          discounted_price: product.discounted_price,
          category_name: product.category_name,
        });
        setIsWishlisted(true);
      }
      localStorage.setItem('dollysticart_wishlist', JSON.stringify(storedWishlist));
      
      // Dispatch custom event to refresh Header count
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (e) {
      console.error('Error toggling wishlist', e);
    }
  };

  // Add to Cart Logic
  const handleAddToCart = (shouldRedirect = false) => {
    setAddingToCart(true);
    
    // Simulate slight server delay for organic premium feel
    setTimeout(() => {
      try {
        let storedCart = JSON.parse(localStorage.getItem('dollysticart_cart') || '[]');
        const existingIdx = storedCart.findIndex((item: any) => item.productId === product.id);
        
        if (existingIdx > -1) {
          storedCart[existingIdx].quantity += quantity;
        } else {
          storedCart.push({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            quantity: quantity,
            // Include catalog details for UI display only (never trust for final payments!)
            regular_price: product.regular_price,
            discounted_price: product.discounted_price,
            category_name: product.category_name,
            image_url: product.images && product.images.length > 0 ? product.images[0] : undefined
          });
        }
        
        localStorage.setItem('dollysticart_cart', JSON.stringify(storedCart));
        
        // Dispatch event for Header
        window.dispatchEvent(new Event('cart-updated'));
        
        setAddingToCart(false);
        setAddedSuccess(true);
        
        setTimeout(() => setAddedSuccess(false), 2000);

        if (shouldRedirect) {
          router.push('/cart');
        }
      } catch (e) {
        console.error('Error adding to cart', e);
        setAddingToCart(false);
      }
    }, 400);
  };

  // Direct buy action
  const handleBuyNow = () => {
    handleAddToCart(true);
  };

  const finalPrice = product.discounted_price ?? product.regular_price;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
      
      {/* Left: Product Images Gallery */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Main active image block */}
        <div className="overflow-hidden bg-[#0c0c0e] aspect-[4/5] border border-zinc-900 relative">
          {product.images && product.images.length > 0 ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={product.images[activeImageIdx] || product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <GalleryPlaceholder label={images[activeImageIdx]} index={activeImageIdx} />
          )}
        </div>
        
        {/* Gallery thumbnails */}
        {product.images && product.images.length > 1 ? (
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`border aspect-[4/5] bg-[#0c0c0e] flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                  activeImageIdx === idx ? 'border-accent' : 'border-zinc-900 hover:border-zinc-700'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-zinc-950/40 opacity-30 hover:opacity-0 transition-opacity" />
              </button>
            ))}
          </div>
        ) : (!product.images || product.images.length === 0) && (
          <div className="grid grid-cols-3 gap-4">
            {images.map((imgLabel, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`border aspect-[4/5] bg-[#0c0c0e] flex items-center justify-center p-2 relative overflow-hidden transition-all duration-300 ${
                  activeImageIdx === idx ? 'border-accent' : 'border-zinc-900 hover:border-zinc-700'
                }`}
              >
                <span className="font-display text-[8px] text-zinc-500 uppercase tracking-wider text-center max-w-[80%] line-clamp-1">
                  {imgLabel}
                </span>
                <div className="absolute inset-0 bg-zinc-950/40 opacity-30 hover:opacity-0 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Product specs Details Column */}
      <div className="lg:col-span-5 flex flex-col space-y-6 md:space-y-8">
        
        {/* Core title and metadata */}
        <div className="flex flex-col space-y-2 border-b border-border-subtle pb-6 items-start">
          <span className="font-display text-[10px] uppercase tracking-[0.25em] text-muted">
            {product.category_name}
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-foreground">
            {product.name}
          </h1>
          
          {/* Price display */}
          <div className="flex items-center space-x-3 pt-2">
            {product.discounted_price ? (
              <>
                <span className="font-sans text-lg text-muted line-through">
                  {formatPrice(product.regular_price)}
                </span>
                <span className="font-sans text-xl font-bold text-foreground">
                  {formatPrice(product.discounted_price)}
                </span>
                <span className="font-display text-[9px] uppercase tracking-widest px-2 py-0.5 border border-accent bg-accent/5 text-accent font-semibold">
                  Save {formatPrice(product.regular_price - product.discounted_price)}
                </span>
              </>
            ) : (
              <span className="font-sans text-xl font-bold text-foreground">
                {formatPrice(product.regular_price)}
              </span>
            )}
          </div>
        </div>

        {/* Product Description */}
        <div className="border-b border-border-subtle pb-6">
          <h3 className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/50 mb-3">
            The Story / Details
          </h3>
          <p className="font-sans text-sm text-foreground/80 leading-relaxed max-w-lg">
            {product.description}
          </p>
        </div>

        {/* Selection & CTA Actions Area */}
        <div className="flex flex-col space-y-4">
          
          {/* Quantity selector */}
          <div className="flex items-center space-x-4">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/50">
              Quantity
            </span>
            <div className="flex items-center border border-zinc-800 bg-[#0c0c0e] h-10">
              <button
                onClick={() => handleQuantityChange('dec')}
                className="w-10 h-full flex items-center justify-center text-foreground/60 hover:text-accent transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-12 h-full flex items-center justify-center font-sans text-sm text-foreground">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange('inc')}
                className="w-10 h-full flex items-center justify-center text-foreground/60 hover:text-accent transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {/* Add to Cart button */}
            <button
              onClick={() => handleAddToCart()}
              disabled={addingToCart}
              className={`flex-1 h-12 flex items-center justify-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${
                addedSuccess
                  ? 'border-green-500 bg-green-500/5 text-green-500'
                  : 'border-zinc-800 bg-[#0c0c0e] text-foreground hover:border-zinc-500'
              }`}
            >
              {addingToCart ? (
                <span>ADDING...</span>
              ) : addedSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  ADDED TO BAG
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5" />
                  ADD TO BAG
                </>
              )}
            </button>

            {/* Buy Now button */}
            <button
              onClick={handleBuyNow}
              className="flex-1 h-12 flex items-center justify-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest bg-accent text-black border border-accent hover:bg-transparent hover:text-accent hover:border-accent transition-all duration-300"
            >
              BUY IT NOW
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            {/* Wishlist toggle */}
            <button
              onClick={toggleWishlist}
              className={`w-12 h-12 flex items-center justify-center border transition-all duration-300 ${
                isWishlisted
                  ? 'border-accent bg-accent/5 text-accent'
                  : 'border-zinc-800 text-foreground/60 hover:border-zinc-500 hover:text-foreground'
              }`}
              aria-label="Wishlist Toggle"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-accent' : ''}`} />
            </button>
          </div>
        </div>

        {/* Premium editorial bullet notes */}
        <div className="pt-2">
          <ul className="space-y-2.5 font-sans text-xs text-muted">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full shrink-0" />
              Handmade & signed by Dollysticart
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full shrink-0" />
              Secure, insured shipping in premium wooden/cardboard casing
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full shrink-0" />
              100% price integrity checked by server validation
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
