import { X } from 'lucide-react';
import type { Conversation } from '../../types/chat';

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onCreate,
  onSelect,
  onClose,
}: {
  conversations: Conversation[];
  activeConversationId: string | null;
  onCreate: () => void;
  onSelect: (conversationId: string) => void;
  onClose: () => void;
}) {
  return (
    <aside className="flex h-full w-[min(18rem,88vw)] shrink-0 flex-col border-r border-[#DECFBE] bg-[#FAF8F4]/95 p-4 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-[#362A1F]">对话列表</div>
          <div className="text-xs text-[#7F6B58]">已保存的聊天会在这里显示</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-[#DECFBE] p-2 text-[#7F6B58] transition hover:bg-white"
          aria-label="关闭侧边栏"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <button
        onClick={onCreate}
        className="mb-4 w-full rounded-xl border border-[#DECFBE] bg-white px-4 py-3 text-sm text-[#362A1F] shadow-sm transition hover:bg-[#F8F2EA]"
      >
        新聊天
      </button>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DECFBE] bg-white/80 px-4 py-6 text-sm text-[#7F6B58]">
            还没有历史对话，发出第一条消息后这里就会出现记录。
          </div>
        ) : null}
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
              activeConversationId === conversation.id
                ? 'bg-[#EAE3D4]'
                : 'bg-transparent hover:bg-[#F4F0E8]'
            }`}
          >
            <div className="truncate font-medium text-[#362A1F]">{conversation.title}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}
