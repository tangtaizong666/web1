import type { Conversation, Message } from '../types/chat';

const GUEST_CHAT_STORAGE_KEY = 'campus-cycle-guest-chat-v1';

export type GuestConversationRecord = Conversation & {
  messages: Message[];
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function sortConversations(conversations: GuestConversationRecord[]) {
  return [...conversations].sort((left, right) => {
    const leftTimestamp = left.last_message_at ?? left.created_at;
    const rightTimestamp = right.last_message_at ?? right.created_at;

    return new Date(rightTimestamp).getTime() - new Date(leftTimestamp).getTime();
  });
}

function fallbackId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return fallbackId(prefix);
}

export function readGuestConversationRecords() {
  if (!canUseStorage()) {
    return [] as GuestConversationRecord[];
  }

  const rawValue = window.localStorage.getItem(GUEST_CHAT_STORAGE_KEY);

  if (!rawValue) {
    return [] as GuestConversationRecord[];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [] as GuestConversationRecord[];
    }

    return sortConversations(parsedValue as GuestConversationRecord[]);
  } catch {
    return [] as GuestConversationRecord[];
  }
}

export function writeGuestConversationRecords(conversations: GuestConversationRecord[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(GUEST_CHAT_STORAGE_KEY, JSON.stringify(sortConversations(conversations)));
}

export function upsertGuestConversationRecord(conversation: GuestConversationRecord) {
  const currentRecords = readGuestConversationRecords();
  const nextRecords = currentRecords.filter((currentConversation) => currentConversation.id !== conversation.id);

  writeGuestConversationRecords([conversation, ...nextRecords]);
}

export function listGuestConversations() {
  return readGuestConversationRecords().map(({ messages, ...conversation }) => conversation);
}

export function getGuestConversationRecord(conversationId: string) {
  return readGuestConversationRecords().find((conversation) => conversation.id === conversationId) ?? null;
}

export function getGuestConversationMessages(conversationId: string) {
  return getGuestConversationRecord(conversationId)?.messages ?? [];
}

export function createGuestConversationRecord(title = '新对话') {
  const timestamp = new Date().toISOString();

  return {
    id: createId('guest-conversation'),
    title,
    created_at: timestamp,
    updated_at: timestamp,
    last_message_at: null,
    messages: [],
  } satisfies GuestConversationRecord;
}

export function hasImportableGuestConversations() {
  return readGuestConversationRecords().some((conversation) => conversation.messages.length > 0);
}

export function exportGuestConversationsForImport() {
  return readGuestConversationRecords()
    .filter((conversation) => conversation.messages.length > 0)
    .map((conversation) => ({
      title: conversation.title,
      messages: conversation.messages.map((message) => ({
        role: message.role,
        content: message.content,
        created_at: message.created_at,
      })),
    }));
}

export function clearGuestConversations() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(GUEST_CHAT_STORAGE_KEY);
}
