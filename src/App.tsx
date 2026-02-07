import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CalendarPage } from './pages/CalendarPage';
import { LoginPage } from './pages/LoginPage';
import { ReviewPage } from './pages/ReviewPage';
import { TrashPage } from './pages/TrashPage';
import { HistoryReportsPage } from './pages/HistoryReportsPage';
import { ReportVisualizationPage } from './pages/ReportVisualizationPage';
import { TreasureBoxPage } from './pages/TreasureBoxPage';
import { TroubleSurgeryPage } from './pages/TroubleSurgeryPage';
import { SurgeryHistoryPage } from './pages/SurgeryHistoryPage';
import { SurgeryTrashPage } from './pages/SurgeryTrashPage';
import { ControlDichotomyPage } from './pages/ControlDichotomyPage';
import { ControlHistoryPage } from './pages/ControlHistoryPage';
import { RequireAuth } from './components/RequireAuth';
import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';

import { useMoodStore } from './store/useMoodStore';
import { useSurgeryStore } from './store/useSurgeryStore';
import { useControlStore } from './store/useControlStore';

function App() {
  const initAuth = useAuthStore(state => state.initAuth);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    initAuth();

    // 1. Mood Store Auto-Cleanup (自动清理重复数据)
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

    // 2. Surgery Store Migration (数据迁移 - 一次性逻辑)
    const migrateSurgeryData = async () => {
      // @ts-ignore: 忽略类型检查，因为 surgeryRecords 可能已从类型定义中移除
      const moodStore = useMoodStore.getState() as any;
      const surgeryStore = useSurgeryStore.getState();

      // Check if old data exists in MoodStore
      if (moodStore.surgeryRecords && moodStore.surgeryRecords.length > 0) {
        console.log(`[Migration] Found ${moodStore.surgeryRecords.length} surgery records in MoodStore. Migrating...`);
        
        // Add to new store
        for (const record of moodStore.surgeryRecords) {
           // 注意：这里最好保留原始 timestamp，如果 addRecord 会重置时间，建议后续优化
           await surgeryStore.addRecord(record);
        }

        // Clear old store to prevent re-migration
        useMoodStore.setState({ surgeryRecords: [] } as any);
        console.log('[Migration] Migration completed. Old records cleared.');
      }
    };
    migrateSurgeryData();

  }, [initAuth]);

  // Sync when user changes (用户登录后同步数据)
  useEffect(() => {
    if (user) {
      // 核心修复：同时同步两个 Store 的数据
      Promise.all([
        useMoodStore.getState().syncFromCloud(),
        useSurgeryStore.getState().syncFromCloud(),
        useControlStore.getState().syncFromCloud()
      ]).catch(console.error);
    }
  }, [user]);

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
        <Route path="/report-visualization/:year/:week" element={
          <RequireAuth>
            <ReportVisualizationPage />
          </RequireAuth>
        } />
        <Route path="/treasure-box" element={
          <RequireAuth>
            <TreasureBoxPage />
          </RequireAuth>
        } />
        <Route path="/treasure-box/trouble-surgery" element={
          <RequireAuth>
            <TroubleSurgeryPage />
          </RequireAuth>
        } />
        <Route path="/treasure-box/surgery-history" element={
          <RequireAuth>
            <SurgeryHistoryPage />
          </RequireAuth>
        } />
        <Route path="/treasure-box/surgery-trash" element={
          <RequireAuth>
            <SurgeryTrashPage />
          </RequireAuth>
        } />
        <Route path="/treasure-box/control-dichotomy" element={
          <RequireAuth>
            <ControlDichotomyPage />
          </RequireAuth>
        } />
        <Route path="/treasure-box/control-history" element={
          <RequireAuth>
            <ControlHistoryPage />
          </RequireAuth>
        } />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;