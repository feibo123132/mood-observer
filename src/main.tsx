import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useMoodStore } from './store/useMoodStore'

// 挂载到 window 以便手动执行修复命令: window.useMoodStore.getState().deduplicateCloudData()
(window as any).useMoodStore = useMoodStore;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
