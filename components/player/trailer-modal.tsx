'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoKey?: string;
  title?: string;
}

export function TrailerModal({ isOpen, onClose, videoKey, title }: TrailerModalProps) {
  const { t } = useTranslation();

  if (!isOpen || !videoKey) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-[#18181c] shadow-2xl ring-1 ring-white/10 z-10"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#121215]">
            <h3 className="text-sm sm:text-base font-semibold text-white truncate max-w-md">
              {title ? `${title} - ${t('movies.officialTrailer', 'Official Trailer')}` : t('movies.trailer', 'Trailer')}
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close trailer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Video Container */}
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
              title={title || 'Movie Trailer'}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default TrailerModal;
