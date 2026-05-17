import { useEffect, useRef, useLayoutEffect } from 'react';
import { useStore } from '../store/useStore';
import { DanmakuEngine } from '../engine/DanmakuEngine';

export default function DanmakuCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DanmakuEngine | null>(null);
  const timeRef = useRef(0);

  const danmakus = useStore((s) => s.danmakus);
  const currentTime = useStore((s) => s.currentTime);
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  const fontSize = useStore((s) => s.fontSize);
  const fontWeight = useStore((s) => s.fontWeight);
  const strokeWidth = useStore((s) => s.strokeWidth);
  const mediaSrc = useStore((s) => s.mediaSrc);

  // Keep a ref to currentTime so the rAF loop doesn't need to be recreated
  timeRef.current = currentTime;

  // Initialize / reconfigure engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new DanmakuEngine({
        width,
        height,
        scrollSpeed: 350,
        fontSize,
        fontWeight,
        strokeWidth,
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        trackPadding: 4,
      });
    } else {
      engineRef.current.updateConfig({ width, height, fontSize, fontWeight, strokeWidth });
    }
  }, [width, height, fontSize, fontWeight, strokeWidth]);

  // Recompute track assignments when danmaku list or font size changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');
    if (ctx) {
      engine.recomputeAssignments(danmakus, ctx);
    }
  }, [danmakus, width, height, fontSize, fontWeight]);

  // Continuous rAF render loop (reads latest time from ref)
  useEffect(() => {
    if (!mediaSrc) return;

    let rafId: number;
    const loop = () => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (canvas && engine) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Don't reset canvas size every frame — only when dimensions change
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          engine.render(ctx, timeRef.current);
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [mediaSrc]);

  // Sync canvas resolution when width/height change
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
  }, [width, height]);

  // Maintain correct display aspect ratio within the container
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const resize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw === 0 || ch === 0) return;

      const canvasRatio = width / height;
      const containerRatio = cw / ch;

      let dw: number, dh: number;
      if (containerRatio > canvasRatio) {
        dh = ch;
        dw = ch * canvasRatio;
      } else {
        dw = cw;
        dh = cw / canvasRatio;
      }

      canvas.style.width = `${dw}px`;
      canvas.style.height = `${dh}px`;
      canvas.style.left = `${(cw - dw) / 2}px`;
      canvas.style.top = `${(ch - dh) / 2}px`;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="danmaku-canvas"
      width={width}
      height={height}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
      }}
    />
  );
}
