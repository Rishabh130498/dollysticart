'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Save, ArrowLeft, Image as ImageIcon, Trash2, CheckCircle, AlertTriangle, Crop } from 'lucide-react';


interface ProductFormProps {
  productId?: string; // If provided, we are in Edit Mode
}

export default function ProductForm({ productId }: ProductFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [regularPrice, setRegularPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published');
  
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cropper states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropImageFile, setCropImageFile] = useState<File | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);

  // File input ref for native file selector
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Asset picker & Deletion choice states
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showDatabasePicker, setShowDatabasePicker] = useState(false);
  const [deleteConfirmImg, setDeleteConfirmImg] = useState<{ id: string; url: string; idx: number } | null>(null);
  const [isProductImgShared, setIsProductImgShared] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 1. Fetch categories list for dropdown
    const loadCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .order('sort_order', { ascending: true });
      setCategories(data || []);
    };
    
    loadCategories();

    // 2. If edit mode, load product details
    if (productId) {
      const loadProduct = async () => {
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (error || !product) {
          setErrorMsg('Failed to load product details.');
          return;
        }

        setName(product.name);
        setSlug(product.slug);
        setDescription(product.description || '');
        setRegularPrice((product.regular_price / 100).toString());
        setDiscountPrice(product.discounted_price ? (product.discounted_price / 100).toString() : '');
        setCategoryId(product.category_id || '');
        setFeatured(product.featured);
        setStatus(product.status);

        // Fetch images
        const { data: imgs } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .order('sort_order', { ascending: true });
        
        setImages(imgs || []);
      };

      loadProduct();
    }
  }, [productId, supabase]);

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!productId) {
      setSlug(val.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      );
    }
  };

  // Upload file to Supabase storage and save record
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setErrorMsg('');
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload file to products bucket
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Construct public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      if (productId) {
        // If edit mode, insert immediately to DB
        const { data: newImg, error: dbError } = await supabase
          .from('product_images')
          .insert([
            {
              product_id: productId,
              storage_path: publicUrl,
              is_primary: images.length === 0,
              sort_order: images.length
            }
          ])
          .select('*')
          .single();

        if (dbError) throw dbError;
        setImages([...images, newImg]);
      } else {
        // If create mode, save temporarily in state to insert later
        setImages([...images, { storage_path: publicUrl, is_primary: images.length === 0, sort_order: images.length, fileObj: file }]);
      }

      setSuccessMsg('Image uploaded successfully.');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Image upload failed. Make sure you created a public "products" bucket in Supabase storage.');
    } finally {
      setUploading(false);
    }
  };

  // Pre-upload crop selector modal handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Open cropper modal
    setCropImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Crop image using canvas and upload cropped output
  const applyCrop = () => {
    const canvas = cropCanvasRef.current;
    const img = cropImgRef.current;
    if (!canvas || !img || !cropImageFile) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use default crop: centered 3:4 crop box
    const aspectWidth = 3;
    const aspectHeight = 4;
    
    // Source dimensions
    const sw = img.naturalWidth;
    const sh = img.naturalHeight;
    
    let cropWidth = sw;
    let cropHeight = (sw * aspectHeight) / aspectWidth;
    
    if (cropHeight > sh) {
      cropHeight = sh;
      cropWidth = (sh * aspectWidth) / aspectHeight;
    }
    
    const sx = (sw - cropWidth) / 2;
    const sy = (sh - cropHeight) / 2;

    // Canvas target dimensions
    canvas.width = 600;
    canvas.height = 800;

    ctx.drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], cropImageFile.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        setCropModalOpen(false);
        handleFileUpload(croppedFile);
      }
    }, 'image/jpeg', 0.9);
  };

  // Helper: check if file is shared in database before physical storage deletion
  const checkProductImageUsage = async (url: string) => {
    try {
      const escapedUrl = url.split('?')[0];
      
      // 1. Check homepage sections
      const { data: secData } = await supabase.from('homepage_sections').select('*');
      const secCount = secData ? (JSON.stringify(secData).split(escapedUrl).length - 1) : 0;
      
      // 2. Check product images
      const { data: prodData } = await supabase.from('product_images').select('image_url');
      const prodCount = prodData ? (JSON.stringify(prodData).split(escapedUrl).length - 1) : 0;
      
      return (secCount + prodCount) > 1;
    } catch (e) {
      console.error('Error verifying image references:', e);
      return false;
    }
  };

  // Helper: extract file path key from public url
  const getStoragePathFromUrl = (url: string) => {
    try {
      const parts = url.split('/public/products/');
      if (parts.length > 1) {
        return decodeURIComponent(parts[1].split('?')[0]);
      }
    } catch (e) {
      console.error('Error parsing storage path:', e);
    }
    return null;
  };

  // Delete image
  const handleImageDelete = async (imgId: string, idx: number) => {
    const targetImg = images.find((img, i) => (img.id === imgId || i === idx));
    const url = targetImg?.storage_path || '';
    if (!url) return;

    const isShared = await checkProductImageUsage(url);
    setIsProductImgShared(isShared);
    setDeleteConfirmImg({ id: imgId, url, idx });
  };

  const handleProductRemoveOnly = async () => {
    if (!deleteConfirmImg) return;
    const { id, idx } = deleteConfirmImg;
    if (productId && id) {
      try {
        const { error } = await supabase
          .from('product_images')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setImages(images.filter(img => img.id !== id));
      } catch (err: any) {
        console.error(err);
        alert('Failed to delete image reference.');
      }
    } else {
      setImages(images.filter((_, i) => i !== idx));
    }
    setDeleteConfirmImg(null);
  };

  const handleProductRemoveAndDelete = async () => {
    if (!deleteConfirmImg) return;
    const { id, url, idx } = deleteConfirmImg;
    try {
      // 1. Remove database record
      if (productId && id) {
        const { error } = await supabase
          .from('product_images')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setImages(images.filter(img => img.id !== id));
      } else {
        setImages(images.filter((_, i) => i !== idx));
      }

      // 2. Delete actual file from Storage bucket
      const path = getStoragePathFromUrl(url);
      if (path) {
        const { error } = await supabase.storage.from('products').remove([path]);
        if (error) {
          console.warn('Physical storage file delete failed:', error);
        }
      }
    } catch (err: any) {
      console.error('Failed to remove asset:', err);
      alert(err.message || 'Error deleting storage asset.');
    } finally {
      setDeleteConfirmImg(null);
    }
  };

  const handleSelectExistingImage = async (url: string) => {
    if (productId) {
      try {
        const { data: newImg, error: dbError } = await supabase
          .from('product_images')
          .insert([
            {
              product_id: productId,
              storage_path: url,
              is_primary: images.length === 0,
              sort_order: images.length
            }
          ])
          .select('*')
          .single();

        if (dbError) throw dbError;
        setImages([...images, newImg]);
      } catch (err: any) {
        console.error(err);
        alert(err.message || 'Failed to save existing reference.');
      }
    } else {
      setImages([...images, { storage_path: url, is_primary: images.length === 0, sort_order: images.length }]);
    }
    setShowDatabasePicker(false);
  };

  // Set primary image
  const handleSetPrimary = async (imgId: string, idx: number) => {
    if (productId) {
      try {
        // Reset all images to not primary
        await supabase
          .from('product_images')
          .update({ is_primary: false })
          .eq('product_id', productId);
        
        // Set selected to primary
        await supabase
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', imgId);

        setImages(images.map(img => ({
          ...img,
          is_primary: img.id === imgId
        })));
      } catch (err) {
        console.error(err);
      }
    } else {
      setImages(images.map((img, i) => ({
        ...img,
        is_primary: i === idx
      })));
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm('Are you sure you want to permanently delete this product and all its uploaded images? This action is irreversible.')) {
      return;
    }
    
    setDeletingProduct(true);
    setErrorMsg('');
    
    try {
      // 1. Delete physical storage files if any exist
      if (images && images.length > 0) {
        const storagePaths = images
          .map(img => getStoragePathFromUrl(img.storage_path))
          .filter(Boolean) as string[];
        
        if (storagePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('products')
            .remove(storagePaths);
          
          if (storageError) {
            console.warn('Physical storage file deletions failed or files already deleted:', storageError);
          }
        }
      }

      // 2. Delete product record (will cascade delete database image references automatically)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setSuccessMsg('Product permanently deleted.');
      setTimeout(() => router.push('/admin/shop'), 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to delete product.');
      setDeletingProduct(false);
    }
  };

  // Submit product creation/edits
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!name || !slug || !regularPrice) {
      setErrorMsg('Please populate all required fields.');
      setSubmitting(false);
      return;
    }

    const regPricePaise = Math.round(parseFloat(regularPrice) * 100);
    const discPricePaise = discountPrice ? Math.round(parseFloat(discountPrice) * 100) : null;

    if (isNaN(regPricePaise) || regPricePaise < 0) {
      setErrorMsg('Regular price must be a valid positive number.');
      setSubmitting(false);
      return;
    }

    if (discPricePaise !== null && (isNaN(discPricePaise) || discPricePaise >= regPricePaise || discPricePaise < 0)) {
      setErrorMsg('Discounted price must be lower than the regular price.');
      setSubmitting(false);
      return;
    }

    try {
      if (productId) {
        // 1. EDIT MODE: Update existing product record
        const { error } = await supabase
          .from('products')
          .update({
            name,
            slug,
            description,
            regular_price: regPricePaise,
            discounted_price: discPricePaise,
            category_id: categoryId || null,
            featured,
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        if (error) throw error;
        
        setSuccessMsg('Product details updated successfully.');
        setTimeout(() => router.push('/admin/shop'), 1500);
      } else {
        // 2. CREATE MODE: Insert new product record
        const { data: newProd, error: prodErr } = await supabase
          .from('products')
          .insert([
            {
              name,
              slug,
              description,
              regular_price: regPricePaise,
              discounted_price: discPricePaise,
              category_id: categoryId || null,
              featured,
              status
            }
          ])
          .select('id')
          .single();

        if (prodErr || !newProd) throw prodErr;

        // Insert pending images if any
        if (images.length > 0) {
          const imagesToInsert = images.map((img, i) => ({
            product_id: newProd.id,
            storage_path: img.storage_path,
            is_primary: img.is_primary,
            sort_order: i
          }));

          const { error: imgsErr } = await supabase
            .from('product_images')
            .insert(imagesToInsert);
          
          if (imgsErr) console.error('Error linking images', imgsErr);
        }

        setSuccessMsg('Product created successfully.');
        setTimeout(() => router.push('/admin/shop'), 1500);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Submit operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/shop"
            className="h-8 w-8 flex items-center justify-center border border-zinc-800 text-zinc-500 hover:text-accent hover:border-accent transition-all rounded"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="font-display text-[9px] uppercase tracking-[0.25em] text-accent font-semibold">
              {productId ? 'Modify Release' : 'Add Release'}
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-wide">
              {productId ? 'Edit Product' : 'Create Product'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {productId && (
            <button
              type="button"
              onClick={handleDeleteProduct}
              disabled={submitting || deletingProduct}
              className="h-10 px-4 border border-red-900 bg-red-950/20 text-red-500 flex items-center justify-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-widest hover:bg-red-950 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              {deletingProduct ? 'DELETING...' : 'DELETE PRODUCT'}
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || deletingProduct}
            className="h-10 px-5 bg-accent text-black flex items-center justify-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-widest border border-accent hover:bg-transparent hover:text-accent transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {submitting ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-500 font-sans text-xs">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 border border-green-500/20 bg-green-500/5 text-green-500 font-sans text-xs flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      {/* Form and Image Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
        
        {/* Left Column: Form Details fields */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 border border-border-subtle bg-[#0c0c0e] p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground/50 border-b border-zinc-900 pb-3">
            Product details
          </h2>

          {/* Name */}
          <div className="flex flex-col space-y-2">
            <label className="font-display text-[9px] uppercase tracking-widest text-muted">
              Product Name <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Abstract Impasto No. 1"
              className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-700 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Slug */}
          <div className="flex flex-col space-y-2">
            <label className="font-display text-[9px] uppercase tracking-widest text-muted flex justify-between items-center">
              <span>Slug (URL Keyword) <span className="text-accent">*</span></span>
              <span className="text-[8px] font-mono text-zinc-600">Auto-Generated</span>
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. abstract-impasto-1"
              className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-700 focus:border-accent focus:outline-none transition-colors"
            />
            <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
              <strong className="text-zinc-400">What is this?</strong> The slug forms your product webpage web address (e.g. <span className="font-mono text-accent">/product/abstract-impasto-1</span>). If editing manually, use only <strong>lowercase letters</strong>, <strong>numbers</strong>, and <strong>hyphens (-)</strong> with no spaces or special symbols.
            </p>
          </div>

          {/* Category Dropdown */}
          <div className="flex flex-col space-y-2">
            <label className="font-display text-[9px] uppercase tracking-widest text-muted">
              Catalog Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
            >
              <option value="">Uncategorized</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Prices INR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                Regular Price (INR) <span className="text-accent">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
                placeholder="2999.00"
                className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                Discounted Price (INR)
              </label>
              <input
                type="number"
                step="0.01"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="1999.00 (Leave empty if no discount)"
                className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col space-y-2">
            <label className="font-display text-[9px] uppercase tracking-widest text-muted">
              Description / Specifications
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail canvas materials, textured details, shipping care notes..."
              className="border border-zinc-800 bg-background p-4 font-display text-xs tracking-wider text-foreground placeholder:text-zinc-700 focus:border-accent focus:outline-none transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Checkboxes & Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Status */}
            <div className="flex flex-col space-y-2">
              <label className="font-display text-[9px] uppercase tracking-widest text-muted">
                Publishing Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="h-10 border border-zinc-800 bg-background px-3 font-display text-xs tracking-wider text-foreground focus:border-accent focus:outline-none transition-colors"
              >
                <option value="draft">Draft (Hidden)</option>
                <option value="published">Published (Live)</option>
                <option value="archived">Archived (Archived)</option>
              </select>
            </div>

            {/* Featured */}
            <div className="flex items-center space-x-3 pt-6">
              <input
                type="checkbox"
                id="featured"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-800 bg-background text-accent focus:ring-accent"
              />
              <label htmlFor="featured" className="font-display text-[9px] uppercase tracking-widest text-foreground/80 font-bold select-none cursor-pointer">
                Feature on Homepage
              </label>
            </div>
          </div>
        </form>

        {/* Right Column: Image Gallery uploaders */}
        <div className="lg:col-span-5 border border-border-subtle bg-[#0c0c0e] p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-foreground/50 border-b border-zinc-900 pb-3 flex items-center justify-between">
            <span>Product Gallery</span>
            <span className="font-mono text-[9px] text-zinc-600">3:4 Aspect RECOMMENDED</span>
          </h2>

          {/* Upload Button wrapper */}
          <div className="space-y-4">
            <div 
              onClick={() => setShowUploadOptions(true)}
              className="border border-dashed border-zinc-800 hover:border-zinc-500 bg-background h-24 flex flex-col items-center justify-center p-4 relative group cursor-pointer transition-colors duration-300"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <ImageIcon className="h-6 w-6 text-zinc-600 group-hover:text-accent transition-colors" />
              <span className="font-display text-[8px] uppercase tracking-widest text-zinc-500 mt-2">
                {uploading ? 'UPLOADING...' : 'SELECT IMAGE (CROPPER)'}
              </span>

              {/* Source Option Selector Overlay */}
              {showUploadOptions && (
                <div 
                  className="absolute inset-0 bg-black/95 z-30 flex flex-col items-center justify-center p-3 text-center space-y-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <span className="font-display text-[8px] font-extrabold uppercase tracking-widest text-accent">Select Image Source</span>
                  <div className="flex space-x-2 w-full max-w-[200px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowUploadOptions(false);
                        setShowDatabasePicker(true);
                      }}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-display text-[7px] font-bold py-1.5 px-2 uppercase tracking-widest border border-zinc-800 transition-colors cursor-pointer"
                    >
                      DB Lib
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowUploadOptions(false);
                        fileInputRef.current?.click();
                      }}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-display text-[7px] font-bold py-1.5 px-2 uppercase tracking-widest border border-zinc-800 transition-colors cursor-pointer"
                    >
                      Computer
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowUploadOptions(false);
                    }}
                    className="text-[7px] text-zinc-500 hover:text-zinc-300 uppercase tracking-widest cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Database Asset Picker overlay inside dropzone */}
              {showDatabasePicker && (
                <DatabasePicker
                  supabase={supabase}
                  onClose={() => setShowDatabasePicker(false)}
                  onSelect={handleSelectExistingImage}
                />
              )}
            </div>
          </div>

          {/* Image Cards list */}
          {images.length === 0 ? (
            <div className="py-12 border border-zinc-900 text-center">
              <span className="font-display text-[9px] text-zinc-600 tracking-widest uppercase">No images uploaded</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {images.map((img, idx) => (
                <div key={img.id || idx} className="border border-zinc-900 bg-background p-2 flex flex-col space-y-2 relative group overflow-hidden">
                  
                  {/* Aspect Ratio 3:4 container */}
                  <div className="aspect-[3/4] bg-zinc-950 flex items-center justify-center relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={img.storage_path} 
                      alt="Product Gallery Preview" 
                      className="w-full h-full object-cover" 
                    />
                    
                    {img.is_primary && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-accent text-black font-display text-[7px] font-bold uppercase tracking-widest">
                        PRIMARY
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 font-display text-[8px] tracking-widest pt-1">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img.id, idx)}
                      disabled={img.is_primary}
                      className={`uppercase ${img.is_primary ? 'text-accent font-bold' : 'text-muted hover:text-foreground'}`}
                    >
                      Primary
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleImageDelete(img.id, idx)}
                      className="text-zinc-600 hover:text-red-500 transition-colors"
                      title="Delete Image"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 6. React Crop Selector HTML5 Canvas Dialog */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-overlay backdrop-blur-sm" />
          
          <div className="relative w-full max-w-lg border border-border-subtle bg-background p-6 shadow-2xl space-y-6 flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="space-y-1 text-center">
              <h3 className="font-display text-sm font-bold uppercase tracking-widest text-accent flex items-center justify-center gap-1.5">
                <Crop className="h-4.5 w-4.5" />
                Aesthetic Image Cropper
              </h3>
              <p className="font-sans text-[10px] text-muted">
                Pre-cropping image to a precise 3:4 aspect ratio ensures catalog alignment and layout protection.
              </p>
            </div>

            {/* Hidden canvas rendering buffer */}
            <canvas ref={cropCanvasRef} className="hidden" />

            {/* Original Select Source container */}
            <div className="w-full max-h-80 overflow-y-auto bg-zinc-950 flex items-center justify-center border border-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={cropImgRef}
                src={cropImageSrc || ''}
                alt="Source Crop"
                className="max-w-full max-h-80 object-contain"
                crossOrigin="anonymous"
              />
            </div>

            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={applyCrop}
                className="flex-1 h-11 bg-accent text-black font-display text-[9px] font-bold uppercase tracking-widest hover:bg-accent-dark transition-colors border border-accent"
              >
                APPLY 3:4 CROP & UPLOAD
              </button>
              
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="flex-1 h-11 border border-zinc-800 hover:border-zinc-500 text-foreground font-display text-[9px] font-bold uppercase tracking-widest bg-transparent transition-all"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Remove Choice Modal Dialog */}
      {deleteConfirmImg && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="w-full max-w-sm border border-zinc-800 bg-[#0c0c0e] p-6 text-center space-y-4 shadow-2xl">
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-red-500">Remove this product image?</h4>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider leading-relaxed">
              Do you also want to delete this image file from Supabase Storage?
            </p>
            {isProductImgShared && (
              <p className="text-[9px] text-yellow-500 uppercase tracking-widest leading-relaxed">
                ⚠️ Shared: This image is used in other layout or product views.
              </p>
            )}
            <div className="flex flex-col space-y-2 pt-2">
              <button
                type="button"
                onClick={handleProductRemoveOnly}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-display text-[9px] font-bold py-2 uppercase tracking-widest border border-zinc-800 transition-all cursor-pointer"
              >
                Remove Only
              </button>
              <button
                type="button"
                onClick={handleProductRemoveAndDelete}
                className="w-full bg-red-950 hover:bg-red-900 text-white font-display text-[9px] font-bold py-2 uppercase tracking-widest border border-red-900 transition-all cursor-pointer"
              >
                Remove & Delete File
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmImg(null)}
                className="w-full bg-black hover:bg-zinc-950 text-zinc-500 font-display text-[9px] py-2 uppercase tracking-widest border border-zinc-900 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- SUB-COMPONENT: SUPABASE DATABASE ASSET PICKER ---
function DatabasePicker({ 
  supabase, 
  onClose, 
  onSelect 
}: { 
  supabase: any; 
  onClose: () => void; 
  onSelect: (url: string) => void; 
}) {
  const [files, setFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from('products')
          .list('', { limit: 100 });

        if (error) throw error;
        
        // Filter out folders (which don't have metadata) and placeholder files
        const fileList = (data || []).filter((f: any) => f.metadata && f.name !== '.emptyFolderPlaceholder');
        setFiles(fileList);
      } catch (err) {
        console.error('Error listing storage files:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [supabase]);

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="absolute inset-0 bg-[#060606] border border-zinc-800 z-40 flex flex-col p-4"
      onClick={(e) => {
        // Prevent clicking picker elements from triggering file upload click
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="font-display text-[9px] font-extrabold uppercase tracking-widest text-accent">Database Asset Library</span>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }} 
          className="text-zinc-500 hover:text-white font-mono text-[9px] uppercase tracking-widest cursor-pointer"
        >
          Close
        </button>
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="SEARCH ASSETS..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-[#0c0c0e] border border-zinc-800 text-foreground text-[8px] p-2 rounded uppercase tracking-widest focus:outline-none mb-3"
      />

      {/* Grid List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 pr-1">
        {loading ? (
          <div className="h-full flex items-center justify-center text-zinc-500 font-mono text-[8px] uppercase tracking-widest animate-pulse">
            Loading assets...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500 font-mono text-[8px] uppercase tracking-widest">
            No assets found
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredFiles.map((file) => {
              const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(file.name);

              return (
                <div 
                  key={file.name}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(publicUrl);
                  }}
                  className="group/item border border-zinc-900 bg-[#0c0c0e] hover:border-accent p-1.5 flex flex-col space-y-1 cursor-pointer select-none transition-colors"
                >
                  <div className="aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={publicUrl} 
                      alt={file.name} 
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                  </div>
                  <span className="font-mono text-[6px] text-zinc-500 truncate uppercase tracking-widest" title={file.name}>
                    {file.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
