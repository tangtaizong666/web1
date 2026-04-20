import { apiRequest, buildApiUrl } from './api';
import type { Conversation, Message, PendingAttachment } from '../types/chat';

type CreateConversationResponse = {
  conversation: Conversation;
  created?: boolean;
  message?: string;
};

type GuestConversationImport = {
  title: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }>;
};

export function fetchConversations() {
  return apiRequest<{ conversations: Conversation[] }>('/api/conversations');
}

export function createConversation() {
  return apiRequest<CreateConversationResponse>('/api/conversations', { method: 'POST' });
}

export function fetchMessages(conversationId: string) {
  return apiRequest<{ messages: Message[] }>(`/api/conversations/${conversationId}/messages`);
}

export function sendMessage(conversationId: string, content: string, attachments: PendingAttachment[]) {
  return apiRequest<{ userMessage: Message; assistantMessage: Message }>(
    `/api/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({
        content,
        attachments: attachments.map((attachment) => ({ token: attachment.token })),
      }),
    },
  );
}

export async function uploadAttachment(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(buildApiUrl('/api/uploads'), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(data.error ?? 'Upload failed');
  }

  const data = (await response.json()) as { attachment: PendingAttachment };
  return data.attachment;
}

export function requestGuestReply(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  return apiRequest<{ assistantMessage: Message }>('/api/guest/messages', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
}

export function importGuestConversations(conversations: GuestConversationImport[]) {
  return apiRequest<{ importedCount: number }>('/api/conversations/import', {
    method: 'POST',
    body: JSON.stringify({ conversations }),
  });
}
