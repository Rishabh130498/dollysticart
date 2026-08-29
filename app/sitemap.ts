export const dynamic = 'force-dynamic';

import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // 1. Core Static routes
  const routes = ['', '/shop', '/customize-art', '/about', '/contact'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 2. Dynamic Category & Product routes from Database
  let productRoutes: any[] = [];
  let categoryRoutes: any[] = [];

  try {
    const supabase = await createClient();
    
    // Query active products
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('status', 'published');

    if (products) {
      productRoutes = products.map((p) => ({
        url: `${baseUrl}/product/${p.slug}`,
        lastModified: new Date(p.updated_at || Date.now()).toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }

    // Query active visible categories
    const { data: categories } = await supabase
      .from('categories')
      .select('slug, updated_at')
      .eq('is_visible', true);

    if (categories) {
      categoryRoutes = categories.map((c) => ({
        url: `${baseUrl}/shop/${c.slug}`,
        lastModified: new Date(c.updated_at || Date.now()).toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Error dynamically compiling sitemap.ts XML routes:', error);
  }

  return [...routes, ...categoryRoutes, ...productRoutes];
}
