'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ImageCropModal from '@/components/admin/ImageCropModal';

// --- HELPER TO PARSE RATIO AND RECOMMENDED PIXEL DIMENSIONS ---
export function getAspectDetails(ratioClass: string = 'aspect-[2/1]'): { aspect: number; px: string; label: string } {
  if (ratioClass.includes('2/1') || ratioClass.includes('2-1')) {
    return { aspect: 2 / 1, px: '1920 × 960 px', label: '2:1 Banner' };
  }
  if (ratioClass.includes('16/9') || ratioClass.includes('16-9')) {
    return { aspect: 16 / 9, px: '1920 × 1080 px', label: '16:9 Landscape' };
  }
  if (ratioClass.includes('5/7') || ratioClass.includes('5-7')) {
    return { aspect: 5 / 7, px: '850 × 1190 px', label: '5:7 Portrait' };
  }
  if (ratioClass.includes('4/5') || ratioClass.includes('4-5')) {
    return { aspect: 4 / 5, px: '1000 × 1250 px', label: '4:5 Card' };
  }
  if (ratioClass.includes('square') || ratioClass.includes('1/1') || ratioClass.includes('1-1')) {
    return { aspect: 1 / 1, px: '1000 × 1000 px', label: '1:1 Square' };
  }
  const match = ratioClass.match(/aspect-\[(\d+)\/(\d+)\]/);
  if (match) {
    const w = parseInt(match[1], 10);
    const h = parseInt(match[2], 10);
    if (w && h) {
      const baseWidth = w >= h ? 1920 : 1000;
      const calcHeight = Math.round((baseWidth / w) * h);
      return { aspect: w / h, px: `${baseWidth} × ${calcHeight} px`, label: `${w}:${h}` };
    }
  }
  return { aspect: 2 / 1, px: '1920 × 960 px', label: '2:1 Banner' };
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
        
        // Filter out folders and empty placeholder files
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
          className="text-zinc-500 hover:text-white font-mono text-[9px] uppercase tracking-widest cursor-pointer bg-transparent border-none"
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

// --- MAIN IMAGE DROPZONE COMPONENT ---
export default function ImageDropzone({ 
  imageUrl, 
  onUploadSuccess, 
  ratioClass = 'aspect-[2/1]',
  label = 'Campaign Banner'
}: { 
  imageUrl?: string; 
  onUploadSuccess: (url: string) => void;
  ratioClass?: string;
  label?: string;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [showOptions, setShowOptions] = useState(false);
  const [showDatabasePicker, setShowDatabasePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSharedWarning, setIsSharedWarning] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const aspectDetails = getAspectDetails(ratioClass);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Upload cropped blob file to Supabase storage
  const uploadCroppedBlob = async (blob: Blob) => {
    setUploading(true);
    setCropImageSrc(null);
    setShowOptions(false);
    setShowDatabasePicker(false);
    try {
      const filePath = `cms-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
      const file = new File([blob], filePath, { type: 'image/jpeg' });

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      onUploadSuccess(publicUrl);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Cropped image upload failed. Verify storage rules.');
    } finally {
      setUploading(false);
      setShowOptions(false);
      setShowDatabasePicker(false);
    }
  };

  // Handle local computer file selection -> Open Crop Modal
  const processSelectedFile = (file: File) => {
    setShowOptions(false);
    setShowDatabasePicker(false);
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setCropImageSrc(reader.result.toString());
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const checkImageUsage = async (url: string) => {
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
      console.error('Error checking asset references:', e);
      return false;
    }
  };

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

  const triggerDelete = async () => {
    if (!imageUrl) return;
    const isShared = await checkImageUsage(imageUrl);
    setIsSharedWarning(isShared);
    setShowDeleteConfirm(true);
  };

  const handleRemoveOnly = () => {
    onUploadSuccess('');
    setShowDeleteConfirm(false);
  };

  const handleRemoveAndDelete = async () => {
    if (!imageUrl) return;
    try {
      const path = getStoragePathFromUrl(imageUrl);
      if (path) {
        const { error } = await supabase.storage.from('products').remove([path]);
        if (error) {
          console.warn('Physical storage file delete failed or was already removed:', error);
        }
      }
      onUploadSuccess('');
    } catch (err: any) {
      console.error('Failed to remove storage asset:', err);
      alert(err.message || 'Error deleting storage asset.');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div 
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => setShowOptions(true)}
      className={`w-full ${ratioClass} bg-[#0c0c0e] border relative group cursor-pointer overflow-hidden transition-all flex flex-col items-center justify-center p-6 select-none ${
        dragActive ? 'border-accent bg-accent/5' : 'border-zinc-900 hover:border-zinc-700'
      }`}
    >
      <input 
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Render uploaded image background preview */}
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
        /* Symmetrical spacing overlays if empty blueprint */
        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-15">
          <div className="border-r border-b border-zinc-800"></div>
          <div className="border-r border-b border-zinc-800"></div>
          <div className="border-b border-zinc-800"></div>
          <div className="border-r border-b border-zinc-800"></div>
          <div className="border-r border-b border-zinc-800"></div>
          <div className="border-b border-zinc-800"></div>
        </div>
      )}

      {/* Recommended Dimension Pixel Badge (Pinned Bottom-Left) */}
      <div className="absolute bottom-2.5 left-2.5 z-25 px-2 py-0.5 bg-black/85 border border-zinc-800 rounded text-accent font-mono text-[8px] font-bold uppercase tracking-wider backdrop-blur-sm pointer-events-none">
        {aspectDetails.px}
      </div>

      {/* Controls Overlay in Top-Right Corner */}
      <div className="absolute top-3 right-3 z-35 flex items-center space-x-2">
        {/* Upload Trigger Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowOptions(true);
          }}
          className="p-2 bg-black/90 hover:bg-accent border border-zinc-800 hover:border-accent text-accent hover:text-black rounded-lg transition-all duration-200 cursor-pointer shadow-2xl backdrop-blur-md flex items-center justify-center"
          title="Upload or Choose Image"
        >
          <Upload className={`h-4 w-4 ${uploading ? 'animate-bounce' : ''}`} />
        </button>

        {/* Delete/Remove Trigger Button */}
        {imageUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              triggerDelete();
            }}
            className="p-2 bg-black/90 hover:bg-red-600 border border-zinc-800 hover:border-red-500 text-red-400 hover:text-white rounded-lg transition-all duration-200 cursor-pointer shadow-2xl backdrop-blur-md flex items-center justify-center"
            title="Remove Image"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {!imageUrl && !uploading && (
        <div className="z-1 flex flex-col items-center space-y-1">
          <span className="font-mono text-[8px] text-zinc-400 uppercase tracking-widest font-bold">
            NO IMAGE CONFIGURED &bull; {aspectDetails.px}
          </span>
        </div>
      )}

      {/* Source Selector Overlay Menu */}
      {showOptions && (
        <div 
          className="absolute inset-0 bg-black/95 z-30 flex flex-col items-center justify-center p-4 text-center space-y-3"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <h4 className="font-display text-[9px] font-extrabold uppercase tracking-widest text-accent">
            Select Image Source ({aspectDetails.px})
          </h4>
          <div className="flex flex-col space-y-2 w-full max-w-[180px]">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowOptions(false);
                setShowDatabasePicker(true);
              }}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-display text-[8px] font-bold py-1.5 px-3 uppercase tracking-widest border border-zinc-800 transition-colors cursor-pointer"
            >
              Choose from Database
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowOptions(false);
                fileInputRef.current?.click();
              }}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-display text-[8px] font-bold py-1.5 px-3 uppercase tracking-widest border border-zinc-800 transition-colors cursor-pointer"
            >
              Upload from Computer
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowOptions(false);
              }}
              className="bg-black hover:bg-zinc-950 text-zinc-500 font-display text-[8px] py-1.5 px-3 uppercase tracking-widest border border-zinc-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete / Remove Choice Modal Dialog */}
      {showDeleteConfirm && (
        <div 
          className="absolute inset-0 bg-black/95 z-30 flex flex-col items-center justify-center p-4 text-center space-y-3"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <h4 className="font-display text-[10px] font-extrabold uppercase tracking-widest text-red-500">Remove this image?</h4>
          <p className="text-[9px] text-zinc-400 max-w-[200px] uppercase tracking-wider leading-relaxed">
            Do you also want to delete this image from Supabase Storage?
          </p>
          {isSharedWarning && (
            <p className="text-[7px] text-yellow-500 max-w-[200px] uppercase tracking-widest leading-relaxed">
              ⚠️ Shared: This image is used in other layout or product views.
            </p>
          )}
          <div className="flex flex-col space-y-2 w-full max-w-[180px]">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemoveOnly();
              }}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-display text-[8px] font-bold py-1.5 px-3 uppercase tracking-widest border border-zinc-800 transition-colors cursor-pointer"
            >
              Remove Only
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemoveAndDelete();
              }}
              className="bg-red-950 hover:bg-red-900 text-white font-display text-[8px] font-bold py-1.5 px-3 uppercase tracking-widest border border-red-900 transition-colors cursor-pointer"
            >
              Remove & Delete File
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteConfirm(false);
              }}
              className="bg-black hover:bg-zinc-950 text-zinc-500 font-display text-[8px] py-1.5 px-3 uppercase tracking-widest border border-zinc-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Database Library Image Picker Overlay */}
      {showDatabasePicker && (
        <DatabasePicker
          supabase={supabase}
          onClose={() => setShowDatabasePicker(false)}
          onSelect={async (url) => {
            setShowDatabasePicker(false);
            try {
              const res = await fetch(url);
              const blob = await res.blob();
              const objectUrl = URL.createObjectURL(blob);
              setCropImageSrc(objectUrl);
            } catch (e) {
              console.warn('Failed to pre-fetch asset blob, opening raw URL:', e);
              setCropImageSrc(url);
            }
          }}
        />
      )}

      {/* Interactive Crop Modal */}
      {cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          aspectRatio={aspectDetails.aspect}
          recommendedPx={aspectDetails.px}
          onConfirm={uploadCroppedBlob}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
}
