import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Hero from './Hero';

describe('Hero', () => {
  it('renders a poster image before loading the background video player', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img', { name: 'Campus Cycle hero poster' })).toBeTruthy();
    expect(document.querySelector('mux-player')).toBeNull();
  });

  it('loads the background video player only after the poster has loaded', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );

    fireEvent.load(screen.getByRole('img', { name: 'Campus Cycle hero poster' }));

    const video = document.querySelector('mux-player');
    expect(video).toBeTruthy();
    expect(video?.getAttribute('playback-id')).toBe('VPgqHsW01gQWsfKJcgItYfkeyYYIvJ4DubLbEChs8Tsg');
    expect(video?.getAttribute('autoplay')).toBe('muted');
    expect(video?.hasAttribute('muted')).toBe(true);
    expect(video?.hasAttribute('loop')).toBe(true);
    expect(video?.hasAttribute('playsinline')).toBe(true);
  });

  it('fades out the poster once the video is playing to avoid ghosting', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );

    const poster = screen.getByRole('img', { name: 'Campus Cycle hero poster' });
    expect(poster.className).toContain('opacity-75');

    fireEvent.load(poster);

    const video = document.querySelector('mux-player');
    expect(video).toBeTruthy();
    expect(video?.className).toContain('opacity-0');

    fireEvent(video!, new Event('playing'));

    expect(poster.className).toContain('opacity-0');
    expect(video?.className).toContain('opacity-80');
  });

  it('notifies the page when the poster has loaded', () => {
    const handlePosterReady = vi.fn();

    render(
      <MemoryRouter>
        <Hero onPosterReady={handlePosterReady} />
      </MemoryRouter>,
    );

    fireEvent.load(screen.getByRole('img', { name: 'Campus Cycle hero poster' }));

    expect(handlePosterReady).toHaveBeenCalledTimes(1);
  });

  it('waits for the video playing event before notifying that the hero is ready', () => {
    const handleHeroReady = vi.fn();

    render(
      <MemoryRouter>
        <Hero onHeroReady={handleHeroReady} />
      </MemoryRouter>,
    );

    fireEvent.load(screen.getByRole('img', { name: 'Campus Cycle hero poster' }));

    expect(handleHeroReady).not.toHaveBeenCalled();

    const video = document.querySelector('mux-player');
    expect(video).toBeTruthy();

    fireEvent(video!, new Event('playing'));

    expect(handleHeroReady).toHaveBeenCalledTimes(1);
  });

  it('also waits for the video playing event on mobile', () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    const handleHeroReady = vi.fn();

    render(
      <MemoryRouter>
        <Hero onHeroReady={handleHeroReady} />
      </MemoryRouter>,
    );

    fireEvent.load(screen.getByRole('img', { name: 'Campus Cycle hero poster' }));

    const video = document.querySelector('mux-player');
    expect(video).toBeTruthy();
    expect(handleHeroReady).not.toHaveBeenCalled();

    fireEvent(video!, new Event('playing'));

    expect(handleHeroReady).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
  });
});
