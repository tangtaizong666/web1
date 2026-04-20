import { describe, expect, it } from 'vitest';
import { buildConversationTitle } from '../repositories/conversations';

describe('buildConversationTitle', () => {
  it('trims long prompts for default titles', () => {
    expect(buildConversationTitle('这是一个很长很长的首条消息，用于验证标题只截取前二十个字符')).toBe(
      '这是一个很长很长的首条消息，用于验证标题…',
    );
  });

  it('falls back to a default title for blank input', () => {
    expect(buildConversationTitle('   ')).toBe('新对话');
  });
});
