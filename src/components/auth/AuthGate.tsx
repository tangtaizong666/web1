export function AuthGate() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7] p-6">
      <div className="max-w-md rounded-3xl border border-[#DECFBE] bg-white p-8 text-center shadow-xl">
        <h1 className="font-serif text-3xl text-[#362A1F]">请先登录后使用 AI 助手</h1>
        <p className="mt-3 text-sm text-[#7F6B58]">
          登录后即可查看你的聊天记录、新建对话，并上传图片、文件和语音。
        </p>
      </div>
    </div>
  );
}
