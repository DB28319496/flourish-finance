'use client';

import { useEffect } from 'react';

/**
 * Close modal on ESC + lock body scroll while open.
 * Pass onClose=null when the modal is not open to skip effects.
 */
export function useModal(onClose: (() => void) | null) {
  useEffect(() => {
    if (!onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);
}
