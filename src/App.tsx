import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Shop from './pages/Shop';
import RecyclePage from './pages/RecyclePage';
import AIAssistant from './pages/AIAssistant';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/recycle" element={<RecyclePage />} />
        <Route path="/ai" element={<AIAssistant />} />
      </Routes>
    </Router>
  );
}
