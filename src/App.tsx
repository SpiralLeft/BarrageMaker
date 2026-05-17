import { useEffect, useRef } from 'react';
import { useStore, createDanmaku } from './store/useStore';
import Toolbar from './components/Toolbar';
import MediaPlayer from './components/MediaPlayer';
import DanmakuCanvas from './components/DanmakuCanvas';
import DanmakuInput from './components/DanmakuInput';
import Timeline from './components/Timeline';
import DanmakuEditor from './components/DanmakuEditor';
import ExportPanel from './components/ExportPanel';
import type { DanmakuItem } from './types/danmaku';
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
  const danmakus = useStore((s) => s.danmakus);
  const addDanmaku = useStore((s) => s.addDanmaku);

  const aspectRatio = width / height;

  // Clipboard for copy/paste danmaku
  const clipboardRef = useRef<Pick<DanmakuItem, 'text' | 'mode' | 'color' | 'duration' | 'time'> | null>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const getSelected = () => danmakus.find((d) => d.id === selectedDanmakuId);

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
        return;
      }

      if (e.key === 'Delete' && selectedDanmakuId) {
        e.preventDefault();
        deleteDanmaku(selectedDanmakuId);
        return;
      }

      // Ctrl+C: copy selected danmaku
      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && selectedDanmakuId) {
        e.preventDefault();
        const dm = getSelected();
        if (dm) {
          clipboardRef.current = {
            text: dm.text,
            mode: dm.mode,
            color: dm.color,
            duration: dm.duration,
            time: dm.time,
          };
        }
        return;
      }

      // Ctrl+V: paste danmaku at same time
      if (e.key === 'v' && (e.ctrlKey || e.metaKey) && clipboardRef.current) {
        e.preventDefault();
        const clip = clipboardRef.current;
        const dm = createDanmaku(clip.time, clip.text, clip.mode, clip.color);
        if (clip.duration) dm.duration = clip.duration;
        addDanmaku(dm);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    mediaSrc, isPlaying, currentTime, duration, setIsPlaying, setCurrentTime,
    selectedDanmakuId, deleteDanmaku, danmakus, addDanmaku,
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
