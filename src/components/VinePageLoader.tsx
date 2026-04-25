import { AnimatePresence, motion } from 'motion/react';
import loaderEmblem from '../assets/loader-emblem.jpg';

type VinePageLoaderProps = {
  isVisible: boolean;
};

export default function VinePageLoader({ isVisible }: VinePageLoaderProps) {
  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          key="vine-page-loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-[#F7F2E4]"
          role="status"
          aria-label="页面加载中"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full justify-center px-6"
          >
            <img
              src={loaderEmblem}
              alt="落叶生花加载图标"
              className="h-auto w-full max-w-[min(78vw,760px)] object-contain"
              decoding="async"
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
