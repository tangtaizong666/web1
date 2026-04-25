import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recycle, ShoppingBag, Sparkles } from 'lucide-react';

const MUX_PLAYBACK_ID = 'VPgqHsW01gQWsfKJcgItYfkeyYYIvJ4DubLbEChs8Tsg';
const HERO_POSTER_URL = `https://image.mux.com/${MUX_PLAYBACK_ID}/thumbnail.webp?width=1600&height=1000&fit_mode=crop&time=1`;
const HERO_VIDEO_URL = `https://player.mux.com/${MUX_PLAYBACK_ID}?autoplay=muted&loop=true&muted=true&controls=false&playsinline=true`;

function useDesktopVideoAllowed() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return true;
    }

    return window.matchMedia('(min-width: 768px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateDesktopState = () => setIsDesktop(mediaQuery.matches);

    updateDesktopState();
    mediaQuery.addEventListener?.('change', updateDesktopState);

    return () => {
      mediaQuery.removeEventListener?.('change', updateDesktopState);
    };
  }, []);

  return isDesktop;
}

type HeroProps = {
  onPosterReady?: () => void;
};

export default function Hero({ onPosterReady }: HeroProps) {
  const container = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const desktopVideoAllowed = useDesktopVideoAllowed();
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const shouldLoadVideo = posterLoaded && desktopVideoAllowed && prefersReducedMotion !== true;

  return (
    <section ref={container} className="relative h-[160vh] overflow-hidden bg-brand-900 md:h-[200vh]">
      <div className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden md:h-screen">
        <motion.div style={{ scale, opacity }} className="absolute inset-0 z-0 overflow-hidden">
          <motion.img
            src={HERO_POSTER_URL}
            alt="Campus Cycle hero poster"
            decoding="async"
            fetchPriority="high"
            onLoad={() => {
              setPosterLoaded(true);
              onPosterReady?.();
            }}
            className="absolute inset-0 h-full w-full object-cover opacity-75"
            style={{ scale: prefersReducedMotion ? 1 : 1.04 }}
          />

          {shouldLoadVideo ? (
            <iframe
              title="Campus Cycle background video"
              src={HERO_VIDEO_URL}
              onLoad={() => setVideoLoaded(true)}
              className={`pointer-events-none absolute left-1/2 top-1/2 hidden h-[56.25vw] min-h-[100vh] min-w-[177.77vh] w-[100vw] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 md:block ${
                videoLoaded ? 'opacity-60' : 'opacity-0'
              }`}
              style={{ border: 'none' }}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : null}

          <div className="pointer-events-none absolute inset-0 -z-10 bg-brand-900 opacity-30 kraft-texture" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-900/35 via-brand-900/10 to-brand-900" />
        </motion.div>

        <div className="pointer-events-auto absolute bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 md:bottom-auto md:left-auto md:right-12 md:top-12 md:translate-x-0">
          {[
            { icon: ShoppingBag, label: '商店', path: '/shop' },
            { icon: Recycle, label: '一键回收', path: '/recycle' },
            { icon: Sparkles, label: 'AI 助手', path: '/ai' },
          ].map((item, idx) => (
            <motion.button
              type="button"
              key={item.path}
              onClick={() => navigate(item.path)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + idx * 0.1, duration: 0.8, ease: 'easeOut' }}
              className="group flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-full border border-brand-50/30 bg-brand-50/10 p-3 backdrop-blur-md transition-all duration-500 hover:bg-brand-50/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] md:p-4"
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5 text-brand-50/90 transition-colors group-hover:text-brand-50" />
              <span className="hidden max-w-0 overflow-hidden whitespace-nowrap border-l border-transparent pl-1 text-sm tracking-widest text-brand-50 opacity-0 transition-all duration-500 ease-in-out group-hover:ml-3 group-hover:max-w-[120px] group-hover:border-brand-50/30 group-hover:opacity-100 md:block">
                {item.label}
              </span>
            </motion.button>
          ))}
        </div>

        <motion.div style={{ y: textY }} className="relative z-10 max-w-6xl px-5 text-center md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className="mb-5 block text-[10px] font-bold uppercase tracking-[0.36em] text-brand-300 md:mb-6 md:tracking-[0.5em]"
              style={{ transform: 'translateZ(0)' }}
            >
              可持续循环周期
            </span>
            <h1
              className="mb-8 text-[4rem] leading-[0.86] text-luxury text-brand-50 sm:text-[5rem] md:mb-10 md:text-[12vw]"
              style={{
                textShadow: '0 10px 40px rgba(0,0,0,0.5)',
                transform: 'translateZ(0)',
              }}
            >
              CYCLE
              <br />
              <span className="block w-full text-center italic font-light tracking-normal text-brand-200">新生</span>
            </h1>

            <p className="mx-auto max-w-[20rem] text-base font-light italic leading-8 tracking-wide text-brand-100 md:max-w-2xl md:text-2xl">
              用透明度与设计重塑校园旧衣回收。
              <br />
              让每一件衣物，讲述循环重生的故事。
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-4 md:flex"
        >
          <div className="h-20 w-px bg-gradient-to-b from-brand-50 to-transparent" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-brand-50/50">向下滚动探索</span>
        </motion.div>
      </div>
    </section>
  );
}
