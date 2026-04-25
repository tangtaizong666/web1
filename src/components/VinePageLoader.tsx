import { AnimatePresence, motion } from 'motion/react';

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
          className="fixed inset-0 z-[300] flex items-center justify-center bg-[#F8F5EE]"
          role="status"
          aria-label="页面加载中"
        >
          <div className="relative flex flex-col items-center gap-5">
            <div className="relative h-32 w-32 sm:h-36 sm:w-36">
              <svg viewBox="0 0 160 160" className="h-full w-full overflow-visible" aria-hidden="true">
                <circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="rgba(253,251,247,0.75)"
                  stroke="#DECFBE"
                  strokeWidth="1"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke="#6F7B4C"
                  strokeLinecap="round"
                  strokeWidth="7"
                  pathLength="1"
                  strokeDasharray="1"
                  initial={{ strokeDashoffset: 1, rotate: -96 }}
                  animate={{ strokeDashoffset: 0, rotate: 264 }}
                  transition={{ duration: 1.8, ease: [0.65, 0, 0.35, 1] }}
                  style={{ transformOrigin: '80px 80px' }}
                />
                <motion.g
                  initial={{ rotate: -95 }}
                  animate={{ rotate: 265 }}
                  transition={{ duration: 1.8, ease: [0.65, 0, 0.35, 1] }}
                  style={{ transformOrigin: '80px 80px' }}
                >
                  <path
                    d="M80 22 C91 28 94 40 84 51 C72 43 70 31 80 22Z"
                    fill="#D5A13A"
                    stroke="#F8F5EE"
                    strokeWidth="2"
                  />
                  <path
                    d="M93 35 C86 39 81 44 78 50"
                    fill="none"
                    stroke="#8A6A2D"
                    strokeLinecap="round"
                    strokeWidth="1.8"
                  />
                </motion.g>
                <motion.g
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                >
                  <path
                    d="M58 91 C67 74 88 72 100 86 C91 103 70 105 58 91Z"
                    fill="#5F724A"
                    opacity="0.95"
                  />
                  <path
                    d="M66 90 C76 86 84 86 95 88"
                    fill="none"
                    stroke="#F8F5EE"
                    strokeLinecap="round"
                    strokeWidth="2"
                    opacity="0.75"
                  />
                  <path
                    d="M82 66 C94 55 111 59 118 73 C105 84 89 81 82 66Z"
                    fill="#C7653D"
                    opacity="0.95"
                  />
                  <path
                    d="M90 67 C98 68 105 70 112 74"
                    fill="none"
                    stroke="#F8F5EE"
                    strokeLinecap="round"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                </motion.g>
              </svg>
            </div>
            <div className="text-center">
              <div className="font-serif text-xl tracking-[0.18em] text-[#362A1F]">落叶生花</div>
              <div className="mt-2 text-xs font-medium tracking-[0.28em] text-[#986E4B]">正在进入</div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
