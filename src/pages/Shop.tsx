import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, ChevronDown, X, ShoppingCart } from 'lucide-react';
import { PRODUCTS, CATEGORIES } from '../data/products';

export default function Shop() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [sortBy, setSortBy] = useState("default");
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null);

  const filteredAndSortedProducts = useMemo(() => {
    let result = PRODUCTS;

    // Filter by Category
    if (activeCategory !== "全部") {
      result = result.filter(p => p.category === activeCategory);
    }

    // Filter by Search
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort
    result = [...result]; // create a copy before sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [searchQuery, activeCategory, sortBy]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-brand-50 px-5 pb-24 pt-6 md:px-12 md:pb-32 md:pt-8 lg:px-20">
      {/* Top Nav */}
      <nav className="relative z-10 mx-auto mb-10 flex max-w-7xl items-center justify-between gap-4 md:mb-12">
        <button 
          onClick={() => navigate('/')}
          className="flex min-w-0 items-center gap-2 font-serif text-base italic text-brand-700 transition-colors hover:text-brand-900 md:text-lg"
        >
          <ArrowLeft className="w-5 h-5" /> 返回首页
        </button>
        <div className="hidden shrink-0 rounded-full border border-brand-900 px-4 py-1 font-serif text-lg italic tracking-widest text-brand-900 sm:block md:text-2xl">
          Store
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mt-8 flex flex-col items-center justify-between overflow-hidden border-b border-brand-200 pb-16 md:mt-12 md:flex-row md:pb-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="w-full min-w-0 pr-0 md:w-1/2 md:pr-12"
          >
            <h1 className="mb-6 font-serif text-5xl leading-tight tracking-widest text-brand-900 sm:text-6xl md:mb-8 md:text-8xl">
              商店
            </h1>
            <p className="mb-8 max-w-full break-words font-serif text-base italic tracking-wide text-brand-500 md:max-w-md md:text-lg md:uppercase md:tracking-wider">
              Free of fast fashion, built for longevity.
            </p>
            <div className="h-px bg-brand-300 w-16 mb-8"></div>
            <p className="text-brand-600 tracking-wider text-xs uppercase leading-relaxed font-bold">
              Curated sustainable pieces<br />
              From campus, for campus
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mt-12 flex w-full justify-center md:mt-0 md:w-1/2 md:justify-end"
          >
             <div className="relative aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-t-full border-4 border-brand-100 shadow-2xl sm:max-w-[400px]">
                <img 
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop" 
                  className="w-full h-full object-cover bg-brand-200" 
                  alt="Sustainable Fashion Hero" 
                  referrerPolicy="no-referrer"
                />
             </div>
          </motion.div>
        </div>

        {/* Toolbar: Search, Filters, Sort */}
        <div className="mb-10 mt-12 flex flex-col items-stretch justify-between gap-6 border-b border-brand-200 py-6 pb-10 md:mb-12 md:mt-16 md:pb-12 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="w-full max-w-none flex-1 lg:w-auto lg:max-w-md">
            <div className="flex items-center bg-transparent border-b border-brand-400 py-3">
              <Search className="w-5 h-5 text-brand-900 mr-3" />
              <input
                type="text"
                placeholder="搜索单品 (例如：极简白衬衫)..."
                className="bg-transparent outline-none text-base text-brand-900 w-full placeholder:text-brand-400 font-serif italic"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex w-full flex-wrap justify-start gap-2 lg:w-auto lg:justify-center">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 sm:px-6 ${
                  activeCategory === cat 
                    ? 'bg-brand-900 text-brand-50 scale-105' 
                    : 'border border-brand-300 text-brand-700 hover:border-brand-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[160px]">
             <select
                className="w-full appearance-none bg-transparent border border-brand-300 rounded-full px-5 py-2.5 pr-10 text-sm font-medium outline-none text-brand-900 focus:border-brand-900 transition-colors cursor-pointer"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
             >
               <option value="default">默认排序</option>
               <option value="price-asc">价格：从低到高</option>
               <option value="price-desc">价格：从高到低</option>
             </select>
             <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-700" />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 md:grid-cols-3 md:gap-x-10 md:gap-y-16 lg:grid-cols-4">
          <AnimatePresence>
            {filteredAndSortedProducts.length > 0 ? (
              filteredAndSortedProducts.map((item, idx) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="flex flex-col group cursor-pointer"
                  onClick={() => setSelectedProduct(item)}
                >
                  {/* Clean rectangular container (Ugmonk style) */}
                  <div className="relative w-full aspect-[4/5] mb-4 bg-white md:bg-[#f5f5f5] flex items-center justify-center overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>

                  {/* Product Info - Left Aligned */}
                  <div className="flex flex-col items-start px-1 text-left w-full">
                    <div className="flex justify-between items-start w-full gap-2">
                       <h3 className="text-sm font-medium text-brand-900 leading-tight">
                         {item.name} <span className="text-brand-500 font-normal">({item.color})</span>
                       </h3>
                    </div>
                    <p className="text-brand-600 text-sm mt-1 mb-2">
                       ¥{item.price.toFixed(2)}
                    </p>
                    {/* Tags logic remains, but simplified below price */}
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {item.tags.map(tag => (
                        <span key={tag} className="bg-brand-100 px-2 py-0.5 rounded text-[10px] text-brand-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="col-span-full py-24 text-center"
               >
                  <p className="text-brand-500 font-serif italic text-xl">
                    Ops! 没有找到符合条件的商品。
                  </p>
                  <button 
                    onClick={() => {
                       setSearchQuery("");
                       setActiveCategory("全部");
                       setSortBy("default");
                    }}
                    className="mt-6 border-b border-brand-900 pb-1 text-brand-900"
                  >
                    清除所有筛选条件
                  </button>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Separate component for the Modal to keep Shop clean
function ProductModal({ product, onClose }: { product: typeof PRODUCTS[0], onClose: () => void }) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-auto max-h-[92svh] w-full max-w-6xl flex-col overflow-y-auto rounded-2xl bg-brand-50 shadow-2xl md:h-[85vh] md:flex-row md:overflow-hidden md:rounded-3xl"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-2 bg-brand-50/50 hover:bg-brand-100 rounded-full text-brand-900 transition-colors backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left Pane - Product Details (Dark Brand Theme) */}
        <div className="flex w-full flex-col justify-center overflow-y-auto bg-brand-900 p-6 text-brand-50 md:w-5/12 md:p-12 lg:p-16">
          
          <div className="space-y-6 md:space-y-8">
            <div>
              <p className="text-brand-300 font-serif italic text-2xl md:text-3xl mb-4">
                ¥{product.price.toFixed(2)}
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-brand-50 tracking-wider leading-tight">
                {product.name}
              </h2>
            </div>
            
            <p className="text-brand-200/80 font-light leading-relaxed text-sm md:text-base">
              {product.description}
            </p>

            <button className="w-fit flex items-center gap-3 bg-brand-50 text-brand-900 px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-brand-200 transition-colors">
              <ShoppingCart className="w-5 h-5" /> 立即购买
            </button>

            {/* Specifications Section */}
            <div className="pt-8 border-t border-brand-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-brand-300">
              <div>
                <p className="font-bold text-brand-100 mb-1">Color / 色系</p>
                <p>{product.color}</p>
              </div>
              <div>
                <p className="font-bold text-brand-100 mb-1">Material / 材质</p>
                <p>{product.specs.material}</p>
              </div>
               <div className="md:col-span-2 lg:col-span-1">
                <p className="font-bold text-brand-100 mb-1">Size / 尺码</p>
                <p>{product.specs.size}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane - Images */}
        <div className="relative flex min-h-[360px] w-full items-center justify-center overflow-hidden bg-[#F9F7F4] p-6 md:min-h-[400px] md:w-7/12 md:p-12">
           {/* Thumbnails */}
           <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-row gap-3 md:bottom-auto md:left-auto md:right-8 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:flex-col md:gap-4">
              {product.thumbnails.map((thumb, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`h-14 w-11 overflow-hidden rounded-md border-2 transition-all duration-300 md:h-20 md:w-16 ${activeImageIdx === idx ? 'border-brand-900 shadow-md transform scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={thumb} className="w-full h-full object-cover" alt="thumbnail" referrerPolicy="no-referrer" />
                </button>
              ))}
           </div>

           {/* Main Featured Image */}
           <AnimatePresence mode="wait">
             <motion.img
                key={activeImageIdx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                src={product.thumbnails[activeImageIdx]}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="h-auto max-h-full w-full max-w-[72%] object-contain drop-shadow-2xl md:max-w-[80%]"
             />
           </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
