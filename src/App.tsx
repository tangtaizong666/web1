import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import { hideAppSplash } from './lib/splash';

const Shop = lazy(() => import('./pages/Shop'));
const RecyclePage = lazy(() => import('./pages/RecyclePage'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));

// On the home page the splash stays until the hero reports ready (see Home);
// every other entry point dismisses it as soon as React takes over.
function SplashGate() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/') {
      hideAppSplash();
    }
  }, [location.pathname]);

  return null;
}

export default function App() {
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
