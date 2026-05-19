'use client';

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { standardEase } from './variants';

type Props = {
  children: React.ReactNode;
  variants?: Variants;
  className?: string;
  delay?: number;
  margin?: string;
};

export function Reveal({
  children,
  variants,
  className,
  delay = 0,
  margin = '-60px',
}: Props) {
  if (variants) {
    return (
      <motion.div
        className={className}
        variants={variants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin }}
        transition={{ delay }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin }}
      transition={{ duration: 0.5, ease: standardEase, delay }}
    >
      {children}
    </motion.div>
  );
}
