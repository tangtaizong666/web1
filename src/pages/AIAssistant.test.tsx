import { StrictMode } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AIAssistant from './AIAssistant';

const useAuthMock = vi.fn();
const useConversationsMock = vi.fn();
const useConversationMessagesMock = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../hooks/useConversations', () => ({
  useConversations: (authenticated: boolean) => useConversationsMock(authenticated),
}));

vi.mock('../hooks/useConversationMessages', () => ({
  useConversationMessages: (options: unknown) => useConversationMessagesMock(options),
}));

vi.mock('../lib/guestChat', () => ({
  clearGuestConversations: vi.fn(),
  exportGuestConversationsForImport: vi.fn(() => []),
  hasImportableGuestConversations: vi.fn(() => false),
}));

vi.mock('../lib/chat', () => ({
  importGuestConversations: vi.fn(async () => ({ importedCount: 0 })),
}));

describe('AIAssistant', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: false,
      loginUser: vi.fn(),
      registerUser: vi.fn(),
      logoutUser: vi.fn(),
    });
    useConversationsMock.mockReturnValue({
      conversations: [],
      activeConversationId: null,
      setActiveConversationId: vi.fn(),
      createNewConversation: vi.fn(),
      refreshConversations: vi.fn(async () => undefined),
      conversationsError: '',
      conversationsNotice: '',
      clearConversationsNotice: vi.fn(),
    });
    useConversationMessagesMock.mockReturnValue({
      messages: [],
      attachments: [],
      sending: false,
      messagesError: '',
      addAttachment: vi.fn(),
      removeAttachment: vi.fn(),
      submitMessage: vi.fn(async () => undefined),
    });
  });

  it('renders guest mode instead of blocking the page when no user is present', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <MemoryRouter>
            <AIAssistant />
          </MemoryRouter>
        </StrictMode>,
      );
    });

    expect(container.textContent).toContain('游客模式可直接聊天');
    expect(container.textContent).toContain('登录');
    expect(container.textContent).toContain('注册');
    expect(container.textContent).toContain('返回首页');
    expect(container.textContent).toContain('游客模式下先支持文本聊天');

    root.unmount();
    container.remove();
  });

  it('keeps the sidebar closed by default and opens it from the toggle button', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      isLoading: false,
      loginUser: vi.fn(),
      registerUser: vi.fn(),
      logoutUser: vi.fn(),
    });
    useConversationsMock.mockReturnValue({
      conversations: [
        {
          id: 'conversation-1',
          title: '旧衣建议',
          created_at: '',
          updated_at: '',
          last_message_at: null,
        },
      ],
      activeConversationId: 'conversation-1',
      setActiveConversationId: vi.fn(),
      createNewConversation: vi.fn(),
      refreshConversations: vi.fn(async () => undefined),
      conversationsError: '',
      conversationsNotice: '',
      clearConversationsNotice: vi.fn(),
    });
    useConversationMessagesMock.mockReturnValue({
      messages: [{ id: 'message-1', role: 'assistant', content: '你好', created_at: '', attachments: [] }],
      attachments: [],
      sending: false,
      messagesError: '',
      addAttachment: vi.fn(),
      removeAttachment: vi.fn(),
      submitMessage: vi.fn(async () => undefined),
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <MemoryRouter>
            <AIAssistant />
          </MemoryRouter>
        </StrictMode>,
      );
    });

    expect(container.textContent).not.toContain('对话列表');
    expect(container.textContent).toContain('你好');

    const toggleButton = container.querySelector('button[aria-label="打开侧边栏"]');
    expect(toggleButton).toBeTruthy();

    await act(async () => {
      toggleButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('对话列表');
    expect(container.textContent).toContain('旧衣建议');

    root.unmount();
    container.remove();
  });
});
