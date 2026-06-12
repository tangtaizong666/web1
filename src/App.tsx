import { lazy, Suspense, useEffect, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import { hideAppSplash } from './lib/splash';

const Shop = lazy(() => import('./pages/Shop'));
const RecyclePage = lazy(() => import('./pages/RecyclePage'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));

// Warm the lazy route chunks once the browser is idle. Without this the first
// tap on 商店/回收/AI 助手 pauses on the current page while the chunk downloads
// (React Router v7 keeps the old UI during the transition), which reads as lag.
function usePrefetchRoutes() {
  useEffect(() => {
    const prefetch = () => {
      void import('./pages/Shop');
      void import('./pages/RecyclePage');
      void import('./pages/AIAssistant');
    };

    // Safari has no requestIdleCallback; a timer keeps it off the critical path.
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(prefetch, 2500);
    return () => window.clearTimeout(id);
  }, []);
}

// On the home page the splash stays until the hero reports ready (see Home);
// every other entry point dismisses it as soon as React takes over. Route
// changes also reset the window scroll before paint, otherwise the next page
// briefly renders at the previous page's scroll offset.
function SplashGate() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    if (location.pathname !== '/') {
      hideAppSplash();
    }
  }, [location.pathname]);

  return null;
}

export default function App() {
  usePrefetchRoutes();

  return (
    <Router>
      <SplashGate />
      <Suspense fallback={<div className="min-h-screen bg-brand-100" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/recycle" element={<RecyclePage />} />
          <Route path="/ai" element={<AIAssistant />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
