'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Sidebar } from '@/components/docs/sidebar';
import { standardEase } from '@/components/motion/variants';

export function MobileDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--color-bg)]/80 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ ease: standardEase, duration: 0.3 }}
              className="absolute left-0 top-0 h-full w-72 border-r border-[var(--color-border)] bg-[var(--color-bg)] p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setOpen(false)}
                className="mb-6 inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
              <Sidebar onNavigate={() => setOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
