import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, MessageSquare, Search, 
  MoreHorizontal, Paperclip, 
  Image as ImageIcon, Mic, Send, Bot, User, PanelLeftClose, PanelLeft, X
} from 'lucide-react';

const MOCK_HISTORY = [
  { id: 1, title: '如何回收旧衣服？' },
  { id: 2, title: '可降解面料的种类' },
  { id: 3, title: '上门回收的积分怎么算' },
  { id: 4, title: '碳足迹减少报告' },
];

const MOCK_MESSAGES = [
  { 
    id: 1, 
    role: 'ai', 
    text: '您好！我是 Rennale Renuelly 的专属环保智能助手。很高兴为您服务！\n\n请问您今天想要了解些什么？比如衣物回收指导、碳足迹测算、还是了解我们最新的环保面料服饰？' 
  }
];

export default function AIAssistant() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FDFBF7] font-sans overflow-hidden">
      {/* 
        Background Image
      */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1627581561111-e41afcf9c636?q=80&w=2000&auto=format&fit=crop')"
        }}
      >
        {/* Removed the background overlay filters as requested to keep the original image colors */}
      </div>

      {/* Sidebar - Collapsible */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative z-20 h-full flex flex-col bg-[#FAF8F4]/90 backdrop-blur-3xl border-r border-[#DECFBE] text-[#362A1F] overflow-hidden shrink-0 shadow-[20px_0_40px_rgba(0,0,0,0.05)]"
          >
            
            {/* Top Actions */}
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <button 
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-[#7F6B58] hover:text-[#362A1F] transition-colors text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> 返回主页
                </button>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 text-[#7F6B58] hover:text-[#362A1F] hover:bg-[#EAE3D4]/50 rounded-lg transition-colors sm:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button className="flex items-center justify-between w-full bg-white hover:bg-[#FDFBF7] transition-colors rounded-xl px-4 py-3 border border-[#DECFBE] shadow-sm group">
                <div className="flex items-center gap-3">
                  <div className="bg-[#EAE3D4] p-1 rounded-md">
                    <Plus className="w-4 h-4 text-[#4A3D30]" />
                  </div>
                  <span className="font-medium text-[#362A1F] text-sm">新聊天</span>
                </div>
              </button>

              <div className="relative">
                 <Search className="w-4 h-4 text-[#BAAFA0] absolute left-3 top-1/2 -translate-y-1/2" />
                 <input 
                   type="text" 
                   placeholder="搜索聊天记录..." 
                   className="w-full bg-[#FDFBF7] border border-[#DECFBE] rounded-xl py-2 pl-9 pr-4 text-sm text-[#362A1F] placeholder:text-[#BAAFA0] outline-none focus:border-[#986E4B] focus:ring-1 focus:ring-[#986E4B]/20 transition-all shadow-inner"
                 />
              </div>
            </div>

            {/* Chat History List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 custom-scrollbar min-w-[288px]">
              <div className="px-3 py-2 text-xs font-semibold text-[#BAAFA0] tracking-wider mt-2 mb-1">近期对话</div>
              {MOCK_HISTORY.map((chat) => (
                <button key={chat.id} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#EAE3D4]/50 transition-colors group">
                  <div className="flex items-center gap-3 overflow-hidden text-[#6C5B49] group-hover:text-[#362A1F]">
                    <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                    <span className="text-sm truncate font-medium">{chat.title}</span>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-transparent group-hover:text-[#BAAFA0] shrink-0" />
                </button>
              ))}
            </div>
            
            <div className="p-4 border-t border-[#DECFBE] text-center">
                <span className="text-xs text-[#BAAFA0] font-serif italic">Campus Cycle AI</span>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="relative z-10 flex-1 flex flex-col h-full bg-transparent min-w-0">
        
        {/* Header - Transparent & Elegant */}
        <div className="w-full h-16 flex items-center justify-between px-4 sm:px-6 z-20">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setSidebarOpen(!sidebarOpen)}
               className="p-2 text-[#4A3D30] hover:bg-white/40 hover:text-[#362A1F] rounded-xl transition-colors backdrop-blur-md border border-white/20 shadow-sm bg-white/20"
               title={sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
             >
               {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
             </button>
             
             {/* Only show 'Return Home' here if sidebar is closed, so user always has a way back */}
             {!sidebarOpen && (
               <button 
                 onClick={() => navigate('/')}
                 className="hidden sm:flex items-center gap-2 px-3 py-2 text-[#4A3D30] hover:bg-white/40 hover:text-[#362A1F] rounded-xl transition-colors backdrop-blur-md border border-white/20 shadow-sm text-sm font-medium bg-white/20"
               >
                 <ArrowLeft className="w-4 h-4" /> 返回主页
               </button>
             )}
           </div>

           <div className="flex items-center justify-center absolute left-1/2 -translate-x-1/2">
              <button className="flex items-center gap-2 text-[#362A1F] hover:bg-white/60 transition-colors bg-white/40 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/30 shadow-sm">
                  <span className="font-serif italic font-semibold text-sm">Rennale Vision-AI</span>
                  <span className="text-[10px] px-2 py-0.5 bg-[#986E4B] text-white rounded-full font-bold tracking-wider">PRO</span>
               </button>
           </div>
           
           <div className="flex items-center gap-2">
             <button className="sm:hidden p-2 text-[#4A3D30] hover:bg-white/40 hover:text-[#362A1F] rounded-xl transition-colors backdrop-blur-md border border-white/20 shadow-sm bg-white/20">
               <Plus className="w-5 h-5" />
             </button>
           </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 w-full overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
            <div className="max-w-3xl mx-auto space-y-8 pb-10 mt-10">
              {MOCK_MESSAGES.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-10 h-10 rounded-full bg-[#FDFBF7] flex items-center justify-center shrink-0 border border-[#DECFBE] shadow-sm">
                      <Bot className="w-5 h-5 text-[#986E4B]" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] rounded-[2rem] p-6 text-[15px] leading-relaxed shadow-xl backdrop-blur-2xl whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-white/80 text-[#362A1F] rounded-tr-md border border-white/40 font-medium' 
                      : 'bg-[#FDFBF7]/80 text-[#4A3D30] rounded-tl-md border border-white/60'
                  }`}>
                    {msg.text}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-[#986E4B] flex items-center justify-center shrink-0 border border-white/40 shadow-sm">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
        </div>

        {/* Floating Input Area */}
        <div className="p-4 md:p-6 w-full max-w-4xl shrink-0 mx-auto">
          <div className="relative bg-[#FDFBF7]/80 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgba(54,42,31,0.08)] overflow-hidden focus-within:border-[#986E4B]/40 focus-within:ring-2 focus-within:ring-[#986E4B]/10 transition-all">
             <div className="px-6 pt-6 pb-3">
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="给 AI 智能环保助手发送消息..."
                  className="w-full bg-transparent outline-none text-[#362A1F] placeholder:text-[#BAAFA0] resize-none min-h-[44px] max-h-[200px]"
                  rows={2}
                />
             </div>
             
             {/* Bottom toolbar */}
             <div className="flex items-center justify-between px-5 pb-4">
                 <div className="flex items-center gap-1.5 text-[#986E4B]">
                    <button className="p-2.5 hover:bg-[#EAE3D4]/50 hover:text-[#362A1F] rounded-full transition-colors group relative" title="附加文件">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 hover:bg-[#EAE3D4]/50 hover:text-[#362A1F] rounded-full transition-colors group relative" title="上传图片">
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <div className="w-[1px] h-5 bg-[#DECFBE] mx-1"></div>
                    <button className="p-2.5 hover:bg-[#986E4B]/10 hover:text-[#6C4B30] rounded-full transition-colors group relative flex items-center gap-1" title="语音输入">
                        <Mic className="w-5 h-5" />
                    </button>
                 </div>
                 
                 <button 
                  className={`p-3 rounded-full flex items-center justify-center transition-all ${
                    inputText.trim().length > 0 
                      ? 'bg-[#986E4B] text-white hover:bg-[#835C3D] shadow-md hover:shadow-lg hover:-translate-y-0.5' 
                      : 'bg-[#EAE3D4] text-[#BAAFA0] cursor-not-allowed'
                  }`}
                 >
                    <Send className="w-4 h-4 ml-0.5" />
                 </button>
             </div>
          </div>
          <div className="text-center text-xs text-[#7F6B58] mt-4 font-medium tracking-wide px-4 pb-2 drop-shadow-sm mix-blend-multiply">
             Rennale Vision-AI 可能会生成不准确的测算信息。请核实重要的积分数据。
          </div>
        </div>

      </div>
      
      {/* Global generic styles for scrollbar in this specific panel */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(186, 175, 160, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(152, 110, 75, 0.6);
        }
      `}</style>
    </div>
  );
}
