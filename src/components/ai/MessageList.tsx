import type { Message } from '../../types/chat';

export function MessageList({ messages, pageError }: { messages: Message[]; pageError: string }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      {pageError ? (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>
      ) : null}
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {messages.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#DECFBE] bg-white/80 px-6 py-8 text-center text-sm leading-7 text-[#7F6B58]">
            问问 AI 如何回收旧衣、估算积分，或者让它帮你整理捐赠建议。
          </div>
        ) : null}
        {messages.map((message) => (
          <div key={message.id} className={message.role === 'user' ? 'self-end' : 'self-start'}>
            <div
              className={`max-w-[80%] rounded-[2rem] px-5 py-4 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-[#986E4B] text-white'
                  : 'border border-[#DECFBE] bg-white text-[#362A1F]'
              }`}
            >
              <div className={message.content === 'AI 正在思考...' ? 'animate-pulse text-[#7F6B58]' : ''}>
                {message.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
