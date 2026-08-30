'use client';

import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Check, X, Crop as CropIcon } from 'lucide-react';

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

interface ImageCropModalProps {
  imageSrc: string;
  aspectRatio: number;
  recommendedPx: string;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropModal({
  imageSrc,
  aspectRatio,
  recommendedPx,
  onConfirm,
  onCancel,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  }

  const handleApplyCrop = async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      alert('Please select a valid crop region on the image.');
      return;
    }

    setProcessing(true);
    try {
      let image = imgRef.current;

      // Safe helper to render crop onto canvas
      const renderCanvas = (imgElement: HTMLImageElement): HTMLCanvasElement => {
        const canvas = document.createElement('canvas');
        const scaleX = imgElement.naturalWidth / imgElement.width;
        const scaleY = imgElement.naturalHeight / imgElement.height;

        const targetWidth = Math.round(completedCrop.width * scaleX);
        const targetHeight = Math.round(completedCrop.height * scaleY);

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context creation failed.');
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          imgElement,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY,
          0,
          0,
          targetWidth,
          targetHeight
        );
        return canvas;
      };

      // Try drawing current image element
      let canvas = renderCanvas(image);

      try {
        await new Promise<void>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Tainted canvas or empty blob.'));
                return;
              }
              onConfirm(blob);
              resolve();
            },
            'image/jpeg',
            0.92
          );
        });
      } catch (taintedErr) {
        // Tainted canvas fallback: fetch image as blob URL to eliminate CORS taint
        console.warn('Canvas tainted by CORS, pre-fetching clean blob URL...', taintedErr);
        const res = await fetch(imageSrc);
        const imageBlob = await res.blob();
        const objectUrl = URL.createObjectURL(imageBlob);

        const cleanImg = new Image();
        cleanImg.crossOrigin = 'anonymous';
        await new Promise((res, rej) => {
          cleanImg.onload = res;
          cleanImg.onerror = rej;
          cleanImg.src = objectUrl;
        });

        const cleanCanvas = renderCanvas(cleanImg);
        URL.revokeObjectURL(objectUrl);

        cleanCanvas.toBlob(
          (blob) => {
            if (!blob) {
              alert('Failed to generate cropped image blob.');
              setProcessing(false);
              return;
            }
            onConfirm(blob);
          },
          'image/jpeg',
          0.92
        );
      }
    } catch (err: any) {
      console.error('Crop processing failed:', err);
      alert(err.message || 'Crop processing failed.');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0c0c0e] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#060606]">
          <div className="flex items-center space-x-2.5">
            <CropIcon className="h-4 w-4 text-accent" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
              Interactive Image Crop Tool
            </h3>
          </div>

          {/* Recommended Dimension Badge */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 border border-accent/30 bg-accent/10 rounded font-mono text-[10px] font-bold text-accent uppercase tracking-wider">
              Frame: {recommendedPx}
            </span>
            <button
              onClick={onCancel}
              className="text-zinc-400 hover:text-foreground transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cropper Container Body */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center bg-[#060606]/80 min-h-[300px]">
          <p className="text-[10px] font-mono text-zinc-400 mb-4 uppercase tracking-widest text-center">
            Drag & resize the selection box to position your image within the fixed ratio frame.
          </p>

          <div className="max-w-full max-h-[55vh] flex items-center justify-center overflow-hidden border border-zinc-900 rounded bg-black/60 p-2">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              keepSelection
              className="max-h-[50vh]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                alt="Source to crop"
                src={imageSrc}
                crossOrigin="anonymous"
                onLoad={onImageLoad}
                className="max-h-[50vh] w-auto object-contain select-none"
              />
            </ReactCrop>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-zinc-800 bg-[#060606] gap-3">
          <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
            Fixed Frame Ratio: {aspectRatio.toFixed(2)}:1 &bull; Output Quality: High 92% JPEG
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none h-10 px-4 border border-zinc-800 text-zinc-400 hover:text-foreground font-display text-[9px] font-bold uppercase tracking-widest transition-colors rounded"
            >
              CANCEL
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={handleApplyCrop}
              className="flex-1 sm:flex-none h-10 px-6 bg-accent text-black font-display text-[9px] font-bold uppercase tracking-widest border border-accent hover:bg-transparent hover:text-accent transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 rounded"
            >
              {processing ? (
                <span className="animate-pulse">PROCESSING CROP...</span>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  APPLY & UPLOAD CROPPED IMAGE
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
