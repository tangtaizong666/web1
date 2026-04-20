import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAttachmentToken } from '../lib/uploads';

const {
  sessionsState,
  conversationsState,
  messagesState,
  attachmentsState,
  buildRelayUserContentMock,
  generateAssistantReplyMock,
  listAttachmentsByMessageIdsMock,
} = vi.hoisted(() => ({
  sessionsState: new Map<string, string>(),
  conversationsState: new Map<
    string,
    {
      id: string;
      user_id: string;
      title: string;
      created_at: string;
      updated_at: string;
      last_message_at: string | null;
    }
  >(),
  messagesState: new Map<
    string,
    Array<{
      id: string;
      conversation_id: string;
      role: 'user' | 'assistant';
      content: string;
      created_at: string;
    }>
  >(),
  attachmentsState: [] as Array<{
    id?: string;
    message_id: string;
    kind: 'image' | 'file' | 'audio';
    original_name: string;
    mime_type: string;
    size_bytes: number;
    storage_path: string;
    extracted_text: string | null;
    created_at?: string;
  }>,
  buildRelayUserContentMock: vi.fn(async (content: string) => content as RelayMessage['content']),
  generateAssistantReplyMock: vi.fn(async () => '这是 AI 回复'),
  listAttachmentsByMessageIdsMock: vi.fn(async (messageIds: string[]) =>
    attachmentsState.filter((attachment) => messageIds.includes(attachment.message_id)),
  ),
}));
let messageCounter = 0;

vi.mock('../lib/session', async () => {
  const actual = await vi.importActual<typeof import('../lib/session')>('../lib/session');

  return {
    ...actual,
    getSessionUserId: vi.fn(async (sessionId: string) => sessionsState.get(sessionId) ?? null),
  };
});

vi.mock('../repositories/conversations', async () => {
  const actual = await vi.importActual<typeof import('../repositories/conversations')>(
    '../repositories/conversations',
  );

  return {
    ...actual,
    findConversationById: vi.fn(async (id: string) => conversationsState.get(id) ?? null),
    updateConversationTitle: vi.fn(async (id: string, title: string) => {
      const conversation = conversationsState.get(id);
      if (!conversation) {
        return null;
      }

      const updated = {
        ...conversation,
        title,
        updated_at: new Date().toISOString(),
      };
      conversationsState.set(id, updated);
      return updated;
    }),
    touchConversation: vi.fn(async (id: string) => {
      const conversation = conversationsState.get(id);
      if (!conversation) {
        return;
      }

      conversationsState.set(id, {
        ...conversation,
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      });
    }),
  };
});

vi.mock('../repositories/messages', () => ({
  listMessages: vi.fn(async (conversationId: string) => messagesState.get(conversationId) ?? []),
  createMessage: vi.fn(async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    messageCounter += 1;
    const message = {
      id: `message-${messageCounter}`,
      conversation_id: conversationId,
      role,
      content,
      created_at: new Date().toISOString(),
    };

    const current = messagesState.get(conversationId) ?? [];
    messagesState.set(conversationId, [...current, message]);
    return message;
  }),
}));

vi.mock('../repositories/attachments', () => ({
  createAttachment: vi.fn(
    async (
      messageId: string,
      kind: 'image' | 'file' | 'audio',
      originalName: string,
      mimeType: string,
      sizeBytes: number,
      storagePath: string,
      extractedText: string | null,
    ) => {
      const attachment = {
        id: `attachment-${attachmentsState.length + 1}`,
        message_id: messageId,
        kind,
        original_name: originalName,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        storage_path: storagePath,
        extracted_text: extractedText,
        created_at: new Date().toISOString(),
      };
      attachmentsState.push(attachment);
      return attachment;
    },
  ),
  listAttachmentsByMessageIds: listAttachmentsByMessageIdsMock,
}));

vi.mock('../lib/relayClient', () => ({
  buildRelayUserContent: buildRelayUserContentMock,
  generateAssistantReply: generateAssistantReplyMock,
}));

import { COOKIE_NAME } from '../lib/session';
import type { RelayMessage } from '../lib/relayClient';
import { createApp } from '../app';

function buildAttachmentToken(
  userId: string,
  overrides: Partial<{
    kind: 'image' | 'file' | 'audio';
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storagePath: string;
    extractedText: string | null;
  }> = {},
) {
  return createAttachmentToken({
    userId,
    kind: overrides.kind ?? 'audio',
    originalName: overrides.originalName ?? 'voice.webm',
    mimeType: overrides.mimeType ?? 'audio/webm',
    sizeBytes: overrides.sizeBytes ?? 128,
    storagePath: overrides.storagePath ?? 'uploads/voice.webm',
    extractedText:
      'extractedText' in overrides ? (overrides.extractedText ?? null) : '这是语音转写',
  });
}

describe('message routes', () => {
  beforeEach(() => {
    sessionsState.clear();
    conversationsState.clear();
    messagesState.clear();
    attachmentsState.length = 0;
    messageCounter = 0;
    buildRelayUserContentMock.mockClear();
    buildRelayUserContentMock.mockImplementation(async (content: string) => content as RelayMessage['content']);
    generateAssistantReplyMock.mockClear();
    generateAssistantReplyMock.mockImplementation(async () => '这是 AI 回复');
    listAttachmentsByMessageIdsMock.mockClear();
    vi.clearAllMocks();
  });

  it('rejects unauthenticated message posting', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/conversations/conversation-id/messages')
      .send({ content: '你好' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('lists conversation messages with attachment metadata for the owner', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');
    conversationsState.set('conversation-1', {
      id: 'conversation-1',
      user_id: 'user-1',
      title: '旧衣咨询',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: null,
    });
    messagesState.set('conversation-1', [
      {
        id: 'message-seed-1',
        conversation_id: 'conversation-1',
        role: 'user',
        content: '如何回收',
        created_at: new Date().toISOString(),
      },
    ]);
    attachmentsState.push({
      id: 'attachment-seed-1',
      message_id: 'message-seed-1',
      kind: 'image',
      original_name: 'photo.png',
      mime_type: 'image/png',
      size_bytes: 123,
      storage_path: 'uploads/photo.png',
      extracted_text: null,
      created_at: new Date().toISOString(),
    });

    const response = await request(app)
      .get('/api/conversations/conversation-1/messages')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`);

    expect(response.status).toBe(200);
    expect(response.body.messages).toHaveLength(1);
    expect(response.body.messages[0].content).toBe('如何回收');
    expect(response.body.messages[0].attachments).toEqual([
      {
        id: 'attachment-seed-1',
        kind: 'image',
        originalName: 'photo.png',
        mimeType: 'image/png',
        sizeBytes: 123,
        storagePath: 'uploads/photo.png',
        extractedText: null,
        created_at: expect.any(String),
      },
    ]);
  });

  it('stores both user and assistant messages, returns verified attachments, and updates the initial title', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');
    conversationsState.set('conversation-1', {
      id: 'conversation-1',
      user_id: 'user-1',
      title: '新对话',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: null,
    });

    const response = await request(app)
      .post('/api/conversations/conversation-1/messages')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .send({
        content: '请帮我规划旧衣投递',
        attachments: [{ token: buildAttachmentToken('user-1') }],
      });

    expect(response.status).toBe(201);
    expect(response.body.userMessage.role).toBe('user');
    expect(response.body.userMessage.content).toBe('请帮我规划旧衣投递');
    expect(response.body.userMessage.attachments).toEqual([
      {
        id: 'uploads/voice.webm',
        kind: 'audio',
        originalName: 'voice.webm',
        mimeType: 'audio/webm',
        sizeBytes: 128,
        storagePath: 'uploads/voice.webm',
        extractedText: '这是语音转写',
        created_at: undefined,
      },
    ]);
    expect(response.body.assistantMessage.role).toBe('assistant');
    expect(response.body.assistantMessage.content).toBe('这是 AI 回复');
    expect(response.body.assistantMessage.attachments).toEqual([]);
    expect(conversationsState.get('conversation-1')?.title).toBe('请帮我规划旧衣投递');
    expect(messagesState.get('conversation-1')).toHaveLength(2);
    expect(attachmentsState).toEqual([
      {
        id: 'attachment-1',
        message_id: 'message-1',
        kind: 'audio',
        original_name: 'voice.webm',
        mime_type: 'audio/webm',
        size_bytes: 128,
        storage_path: 'uploads/voice.webm',
        extracted_text: '这是语音转写',
        created_at: expect.any(String),
      },
    ]);
  });

  it('uses structured relay content for image attachments', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');
    conversationsState.set('conversation-1', {
      id: 'conversation-1',
      user_id: 'user-1',
      title: '旧衣识别',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: null,
    });
    buildRelayUserContentMock.mockResolvedValueOnce([
      { type: 'text', text: '看看这张图片' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,ZmFrZQ==' } },
    ]);

    const response = await request(app)
      .post('/api/conversations/conversation-1/messages')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .send({
        content: '看看这张图片',
        attachments: [
          {
            token: buildAttachmentToken('user-1', {
              kind: 'image',
              originalName: 'photo.png',
              mimeType: 'image/png',
              sizeBytes: 64,
              storagePath: 'uploads/photo.png',
              extractedText: null,
            }),
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(buildRelayUserContentMock).toHaveBeenCalledWith('看看这张图片', [
      {
        id: 'uploads/photo.png',
        kind: 'image',
        originalName: 'photo.png',
        mimeType: 'image/png',
        sizeBytes: 64,
        storagePath: 'uploads/photo.png',
        extractedText: null,
        created_at: undefined,
      },
    ]);
    expect(generateAssistantReplyMock).toHaveBeenCalledWith([
      {
        role: 'system',
        content: '你是校园旧衣循环平台的 AI 助手，回答应简洁、友好、对环保主题有帮助。',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: '看看这张图片' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,ZmFrZQ==' } },
        ],
      },
    ]);
  });

  it('allows audio attachments to supply the saved user message content', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');
    conversationsState.set('conversation-1', {
      id: 'conversation-1',
      user_id: 'user-1',
      title: '新对话',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: null,
    });

    const response = await request(app)
      .post('/api/conversations/conversation-1/messages')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .send({
        content: '',
        attachments: [
          {
            token: buildAttachmentToken('user-1', { extractedText: '这是语音转写内容' }),
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.userMessage.content).toBe('这是语音转写内容');
    expect(buildRelayUserContentMock).toHaveBeenCalledWith('这是语音转写内容', [
      {
        id: 'uploads/voice.webm',
        kind: 'audio',
        originalName: 'voice.webm',
        mimeType: 'audio/webm',
        sizeBytes: 128,
        storagePath: 'uploads/voice.webm',
        extractedText: '这是语音转写内容',
        created_at: undefined,
      },
    ]);
    expect(conversationsState.get('conversation-1')?.title).toBe('这是语音转写内容');
  });

  it('rejects forged attachment tokens', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');
    conversationsState.set('conversation-1', {
      id: 'conversation-1',
      user_id: 'user-1',
      title: '新对话',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: null,
    });

    const validToken = buildAttachmentToken('user-1');
    const forgedToken = `${validToken.slice(0, -1)}x`;

    const response = await request(app)
      .post('/api/conversations/conversation-1/messages')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .send({
        content: '请处理附件',
        attachments: [{ token: forgedToken }],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid attachment token' });
    expect(attachmentsState).toEqual([]);
  });

  it('does not trust tampered client attachment metadata when token is valid', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');
    conversationsState.set('conversation-1', {
      id: 'conversation-1',
      user_id: 'user-1',
      title: '新对话',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: null,
    });

    const response = await request(app)
      .post('/api/conversations/conversation-1/messages')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .send({
        content: '请处理附件',
        attachments: [
          {
            token: buildAttachmentToken('user-1', {
              kind: 'image',
              originalName: 'trusted.png',
              mimeType: 'image/png',
              sizeBytes: 77,
              storagePath: 'uploads/trusted.png',
              extractedText: null,
            }),
            kind: 'file',
            originalName: 'evil.txt',
            mimeType: 'text/plain',
            sizeBytes: 999,
            storagePath: '../../etc/passwd',
            extractedText: 'tampered',
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.userMessage.attachments).toEqual([
      {
        id: 'uploads/trusted.png',
        kind: 'image',
        originalName: 'trusted.png',
        mimeType: 'image/png',
        sizeBytes: 77,
        storagePath: 'uploads/trusted.png',
        extractedText: null,
        created_at: undefined,
      },
    ]);
    expect(attachmentsState).toEqual([
      {
        id: 'attachment-1',
        message_id: 'message-1',
        kind: 'image',
        original_name: 'trusted.png',
        mime_type: 'image/png',
        size_bytes: 77,
        storage_path: 'uploads/trusted.png',
        extracted_text: null,
        created_at: expect.any(String),
      },
    ]);
  });

  it('returns 404 when accessing another user\'s conversation', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');
    conversationsState.set('conversation-2', {
      id: 'conversation-2',
      user_id: 'user-2',
      title: '别人的会话',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: null,
    });

    const response = await request(app)
      .post('/api/conversations/conversation-2/messages')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .send({ content: '你好' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Conversation not found' });
  });
});
