export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import FormattedPrice from '@/components/common/FormattedPrice';

// 1. Editorial Blueprint Placeholder
function BlankPlaceholder({ ratio, label, imageUrl, hideText = false }: { ratio: string; label: string; imageUrl?: string; hideText?: boolean }) {
  return (
    <div className={`w-full ${ratio} bg-[#0c0c0e] flex flex-col items-center justify-center p-6 select-none relative group overflow-hidden`}>
      {/* Background image if loaded */}
      {imageUrl ? (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl} 
            alt={label} 
            className="w-full h-full object-cover transition-all duration-500" 
          />
        </div>
      ) : (
        /* Spacing alignment lines overlay if empty blueprint */
        <>
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-15">
            <div className="border-r border-b border-zinc-800"></div>
            <div className="border-r border-b border-zinc-800"></div>
            <div className="border-b border-zinc-800"></div>
            <div className="border-r border-b border-zinc-800"></div>
            <div className="border-r border-b border-zinc-800"></div>
            <div className="border-b border-zinc-800"></div>
          </div>
          
          <div className="absolute w-8 h-8 border border-zinc-800/30 pointer-events-none" />
          
          {!hideText && (
            <div className="z-10 flex flex-col items-center space-y-1 text-center">
              <span className="font-display text-[9px] tracking-[0.2em] text-zinc-500 uppercase text-center max-w-[80%] line-clamp-2">
                {label}
              </span>
              <span className="font-mono text-[7px] text-zinc-700 uppercase tracking-widest mt-1">
                {ratio.replace('aspect-[', '').replace(']', '')}
              </span>
            </div>
          )}
        </>
      )}
      
      <div className="absolute inset-0 border border-transparent group-hover:border-accent/5 transition-colors duration-500 pointer-events-none" />
    </div>
  );
}

// 2. Price Formatter
function formatPrice(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
}

export default async function Home() {
  let sections: any[] = [];
  let dbProducts: any[] = [];
  
  try {
    const supabase = await createClient();
    
    // Fetch CMS Homepage sections
    const { data: secData } = await supabase
      .from('homepage_sections')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });
    sections = (secData || []).filter(sec => !sec.type.endsWith('_page'));

    // Fetch live products for carousel
    const { data: prodData } = await supabase
      .from('products')
      .select('*, categories(name), product_images(image_url)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10);
    dbProducts = prodData || [];
  } catch (error) {
    console.error('Error fetching homepage databases:', error);
  }

  // Fallback defaults matching Kith campaign structures
  const displaySections = sections.length > 0 ? sections : [
    {
      id: 'sec-hero-1',
      type: 'banner',
      content: {
        heading: 'TEXTURE & DIMENSION',
        description: 'Original textured impasto acrylics and premium framed prints, crafted for modern luxury living.',
        cta_text: 'EXPLORE SHOP',
        cta_link: '/shop',
        ratio: 'aspect-[2/1] md:aspect-[2/1] aspect-[1/1]',
        label: 'HERO CAMPAIGN 01',
        image_url: ''
      }
    },
    {
      id: 'sec-collection-1',
      type: 'collection',
      content: {
        title: 'THE CORE EDITORIALS',
        items: [
          { heading: 'ORIGINAL TEXTURES', cta_link: '/shop/original-art', ratio: 'aspect-[5/7]', label: 'IMPASTO CANVAS', image_url: '' },
          { heading: 'GALLERY PRINTS', cta_link: '/shop/art-prints', ratio: 'aspect-[5/7]', label: 'ARCHIVAL PRINTS', image_url: '' },
          { heading: 'STUDIO DESIGNS', cta_link: '/shop/art-products/stationery', ratio: 'aspect-[5/7]', label: 'CALENDARS', image_url: '' },
          { heading: 'COLLECTIBLES', cta_link: '/shop/art-products/bookmarks', ratio: 'aspect-[5/7]', label: 'MAGNETS & MORE', image_url: '' }
        ]
      }
    },
    {
      id: 'sec-swiper-1',
      type: 'product_swiper',
      content: {
        heading: 'LATEST RELEASES',
        limit: 10
      }
    },
    {
      id: 'sec-hero-2',
      type: 'banner',
      content: {
        heading: 'BESPOKE ART COMMISSIONS',
        description: 'Collaborate with Dollysticart to paint a custom textured artwork designed uniquely to match your home\'s layout, color scheme, and specific canvas dimensions.',
        cta_text: 'REQUEST COMMISSION',
        cta_link: '/customize-art',
        ratio: 'aspect-[2/1] md:aspect-[2/1] aspect-[1/1]',
        label: 'HERO CAMPAIGN 02',
        image_url: ''
      }
    }
  ];

  // Carousel product source
  const productsList = dbProducts.length > 0 ? dbProducts : [
    { id: 'p1', name: 'Abstract Impasto No. 1', regular_price: 299900, discounted_price: 199900, slug: 'abstract-impasto-1', categories: { name: 'Original Art' } },
    { id: 'p2', name: 'Textured Flow Studies', regular_price: 149900, discounted_price: null, slug: 'textured-flow-studies', categories: { name: 'Art Prints' } },
    { id: 'p3', name: 'Minimal Canvas Sketch', regular_price: 99900, discounted_price: 79900, slug: 'minimal-canvas-sketch', categories: { name: 'Art Prints' } },
    { id: 'p4', name: 'Monochrome Palette Work', regular_price: 349900, discounted_price: null, slug: 'monochrome-palette-work', categories: { name: 'Original Art' } },
    { id: 'p5', name: 'Aesthetic Brushwork No. 2', regular_price: 189900, discounted_price: null, slug: 'aesthetic-brushwork-2', categories: { name: 'Original Art' } },
  ];

  return (
    <div className="w-full flex flex-col space-y-0 pb-16 md:pb-24 pt-[74px]">
      
      {/* Loop Campaign Sections */}
      {displaySections.map((section) => {
        const content = section.published_content?.heading || section.published_content?.items || section.published_content?.text || section.published_content?.html || section.published_content?.height ? section.published_content : (section.content || section.draft_content || {});

        switch (section.type) {
          
          // 1. CAMPAIGN HERO COVER / BANNER
          case 'hero':
          case 'banner':
            const ratioClass = content.ratio || 'aspect-[2/1] aspect-[1/1]';
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-0">
                <div className="relative w-full overflow-hidden group">
                  <BlankPlaceholder ratio={ratioClass} label={content.label || 'CAMPAIGN COVER'} imageUrl={content.image_url} hideText={true} />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent flex flex-col justify-end items-center text-center p-8 sm:p-12 md:p-16 space-y-3 sm:space-y-4 pointer-events-none">
                    <h2 className="font-display text-xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-[0.15em] text-foreground max-w-3xl leading-none">
                      {content.heading}
                    </h2>
                    <p className="font-sans text-[10px] sm:text-xs text-foreground/80 max-w-md tracking-wider leading-relaxed">
                      {content.description}
                    </p>
                    {content.cta_link && (
                      <Link 
                        href={content.cta_link} 
                        className="btn-kith-outline mt-2 pointer-events-auto"
                      >
                        {content.cta_text || 'DISCOVER'}
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            );

          // 2. LOOKBOOK GRID / COLLECTIONS
          case 'lookbook':
          case 'collection':
            const gridItems = content.items || [];
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-12 md:py-16">
                {(section.title || content.title) && (
                  <h3 className="font-display text-[10px] font-extrabold uppercase tracking-[0.25em] text-foreground/55 mb-6 md:mb-8 text-center">
                    {section.title || content.title}
                  </h3>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gridItems.map((item: any, idx: number) => (
                    <Link 
                      key={idx}
                      href={item.cta_link || '/shop'}
                      className="group flex flex-col space-y-3 relative overflow-hidden"
                    >
                      <BlankPlaceholder ratio={item.ratio || 'aspect-[5/7]'} label={item.label || item.heading} imageUrl={item.image_url} hideText={true} />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/0 to-transparent flex flex-col justify-end items-center p-4 pb-6 pointer-events-none">
                        <span className="font-display text-[10px] font-extrabold uppercase tracking-[0.2em] text-foreground text-center border-b border-transparent group-hover:border-accent transition-colors pb-1">
                          {item.heading}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );

          // 3. FEATURED PRODUCTS LAYOUT
          case 'featured_products':
            const featuredProducts = dbProducts.slice(0, 4);
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-12 md:py-16">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Side: Campaign Banner */}
                  <div className="w-full lg:w-1/3 relative overflow-hidden group min-h-[350px]">
                    <BlankPlaceholder 
                      ratio="aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[400px]" 
                      label={content.label || 'FEATURED COLLECTION'} 
                      imageUrl={content.image_url} 
                      hideText={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent flex flex-col justify-end p-6 space-y-2 pointer-events-none">
                      <h4 className="font-display text-[13px] font-bold uppercase tracking-wider text-foreground">
                        {content.heading || 'FEATURED CAMPAIGN'}
                      </h4>
                      <p className="font-sans text-[10px] text-zinc-300 tracking-wider">
                        {content.description || 'Explore our latest releases.'}
                      </p>
                      {content.cta_link && (
                        <Link href={content.cta_link} className="btn-kith-outline w-fit text-[9px] py-1.5 px-3 pointer-events-auto">
                          {content.cta_text || 'SHOP NOW'}
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Side: 4 Product Cards Grid */}
                  <div className="w-full lg:w-2/3 grid grid-cols-2 gap-4">
                    {featuredProducts.map((product: any) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        className="group flex flex-col space-y-3 grayscale-card border border-zinc-900 bg-[#060607] p-3 transition-colors hover:border-zinc-800"
                      >
                        <div className="relative aspect-[4/5] w-full bg-[#0c0c0e] overflow-hidden flex items-center justify-center">
                          {product.product_images?.[0]?.image_url ? (
                            <img
                              src={product.product_images[0].image_url}
                              alt={product.name}
                              className="w-full h-full object-cover transition-all duration-500"
                            />
                          ) : (
                            <span className="font-display text-[9px] tracking-wider text-zinc-600 uppercase">NO IMAGE</span>
                          )}
                          {product.discounted_price && (
                            <span className="absolute top-2 left-2 bg-accent text-black font-display text-[7px] font-extrabold uppercase px-1.5 py-0.5 tracking-wider">
                              SALE
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">
                            {product.categories?.name || 'Art'}
                          </span>
                          <h4 className="font-display text-[10px] tracking-wider text-foreground font-semibold group-hover:text-accent transition-colors truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            {product.discounted_price ? (
                              <>
                                <span className="font-mono text-[9px] text-zinc-500 line-through">
                                  <FormattedPrice amountInPaise={product.regular_price} />
                                </span>
                                <span className="font-mono text-[9px] text-foreground font-semibold">
                                  <FormattedPrice amountInPaise={product.discounted_price} />
                                </span>
                              </>
                            ) : (
                              <span className="font-mono text-[9px] text-foreground">
                                <FormattedPrice amountInPaise={product.regular_price} />
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            );

          // 4. TEXT SECTION
          case 'text':
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-12 text-center border-y border-zinc-900/50 bg-zinc-950/20">
                <h3 className="font-display text-xs font-bold uppercase tracking-[0.25em] text-accent mb-2">
                  {content.heading}
                </h3>
                <p className="font-sans text-xs text-zinc-400 max-w-2xl mx-auto leading-relaxed tracking-wide">
                  {content.body}
                </p>
              </section>
            );

          // 5. SINGLE PRODUCT BANNER
          case 'product':
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-12 flex justify-center">
                <div className="w-full max-w-[450px] border border-zinc-900 bg-[#060607] p-4 flex flex-col space-y-4">
                  {content.image_url && (
                    <div className="w-full aspect-[4/5] relative">
                      <img src={content.image_url} alt={content.heading} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex flex-col space-y-1">
                    <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">FEATURED PRODUCT EDITION</span>
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                      {content.heading}
                    </h4>
                    <p className="font-sans text-[10px] text-zinc-400">
                      {content.description}
                    </p>
                    {content.product_slug && (
                      <Link href={content.product_slug} className="btn-kith-outline w-fit text-[9px] py-1.5 px-3 mt-3">
                        {content.cta_text || 'VIEW ITEM'}
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            );

          // 6. PRODUCT GRID
          case 'product_grid':
            const targetSlugs = content.product_slugs ? content.product_slugs.split(',').map((s: string) => s.trim()) : [];
            const gridProds = targetSlugs.length > 0
              ? dbProducts.filter((p: any) => targetSlugs.includes(p.slug))
              : dbProducts.slice(0, content.limit || 4);
            const cols = content.columns || 4;

            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-12 text-center">
                <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-foreground/75 mb-6">
                  {content.heading}
                </h4>
                <div className={`grid gap-4 ${cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                  {gridProds.map((product: any) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      className="group flex flex-col space-y-3 grayscale-card border border-zinc-900 bg-[#060607] p-3 transition-colors hover:border-zinc-800"
                    >
                      <div className="relative aspect-[4/5] w-full bg-[#0c0c0e] overflow-hidden flex items-center justify-center">
                        {product.product_images?.[0]?.image_url ? (
                          <img src={product.product_images[0].image_url} alt={product.name} className="w-full h-full object-cover transition-all duration-500" />
                        ) : (
                          <span className="font-display text-[9px] tracking-wider text-zinc-600 uppercase">NO IMAGE</span>
                        )}
                      </div>
                      <div className="flex flex-col space-y-1 text-left">
                        <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">{product.categories?.name || 'Art'}</span>
                        <h4 className="font-display text-[10px] tracking-wider text-foreground font-semibold group-hover:text-accent transition-colors truncate">{product.name}</h4>
                        <span className="font-mono text-[9px] text-foreground"><FormattedPrice amountInPaise={product.regular_price} /></span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );

          // 7. IMAGE COMPONENT
          case 'image':
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-8 max-w-3xl mx-auto text-center">
                {content.image_url && (
                  <div className={`w-full ${content.ratio || 'aspect-[16/9]'} relative`}>
                    <img src={content.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {content.caption && (
                  <p className="font-sans text-[9px] text-zinc-500 mt-2 italic">{content.caption}</p>
                )}
              </section>
            );

          // 8. VIDEO COMPONENT
          case 'video':
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-8 max-w-3xl mx-auto text-center">
                <div className={`w-full ${content.ratio || 'aspect-[16/9]'} relative overflow-hidden bg-black border border-zinc-900`}>
                  <video 
                    src={content.video_url} 
                    controls 
                    autoPlay={content.autoplay} 
                    muted={content.autoplay}
                    loop
                    className="w-full h-full object-cover" 
                  />
                </div>
              </section>
            );

          // 9. PROMO BANNER COMPONENT
          case 'promo_banner':
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-8">
                <div className="w-full py-8 bg-[#0c0c0e] border border-zinc-900 rounded p-6 flex flex-col items-center justify-center space-y-3">
                  <h4 className="font-display text-[10px] uppercase tracking-widest text-accent font-bold">{content.heading}</h4>
                  <div className="font-mono text-xs md:text-sm font-bold border-2 border-dashed border-zinc-800 px-4 py-1.5 rounded tracking-widest text-foreground select-all bg-black">{content.promo_code}</div>
                  <p className="font-sans text-[9px] text-zinc-500 tracking-wider">{content.discount}</p>
                  {content.cta_link && (
                    <Link href={content.cta_link} className="btn-kith-outline mt-2 text-[9px] py-1.5 px-3">
                      {content.cta_text || 'APPLY OFFER'}
                    </Link>
                  )}
                </div>
              </section>
            );

          // 10. FEATURED CONTENT BANNER
          case 'featured_content':
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-12 md:py-16">
                <div className="w-full py-16 bg-[#0c0c0e] border border-zinc-900 rounded p-8 sm:p-12 relative overflow-hidden flex flex-col justify-center items-center text-center space-y-4">
                  {content.image_url && (
                    <div className="absolute inset-0 z-0 opacity-20">
                      <img src={content.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="z-10 flex flex-col justify-center items-center space-y-4 max-w-xl">
                    <h3 className="font-display text-sm md:text-base font-bold uppercase tracking-[0.15em] text-foreground">{content.heading}</h3>
                    <p className="font-sans text-[10px] sm:text-xs text-zinc-400 tracking-wider leading-relaxed">{content.body}</p>
                    {content.cta_link && (
                      <Link href={content.cta_link} className="btn-kith-outline mt-2 text-[9px] py-1.5 px-3">
                        {content.cta_text || 'LEARN MORE'}
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            );

          // 11. ANNOUNCEMENT BULLETIN
          case 'announcement':
            return (
              <section key={section.id} className="w-full bg-accent text-black text-center py-2 px-4 uppercase tracking-[0.2em] font-display text-[8px] font-bold">
                {content.text}
              </section>
            );

          // 12. CTA BUTTON BLOCK
          case 'cta':
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-12 text-center">
                <div className="w-full py-12 bg-[#0c0c0e] border border-zinc-900 flex flex-col items-center justify-center p-8 space-y-4">
                  <h3 className="font-display text-xs md:text-sm font-bold uppercase tracking-wider">{content.heading}</h3>
                  <Link href={content.cta_link || '/customize-art'} className="btn-kith-outline tracking-widest text-[9px] font-bold py-2 px-4">
                    {content.button_text || 'BOOK FREE CONSULTATION'}
                  </Link>
                </div>
              </section>
            );

          // 13. SPACER COMPONENT
          case 'spacer':
            return (
              <section key={section.id} className={`w-full ${content.height || 'h-12'}`} />
            );

          // 14. CUSTOM HTML SECTION
          case 'custom_section':
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-6" dangerouslySetInnerHTML={{ __html: content.html || '' }} />
            );

          // 15. PRODUCT CAROUSEL SWIPER
          case 'product_swiper':
            const swiperLimit = content.limit || 10;
            const swiperProducts = productsList.slice(0, swiperLimit);
            return (
              <section key={section.id} className="w-full px-4 sm:px-6 py-12 md:py-16">
                <div className="flex justify-between items-end mb-6 md:mb-8">
                  <h3 className="font-display text-[10px] font-extrabold uppercase tracking-[0.25em] text-foreground/55">
                    {content.heading || 'LATEST RELEASES'}
                  </h3>
                  <Link
                    href="/shop"
                    className="font-display text-[9px] font-bold uppercase tracking-widest text-muted hover:text-accent border-b border-zinc-900 pb-0.5 transition-colors"
                  >
                    VIEW ALL
                  </Link>
                </div>

                {/* Horizontal swiper container */}
                <div className="kith-swiper w-full gap-4 pb-4">
                  {swiperProducts.map((product: any) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      className="kith-swiper-item w-[68%] sm:w-[45%] md:w-[28%] lg:w-[19.2%] group flex flex-col space-y-3.5 grayscale-card"
                    >
                      {/* Image Container aspect-ratio 4:5 */}
                      <div className="overflow-hidden bg-[#0c0c0e]">
                        <BlankPlaceholder ratio="aspect-[4/5]" label={product.name} imageUrl={product.product_images?.[0]?.image_url} />
                      </div>
                      
                      {/* Product Info left-aligned, font-georgia */}
                      <div className="flex flex-col space-y-1 items-start text-left px-3.5 pb-3.5">
                        <span className="font-display text-[8px] uppercase tracking-widest text-zinc-600">
                          {product.categories?.name || 'Art Release'}
                        </span>
                        
                        {/* Product Name in Georgia */}
                        <h4 className="font-georgia text-[12px] italic tracking-wide text-foreground group-hover:text-accent transition-colors leading-tight line-clamp-1">
                          {product.name}
                        </h4>
                        
                        {/* Price */}
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
              </section>
            );

          default:
            return null;
        }
      })}

    </div>
  );
}
