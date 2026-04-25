import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Hero from './Hero';

describe('Hero', () => {
  it('renders a poster image before loading the background video iframe', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img', { name: 'Campus Cycle hero poster' })).toBeTruthy();
    expect(screen.queryByTitle('Campus Cycle background video')).toBeNull();
  });

  it('loads the background video iframe only after the poster has loaded', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );

    fireEvent.load(screen.getByRole('img', { name: 'Campus Cycle hero poster' }));

    const video = screen.queryByTitle('Campus Cycle background video');
    expect(video).toBeTruthy();
    expect(video?.getAttribute('src')).toContain('autoplay=muted');
    expect(video?.getAttribute('src')).toContain('controls=false');
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
});
