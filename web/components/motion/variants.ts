import type { Variants, Transition } from 'framer-motion';

export const standardEase: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export const standardTransition: Transition = {
  duration: 0.5,
  ease: standardEase,
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: standardTransition },
};

export const fadeInDisplay: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { ...standardTransition, duration: 0.7 } },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: standardTransition },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: standardEase },
  },
};
