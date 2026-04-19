import { motion } from 'motion/react';
import { Truck, ClipboardList, Droplets, CheckCircle2, Scissors, RefreshCcw } from 'lucide-react';

const steps = [
  { icon: Truck, label: "投递", desc: "宿舍点或预约上门" },
  { icon: ClipboardList, label: "分级", desc: "AI 辅助智能分类" },
  { icon: Droplets, label: "清洗消杀", desc: "专业标准深度处理" },
  { icon: CheckCircle2, label: "质检", desc: "严格把控上架标准" },
  { icon: Scissors, label: "改造 / 上架", desc: "赋予旧衣新设计" },
  { icon: RefreshCcw, label: "再流通 / 再利用", desc: "开启第二次生命" }
];

export default function Workflow() {
  return (
    <section className="bg-brand-50 py-32 border-t border-brand-200">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-20">
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-brand-400 font-medium tracking-[0.2em] text-sm mb-4"
          >
            透明化流程
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif text-brand-900"
          >
            衣服交出去以后到底发生了什么？
          </motion.h2>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-[40px] left-10 w-[calc(100%-80px)] h-px bg-brand-200 hidden lg:block z-0" />
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6 border border-brand-200 group-hover:border-brand-400 group-hover:bg-brand-100 transition-all">
                  <step.icon strokeWidth={1.5} className="w-8 h-8 text-brand-700" />
                </div>
                <h3 className="text-lg font-serif mb-2 text-brand-900">{step.label}</h3>
                <p className="text-brand-500 text-xs font-light max-w-[120px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-24 text-center">
          <p className="text-brand-500 italic font-serif text-lg md:text-xl max-w-2xl mx-auto">
            “当处理过程足够透明，购买二手和改造商品这件事，才会真正成立。”
          </p>
        </div>
      </div>
    </section>
  );
}
