import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

const Shop = lazy(() => import('./pages/Shop'));
const RecyclePage = lazy(() => import('./pages/RecyclePage'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));

export default function App() {
  return (
    <Router>
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
