import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createMessageMock, touchConversationAtMock } = vi.hoisted(() => ({
  createMessageMock: vi.fn(async () => ({
    id: 'message-1',
    conversation_id: 'conversation-1',
    role: 'user',
    content: '你好',
    created_at: new Date().toISOString(),
  })),
  touchConversationAtMock: vi.fn(async () => undefined),
}));

const sessionsState = new Map<string, string>();
const conversationsState = new Map<
  string,
  {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
    last_message_at: string | null;
  }
>();
let conversationCounter = 0;

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
    createConversation: vi.fn(async (userId: string, title = '新对话') => {
      conversationCounter += 1;
      const timestamp = new Date().toISOString();
      const conversation = {
        id: `conversation-${conversationCounter}`,
        user_id: userId,
        title,
        created_at: timestamp,
        updated_at: timestamp,
        last_message_at: null,
      };

      conversationsState.set(conversation.id, conversation);
      return conversation;
    }),
    listConversations: vi.fn(async (userId: string) =>
      [...conversationsState.values()].filter((conversation) => conversation.user_id === userId),
    ),
    findBlankConversation: vi.fn(async (userId: string) =>
      [...conversationsState.values()].find(
        (conversation) =>
          conversation.user_id === userId &&
          conversation.title === '新对话' &&
          conversation.last_message_at === null,
      ) ?? null,
    ),
    findConversationById: vi.fn(async (id: string) => conversationsState.get(id) ?? null),
    touchConversationAt: touchConversationAtMock,
  };
});

vi.mock('../repositories/messages', () => ({
  createMessage: createMessageMock,
}));

import { COOKIE_NAME } from '../lib/session';
import { createApp } from '../app';

describe('conversation routes', () => {
  beforeEach(() => {
    sessionsState.clear();
    conversationsState.clear();
    conversationCounter = 0;
    createMessageMock.mockClear();
    touchConversationAtMock.mockClear();
    vi.clearAllMocks();
  });

  it('rejects unauthenticated conversation listing', async () => {
    const app = createApp();
    const response = await request(app).get('/api/conversations');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  it('lists and creates conversations for the authenticated user only', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');
    sessionsState.set('session-user-2', 'user-2');

    conversationsState.set('conversation-seed-1', {
      id: 'conversation-seed-1',
      user_id: 'user-1',
      title: '我的对话',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: null,
    });
    conversationsState.set('conversation-seed-2', {
      id: 'conversation-seed-2',
      user_id: 'user-2',
      title: '别人的对话',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: null,
    });

    const listResponse = await request(app)
      .get('/api/conversations')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.conversations).toHaveLength(1);
    expect(listResponse.body.conversations[0].id).toBe('conversation-seed-1');

    const createResponse = await request(app)
      .post('/api/conversations')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .send({});

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.conversation.user_id).toBe('user-1');

    const detailResponse = await request(app)
      .get(`/api/conversations/${createResponse.body.conversation.id}`)
      .set('Cookie', `${COOKIE_NAME}=session-user-1`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.conversation.id).toBe(createResponse.body.conversation.id);
  });

  it('reuses the existing blank conversation instead of creating duplicates', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');
    conversationsState.set('conversation-seed-blank', {
      id: 'conversation-seed-blank',
      user_id: 'user-1',
      title: '新对话',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: null,
    });

    const response = await request(app)
      .post('/api/conversations')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.created).toBe(false);
    expect(response.body.conversation.id).toBe('conversation-seed-blank');
    expect(response.body.message).toContain('空白新对话');
  });

  it('imports guest conversations into the authenticated account', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');

    const response = await request(app)
      .post('/api/conversations/import')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`)
      .send({
        conversations: [
          {
            title: '新对话',
            messages: [
              {
                role: 'user',
                content: '我有一袋旧衣服要怎么处理？',
                created_at: '2026-04-20T07:00:00.000Z',
              },
              {
                role: 'assistant',
                content: '可以先查看附近回收点。',
                created_at: '2026-04-20T07:00:10.000Z',
              },
            ],
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.importedCount).toBe(1);
    expect(createMessageMock).toHaveBeenCalledTimes(2);
    expect(touchConversationAtMock).toHaveBeenCalledTimes(1);
  });

  it('hides conversations owned by other users', async () => {
    const app = createApp();
    sessionsState.set('session-user-1', 'user-1');
    conversationsState.set('conversation-other', {
      id: 'conversation-other',
      user_id: 'user-2',
      title: '他人的对话',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: null,
    });

    const response = await request(app)
      .get('/api/conversations/conversation-other')
      .set('Cookie', `${COOKIE_NAME}=session-user-1`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Conversation not found' });
  });
});
