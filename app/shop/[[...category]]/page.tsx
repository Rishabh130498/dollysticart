import React from 'react';
import Link from 'next/link';
import { ChevronRight, Filter, Grid, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import FormattedPrice from '@/components/common/FormattedPrice';
import { getProductCardImageUrl } from '@/lib/utils/image-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Price Formatter Helper
function formatPrice(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
}

// Blank Placeholder Card Image
function BlankPlaceholder({ label, imageUrl }: { label: string; imageUrl?: string }) {
  return (
    <div className="w-full aspect-[3/4] bg-[#0c0c0e] flex flex-col items-center justify-center p-4 relative group overflow-hidden">
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl} 
            alt={label} 
            className="absolute inset-0 w-full h-full object-cover z-10 transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 z-20 bg-zinc-950/10 group-hover:bg-zinc-950/0 transition-colors pointer-events-none" />
        </>
      ) : (
        <>
          {/* Editorial Grid Lines */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-10">
            <div className="border-r border-b border-zinc-800"></div>
            <div className="border-r border-b border-zinc-800"></div>
            <div className="border-b border-zinc-800"></div>
            <div className="border-r border-b border-zinc-800"></div>
            <div className="border-r border-b border-zinc-800"></div>
            <div className="border-b border-zinc-800"></div>
          </div>
          <span className="font-display text-[9px] tracking-[0.2em] text-zinc-500 uppercase text-center max-w-[80%] line-clamp-2">
            {label}
          </span>
          <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest mt-1">
            3:4 ARTWORK
          </span>
          <div className="absolute inset-0 bg-zinc-950/20 group-hover:bg-zinc-950/0 pointer-events-none" />
        </>
      )}
    </div>
  );
}

// Mock Fallbacks
const MOCK_CATEGORIES = [
  { id: 'c1', name: 'Original Art', slug: 'original-art', parent_id: null },
  { id: 'c2', name: 'Art Prints', slug: 'art-prints', parent_id: null },
  { id: 'c3', name: 'Calendar', slug: 'calendar', parent_id: null },
  { id: 'c4', name: 'Art Products', slug: 'art-products', parent_id: null },
  { id: 'sub1', name: 'Bookmarks', slug: 'bookmarks', parent_id: 'c4' },
  { id: 'sub2', name: 'Stationery', slug: 'stationery', parent_id: 'c4' },
  { id: 'sub3', name: 'Fridge Magnets', slug: 'fridge-magnets', parent_id: 'c4' },
  { id: 'sub4', name: 'Stickers', slug: 'stickers', parent_id: 'c4' },
  { id: 'sub5', name: 'Badges', slug: 'badges', parent_id: 'c4' },
  { id: 'sub6', name: 'Apparels', slug: 'apparels', parent_id: 'c4' },
  { id: 'sub7', name: 'Mugs', slug: 'mugs', parent_id: 'c4' },
  { id: 'sub8', name: 'Phone Cases', slug: 'phone-cases', parent_id: 'c4' },
];

const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Abstract Impasto No. 1', regular_price: 299900, discounted_price: 199900, slug: 'abstract-impasto-1', category_id: 'c1', category_name: 'Original Art', featured: true },
  { id: 'p2', name: 'Textured Flow Studies', regular_price: 149900, discounted_price: null, slug: 'textured-flow-studies', category_id: 'c2', category_name: 'Art Prints', featured: true },
  { id: 'p3', name: 'Minimal Canvas Sketch', regular_price: 99900, discounted_price: 79900, slug: 'minimal-canvas-sketch', category_id: 'c2', category_name: 'Art Prints', featured: false },
  { id: 'p4', name: 'Monochrome Palette Work', regular_price: 349900, discounted_price: null, slug: 'monochrome-palette-work', category_id: 'c1', category_name: 'Original Art', featured: true },
  { id: 'p5', name: 'Textured Palette Calendar 2027', regular_price: 199900, discounted_price: null, slug: 'textured-palette-calendar-2027', category_id: 'c3', category_name: 'Calendar', featured: false },
  { id: 'p6', name: 'Premium Metallic Bookmark Set', regular_price: 49900, discounted_price: null, slug: 'premium-metallic-bookmark-set', category_id: 'sub1', category_name: 'Bookmarks', featured: false },
  { id: 'p7', name: 'Aesthetic Impasto Fridge Magnet', regular_price: 29900, discounted_price: null, slug: 'aesthetic-impasto-fridge-magnet', category_id: 'sub3', category_name: 'Fridge Magnets', featured: false },
  { id: 'p8', name: 'Aesthetic Textured Sticker Pack', regular_price: 19900, discounted_price: null, slug: 'aesthetic-textured-sticker-pack', category_id: 'sub4', category_name: 'Stickers', featured: false }
];

interface PageProps {
  params: Promise<{
    category?: string[];
  }>;
  searchParams: Promise<{
    search?: string;
    sort?: string;
  }>;
}

export default async function ShopPage({ params, searchParams }: PageProps) {
  // Await the route promises (Next.js 15 requirement)
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const categorySlugs = resolvedParams.category || [];
  const searchVal = resolvedSearchParams.search || '';
  const sortVal = resolvedSearchParams.sort || 'default';

  // Get active category slug if set
  const activeCategorySlug = categorySlugs[categorySlugs.length - 1];

  let dbCategories: any[] = [];
  let dbProducts: any[] = [];
  let useFallback = false;

  let shopHeroTitle = 'ALL RELEASES';

  try {
    const supabase = await createClient();
    
    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    dbCategories = categoriesData || [];

    // Fetch products (using LEFT JOIN so uncategorized products are not filtered out)
    let query = supabase
      .from('products')
      .select('*, categories!left(name), product_images!left(storage_path, is_primary)')
      .neq('status', 'archived');
    
    const { data: productsData } = await query;
    dbProducts = productsData || [];

    // Fetch CMS Shop Page title
    const { data: shopPageCms } = await supabase
      .from('homepage_sections')
      .select('published_content')
      .eq('type', 'shop_page')
      .maybeSingle();
    
    if (shopPageCms?.published_content?.hero_title) {
      shopHeroTitle = shopPageCms.published_content.hero_title;
    }

    if (dbCategories.length === 0 && dbProducts.length === 0) {
      useFallback = true;
    }
  } catch (error) {
    console.error('Database connection error inside shop, loading fallbacks.', error);
    useFallback = true;
  }

  // Bind source datasets
  const categoriesList = useFallback ? MOCK_CATEGORIES : dbCategories;
  const rawProducts = useFallback ? MOCK_PRODUCTS : dbProducts.map(p => ({
    ...p,
    category_name: p.categories?.name || 'Uncategorized'
  }));

  // Helper mapping category name/ids
  const categoriesMap = new Map(categoriesList.map(c => [c.slug, c]));
  const categoriesIdMap = new Map(categoriesList.map(c => [c.id, c]));

  // Get current category structure info
  const activeCategory = activeCategorySlug ? categoriesMap.get(activeCategorySlug) : null;

  // Build category hierarchy breadcrumbs
  const breadcrumbs: { label: string; href: string }[] = [{ label: 'Shop', href: '/shop' }];
  if (categorySlugs.length > 0) {
    let accumulatedPath = '/shop';
    for (const slug of categorySlugs) {
      const cat = categoriesMap.get(slug);
      if (cat) {
        accumulatedPath += `/${slug}`;
        breadcrumbs.push({ label: cat.name, href: accumulatedPath });
      }
    }
  }

  // Filter Products by Category (recursively checks children)
  const getSubcategoryIds = (catId: string): string[] => {
    const ids = [catId];
    categoriesList.forEach(c => {
      if (c.parent_id === catId) {
        ids.push(...getSubcategoryIds(c.id));
      }
    });
    return ids;
  };

  let filteredProducts = [...rawProducts];

  if (activeCategory) {
    const categoryIds = getSubcategoryIds(activeCategory.id);
    filteredProducts = filteredProducts.filter(p => categoryIds.includes(p.category_id));
  }

  // Filter Products by Search
  if (searchVal) {
    const term = searchVal.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(term) || 
      (p.description && p.description.toLowerCase().includes(term))
    );
  }

  // Apply Sorting
  if (sortVal === 'price-asc') {
    filteredProducts.sort((a, b) => {
      const priceA = a.discounted_price ?? a.regular_price;
      const priceB = b.discounted_price ?? b.regular_price;
      return priceA - priceB;
    });
  } else if (sortVal === 'price-desc') {
    filteredProducts.sort((a, b) => {
      const priceA = a.discounted_price ?? a.regular_price;
      const priceB = b.discounted_price ?? b.regular_price;
      return priceB - priceA;
    });
  } else if (sortVal === 'newest') {
    filteredProducts.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }

  // Build sidebar categories layout hierarchies (parents and their children)
  const parentCategories = categoriesList.filter(c => c.parent_id === null);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10 md:pt-36 md:pb-16">
      
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-muted mb-6 md:mb-10">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.href}>
            {idx > 0 && <ChevronRight className="h-3 w-3 text-zinc-700" />}
            <Link 
              href={crumb.href} 
              className={`hover:text-accent transition-colors ${
                idx === breadcrumbs.length - 1 ? 'text-foreground font-semibold' : ''
              }`}
            >
              {crumb.label}
            </Link>
          </React.Fragment>
        ))}
      </nav>

      {/* 2. Top Title & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border-subtle pb-6 mb-8 md:mb-12 space-y-4 md:space-y-0">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold uppercase tracking-wide">
            {activeCategory ? activeCategory.name : shopHeroTitle}
          </h1>
          {searchVal && (
            <p className="font-sans text-xs text-muted mt-2">
              Showing search results for &ldquo;<span className="text-foreground font-semibold">{searchVal}</span>&rdquo; ({filteredProducts.length} items)
            </p>
          )}
        </div>
        
        {/* Sorting controls URL builder */}
        <div className="flex items-center gap-4">
          <span className="font-display text-[10px] tracking-wider text-muted uppercase flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" />
            Sort By
          </span>
          <div className="flex gap-2">
            {[
              { label: 'DEFAULT', sort: 'default' },
              { label: 'PRICE: LOW TO HIGH', sort: 'price-asc' },
              { label: 'PRICE: HIGH TO LOW', sort: 'price-desc' },
              { label: 'NEWEST', sort: 'newest' },
            ].map(opt => {
              const urlSearch = searchVal ? `&search=${encodeURIComponent(searchVal)}` : '';
              const categoryPath = categorySlugs.length > 0 ? `/${categorySlugs.join('/')}` : '';
              return (
                <Link
                  key={opt.sort}
                  href={`/shop${categoryPath}?sort=${opt.sort}${urlSearch}`}
                  className={`font-display text-[9px] uppercase tracking-widest px-3 py-1.5 border transition-all duration-300 ${
                    sortVal === opt.sort 
                      ? 'border-accent bg-accent text-black font-semibold' 
                      : 'border-zinc-800 text-foreground/70 hover:border-zinc-600 hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Catalog Shell Layout (Sidebar + Grid) */}
      <div className="flex flex-col md:flex-row gap-10 md:gap-16">
        
        {/* Categories Sidebar */}
        <aside className="w-full md:w-60 shrink-0">
          <div className="border-b border-border-subtle md:border-none pb-4 md:pb-0">
            <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/50 mb-4 hidden md:block">
              Categories
            </h2>
            <ul className="flex flex-wrap md:flex-col gap-2 md:gap-4 font-display text-[11px] uppercase tracking-widest">
              {/* "All" button */}
              <li className="w-auto md:w-full">
                <Link 
                  href="/shop"
                  className={`block py-1 hover:text-accent transition-colors ${
                    !activeCategory ? 'text-accent font-semibold border-b border-accent md:border-none' : 'text-foreground/70'
                  }`}
                >
                  ALL ITEMS ({rawProducts.length})
                </Link>
              </li>
              
              {/* Loop parent categories */}
              {parentCategories.map(parent => {
                const subcats = categoriesList.filter(c => c.parent_id === parent.id);
                const isParentActive = categorySlugs[0] === parent.slug;
                
                return (
                  <li key={parent.id} className="w-auto md:w-full">
                    <Link 
                      href={`/shop/${parent.slug}`}
                      className={`block py-1 hover:text-accent transition-colors ${
                        isParentActive ? 'text-accent font-semibold border-b border-accent md:border-none' : 'text-foreground/70'
                      }`}
                    >
                      {parent.name}
                    </Link>
                    
                    {/* Render subcategories if desktop and parent is active */}
                    {subcats.length > 0 && (
                      <ul className="hidden md:block pl-4 mt-2 space-y-2 border-l border-zinc-900">
                        {subcats.map(sub => (
                          <li key={sub.id}>
                            <Link 
                              href={`/shop/${parent.slug}/${sub.slug}`}
                              className={`block text-[10px] hover:text-accent transition-colors ${
                                activeCategorySlug === sub.slug ? 'text-accent font-semibold' : 'text-muted'
                              }`}
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* 4. Products Grid */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-900 rounded-lg text-center px-4">
              <span className="font-display text-xs tracking-widest text-muted uppercase">No items found</span>
              <p className="font-sans text-xs text-zinc-600 mt-2 max-w-xs">
                We couldn&rsquo;t find any items matching your selected criteria. Try checking your spelling or clearing filters.
              </p>
              <Link 
                href="/shop" 
                className="mt-6 border border-zinc-800 hover:border-accent px-4 py-2 font-display text-[9px] uppercase tracking-widest text-foreground hover:text-accent transition-colors duration-300"
              >
                Clear Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {filteredProducts.map((product) => (
                <Link 
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="group flex flex-col space-y-3 grayscale-card"
                >
                  {/* Aspect Ratio 3:4 Box */}
                  <BlankPlaceholder 
                    label={product.name} 
                    imageUrl={getProductCardImageUrl(product)} 
                  />

                  {/* Info details */}
                  <div className="flex flex-col space-y-1 items-start px-3.5 pb-3.5">
                    <span className="font-display text-[8px] uppercase tracking-[0.2em] text-muted">
                      {product.category_name}
                    </span>
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-accent transition-colors duration-300">
                      {product.name}
                    </h3>
                    
                    {/* Prices */}
                    <div className="flex items-center space-x-2 pt-0.5">
                      {product.discounted_price ? (
                        <>
                          <span className="font-sans text-xs text-muted line-through">
                            <FormattedPrice amountInPaise={product.regular_price} />
                          </span>
                          <span className="font-sans text-xs font-semibold text-foreground">
                            <FormattedPrice amountInPaise={product.discounted_price} />
                          </span>
                        </>
                      ) : (
                        <span className="font-sans text-xs text-foreground">
                          <FormattedPrice amountInPaise={product.regular_price} />
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
