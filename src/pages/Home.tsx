import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import Advantages from '../components/Advantages';
import Workflow from '../components/Workflow';
import Process from '../components/Process';
import Showcase from '../components/Showcase';
import FAQ from '../components/FAQ';
import { Recycle, ShoppingBag, Heart, Sparkles } from 'lucide-react';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../hooks/useAuth';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const lenisRef = useRef<Lenis | null>(null);
  const navigate = useNavigate();
  const { user, loginUser, registerUser, logoutUser } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);

  useLayoutEffect(() => {
    // Initialize Lenis
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
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Sync GSAP with Lenis
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(raf);
    };
  }, []);

  return (
    <div className="min-h-screen bg-brand-100 selection:bg-brand-900 selection:text-brand-50">
      <div className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/90 px-3 py-2 shadow-sm backdrop-blur">
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
        <Hero />
        
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

        <Advantages />
        
        {/* Cangxingchuangye.cc.cd style horizontal process */}
        <Workflow />

        {/* Wonderwindows style Sticky Scroll Pinned Section */}
        <Process />

        <Showcase />

        <FAQ />

        {/* Minimal High-End CTA */}
        <section className="negative-space">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-32 border-t border-brand-200">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="text-[12vw] tracking-widest text-luxury text-center mb-12 font-serif"
            >
              循环新生
            </motion.h2>
            
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full max-w-4xl px-4">
              <button 
                onClick={() => navigate('/recycle')}
                className="w-full lg:w-1/3 px-8 py-6 border border-brand-900 text-brand-900 rounded-full font-serif italic text-xl flex items-center justify-center gap-3 hover:bg-brand-900 hover:text-brand-50 transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.05)] text-center"
              >
                <Recycle className="w-5 h-5 flex-shrink-0" />
                立即投递旧衣
              </button>
              <button 
                onClick={() => navigate('/shop')}
                className="w-full lg:w-1/3 px-8 py-6 border border-brand-900 text-brand-900 rounded-full font-serif italic text-xl flex items-center justify-center gap-3 hover:bg-brand-900 hover:text-brand-50 transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.05)] text-center"
              >
                <ShoppingBag className="w-5 h-5 flex-shrink-0" />
                探索商店
              </button>
              <button 
                onClick={() => navigate('/ai')}
                className="w-full lg:w-1/3 px-8 py-6 border border-brand-900 text-brand-900 rounded-full font-serif italic text-xl flex items-center justify-center gap-3 hover:bg-brand-900 hover:text-brand-50 transition-colors shadow-[0_4px_14px_rgba(0,0,0,0.05)] text-center"
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
