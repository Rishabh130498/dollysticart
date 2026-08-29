import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';

// Mock list matching shop
const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Abstract Impasto No. 1', regular_price: 299900, discounted_price: 199900, slug: 'abstract-impasto-1', category_name: 'Original Art', description: 'A one-of-one textured acrylic canvas painting. Features heavy impasto knife work in deep charcoal and titanium white tones, highlighted with fluorescent neon accents. Stretched on a premium pine wood gallery frame.' },
  { id: 'p2', name: 'Textured Flow Studies', regular_price: 149900, discounted_price: null, slug: 'textured-flow-studies', category_name: 'Art Prints', description: 'A high-fidelity reproduction print of our textured palette knife flow study. Printed on 310gsm museum-grade 100% cotton rag acid-free paper. Archival inks guarantee colors for up to 100 years.' },
  { id: 'p3', name: 'Minimal Canvas Sketch', regular_price: 99900, discounted_price: 79900, slug: 'minimal-canvas-sketch', category_name: 'Art Prints', description: 'A minimalist textured sketch study capturing light and shadow cast across micro-impasto surfaces. Excellent as a standalone piece or within an editorial gallery wall collection.' },
  { id: 'p4', name: 'Monochrome Palette Work', regular_price: 349900, discounted_price: null, slug: 'monochrome-palette-work', category_name: 'Original Art', description: 'A large-scale dramatic textured acrylic canvas painting. The monochrome impasto layers reflect dynamic shadows when illuminated, bringing an organic depth to premium spaces.' },
  { id: 'p5', name: 'Textured Palette Calendar 2027', regular_price: 199900, discounted_price: null, slug: 'textured-palette-calendar-2027', category_name: 'Calendar', description: 'Our annual desk calendar collection. Each month features a high-fidelity print of a bespoke textured palette knife study, double-sided on thick textured cardstock. Includes a custom-crafted solid oak base.' },
  { id: 'p6', name: 'Premium Metallic Bookmark Set', regular_price: 49900, discounted_price: null, slug: 'premium-metallic-bookmark-set', category_name: 'Bookmarks', description: 'A set of four heavy cardstock bookmarks hand-painted with textured acrylic strokes, finished with subtle metallic highlights. Comes packaged inside a black linen presentation envelope.' },
  { id: 'p7', name: 'Aesthetic Impasto Fridge Magnet', regular_price: 29900, discounted_price: null, slug: 'aesthetic-impasto-fridge-magnet', category_name: 'Fridge Magnets', description: 'A miniature canvas fridge magnet decorated with hand-painted textured acrylic impasto strokes. Adds a touch of fine art to domestic surfaces.' },
  { id: 'p8', name: 'Aesthetic Textured Sticker Pack', regular_price: 19900, discounted_price: null, slug: 'aesthetic-textured-sticker-pack', category_name: 'Stickers', description: 'A collection of 10 high-quality matte vinyl stickers featuring abstract textured paint strokes. Fully waterproof and fade-resistant, perfect for notebooks, laptops, and phone cases.' }
];

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Fetch helper matching database and mock fallbacks
async function getProductBySlug(slug: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    
    if (data) {
      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        regular_price: data.regular_price,
        discounted_price: data.discounted_price,
        category_name: data.categories?.name || 'Uncategorized'
      };
    }
  } catch (error) {
    console.error('Database connection error inside product slug retrieval, loading fallback.', error);
  }

  // Load Mock fallback if database not seeded or connection failed
  return MOCK_PRODUCTS.find(p => p.slug === slug) || null;
}

// Dynamic SEO metadata generator
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: product.name,
    description: product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.substring(0, 160),
      type: 'article',
      url: `/product/${product.slug}`,
    }
  };
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-xl uppercase tracking-widest mb-4">Product Not Found</h1>
        <p className="font-sans text-xs text-muted mb-8">
          The requested product does not exist or has been unpublished.
        </p>
        <Link 
          href="/shop" 
          className="border border-zinc-800 hover:border-accent px-6 py-2.5 font-display text-[10px] uppercase tracking-widest text-foreground hover:text-accent transition-colors"
        >
          BACK TO SHOP
        </Link>
      </div>
    );
  }

  // Schema.org structured JSON-LD data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.slug,
    category: product.category_name,
    offers: {
      '@type': 'Offer',
      price: ((product.discounted_price ?? product.regular_price) / 100).toFixed(2),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/product/${product.slug}`
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* 1. Inject JSON-LD Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 2. Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-muted mb-8 md:mb-12">
        <Link href="/shop" className="hover:text-accent transition-colors">Shop</Link>
        <ChevronRight className="h-3 w-3 text-zinc-700" />
        <Link href={`/shop/${product.category_name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`} className="hover:text-accent transition-colors">
          {product.category_name}
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-700" />
        <span className="text-foreground font-semibold">{product.name}</span>
      </nav>

      {/* 3. Product detail layout */}
      <ProductDetailsClient product={product} />
    </div>
  );
}
