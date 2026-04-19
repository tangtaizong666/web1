import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    num: "01",
    label: "溯源",
    title: "织物里的智能",
    desc: "从衣物进入回收箱的那一刻起，AI 就会识别它的成分、质量与潜能。我们不仅仅是在分类；我们是在解码每一件衣物的未来。",
    visual: (svgClass: string) => (
      <svg className={svgClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46 16 2a8.59 8.59 0 0 0-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      </svg>
    )
  },
  {
    num: "02",
    label: "消杀",
    title: "纯净的精确刻度",
    desc: "医疗级的消毒不仅是承诺，更是标准。在这里，“二手”绝不意味着“次级”。从深层除尘、臭氧杀菌到紫外线扫射，我们保证衣物绝对的安全与清新。",
    visual: (svgClass: string) => (
      <svg className={svgClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 5 4 4" />
        <path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13" />
        <path d="m8 6 2-2" />
        <path d="m2 22 5.5-1.5L21.17 6.83a2.82 2.82 0 0 0-4-4L3.5 16.5Z" />
        <path d="m18 16 2-2" />
        <path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17" />
      </svg>
    )
  },
  {
    num: "03",
    label: "策展",
    title: "新故事的开篇",
    desc: "无论是直接再流通，还是交由设计师进行解构重塑，每一件单品都被重新精心策划，以匹配现代的校园审美与生活节奏。用新的形式将浪费化作宣言。",
    visual: (svgClass: string) => (
      <svg className={svgClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
        <path d="M2 20h20" />
        <path d="M14 12v.01" />
      </svg>
    )
  },
  {
    num: "04",
    label: "重塑",
    title: "再次穿起。唤醒生命。",
    desc: "一件衣物真正的价值并不在于被制造出来时的惊艳，而在于被不断延续的寿命。重新穿上它，以可持续的时尚实践挑战用完即弃的消费主义。",
    visual: (svgClass: string) => (
      <svg className={svgClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </svg>
    )
  }
];

export default function Process() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Create a single main timeline scrubbed to the whole pinned section
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: `+=${steps.length * 100}%`,
          pin: true,
          scrub: 1,
        }
      });

      // The time between steps
      const duration = 1;

      // Animate from step to step
      for(let i=1; i<steps.length; i++) {
        // Timeline label for synchronization
        const label = `step${i}`;
        
        // Hide previous text
        tl.to(`.step-text-${i-1}`, { opacity: 0, y: -30, duration: duration, ease: "power2.inOut" }, label);
        
        // Hide previous visual (scale down / fade out)
        tl.to(`.step-visual-${i-1}`, { opacity: 0, scale: 0.8, duration: duration, ease: "power2.inOut" }, label);
        
        // Show next text (from bottom up)
        tl.fromTo(`.step-text-${i}`, 
          { opacity: 0, y: 30 }, 
          { opacity: 1, y: 0, duration: duration, ease: "power2.inOut" }, 
          label
        );
        
        // Show next visual (expand / fade in)
        tl.fromTo(`.step-visual-${i}`, 
          { opacity: 0, scale: 1.2 }, 
          { opacity: 1, scale: 1, duration: duration, ease: "power2.inOut" }, 
          label
        );
      }

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="h-screen w-full flex kraft-texture text-brand-900 border-t border-brand-200">
      {/* Left Column: Text (40%) */}
      <div className="w-full md:w-[40%] h-full relative border-r border-brand-900/10">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-10 md:px-20 h-96 flex flex-col justify-center">
          {steps.map((step, i) => (
            <div 
              key={`text-${i}`} 
              className={`step-text-${i} absolute w-auto left-10 md:left-20 right-10 md:right-20 pointer-events-none ${i === 0 ? "opacity-100" : "opacity-0"}`}
            >
              <span className="text-[10px] uppercase tracking-[0.4em] text-brand-500 font-bold mb-8 block">
                {step.num} / {step.label}
              </span>
              <h2 className="text-5xl md:text-6xl font-serif leading-none mb-10 tracking-tighter">
                {step.title}
              </h2>
              <p className="text-xl text-brand-700 font-light leading-relaxed italic">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Visuals (60%) */}
      <div className="hidden md:flex w-[60%] h-full relative items-center justify-center overflow-hidden">
        {/* Subtle pulsating center light */}
        <div className="absolute w-[40vw] h-[40vw] bg-brand-50/50 rounded-full blur-3xl opacity-50" />
        
        {steps.map((step, i) => (
          <div 
            key={`visual-${i}`} 
            className={`step-visual-${i} absolute inset-0 flex items-center justify-center ${i === 0 ? "opacity-100" : "opacity-0"}`}
          >
            {step.visual("w-64 h-64 text-brand-800 drop-shadow-2xl")}
          </div>
        ))}
      </div>
    </section>
  );
}
