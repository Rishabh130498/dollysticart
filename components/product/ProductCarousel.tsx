'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FormattedPrice from '@/components/common/FormattedPrice';
import { getProductCardImageUrl } from '@/lib/utils/image-helpers';

interface ProductCarouselProps {
  products: any[];
  heading?: string;
}

export default function ProductCarousel({ products, heading = 'LATEST RELEASES' }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic responsive items per page calculation
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(1.5);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2.5);
      } else {
        setItemsPerPage(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalItems = products.length;
  const maxIndex = Math.max(0, Math.ceil(totalItems - Math.floor(itemsPerPage)));

  // Auto-play timer mechanism (Every 3.5s)
  useEffect(() => {
    if (isPaused || totalItems <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, maxIndex, totalItems]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  if (!products || products.length === 0) return null;

  return (
    <section 
      className="w-full px-4 sm:px-6 pt-16 pb-12 md:pt-24 md:pb-16 mt-4 md:mt-8 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header section with Title and Nav Controls */}
      <div className="flex justify-between items-end mb-6 md:mb-8">
        <div>
          <h3 className="font-display text-[10px] font-extrabold uppercase tracking-[0.25em] text-foreground/55">
            {heading}
          </h3>
          <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest block mt-1">
            {isPaused ? 'PAUSED' : 'AUTO-PLAYING'} &bull; {currentIndex + 1} / {maxIndex + 1}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/shop"
            className="font-display text-[9px] font-bold uppercase tracking-widest text-muted hover:text-accent border-b border-zinc-900 pb-0.5 transition-colors hidden sm:block"
          >
            VIEW ALL
          </Link>

          {/* Nav Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="w-8 h-8 rounded-full border border-zinc-800 bg-[#0c0c0e] hover:border-accent hover:text-accent flex items-center justify-center text-zinc-400 transition-all cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="w-8 h-8 rounded-full border border-zinc-800 bg-[#0c0c0e] hover:border-accent hover:text-accent flex items-center justify-center text-zinc-400 transition-all cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Track Wrapper */}
      <div className="relative w-full overflow-hidden py-3 -my-3">
        <div
          className="flex transition-transform duration-700 ease-out gap-4 pt-1"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
          }}
        >
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              style={{ flex: `0 0 calc(${100 / itemsPerPage}% - 12px)` }}
              className="group flex flex-col space-y-3.5 grayscale-card shrink-0 select-none"
            >
              {/* Product Image Frame */}
              <div className="relative aspect-[4/5] w-full bg-[#0c0c0e] overflow-hidden border border-zinc-900 group-hover:border-zinc-700 transition-colors">
                {getProductCardImageUrl(product) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getProductCardImageUrl(product)}
                    alt={product.name}
                    draggable={false}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <span className="font-display text-[9px] tracking-wider text-zinc-600 uppercase">NO IMAGE</span>
                  </div>
                )}

                {product.discounted_price && (
                  <span className="absolute top-2 left-2 bg-accent text-black font-display text-[7px] font-extrabold uppercase px-1.5 py-0.5 tracking-wider">
                    SALE
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col space-y-1 items-start text-left px-1">
                <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">
                  {product.categories?.name || 'Art Release'}
                </span>

                <h4 className="font-georgia text-[12px] italic tracking-wide text-foreground group-hover:text-accent transition-colors leading-tight line-clamp-1">
                  {product.name}
                </h4>

                <div className="flex items-center space-x-2.5 pt-0.5 font-mono text-[10px]">
                  {product.discounted_price ? (
                    <>
                      <span className="text-zinc-600 line-through">
                        <FormattedPrice amountInPaise={product.regular_price} />
                      </span>
                      <span className="text-foreground font-semibold">
                        <FormattedPrice amountInPaise={product.discounted_price} />
                      </span>
                    </>
                  ) : (
                    <span className="text-foreground">
                      <FormattedPrice amountInPaise={product.regular_price} />
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Pagination Indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-6">
        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentIndex === idx ? 'w-6 bg-accent' : 'w-1.5 bg-zinc-800 hover:bg-zinc-600'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
