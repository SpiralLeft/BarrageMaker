import { useState, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { DanmakuEngine } from '../engine/DanmakuEngine';

type ExportState = 'idle' | 'rendering' | 'done' | 'error';

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPanel() {
  const danmakus = useStore((s) => s.danmakus);
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  const fps = useStore((s) => s.fps);
  const fontSize = useStore((s) => s.fontSize);
  const fontWeight = useStore((s) => s.fontWeight);
  const strokeWidth = useStore((s) => s.strokeWidth);
  const setWidth = useStore((s) => s.setWidth);
  const setHeight = useStore((s) => s.setHeight);
  const setFps = useStore((s) => s.setFps);
  const duration = useStore((s) => s.duration);

  const [exportState, setExportState] = useState<ExportState>('idle');
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState<'webm' | 'png-sequence'>('webm');
  const [shadow, setShadow] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const abortRef = useRef(false);

  const totalDuration = Math.max(duration || 10, ...danmakus.map((d) => {
    const extra = d.mode === 'scroll' ? 8 : (d.duration || 3);
    return d.time + extra;
  })) + 2;

  const totalFrames = Math.ceil(totalDuration * fps);

  const makeEngine = (ctx: CanvasRenderingContext2D) => {
    const engine = new DanmakuEngine({
      width, height, scrollSpeed: 350, fontSize, fontWeight, strokeWidth,
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      trackPadding: 4,
    });
    engine.recomputeAssignments(danmakus, ctx);
    return engine;
  };

  const exportWebM = useCallback(async () => {
    abortRef.current = false;
    setExportState('rendering');
    setProgress(0);
    setStatusMsg('正在渲染...');

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d')!;
    const engine = makeEngine(ctx);

    const stream = offscreen.captureStream(fps);
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm; codecs="vp9"')
        ? 'video/webm; codecs="vp9"'
        : 'video/webm',
      videoBitsPerSecond: 5000000,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    const done = new Promise<void>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        downloadBlob(blob, 'danmaku.webm');
        setExportState('done');
        setStatusMsg('');
        resolve();
      };
      recorder.onerror = () => setExportState('error');
    });

    recorder.start();

    const renderFrame = () => {
      if (abortRef.current) { recorder.stop(); return; }
      if (frame >= totalFrames) { recorder.stop(); return; }

      const t = frame / fps;
      ctx.clearRect(0, 0, width, height);
      engine.render(ctx, t, { shadow });
      setProgress(Math.round((frame / totalFrames) * 100));

      frame++;
      requestAnimationFrame(renderFrame);
    };

    let frame = 0;
    renderFrame();
    await done;
  }, [danmakus, width, height, fps, fontSize, fontWeight, strokeWidth, shadow, totalFrames, makeEngine]);

  const exportPNGSequence = useCallback(async () => {
    abortRef.current = false;
    setExportState('rendering');
    setProgress(0);

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d')!;
    const engine = makeEngine(ctx);

    for (let frame = 0; frame < totalFrames; frame++) {
      if (abortRef.current) {
        setExportState('idle');
        setStatusMsg('已取消');
        return;
      }

      const t = frame / fps;
      ctx.clearRect(0, 0, width, height);
      engine.render(ctx, t, { shadow });

      const blob = await new Promise<Blob | null>((resolve) =>
        offscreen.toBlob(resolve, 'image/png'),
      );

      if (blob) {
        const fileName = `frame_${String(frame).padStart(6, '0')}.png`;
        downloadBlob(blob, fileName);
      }

      setProgress(Math.round(((frame + 1) / totalFrames) * 100));
      setStatusMsg(`${frame + 1} / ${totalFrames}`);

      if (frame % 10 === 9) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    setStatusMsg('');
    setExportState('done');
  }, [danmakus, width, height, fps, fontSize, fontWeight, strokeWidth, shadow, totalFrames, makeEngine]);

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
        <div className="editor-field checkbox-field">
          <label>
            <input
              type="checkbox"
              checked={shadow}
              onChange={(e) => setShadow(e.target.checked)}
            />
            添加阴影
          </label>
        </div>
      </div>

      <div className="export-info">
        <p>时长: {totalDuration.toFixed(1)}s | 总帧数: {totalFrames}</p>
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
          {statusMsg && <span className="export-status">{statusMsg}</span>}
        </div>
      )}

      {exportState === 'done' && (
        <div className="export-done">
          <p>导出完成!</p>
        </div>
      )}

      {exportState === 'error' && (
        <p className="error-msg">导出失败，请重试。</p>
      )}
    </div>
  );
}
