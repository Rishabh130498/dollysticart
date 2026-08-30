'use client';

import { useEffect } from 'react';

export default function ImageProtection() {
  useEffect(() => {
    const isImageOrImageWrapper = (target: HTMLElement | null): boolean => {
      if (!target) return false;
      if (target.tagName === 'IMG' || target.tagName === 'PICTURE') return true;
      if (target.closest('img') || target.closest('picture')) return true;
      // If right-clicked on an overlay directly on top of or containing an image
      if (target.querySelector('img')) return true;
      return false;
    };

    // 1. Disable right-click context menu on images
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (isImageOrImageWrapper(target)) {
        e.preventDefault();
      }
    };

    // 2. Disable drag-and-drop on images
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (isImageOrImageWrapper(target)) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return null;
}
