import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Lenis from 'lenis';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import VinePageLoader from '../components/VinePageLoader';
import { Recycle, ShoppingBag, Heart, Sparkles } from 'lucide-react';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../hooks/useAuth';

const Advantages = lazy(() => import('../components/Advantages'));
const Workflow = lazy(() => import('../components/Workflow'));
const Process = lazy(() => import('../components/Process'));
const Showcase = lazy(() => import('../components/Showcase'));
const FAQ = lazy(() => import('../components/FAQ'));

export default function Home() {
  const lenisRef = useRef<Lenis | null>(null);
  const navigate = useNavigate();
  const { user, loginUser, registerUser, logoutUser } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [heroPosterReady, setHeroPosterReady] = useState(false);
  const [loaderCycleDone, setLoaderCycleDone] = useState(false);
  const [loaderTimedOut, setLoaderTimedOut] = useState(false);
  const showPageLoader = !(loaderCycleDone && (heroPosterReady || loaderTimedOut));

  useEffect(() => {
    const cycleTimer = window.setTimeout(() => setLoaderCycleDone(true), 1850);
    const fallbackTimer = window.setTimeout(() => setLoaderTimedOut(true), 6500);

    return () => {
      window.clearTimeout(cycleTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (!showPageLoader) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showPageLoader]);

  useLayoutEffect(() => {
    let frameId = 0;
    let removeScrollTriggerSync: (() => void) | null = null;
    let cancelled = false;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }

    frameId = requestAnimationFrame(raf);

    void import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
      if (cancelled) {
        return;
      }

      const updateScrollTrigger = () => ScrollTrigger.update();
      lenis.on('scroll', updateScrollTrigger);
      removeScrollTriggerSync = () => {
        lenis.off('scroll', updateScrollTrigger);
      };
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      removeScrollTriggerSync?.();
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-brand-100 selection:bg-brand-900 selection:text-brand-50">
      <VinePageLoader isVisible={showPageLoader} />

      <div className="fixed left-4 top-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-brand-200 bg-brand-50/90 px-3 py-2 shadow-sm backdrop-blur">
        {user ? (
          <>
            <span className="text-sm text-brand-700">{user.email}</span>
            <button onClick={() => void logoutUser()} className="text-sm text-brand-900">
              退出
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setAuthMode('login')} className="text-sm text-brand-900">
              登录
            </button>
            <button onClick={() => setAuthMode('register')} className="text-sm text-brand-500">
              注册
            </button>
          </>
        )}
      </div>

      {authMode ? (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSubmit={authMode === 'login' ? loginUser : registerUser}
        />
      ) : null}

      <main>
        <Hero onPosterReady={() => setHeroPosterReady(true)} />
        
        {/* Oryzo-style Cinematic Break */}
        <section className="negative-space flex items-center justify-center text-center">
          <motion.p 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-brand-500 font-serif italic text-3xl md:text-5xl max-w-4xl leading-tight"
          >
            "循环的挑战不在于旧衣的存在，而在于信任与从容的缺失。"
          </motion.p>
        </section>

        <Suspense fallback={null}>
          <Advantages />
          
          {/* Cangxingchuangye.cc.cd style horizontal process */}
          <Workflow />

          {/* Wonderwindows style Sticky Scroll Pinned Section */}
          <Process />

          <Showcase />

          <FAQ />
        </Suspense>

        {/* Minimal High-End CTA */}
        <section className="negative-space">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-32 border-t border-brand-200">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="mb-10 text-center font-serif text-[4rem] leading-none tracking-widest text-luxury md:mb-12 md:text-[12vw]"
            >
              循环新生
            </motion.h2>
            
            <div className="flex w-full max-w-4xl flex-col items-stretch justify-center gap-4 px-0 sm:px-4 lg:flex-row lg:items-center lg:gap-6">
              <button 
                onClick={() => navigate('/recycle')}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-brand-900 px-6 py-4 text-center font-serif text-lg italic text-brand-900 shadow-[0_4px_14px_rgba(0,0,0,0.05)] transition-colors hover:bg-brand-900 hover:text-brand-50 lg:w-1/3 lg:px-8 lg:py-6 lg:text-xl"
              >
                <Recycle className="w-5 h-5 flex-shrink-0" />
                立即投递旧衣
              </button>
              <button 
                onClick={() => navigate('/shop')}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-brand-900 px-6 py-4 text-center font-serif text-lg italic text-brand-900 shadow-[0_4px_14px_rgba(0,0,0,0.05)] transition-colors hover:bg-brand-900 hover:text-brand-50 lg:w-1/3 lg:px-8 lg:py-6 lg:text-xl"
              >
                <ShoppingBag className="w-5 h-5 flex-shrink-0" />
                探索商店
              </button>
              <button 
                onClick={() => navigate('/ai')}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-brand-900 px-6 py-4 text-center font-serif text-lg italic text-brand-900 shadow-[0_4px_14px_rgba(0,0,0,0.05)] transition-colors hover:bg-brand-900 hover:text-brand-50 lg:w-1/3 lg:px-8 lg:py-6 lg:text-xl"
              >
                <Sparkles className="w-5 h-5 flex-shrink-0" />
                询问 AI 助手
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 px-10 md:px-20 border-t border-brand-200 bg-brand-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-900 rounded-full flex items-center justify-center text-brand-50 font-serif italic">C</div>
              <span className="font-serif text-3xl tracking-tighter uppercase">Campus Cycle</span>
            </div>
            <p className="text-brand-500 max-w-xs font-light tracking-wide leading-relaxed">
              用透明度与设计，重塑校园社区的衣物生命周期。
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 text-[10px] uppercase tracking-[0.2em] font-bold text-brand-700">
            <div className="flex flex-col gap-4">
              <span className="text-brand-300">导航</span>
              <a href="#" className="hover:text-brand-900">平台介绍</a>
              <a href="#" className="hover:text-brand-900">系列展示</a>
              <a href="#" className="hover:text-brand-900">物流溯源</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-brand-300">联系我们</span>
              <a href="#" className="hover:text-brand-900">小红书</a>
              <a href="#" className="hover:text-brand-900">微信</a>
              <a href="#" className="hover:text-brand-900">邮箱</a>
            </div>
            <div className="flex flex-col gap-4 hidden lg:flex">
              <span className="text-brand-300">关于</span>
              <div className="flex items-center gap-2">
                在校园里赋予旧衣新生 <Heart className="w-3 h-3 text-red-500 fill-red-500" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-brand-200 text-[10px] uppercase tracking-[0.2em] text-brand-400 font-medium">
          © 2026 Campus Cycle. AI Studio Build.
        </div>
      </footer>
    </div>
  );
}
