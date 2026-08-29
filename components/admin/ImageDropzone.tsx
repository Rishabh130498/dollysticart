'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `cms-${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      
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
      alert(err.message || 'Image upload failed. Verify storage rules.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
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

      {/* Controls Overlay in Top-Right Corner */}
      <div className="absolute top-2 right-2 z-25 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Upload Trigger Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowOptions(true);
          }}
          className="p-1.5 bg-black/85 border border-zinc-800 text-zinc-400 hover:text-blue-500 hover:border-blue-900/50 rounded transition-colors cursor-pointer"
          title="Upload or Choose Image"
        >
          <Upload className={`h-3.5 w-3.5 ${uploading ? 'animate-bounce text-blue-500' : ''}`} />
        </button>

        {/* Delete/Remove Trigger Button */}
        {imageUrl && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              triggerDelete();
            }}
            className="p-1.5 bg-black/85 border border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-900/50 rounded transition-colors cursor-pointer"
            title="Remove Image"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!imageUrl && !uploading && (
        <div className="z-1 flex flex-col items-center space-y-1">
          <span className="font-mono text-[7px] text-zinc-700 uppercase tracking-widest">NO IMAGE CONFIGURED</span>
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
          <h4 className="font-display text-[9px] font-extrabold uppercase tracking-widest text-accent">Select Image Source</h4>
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
          onSelect={(url) => {
            onUploadSuccess(url);
            setShowDatabasePicker(false);
          }}
        />
      )}
    </div>
  );
}
