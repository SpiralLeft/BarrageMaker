import { useEffect } from 'react';
import { useStore } from './store/useStore';
import Toolbar from './components/Toolbar';
import MediaPlayer from './components/MediaPlayer';
import DanmakuCanvas from './components/DanmakuCanvas';
import DanmakuInput from './components/DanmakuInput';
import Timeline from './components/Timeline';
import DanmakuEditor from './components/DanmakuEditor';
import ExportPanel from './components/ExportPanel';
import './App.css';

export default function App() {
  const mediaSrc = useStore((s) => s.mediaSrc);
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  const isPlaying = useStore((s) => s.isPlaying);
  const currentTime = useStore((s) => s.currentTime);
  const duration = useStore((s) => s.duration);
  const setIsPlaying = useStore((s) => s.setIsPlaying);
  const setCurrentTime = useStore((s) => s.setCurrentTime);
  const selectedDanmakuId = useStore((s) => s.selectedDanmakuId);
  const deleteDanmaku = useStore((s) => s.deleteDanmaku);

  const aspectRatio = width / height;

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === ' ') {
        e.preventDefault();
        if (!mediaSrc) return;
        if (currentTime >= duration && duration > 0) {
          setCurrentTime(0);
        }
        setIsPlaying(!isPlaying);
      }

      if (e.key === 'Delete' && selectedDanmakuId) {
        e.preventDefault();
        deleteDanmaku(selectedDanmakuId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    mediaSrc, isPlaying, currentTime, duration,
    setIsPlaying, setCurrentTime, selectedDanmakuId, deleteDanmaku,
  ]);

  return (
    <div className="app">
      <Toolbar />

      <div className="main-content">
        <div className="left-panel">
          <div
            className="preview-container"
            style={{ aspectRatio: String(aspectRatio), maxHeight: '60vh' }}
          >
            <MediaPlayer />
            {mediaSrc && <DanmakuCanvas />}
          </div>

          <DanmakuInput />
          <Timeline />
        </div>

        <div className="right-panel">
          <DanmakuEditor />
          <ExportPanel />
        </div>
      </div>
    </div>
  );
}
