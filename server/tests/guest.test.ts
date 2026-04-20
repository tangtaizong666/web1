import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

const { generateAssistantReplyMock } = vi.hoisted(() => ({
  generateAssistantReplyMock: vi.fn(async () => '这是访客模式回复'),
}));

vi.mock('../lib/relayClient', () => ({
  generateAssistantReply: generateAssistantReplyMock,
}));

import { createApp } from '../app';

describe('guest chat routes', () => {
  it('allows unauthenticated users to request an AI reply', async () => {
    const app = createApp();

    const response = await request(app).post('/api/guest/messages').send({
      messages: [
        { role: 'user', content: '你好' },
      ],
    });

    expect(response.status).toBe(201);
    expect(response.body.assistantMessage.content).toBe('这是访客模式回复');
    expect(generateAssistantReplyMock).toHaveBeenCalledTimes(1);
  });

  it('rejects guest payloads whose latest message is not from the user', async () => {
    const app = createApp();

    const response = await request(app).post('/api/guest/messages').send({
      messages: [
        { role: 'assistant', content: '我先说话' },
      ],
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Last message must come from the user' });
  });
});
