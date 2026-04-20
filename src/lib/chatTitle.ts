export function buildConversationTitle(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return '新对话';
  }

  return trimmed.length > 20 ? `${trimmed.slice(0, 20)}…` : trimmed;
}
