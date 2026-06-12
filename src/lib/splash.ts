declare global {
  interface Window {
    __hideAppSplash?: () => void;
  }
}

/**
 * Dismisses the inline splash screen defined in index.html.
 * Safe to call multiple times or when the splash is already gone.
 */
export function hideAppSplash() {
  if (typeof window === 'undefined') {
    return;
  }

  window.__hideAppSplash?.();
}
