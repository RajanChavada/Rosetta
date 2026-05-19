'use client';

import { motion } from 'framer-motion';
import { standardEase } from './variants';

type Props = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'header' | 'article' | 'aside';
};

export function FadeIn({ children, delay = 0, className, as = 'div' }: Props) {
  const Comp = motion[as];

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: standardEase, delay }}
    >
      {children}
    </Comp>
  );
}
