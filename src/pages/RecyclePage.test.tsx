import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RecyclePage from './RecyclePage';

vi.mock('../components/RecycleMapModal', () => ({
  default: () => <div data-testid="map-modal" />,
}));

describe('RecyclePage location permission', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
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
});
