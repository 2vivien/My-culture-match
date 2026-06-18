import { Variants } from 'framer-motion';

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export const scaleHover: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transition: { duration: 0.2 } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export const staggerChildren: Variants = {
  visible: { transition: { staggerChildren: 0.07 } },
};
