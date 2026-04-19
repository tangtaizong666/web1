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
    <div className="min-h-screen bg-brand-50 pt-8 px-6 md:px-12 lg:px-20 pb-32">
      {/* Top Nav */}
      <nav className="mb-12 relative z-10 flex justify-between items-center max-w-7xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-brand-700 hover:text-brand-900 transition-colors font-serif italic text-lg"
        >
          <ArrowLeft className="w-5 h-5" /> 返回首页
        </button>
        <div className="font-serif italic text-2xl tracking-widest text-brand-900 border border-brand-900 rounded-full px-4 py-1">
          Store
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center justify-between pb-24 border-b border-brand-200 mt-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="w-full md:w-1/2 pr-0 md:pr-12"
          >
            <h1 className="text-6xl md:text-8xl font-serif text-brand-900 mb-8 tracking-widest leading-tight">
              商店
            </h1>
            <p className="text-brand-500 font-serif italic text-lg max-w-md uppercase tracking-wider mb-8">
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
            className="w-full md:w-1/2 mt-16 md:mt-0 flex justify-center md:justify-end"
          >
             <div className="relative w-full max-w-[400px] aspect-[3/4] rounded-t-full overflow-hidden border-4 border-brand-100 shadow-2xl">
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
        <div className="mt-16 mb-12 py-6 flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-brand-200 pb-12">
          {/* Search */}
          <div className="w-full lg:w-auto flex-1 max-w-md">
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
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
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
          <div className="relative min-w-[160px]">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 md:gap-x-10 gap-y-16">
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
        className="w-full max-w-6xl max-h-full h-auto md:h-[85vh] bg-brand-50 rounded-2xl md:rounded-3xl shadow-2xl flex flex-col md:flex-row relative overflow-hidden"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-2 bg-brand-50/50 hover:bg-brand-100 rounded-full text-brand-900 transition-colors backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left Pane - Product Details (Dark Brand Theme) */}
        <div className="w-full md:w-5/12 bg-brand-900 text-brand-50 p-8 md:p-12 lg:p-16 flex flex-col justify-center overflow-y-auto">
          
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
        <div className="w-full md:w-7/12 bg-[#F9F7F4] flex p-6 md:p-12 relative items-center justify-center overflow-hidden min-h-[400px]">
           {/* Thumbnails */}
           <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 md:gap-4 z-10">
              {product.thumbnails.map((thumb, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-12 h-16 md:w-16 md:h-20 rounded-md overflow-hidden transition-all duration-300 border-2 ${activeImageIdx === idx ? 'border-brand-900 shadow-md transform scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
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
                className="w-full max-w-[80%] h-auto max-h-full object-contain filter drop-shadow-2xl"
             />
           </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
