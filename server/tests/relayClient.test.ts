import { afterEach, describe, expect, it, vi } from 'vitest';

const { readStoredFileMock } = vi.hoisted(() => ({
  readStoredFileMock: vi.fn(),
}));

vi.mock('../lib/storage', () => ({
  readStoredFile: readStoredFileMock,
}));

import { buildRelayUserContent, generateAssistantReply } from '../lib/relayClient';

describe('buildRelayUserContent', () => {
  afterEach(() => {
    readStoredFileMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('returns structured image-capable relay content for image attachments', async () => {
    readStoredFileMock.mockResolvedValueOnce(Buffer.from('fake-image'));

    const content = await buildRelayUserContent('请分析这张图片', [
      {
        kind: 'image',
        mimeType: 'image/png',
        storagePath: 'uploads/photo.png',
        extractedText: null,
        originalName: 'photo.png',
      },
    ]);

    expect(content).toEqual([
      {
        type: 'text',
        text: '请分析这张图片',
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${Buffer.from('fake-image').toString('base64')}`,
        },
      },
    ]);
  });

  it('includes extracted plain text for file attachments', async () => {
    const content = await buildRelayUserContent('请总结附件', [
      {
        kind: 'file',
        mimeType: 'text/plain',
        storagePath: 'uploads/note.txt',
        extractedText: '旧衣回收时间为每周三',
        originalName: 'note.txt',
      },
    ]);

    expect(content).toBe('请总结附件\n\n附件文本（note.txt）:\n旧衣回收时间为每周三');
  });

  it('falls back to a local reply when the relay is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    );

    const content = await generateAssistantReply([
      {
        role: 'system',
        content: '你是校园旧衣循环平台的 AI 助手。',
      },
      {
        role: 'user',
        content: '你好',
      },
    ]);

    expect(content).toContain('当前智能服务暂时未连接');
  });
});
