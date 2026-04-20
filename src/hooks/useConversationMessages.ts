import { useEffect, useState } from 'react';
import { buildConversationTitle } from '../lib/chatTitle';
import {
  fetchMessages,
  requestGuestReply,
  sendMessage,
  uploadAttachment,
} from '../lib/chat';
import {
  getGuestConversationRecord,
  getGuestConversationMessages,
  upsertGuestConversationRecord,
} from '../lib/guestChat';
import type { Conversation, Message, PendingAttachment } from '../types/chat';

type UseConversationMessagesOptions = {
  authenticated: boolean;
  conversationId: string | null;
  createConversation: (options?: { quiet?: boolean }) => Promise<{
    conversation: Conversation;
    created: boolean;
    message?: string;
  }>;
  refreshConversations: () => Promise<void>;
};

function createOptimisticMessage(role: 'user' | 'assistant', content: string): Message {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    role,
    content,
    created_at: new Date().toISOString(),
    attachments: [],
  };
}

export function useConversationMessages({
  authenticated,
  conversationId,
  createConversation,
  refreshConversations,
}: UseConversationMessagesOptions) {
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({});
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!conversationId) {
      setError('');
      return;
    }

    if (!authenticated) {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: getGuestConversationMessages(conversationId),
      }));
      setError('');
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await fetchMessages(conversationId);
        if (cancelled) {
          return;
        }
        setMessagesByConversation((current) => ({
          ...current,
          [conversationId]: result.messages,
        }));
        setError('');
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : '加载消息失败');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authenticated, conversationId]);

  useEffect(() => {
    setAttachments([]);
  }, [authenticated, conversationId]);

  async function addAttachment(file: File) {
    if (!authenticated) {
      setError('登录后才能上传图片、文件和语音。');
      return;
    }

    const attachment = await uploadAttachment(file);
    setAttachments((current) => [...current, attachment]);
    setError('');
  }

  function removeAttachment(attachmentId: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  }

  async function submitMessage(content: string) {
    let targetConversationId = conversationId;

    if (!targetConversationId) {
      const result = await createConversation({ quiet: true });
      targetConversationId = result.conversation.id;
    }

    if (!targetConversationId) {
      throw new Error('新建对话失败');
    }

    let optimisticUserMessage: Message | null = null;
    let pendingAssistantMessage: Message | null = null;

    setSending(true);
    try {
      const currentAttachments = attachments;
      optimisticUserMessage = createOptimisticMessage('user', content);
      pendingAssistantMessage = createOptimisticMessage('assistant', 'AI 正在思考...');
      const currentMessages =
        messagesByConversation[targetConversationId] ??
        (authenticated ? [] : getGuestConversationMessages(targetConversationId));

      setMessagesByConversation((current) => ({
        ...current,
        [targetConversationId]: [...currentMessages, optimisticUserMessage, pendingAssistantMessage],
      }));

      if (authenticated) {
        const result = await sendMessage(targetConversationId, content, currentAttachments);

        setMessagesByConversation((current) => ({
          ...current,
          [targetConversationId]: [
            ...(current[targetConversationId] ?? []).filter(
              (message) =>
                message.id !== optimisticUserMessage.id && message.id !== pendingAssistantMessage.id,
            ),
            result.userMessage,
            result.assistantMessage,
          ],
        }));
      } else {
        const guestConversation = getGuestConversationRecord(targetConversationId);
        const result = await requestGuestReply(
          [...currentMessages, optimisticUserMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
        );
        const finalMessages = [...currentMessages, optimisticUserMessage, result.assistantMessage];
        const nextTitle =
          guestConversation?.title === '新对话' && currentMessages.length === 0
            ? buildConversationTitle(content)
            : guestConversation?.title ?? buildConversationTitle(content);

        setMessagesByConversation((current) => ({
          ...current,
          [targetConversationId]: finalMessages,
        }));

        upsertGuestConversationRecord({
          id: targetConversationId,
          title: nextTitle,
          created_at: guestConversation?.created_at ?? optimisticUserMessage.created_at,
          updated_at: result.assistantMessage.created_at,
          last_message_at: result.assistantMessage.created_at,
          messages: finalMessages,
        });
      }

      setAttachments([]);
      setError('');
      await refreshConversations();
    } catch (sendError) {
      if (optimisticUserMessage && pendingAssistantMessage) {
        setMessagesByConversation((current) => ({
          ...current,
          [targetConversationId]: (current[targetConversationId] ?? []).filter(
            (message) =>
              message.id !== optimisticUserMessage?.id && message.id !== pendingAssistantMessage?.id,
          ),
        }));
      }
      const nextError = sendError instanceof Error ? sendError : new Error('发送失败');
      setError(nextError.message);
      throw nextError;
    } finally {
      setSending(false);
    }
  }

  return {
    messages: conversationId ? messagesByConversation[conversationId] ?? [] : [],
    attachments,
    sending,
    messagesError: error,
    addAttachment,
    removeAttachment,
    submitMessage,
  };
}
