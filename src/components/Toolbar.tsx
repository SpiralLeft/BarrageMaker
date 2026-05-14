import { useRef } from 'react';
import { useStore } from '../store/useStore';
import type { ProjectData } from '../types/danmaku';

export default function Toolbar() {
  const mediaSrc = useStore((s) => s.mediaSrc);
  const setMedia = useStore((s) => s.setMedia);
  const isPlaying = useStore((s) => s.isPlaying);
  const setIsPlaying = useStore((s) => s.setIsPlaying);
  const currentTime = useStore((s) => s.currentTime);
  const setCurrentTime = useStore((s) => s.setCurrentTime);
  const duration = useStore((s) => s.duration);
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  const exportProject = useStore((s) => s.exportProject);
  const importProject = useStore((s) => s.importProject);
  const setDanmakus = useStore((s) => s.setDanmakus);
  const mediaFileName = useStore((s) => s.mediaFileName);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const handleImportMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video/') ? 'video' : 'audio';
    setMedia(url, type, file.name);
  };

  const handlePlayPause = () => {
    if (currentTime >= duration && duration > 0) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSaveProject = () => {
    const data = exportProject();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (mediaFileName || 'project').replace(/\.[^.]+$/, '') + '.barrage.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data: ProjectData = JSON.parse(reader.result as string);
        importProject(data);
        // Prompt user to re-select media since file paths can't be auto-loaded
        alert('项目已加载。请重新导入媒体文件（原路径: ' + data.media + '）');
      } catch {
        alert('项目文件格式错误');
      }
    };
    reader.readAsText(file);
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="tb-btn"
          title="导入媒体文件"
        >
          导入媒体
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/mov,video/webm,audio/mp3,audio/wav,audio/flac,audio/m4a,.m4a"
          onChange={handleImportMedia}
          style={{ display: 'none' }}
        />

        <button onClick={handlePlayPause} className="tb-btn" disabled={!mediaSrc}>
          {isPlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>

        <span className="tb-time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="toolbar-right">
        <button
          onClick={() => projectInputRef.current?.click()}
          className="tb-btn"
          title="加载项目"
        >
          加载项目
        </button>
        <input
          ref={projectInputRef}
          type="file"
          accept=".json"
          onChange={handleLoadProject}
          style={{ display: 'none' }}
        />

        <button onClick={handleSaveProject} className="tb-btn" disabled={!mediaSrc}>
          保存项目
        </button>
      </div>
    </div>
  );
}
