import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recycle, ShoppingBag, Sparkles } from 'lucide-react';

// Poster and video are served from our own origin: no player script, no HLS
// negotiation, so the hero turns dynamic almost immediately on any network.
const HERO_POSTER_URL = '/images/hero-poster.webp';
const HERO_VIDEO_URL = '/videos/hero.mp4';

type HeroProps = {
  onHeroReady?: () => void;
  onHeroError?: () => void;
  onPosterReady?: () => void;
};

export default function Hero({ onHeroReady, onHeroError, onPosterReady }: HeroProps) {
  const container = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLImageElement | null>(null);
  const didNotifyHeroReady = useRef(false);
  const didMarkPosterLoaded = useRef(false);
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const markPosterLoaded = () => {
    if (didMarkPosterLoaded.current) {
      return;
    }

    didMarkPosterLoaded.current = true;
    setPosterLoaded(true);
    onPosterReady?.();
  };
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  // The video is tiny and local, so fetch it in parallel with the poster
  // instead of waiting for the poster to finish first.
  const shouldLoadVideo = prefersReducedMotion !== true;
  const heroMediaReady = posterLoaded && (!shouldLoadVideo || videoLoaded);

  // A cached poster can finish loading before React attaches the onLoad
  // handler, so also check `complete` once after mount.
  useEffect(() => {
    const poster = posterRef.current;
    if (poster?.complete && poster.naturalWidth > 0) {
      markPosterLoaded();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!heroMediaReady || didNotifyHeroReady.current) {
      return;
    }

    didNotifyHeroReady.current = true;
    onHeroReady?.();
  }, [heroMediaReady, onHeroReady]);

  return (
    <section ref={container} className="relative h-[160vh] overflow-hidden bg-brand-900 md:h-[200vh]">
      <div className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden md:h-screen">
        <motion.div style={{ scale, opacity }} className="absolute inset-0 z-0 overflow-hidden">
          <motion.img
            ref={posterRef}
            src={HERO_POSTER_URL}
            alt="Campus Cycle hero poster"
            decoding="async"
            fetchPriority="high"
            onLoad={markPosterLoaded}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              videoLoaded ? 'opacity-0' : 'opacity-75'
            }`}
            style={{ scale: prefersReducedMotion ? 1 : 1.04 }}
          />

          {shouldLoadVideo ? (
            <video
              src={HERO_VIDEO_URL}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              onPlaying={() => setVideoLoaded(true)}
              onError={() => onHeroError?.()}
              className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                videoLoaded ? 'opacity-80' : 'opacity-0'
              }`}
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
