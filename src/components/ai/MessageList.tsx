import type { Message } from '../../types/chat';

const SUGGESTIONS = [
  '旧衣回收后会经历什么流程？',
  '一件八成新的卫衣能换多少积分？',
  '附近的智能回收箱怎么找？',
];

export function MessageList({
  messages,
  pageError,
  sending = false,
  onSuggestion,
}: {
  messages: Message[];
  pageError: string;
  sending?: boolean;
  onSuggestion?: (text: string) => void;
}) {
  return (
    <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6">
      {pageError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6">
        {messages.length === 0 ? (
          <div className="flex w-full flex-col items-start gap-3">
            <div className="max-w-[88%] rounded-[1.5rem] border border-[#E3D8C4] bg-white/85 px-4 py-3 text-sm leading-relaxed text-[#362A1F] backdrop-blur-sm md:max-w-[80%] md:rounded-[2rem] md:px-5 md:py-4">
              你好，有什么需要帮助的吗？
            </div>
            <div className="flex max-w-[88%] flex-wrap gap-2 pl-1 md:max-w-[80%]">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={sending || !onSuggestion}
                  onClick={() => onSuggestion?.(suggestion)}
                  className="rounded-full border border-[#DECFBE] bg-white/70 px-3.5 py-1.5 text-xs text-[#5C4B3A] transition-colors hover:border-[#986E4B]/60 hover:bg-[#986E4B]/10 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={message.role === 'user' ? 'flex w-full justify-end' : 'flex w-full justify-start'}
          >
            <div
              className={`max-w-[88%] rounded-[1.5rem] px-4 py-3 text-sm leading-relaxed [overflow-wrap:anywhere] md:max-w-[80%] md:rounded-[2rem] md:px-5 md:py-4 ${
                message.role === 'user'
                  ? 'bg-[#986E4B] text-white shadow-[0_8px_24px_rgba(152,110,75,0.25)]'
                  : 'border border-[#E3D8C4] bg-white/85 text-[#362A1F] backdrop-blur-sm'
              }`}
            >
              <div className={message.content === 'AI 正在思考...' ? 'animate-pulse text-[#A08D77]' : ''}>
                {message.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
