import { useCallback, useEffect, useRef, useState } from 'react';
import { createConversation, fetchConversations } from '../lib/chat';
import {
  createGuestConversationRecord,
  listGuestConversations,
  upsertGuestConversationRecord,
} from '../lib/guestChat';
import type { Conversation } from '../types/chat';

type CreateConversationOptions = {
  quiet?: boolean;
};

type CreateConversationResult = {
  conversation: Conversation;
  created: boolean;
  message?: string;
};

export function useConversations(authenticated: boolean) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const previousAuthenticatedRef = useRef(authenticated);
  const modeChanged = previousAuthenticatedRef.current !== authenticated;

  const refreshConversations = useCallback(async () => {
    if (!authenticated) {
      const guestConversations = listGuestConversations();

      setConversations(guestConversations);
      setActiveConversationId((current) =>
        guestConversations.some((conversation) => conversation.id === current)
          ? current
          : guestConversations[0]?.id ?? null,
      );
      setError('');
      return;
    }

    const result = await fetchConversations();
    setConversations(result.conversations);
    setActiveConversationId((current) =>
      result.conversations.some((conversation) => conversation.id === current)
        ? current
        : result.conversations[0]?.id ?? null,
    );
    setError('');
  }, [authenticated]);

  useEffect(() => {
    setConversations([]);
    setActiveConversationId(null);
    setError('');
    setNotice('');
  }, [authenticated]);

  useEffect(() => {
    previousAuthenticatedRef.current = authenticated;
  }, [authenticated]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await refreshConversations();
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : '加载对话失败');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshConversations]);

  async function createNewConversation(options: CreateConversationOptions = {}): Promise<CreateConversationResult> {
    const existingBlankConversation = conversations.find(
      (conversation) => conversation.title === '新对话' && !conversation.last_message_at,
    );

    if (existingBlankConversation) {
      setActiveConversationId(existingBlankConversation.id);
      if (!options.quiet) {
        setNotice('当前已经有一个空白新对话了，已为你切换过去。');
      }

      return {
        conversation: existingBlankConversation,
        created: false,
        message: '当前已经有一个空白新对话了，已为你切换过去。',
      };
    }

    if (!authenticated) {
      const guestConversation = createGuestConversationRecord();
      upsertGuestConversationRecord(guestConversation);

      setConversations((current) => [guestConversation, ...current]);
      setActiveConversationId(guestConversation.id);

      return {
        conversation: guestConversation,
        created: true,
      };
    }

    const result = await createConversation();
    const created = result.created ?? true;
    const feedback = result.message ?? '';

    setConversations((current) => [
      result.conversation,
      ...current.filter((conversation) => conversation.id !== result.conversation.id),
    ]);
    setActiveConversationId(result.conversation.id);

    if (!created && feedback && !options.quiet) {
      setNotice(feedback);
    }

    return {
      conversation: result.conversation,
      created,
      message: feedback || undefined,
    };
  }

  return {
    conversations: modeChanged ? [] : conversations,
    activeConversationId: modeChanged ? null : activeConversationId,
    setActiveConversationId,
    createNewConversation,
    refreshConversations,
    conversationsError: error,
    conversationsNotice: notice,
    clearConversationsNotice: () => setNotice(''),
  };
}
