import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthModal } from './AuthModal';

describe('AuthModal', () => {
  it('submits email and password for login', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<AuthModal mode="login" onClose={onClose} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ email: 'a@example.com', password: 'password123' });
    });
    expect(onClose).toHaveBeenCalled();
  });
});
