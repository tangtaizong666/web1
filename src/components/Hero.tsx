import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Recycle, Sparkles } from 'lucide-react';

export default function Hero() {
  const container = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 200]);

  return (
    <section ref={container} className="relative h-[200vh] bg-brand-900 overflow-hidden">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center">
        {/* Cinematic Background Video with Zoom */}
        <motion.div 
          style={{ scale, opacity }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <iframe
            src="https://player.mux.com/VPgqHsW01gQWsfKJcgItYfkeyYYIvJ4DubLbEChs8Tsg?autoplay=any&loop=true&muted=true&controls=false"
            className="w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60 pointer-events-none"
            style={{ border: "none" }}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
          {/* Fallback pattern in case video is slow to load or missing */}
          <div className="absolute inset-0 bg-brand-900 -z-10 kraft-texture opacity-30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-900/40 via-brand-900/10 to-brand-900 pointer-events-none" />
        </motion.div>

        {/* Top Right Floating Action Icons (Only on Cover) */}
        <div className="absolute top-8 right-6 md:top-12 md:right-12 z-50 flex flex-col md:flex-row items-end md:items-center gap-4 pointer-events-auto">
          {[
            { icon: ShoppingBag, label: "商店", path: "/shop" },
            { icon: Recycle, label: "一键回收", path: "/recycle" },
            { icon: Sparkles, label: "AI 助手", path: "/ai" }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              onClick={() => navigate(item.path)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + idx * 0.1, duration: 0.8, ease: "easeOut" }}
              className="group flex items-center bg-brand-50/10 hover:bg-brand-50/20 backdrop-blur-md border border-brand-50/30 rounded-full p-4 cursor-pointer transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              <item.icon className="w-5 h-5 text-brand-50/90 group-hover:text-brand-50 transition-colors" />
              <div className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-3 transition-all duration-500 ease-in-out whitespace-nowrap text-brand-50 text-sm font-sans tracking-widest pl-1 border-l border-transparent group-hover:border-brand-50/30">
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          style={{ y: textY }}
          className="relative z-10 text-center px-10 max-w-6xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[10px] uppercase tracking-[0.5em] text-brand-300 mb-6 block font-bold" style={{ transform: "translateZ(0)" }}>
              可持续循环周期
            </span>
            <h1 className="text-[10vw] leading-[0.9] md:text-[12vw] text-luxury text-brand-50 mb-10" style={{ textShadow: "0 10px 40px rgba(0,0,0,0.5)", transform: "translateZ(0)" }}>
              Cycle.<br />
              <span className="italic font-light lowercase tracking-tighter text-brand-200">新生。</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-brand-100 max-w-2xl mx-auto font-light leading-relaxed tracking-wide italic">
              用透明度与设计重塑校园旧衣回收。<br />
              让每一件衣物，讲述循环重生的故事。
            </p>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          <div className="w-px h-20 bg-gradient-to-b from-brand-50 to-transparent" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-brand-50/50">向下滚动探索</span>
        </motion.div>
      </div>
    </section>
  );
}
