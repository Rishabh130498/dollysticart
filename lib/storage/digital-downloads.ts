import { createAdminClient } from '@/lib/supabase/admin';

export interface DigitalAssetSignedUrl {
  productName: string;
  signedUrl: string;
  expiresInDays: number;
}

/**
 * Generates secure, expiring signed URLs for digital art assets stored in private Supabase Storage.
 * Never exposes permanent public URLs or raw storage paths.
 * 
 * Paid customers can re-generate fresh signed URLs anytime by logging into their customer account page (/account/orders/[id]),
 * effectively giving them lifetime access to their purchased digital products.
 */
export async function generateDigitalDownloadSignedUrls(
  orderId: string,
  expiresInSeconds = 604800 // Default 7 days (604,800 seconds) for initial email access
): Promise<DigitalAssetSignedUrl[]> {
  try {
    const adminDb = createAdminClient();

    // Fetch order items with product digital storage paths
    const { data: orderItems, error } = await adminDb
      .from('order_items')
      .select('*, products(name, digital_storage_path)')
      .eq('order_id', orderId);

    if (error || !orderItems || orderItems.length === 0) {
      return [];
    }

    const digitalAssets: DigitalAssetSignedUrl[] = [];
    const bucketName = process.env.SUPABASE_DIGITAL_BUCKET || 'digital-products';

    for (const item of orderItems) {
      const storagePath = item.products?.digital_storage_path;
      if (storagePath) {
        // Try primary digital products bucket
        let { data, error: signedErr } = await adminDb.storage
          .from(bucketName)
          .createSignedUrl(storagePath, expiresInSeconds);

        // Fallback to products-originals if digital-products bucket is not set up
        if (signedErr || !data?.signedUrl) {
          const fallbackBucket = 'products-originals';
          const { data: fallbackData, error: fbErr } = await adminDb.storage
            .from(fallbackBucket)
            .createSignedUrl(storagePath, expiresInSeconds);

          if (!fbErr && fallbackData?.signedUrl) {
            data = fallbackData;
            signedErr = null;
          }
        }

        if (!signedErr && data?.signedUrl) {
          digitalAssets.push({
            productName: item.products.name,
            signedUrl: data.signedUrl,
            expiresInDays: Math.round(expiresInSeconds / 86400),
          });
        } else {
          console.warn(`[DIGITAL STORAGE WARNING] Digital asset for '${item.products?.name}' could not be generated. Ensure bucket '${bucketName}' or 'products-originals' exists.`);
        }
      }
    }

    return digitalAssets;
  } catch (err) {
    console.error('[DIGITAL DOWNLOAD ERROR] Non-blocking signed URL generation error:', err);
    return [];
  }
}
