import { motion } from 'motion/react';
import { MapPin, Gift, ShieldCheck, Cpu } from 'lucide-react';

const advantages = [
  {
    icon: MapPin,
    title: "无缝触达",
    description: "校园固定投放点与预约上门服务，让旧衣回收成为你的日常节律。"
  },
  {
    icon: Gift,
    title: "看得见的价值",
    description: "每一次投递都能积累绿植积分，兑换可持续好物或独家设计师重做商品。"
  },
  {
    icon: ShieldCheck,
    title: "全流程隐私",
    description: "我们严格保护您的隐私信息。每一个处理批次都经过匿名化处理，确保回收体验体面且安全。"
  },
  {
    icon: Cpu,
    title: "算法级精度",
    description: "AI 驱动的精确分级算法减少了人为判断的误差，确保您的每一件衣服都能去往它该去的地方。"
  }
];

export default function Advantages() {
  return (
    <section className="negative-space bg-brand-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-32">
          {advantages.map((adv, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className="group flex flex-col items-start"
            >
              <div className="mb-10 text-brand-900 overflow-hidden">
                <motion.div 
                  whileHover={{ rotate: 90 }}
                  className="w-12 h-12 flex items-center justify-center border border-brand-200 rounded-full group-hover:bg-brand-900 group-hover:text-brand-50 transition-all duration-700"
                >
                  <adv.icon className="w-5 h-5 border-none" />
                </motion.div>
              </div>
              
              <h3 className="text-4xl font-serif mb-6 tracking-tight leading-none group-hover:translate-x-2 transition-transform duration-700">
                {adv.title}
              </h3>
              
              <p className="text-xl text-brand-500 font-light leading-relaxed max-w-sm">
                {adv.description}
              </p>
              
              <div className="mt-10 w-0 group-hover:w-full h-[1px] bg-brand-900 transition-all duration-1000 origin-left" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
