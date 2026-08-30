/**
 * Image Optimization Utilities for Dollysticart E-Commerce
 * Converts master uploaded images into compressed, optimized WebP assets for public web delivery.
 */

export interface OptimizedImageResult {
  originalFile: File;
  webFile: File;
  originalFileName: string;
  webFileName: string;
}

/**
 * Generates a unique filename slug
 */
export function generateStorageFileNames(originalName: string, prefix = 'img'): { originalFileName: string; webFileName: string } {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';

  const originalFileName = `${prefix}-orig-${timestamp}-${random}.${ext}`;
  const webFileName = `${prefix}-web-${timestamp}-${random}.webp`;

  return { originalFileName, webFileName };
}

/**
 * Resizes an image file/blob to a maximum dimension and encodes to WebP format.
 */
export async function createOptimizedWebPFile(
  fileOrBlob: File | Blob,
  outputFileName: string,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Scale down proportionally if larger than maximum bounds
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D canvas context for image optimization.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert canvas to WebP blob.'));
            return;
          }
          const webpFile = new File([blob], outputFileName, { type: 'image/webp' });
          resolve(webpFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for optimization.'));
    };

    img.src = objectUrl;
  });
}
