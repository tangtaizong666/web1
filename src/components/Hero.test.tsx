import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Hero from './Hero';

function queryVideo() {
  return document.querySelector('video');
}

describe('Hero', () => {
  it('renders the poster and starts loading the local background video immediately', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img', { name: 'Campus Cycle hero poster' })).toBeTruthy();

    const video = queryVideo();
    expect(video).toBeTruthy();
    expect(video?.getAttribute('src')).toBe('/videos/hero.mp4');
    expect(video?.hasAttribute('autoplay')).toBe(true);
    expect(video?.hasAttribute('loop')).toBe(true);
    expect(video?.hasAttribute('playsinline')).toBe(true);
    expect(video?.muted).toBe(true);
  });

  it('fades out the poster once the video is playing to avoid ghosting', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );

    const poster = screen.getByRole('img', { name: 'Campus Cycle hero poster' });
    expect(poster.className).toContain('opacity-75');

    const video = queryVideo();
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

  it('waits for both the poster and the video playing event before notifying ready', () => {
    const handleHeroReady = vi.fn();

    render(
      <MemoryRouter>
        <Hero onHeroReady={handleHeroReady} />
      </MemoryRouter>,
    );

    fireEvent.load(screen.getByRole('img', { name: 'Campus Cycle hero poster' }));

    expect(handleHeroReady).not.toHaveBeenCalled();

    const video = queryVideo();
    expect(video).toBeTruthy();

    fireEvent(video!, new Event('playing'));

    expect(handleHeroReady).toHaveBeenCalledTimes(1);
  });

  it('notifies an error when the video fails to load', () => {
    const handleHeroError = vi.fn();

    render(
      <MemoryRouter>
        <Hero onHeroError={handleHeroError} />
      </MemoryRouter>,
    );

    const video = queryVideo();
    expect(video).toBeTruthy();

    fireEvent(video!, new Event('error'));

    expect(handleHeroError).toHaveBeenCalledTimes(1);
  });

});
