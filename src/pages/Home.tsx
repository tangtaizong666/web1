import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Lenis from 'lenis';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import { Recycle, ShoppingBag, Heart, Sparkles } from 'lucide-react';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../hooks/useAuth';
import { hideAppSplash } from '../lib/splash';

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
      // Give touch the same buttery inertia as the desktop wheel, instead of
      // the browser's plain native scrolling.
      syncTouch: true,
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
      <div className="fixed left-4 top-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-1 rounded-full border border-brand-200/80 bg-brand-50/80 p-1.5 shadow-sm backdrop-blur-md">
        {user ? (
          <>
            <span className="truncate px-3 text-sm text-brand-700">{user.email}</span>
            <button
              onClick={() => void logoutUser()}
              className="rounded-full px-4 py-1.5 text-sm text-brand-900 transition-colors hover:bg-brand-200/60"
            >
              退出
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setAuthMode('login')}
              className="rounded-full bg-brand-900 px-4 py-1.5 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-700"
            >
              登录
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className="rounded-full px-4 py-1.5 text-sm text-brand-700 transition-colors hover:bg-brand-200/60"
            >
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
        <Hero onHeroReady={hideAppSplash} onHeroError={hideAppSplash} />
        
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
                className="flex w-full items-center justify-center gap-3 rounded-full border border-brand-900 bg-brand-900 px-6 py-4 text-center font-serif text-lg italic text-brand-50 shadow-[0_8px_24px_rgba(26,27,20,0.25)] transition-colors hover:bg-brand-700 lg:w-1/3 lg:px-8 lg:py-6 lg:text-xl"
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
              <img src="/favicon.svg" alt="落叶生花标志" className="w-9 h-9" />
              <div className="flex flex-col">
                <span className="font-serif text-3xl tracking-tight">落叶生花</span>
                <span className="text-xs uppercase tracking-[0.3em] text-brand-400">Campus Cycle</span>
              </div>
            </div>
            <p className="text-brand-500 max-w-xs font-light tracking-wide leading-relaxed">
              用透明度与设计，重塑校园社区的衣物生命周期。
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 text-xs uppercase tracking-[0.2em] font-bold text-brand-700">
            <div className="flex flex-col gap-4">
              <span className="text-brand-300">导航</span>
              <button onClick={() => lenisRef.current?.scrollTo(0)} className="text-left hover:text-brand-900 transition-colors">平台介绍</button>
              <button onClick={() => navigate('/shop')} className="text-left hover:text-brand-900 transition-colors">系列展示</button>
              <button onClick={() => navigate('/recycle')} className="text-left hover:text-brand-900 transition-colors">物流溯源</button>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-brand-300">联系我们</span>
              <span>小红书</span>
              <span>微信</span>
              <span>邮箱</span>
            </div>
            <div className="hidden flex-col gap-4 lg:flex">
              <span className="text-brand-300">关于</span>
              <div className="flex items-center gap-2">
                在校园里赋予旧衣新生 <Heart className="w-3 h-3 text-red-500 fill-red-500" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-brand-200 text-xs uppercase tracking-[0.2em] text-brand-400 font-medium">
          © 2026 落叶生花 Campus Cycle
        </div>
      </footer>
    </div>
  );
}
