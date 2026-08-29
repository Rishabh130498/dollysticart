export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Eye } from 'lucide-react';

// Price Formatter Helper
function formatPrice(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
}

// Blank Placeholder Helper
function BlankPlaceholder({ ratio, label, imageUrl }: { ratio: string; label: string; imageUrl?: string }) {
  return (
    <div className={`w-full ${ratio} bg-[#0c0c0e] border border-zinc-900 flex flex-col items-center justify-center p-6 relative group overflow-hidden`}>
      {imageUrl ? (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ) : (
        <>
          {/* Grid Lines */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-10">
            <div className="border-r border-b border-zinc-800"></div>
            <div className="border-r border-b border-zinc-800"></div>
            <div className="border-b border-zinc-800"></div>
          </div>
          <span className="font-display text-[9px] tracking-[0.25em] text-zinc-500 uppercase text-center max-w-[80%] z-10">
            {label}
          </span>
          <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest mt-1 z-10">
            DRAFT PREVIEW
          </span>
        </>
      )}
    </div>
  );
}

export default async function HomepagePreviewPage() {
  let sections: any[] = [];
  let dbProducts: any[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('homepage_sections')
      .select('*')
      .order('sort_order', { ascending: true });
    sections = data || [];

    // Fetch live products for preview consistency
    const { data: prodData } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5);
    dbProducts = prodData || [];
  } catch (error) {
    console.error('Error fetching preview sections', error);
  }

  // Seeding default preview templates
  const displaySections = sections.length > 0 ? sections : [
    {
      id: 'default-hero-1',
      type: 'hero',
      is_visible: true,
      draft_content: {
        heading: 'TEXTURE & DIMENSION (DRAFT)',
        description: 'Original textured impasto acrylics and premium framed prints, crafted for modern luxury living.',
        cta_text: 'EXPLORE SHOP',
        cta_link: '/shop',
        ratio: 'aspect-[2/1]',
        label: 'HERO EDITORIAL COVER',
        image_url: ''
      }
    },
    {
      id: 'default-lookbook-1',
      type: 'lookbook',
      is_visible: true,
      draft_content: {
        items: [
          { heading: 'ORIGINAL TEXTURES', cta_link: '/shop/original-art', ratio: 'aspect-[5/7]', label: 'IMPASTO CANVAS', image_url: '' },
          { heading: 'GALLERY PRINTS', cta_link: '/shop/art-prints', ratio: 'aspect-[5/7]', label: 'ARCHIVAL PRINTS', image_url: '' },
          { heading: 'STUDIO DESIGNS', cta_link: '/shop/art-products/stationery', ratio: 'aspect-[5/7]', label: 'CALENDARS', image_url: '' },
          { heading: 'COLLECTIBLES', cta_link: '/shop/art-products/bookmarks', ratio: 'aspect-[5/7]', label: 'MAGNETS & MORE', image_url: '' }
        ]
      }
    }
  ];

  const productsList = dbProducts.length > 0 ? dbProducts : [
    { id: 'p1', name: 'Abstract Impasto No. 1', regular_price: 299900, discounted_price: 199900, slug: 'abstract-impasto-1', categories: { name: 'Original Art' } },
    { id: 'p2', name: 'Textured Flow Studies', regular_price: 149900, discounted_price: null, slug: 'textured-flow-studies', categories: { name: 'Art Prints' } },
    { id: 'p3', name: 'Minimal Canvas Sketch', regular_price: 99900, discounted_price: 79900, slug: 'minimal-canvas-sketch', categories: { name: 'Art Prints' } },
  ];

  return (
    <div className="w-full flex flex-col space-y-0 pb-20 pt-[114px]">
      
      {/* Sticky Preview Header Warning banner */}
      <div className="fixed top-[74px] left-0 right-0 z-40 w-full bg-accent text-black py-2.5 px-6 font-sans text-xs flex justify-between items-center gap-4 border-b border-accent/20">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 shrink-0" />
          <span className="font-display font-bold uppercase tracking-wider text-[10px]">
            DRAFT PREVIEW ENVIRONMENT
          </span>
          <span className="hidden sm:inline text-black/60 font-semibold">&bull;</span>
          <p className="text-[11px] text-black/80 font-medium">
            Viewing work-in-progress draft layouts. Customers cannot view these until published.
          </p>
        </div>
        <Link
          href="/admin/homepage"
          className="bg-black text-white hover:bg-zinc-800 px-3 py-1 font-display text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          RETURN TO CANVAS
        </Link>
      </div>

      {/* Render Draft Sections Loop */}
      {displaySections.map((section) => {
        if (!section.is_visible) return null;
        const draftData = section.draft_content || {};

        switch (section.type) {
          
          case 'hero':
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-0">
                <div className="relative w-full overflow-hidden group">
                  <BlankPlaceholder 
                    ratio={draftData.ratio || 'aspect-[2/1]'} 
                    label={draftData.label || 'HERO IMAGE'} 
                    imageUrl={draftData.image_url} 
                  />
                  
                  <div className="absolute inset-0 bg-black/10 flex flex-col justify-end items-center text-center p-8 sm:p-12 md:p-16 space-y-3 sm:space-y-4">
                    <h2 className="font-display text-xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-[0.15em] text-foreground max-w-3xl leading-none">
                      {draftData.heading}
                    </h2>
                    <p className="font-sans text-[10px] sm:text-xs text-foreground/80 max-w-md tracking-wider leading-relaxed">
                      {draftData.description}
                    </p>
                    <Link 
                      href={draftData.cta_link || '/shop'} 
                      className="btn-kith-outline mt-2"
                    >
                      {draftData.cta_text || 'DISCOVER'}
                    </Link>
                  </div>
                </div>
              </section>
            );

          case 'lookbook':
            const items = draftData.items || [];
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-12 md:py-16">
                {section.title && (
                  <h3 className="font-display text-[10px] font-extrabold uppercase tracking-[0.25em] text-foreground/55 mb-6 md:mb-8 text-center">
                    {section.title}
                  </h3>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {items.map((item: any, idx: number) => (
                    <div 
                      key={idx}
                      className="group flex flex-col space-y-3 relative overflow-hidden"
                    >
                      <BlankPlaceholder 
                        ratio="aspect-[5/7]" 
                        label={item.label || item.heading} 
                        imageUrl={item.image_url} 
                      />
                      
                      <div className="absolute inset-0 bg-black/50 opacity-100 flex flex-col items-center justify-center p-4">
                        <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground text-center">
                          {item.heading}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );

          default:
            return null;
        }
      })}

      {/* Static releases layout to visualize the page completely */}
      <section className="w-full px-4 sm:px-6 py-12 md:py-16">
        <h3 className="font-display text-[10px] font-extrabold uppercase tracking-[0.25em] text-foreground/55 mb-6 md:mb-8">
          LATEST RELEASES
        </h3>
        <div className="kith-swiper w-full gap-4 pb-4">
          {productsList.map((product: any) => (
            <div
              key={product.id}
              className="kith-swiper-item w-[68%] sm:w-[45%] md:w-[28%] lg:w-[19.2%] flex flex-col space-y-3.5"
            >
              <div className="overflow-hidden bg-[#0c0c0e]">
                <BlankPlaceholder ratio="aspect-[4/5]" label={product.name} />
              </div>
              <div className="flex flex-col space-y-1 items-start text-left">
                <span className="font-display text-[8px] uppercase tracking-widest text-zinc-600">
                  {product.categories?.name || 'Art Release'}
                </span>
                <h4 className="font-georgia text-[12px] italic tracking-wide text-foreground leading-tight">
                  {product.name}
                </h4>
                <div className="flex items-center space-x-2.5 pt-0.5 font-mono text-[10px]">
                  {product.discounted_price ? (
                    <>
                      <span className="text-zinc-600 line-through">
                        {formatPrice(product.regular_price)}
                      </span>
                      <span className="text-foreground font-semibold">
                        {formatPrice(product.discounted_price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-foreground">
                      {formatPrice(product.regular_price)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
