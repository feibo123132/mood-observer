import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CalendarPage } from './pages/CalendarPage';
import { LoginPage } from './pages/LoginPage';
import { ReviewPage } from './pages/ReviewPage';
import { TrashPage } from './pages/TrashPage';
import { HistoryReportsPage } from './pages/HistoryReportsPage';
import { RequireAuth } from './components/RequireAuth';
import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';

import { useMoodStore } from './store/useMoodStore';

function App() {
  const initAuth = useAuthStore(state => state.initAuth);

  useEffect(() => {
    initAuth();

    // 一次性数据清洗逻辑 (Auto-Cleanup)
    const cleanupStore = () => {
      const { records } = useMoodStore.getState();
      const uniqueMap = new Map();
      records.forEach(r => uniqueMap.set(r.id, r));
      
      if (uniqueMap.size < records.length) {
        console.log(`[Auto-Cleanup] 检测到重复数据，正在清理... (原: ${records.length}, 现: ${uniqueMap.size})`);
        useMoodStore.setState({ 
          records: Array.from(uniqueMap.values()) 
        });
      }
    };
    cleanupStore();
  }, [initAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        } />
        <Route path="/calendar" element={
          <RequireAuth>
            <CalendarPage />
          </RequireAuth>
        } />
        <Route path="/review" element={
          <RequireAuth>
            <ReviewPage />
          </RequireAuth>
        } />
        <Route path="/trash" element={
          <RequireAuth>
            <TrashPage />
          </RequireAuth>
        } />
        <Route path="/reports" element={
          <RequireAuth>
            <HistoryReportsPage />
          </RequireAuth>
        } />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
