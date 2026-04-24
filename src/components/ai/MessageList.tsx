import type { Message } from '../../types/chat';

export function MessageList({ messages, pageError }: { messages: Message[]; pageError: string }) {
  return (
    <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6">
      {pageError ? (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>
      ) : null}
      <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6">
        {messages.length === 0 ? (
          <div className="min-w-0 rounded-[1.25rem] border border-dashed border-[#DECFBE] bg-white/80 px-4 py-6 text-left text-sm leading-7 text-[#7F6B58] [overflow-wrap:anywhere] md:rounded-[2rem] md:px-6 md:py-8 md:text-center">
            问问 AI 如何回收旧衣、估算积分，或者让它帮你整理捐赠建议。
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
