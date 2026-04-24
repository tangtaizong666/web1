import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { House, LogOut, PanelLeft, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConversationSidebar } from '../components/ai/ConversationSidebar';
import { MessageList } from '../components/ai/MessageList';
import { ChatComposer } from '../components/ai/ChatComposer';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { useConversationMessages } from '../hooks/useConversationMessages';
import {
  clearGuestConversations,
  exportGuestConversationsForImport,
  hasImportableGuestConversations,
} from '../lib/guestChat';
import { importGuestConversations } from '../lib/chat';

export default function AIAssistant() {
  const { user, isLoading, loginUser, registerUser, logoutUser } = useAuth();
  const uploadsFeatureEnabled = import.meta.env.VITE_ENABLE_ATTACHMENTS !== 'false';
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pageNotice, setPageNotice] = useState('');
  const importedUserIdRef = useRef<string | null>(null);
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    refreshConversations,
    conversationsError,
    conversationsNotice,
    clearConversationsNotice,
  } = useConversations(Boolean(user));
  const {
    messages,
    attachments,
    sending,
    messagesError,
    addAttachment,
    removeAttachment,
    submitMessage,
  } = useConversationMessages({
    authenticated: Boolean(user),
    conversationId: activeConversationId,
    createConversation: createNewConversation,
    refreshConversations,
  });

  useEffect(() => {
    if (!conversationsNotice) {
      return;
    }

    const timer = window.setTimeout(() => {
      clearConversationsNotice();
    }, 2600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [clearConversationsNotice, conversationsNotice]);

  useEffect(() => {
    if (!pageNotice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPageNotice('');
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pageNotice]);

  useEffect(() => {
    if (!user || importedUserIdRef.current === user.id || !hasImportableGuestConversations()) {
      return;
    }

    let cancelled = false;
    importedUserIdRef.current = user.id;

    void (async () => {
      try {
        const guestConversations = exportGuestConversationsForImport();

        if (guestConversations.length === 0) {
          clearGuestConversations();
          return;
        }

        const result = await importGuestConversations(guestConversations);

        if (cancelled) {
          return;
        }

        clearGuestConversations();
        await refreshConversations();
        setPageNotice(
          result.importedCount > 0
            ? `已将 ${result.importedCount} 条访客对话导入当前账号。`
            : '访客记录已同步到当前账号。',
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setPageNotice(error instanceof Error ? error.message : '访客记录导入失败');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshConversations, user]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">加载中...</div>;
  }

  return (
    <div className="relative flex h-[100svh] max-w-full overflow-hidden bg-[#FDFBF7]">
      {authMode ? (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSubmit={authMode === 'login' ? loginUser : registerUser}
        />
      ) : null}

      <AnimatePresence>
        {isSidebarOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 z-20 bg-black/20"
              aria-label="关闭对话侧边栏遮罩"
            />
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 z-30 max-w-[88vw]"
            >
              <ConversationSidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                onCreate={() => {
                  void createNewConversation();
                }}
                onSelect={(conversationId) => {
                  setActiveConversationId(conversationId);
                  setIsSidebarOpen(false);
                }}
                onClose={() => setIsSidebarOpen(false)}
              />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 max-w-full flex-1 flex-col overflow-hidden">
        <header className="flex max-w-full flex-wrap items-center justify-between gap-3 overflow-hidden border-b border-[#DECFBE] bg-white/80 px-3 py-3 backdrop-blur md:flex-nowrap md:px-4">
          <div className="flex w-full min-w-0 max-w-full items-center gap-2 md:w-auto md:flex-1 md:gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((current) => !current)}
              className="rounded-full border border-[#DECFBE] bg-white p-2 text-[#362A1F] shadow-sm transition hover:bg-[#F8F2EA]"
              aria-label={isSidebarOpen ? '关闭侧边栏' : '打开侧边栏'}
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[#362A1F]">AI 循环助手</div>
              <div className="truncate text-xs text-[#7F6B58]">
                {user ? `已登录：${user.email}` : '游客模式可直接聊天，登录后会自动导入当前记录'}
              </div>
            </div>
            <Link
              to="/"
              className="ml-0 inline-flex shrink-0 items-center gap-1 rounded-full border border-[#DECFBE] bg-white px-3 py-2 text-sm text-[#362A1F] shadow-sm transition hover:bg-[#F8F2EA] md:ml-2 md:gap-2"
            >
              <House className="h-4 w-4" />
              <span className="hidden sm:inline">返回首页</span>
            </Link>
          </div>

          <div className="flex w-full min-w-0 items-center gap-2 md:ml-auto md:w-auto md:shrink-0 md:justify-end">
            {user ? (
              <>
                <span className="hidden rounded-full border border-[#DECFBE] bg-[#F8F2EA] px-3 py-2 text-xs text-[#7F6B58] md:inline-flex">
                  记录已绑定账号
                </span>
                <button
                  type="button"
                  onClick={() => void logoutUser()}
                  className="inline-flex items-center gap-2 rounded-full border border-[#DECFBE] bg-white px-3 py-2 text-sm text-[#362A1F] shadow-sm transition hover:bg-[#F8F2EA]"
                >
                  <LogOut className="h-4 w-4" />
                  退出
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="min-w-0 flex-1 rounded-full border border-[#DECFBE] bg-white px-3 py-2 text-sm text-[#362A1F] shadow-sm transition hover:bg-[#F8F2EA] md:w-auto md:flex-none md:px-4"
                >
                  登录
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#362A1F] px-3 py-2 text-sm text-white transition hover:bg-[#4A3A2D] md:w-auto md:flex-none md:gap-2 md:px-4"
                >
                  <UserRound className="hidden h-4 w-4 sm:block" />
                  注册
                </button>
              </>
            )}
          </div>
        </header>

        {pageNotice || conversationsNotice ? (
          <div className="border-b border-[#E8DACA] bg-[#FFF6EA] px-4 py-3 text-sm text-[#8D643E]">
            {pageNotice || conversationsNotice}
          </div>
        ) : null}

        <MessageList messages={messages} pageError={conversationsError || messagesError} />
        <ChatComposer
          sending={sending}
          attachments={attachments}
          uploadsEnabled={Boolean(user) && uploadsFeatureEnabled}
          uploadHelperText={
            user
              ? uploadsFeatureEnabled
                ? '支持上传文本、图片和语音。'
                : '当前部署环境先开放文本聊天，附件上传稍后再接入。'
              : '游客模式下先支持文本聊天，登录后可上传图片、文件和语音。'
          }
          onUpload={addAttachment}
          onRemoveAttachment={removeAttachment}
          onSubmit={submitMessage}
        />
      </div>
    </div>
  );
}
