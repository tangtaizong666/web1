import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const faqs = [
  {
    question: "你们接收哪些类型的旧衣？",
    answer: "我们专注于可再流通、改造或再利用的衣物——外套、卫衣、T恤、丹宁裤等。出于卫生考虑，内衣物或严重破损的衣物将转入工业纤维回收。"
  },
  {
    question: "如何确保衣物的卫生与安全？",
    answer: "每件衣物都会经历多道工序：智能预分级、医疗级别消杀以及专业的人工质检。我们在平台上提供每件物品的透明处理记录。"
  },
  {
    question: "捐献时我的隐私会得到保护吗？",
    answer: "绝对保护。我们秉承“最小数据”原则。捐赠批次会被彻底匿名化，来源身份也绝不会在公开列表中暴露。您的善举意义非凡，但也绝对私密。"
  },
  {
    question: "买到后不合适可以退吗？",
    answer: "标准商品遵循常规退换货。设计师重构商品，因其独一定制属性，通常遵循“结单不退”法则，我们会在商品页进行显著标示。"
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="negative-space bg-brand-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-24">
          <span className="text-[12px] tracking-[0.2em] text-brand-400 mb-4 block">
            常见问题
          </span>
          <h2 className="text-4xl md:text-6xl font-serif leading-none tracking-tighter text-brand-900">
            回答你最后的疑问
          </h2>
        </div>

        <div className="border-t border-brand-200">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index}
                className="group border-b border-brand-200 transition-colors duration-500 hover:bg-brand-100/30"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full py-8 md:py-10 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className={cn(
                    "text-xl md:text-2xl font-serif tracking-tight transition-all duration-700",
                    isOpen ? "text-brand-900 translate-x-2" : "text-brand-700 group-hover:text-brand-900"
                  )}>
                    {faq.question}
                  </span>
                  
                  <div className={cn(
                    "transition-transform duration-700 text-brand-400 group-hover:text-brand-900",
                    isOpen ? "rotate-45" : "rotate-0"
                  )}>
                    <Plus strokeWidth={1.5} className="w-6 h-6" />
                  </div>
                </button>
                
                <div className={cn(
                  "grid transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]",
                  isOpen ? "grid-rows-1 opacity-100 pb-8 md:pb-10" : "grid-rows-0 opacity-0"
                )}>
                  <div className="overflow-hidden">
                    <div className="max-w-2xl text-sm md:text-base text-brand-500 font-light leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
