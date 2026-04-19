import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

const items = [
  {
    id: 1,
    name: "校园基础连帽卫衣",
    category: "再流通",
    price: "¥39",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800&h=1000"
  },
  {
    id: 2,
    name: "建筑感解构丹宁",
    category: "解构重塑",
    price: "¥189",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800&h=1000"
  },
  {
    id: 3,
    name: "极简纯棉T恤",
    category: "纯净基础款",
    price: "¥19",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800&h=1000"
  }
];

export default function Showcase() {
  return (
    <section className="negative-space bg-brand-900 text-brand-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-10">
          <div className="max-w-2xl">
            <span className="text-[12px] tracking-[0.2em] text-brand-400 mb-4 block">
              精选系列
            </span>
            <h2 className="text-5xl md:text-7xl font-serif">
              画廊。<span className="italic font-light">严选甄品。</span>
            </h2>
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] font-medium opacity-50 pb-2">
            <Sparkles className="w-4 h-4" />
            <span>限量手工系列</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 pl-0 md:pl-20">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className="group flex flex-col cursor-pointer"
            >
              <div className="aspect-[3/4] overflow-hidden bg-brand-800">
                <motion.img 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="mt-6 flex justify-between items-start">
                <div>
                  <span className="text-[10px] tracking-[0.2em] text-brand-400 mb-2 block">
                    {item.category}
                  </span>
                  <h4 className="text-xl font-serif">{item.name}</h4>
                </div>
                <div className="text-lg font-serif text-brand-300">{item.price}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
