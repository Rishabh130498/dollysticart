/**
 * Helper utility to safely extract product artwork image URL from database object
 */
export function getProductCardImageUrl(product: any): string | undefined {
  if (!product) return undefined;
  
  // 1. Nested product_images array from Supabase query
  if (Array.isArray(product.product_images) && product.product_images.length > 0) {
    const primary = product.product_images.find((img: any) => img.is_primary) || product.product_images[0];
    const url = primary?.storage_path || primary?.image_url;
    if (url) return url;
  }

  // 2. Single product_images object
  if (product.product_images && typeof product.product_images === 'object') {
    const url = product.product_images.storage_path || product.product_images.image_url;
    if (url) return url;
  }

  // 3. String image array (e.g. product.images)
  if (Array.isArray(product.images) && product.images.length > 0 && typeof product.images[0] === 'string') {
    return product.images[0];
  }

  // 4. Direct storage_path / image_url fields
  if (typeof product.storage_path === 'string') return product.storage_path;
  if (typeof product.image_url === 'string') return product.image_url;

  return undefined;
}
