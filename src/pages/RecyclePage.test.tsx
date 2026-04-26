import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RecyclePage from './RecyclePage';

vi.mock('../components/RecycleMapModal', () => ({
  default: () => <div data-testid="map-modal" />,
}));

describe('RecyclePage location and map behavior', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    vi.restoreAllMocks();
  });

  it('shows a permission dialog before requesting the device location', () => {
    const getCurrentPosition = vi.fn();
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(
      <MemoryRouter>
        <RecyclePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('申请自动定位'));

    expect(screen.getByRole('dialog', { name: '定位权限申请' })).toBeTruthy();
    expect(screen.getByText('允许定位')).toBeTruthy();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('opens the map immediately while external location search is still pending', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}) as Promise<Response>);

    render(
      <MemoryRouter>
        <RecyclePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('输入小区或街道名称...'), {
      target: { value: '深圳大学' },
    });
    fireEvent.click(screen.getByRole('button', { name: '搜索位置' }));

    expect(screen.getByTestId('map-modal')).toBeTruthy();
  });

  it('offers a manual map fallback when browser location is blocked by http', () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new URL('http://chuangxingdasai.asia/recycle'),
    });

    const getCurrentPosition = vi.fn();
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(
      <MemoryRouter>
        <RecyclePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('申请自动定位'));
    fireEvent.click(screen.getByRole('button', { name: '打开地图手动输入' }));

    expect(screen.getByTestId('map-modal')).toBeTruthy();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
});
