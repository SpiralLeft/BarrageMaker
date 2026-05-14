import { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { DanmakuEngine } from '../engine/DanmakuEngine';

type ExportState = 'idle' | 'rendering' | 'done' | 'error';

export default function ExportPanel() {
  const danmakus = useStore((s) => s.danmakus);
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  const fps = useStore((s) => s.fps);
  const fontSize = useStore((s) => s.fontSize);
  const setWidth = useStore((s) => s.setWidth);
  const setHeight = useStore((s) => s.setHeight);
  const setFps = useStore((s) => s.setFps);
  const duration = useStore((s) => s.duration);

  const [exportState, setExportState] = useState<ExportState>('idle');
  const [progress, setProgress] = useState(0);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<'webm' | 'png-sequence'>('webm');

  const totalDuration = Math.max(duration || 10, ...danmakus.map((d) => {
    const extra = d.mode === 'scroll' ? 8 : (d.duration || 3);
    return d.time + extra;
  })) + 2;

  const exportWebM = useCallback(async () => {
    setExportState('rendering');
    setProgress(0);

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d')!;

    const engine = new DanmakuEngine({
      width,
      height,
      scrollSpeed: 350,
      fontSize,
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      trackPadding: 4,
    });
    engine.recomputeAssignments(danmakus, ctx);

    const stream = offscreen.captureStream(fps);
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm; codecs="vp9"')
        ? 'video/webm; codecs="vp9"'
        : 'video/webm',
      videoBitsPerSecond: 5000000,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    const totalFrames = Math.ceil(totalDuration * fps);
    let frame = 0;

    const done = new Promise<void>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setExportUrl(URL.createObjectURL(blob));
        setExportState('done');
        resolve();
      };
    });

    recorder.start();

    const renderFrame = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      const t = frame / fps;
      ctx.clearRect(0, 0, width, height);
      engine.render(ctx, t);
      setProgress(Math.round((frame / totalFrames) * 100));

      frame++;
      requestAnimationFrame(renderFrame);
    };

    renderFrame();
    await done;
  }, [danmakus, width, height, fps, fontSize, totalDuration]);

  const exportPNGSequence = useCallback(async () => {
    setExportState('rendering');
    setProgress(0);

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d')!;

    const engine = new DanmakuEngine({
      width,
      height,
      scrollSpeed: 350,
      fontSize,
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      trackPadding: 4,
    });
    engine.recomputeAssignments(danmakus, ctx);

    const totalFrames = Math.ceil(totalDuration * fps);

    for (let frame = 0; frame < totalFrames; frame++) {
      const t = frame / fps;
      ctx.clearRect(0, 0, width, height);
      engine.render(ctx, t);

      const blob = await new Promise<Blob | null>((resolve) =>
        offscreen.toBlob(resolve, 'image/png'),
      );

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `frame_${String(frame).padStart(6, '0')}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setProgress(Math.round((frame / totalFrames) * 100));

      if (frame % 30 === 29) {
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    setExportState('done');
  }, [danmakus, width, height, fps, fontSize, totalDuration]);

  const startExport = () => {
    if (format === 'webm') {
      exportWebM();
    } else {
      exportPNGSequence();
    }
  };

  return (
    <div className="export-panel">
      <h4>导出弹幕视频</h4>

      <div className="export-settings">
        <div className="editor-field">
          <label>分辨率</label>
          <div className="res-inputs">
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              min="320"
              max="7680"
            />
            <span>×</span>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min="240"
              max="4320"
            />
          </div>
        </div>
        <div className="editor-field">
          <label>FPS</label>
          <select value={fps} onChange={(e) => setFps(Number(e.target.value))}>
            <option value="24">24</option>
            <option value="30">30</option>
            <option value="60">60</option>
          </select>
        </div>
        <div className="editor-field">
          <label>格式</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as 'webm' | 'png-sequence')}>
            <option value="webm">WebM (透明)</option>
            <option value="png-sequence">PNG 序列</option>
          </select>
        </div>
      </div>

      <div className="export-info">
        <p>时长: {totalDuration.toFixed(1)}s | 总帧数: {Math.ceil(totalDuration * fps)}</p>
        <p className="export-note">
          提示: 导出仅包含弹幕，背景透明。如需 MOV + Alpha 通道，请在导出后使用 ffmpeg 转换。
        </p>
      </div>

      {exportState === 'idle' && (
        <button className="export-btn" onClick={startExport} disabled={danmakus.length === 0}>
          开始导出
        </button>
      )}

      {exportState === 'rendering' && (
        <div className="export-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}%</span>
        </div>
      )}

      {exportState === 'done' && exportUrl && (
        <div className="export-done">
          <p>导出完成!</p>
          <a href={exportUrl} download="danmaku.webm" className="download-link">
            下载 WebM 视频
          </a>
        </div>
      )}

      {exportState === 'error' && (
        <p className="error-msg">导出失败，请重试。</p>
      )}
    </div>
  );
}
