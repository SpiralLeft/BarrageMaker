import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { DanmakuItem } from '../types/danmaku';

const MODE_COLORS: Record<string, string> = {
  scroll: '#4fc3f7',
  top: '#ffb74d',
  bottom: '#81c784',
};

/** Greedy lane assignment: each danmaku gets the first lane where it doesn't overlap */
function computeLanes(danmakus: DanmakuItem[], maxTime: number): Map<string, number> {
  const sorted = [...danmakus].sort((a, b) => a.time - b.time);
  // Each lane stores the latest end-time (as fraction of maxTime) currently occupying it
  const laneEnds: number[] = [];
  const laneMap = new Map<string, number>();

  // Minimum visual width of a danmaku marker as fraction of maxTime
  const minWidth = 0.003; // ~0.2s on a 60s timeline

  for (const dm of sorted) {
    const start = dm.time / maxTime;
    // Duration as fraction of maxTime: at least minWidth
    const durFrac = Math.max(
      minWidth,
      (dm.mode === 'scroll' ? 0.12 : (dm.duration || 3) / maxTime),
    );
    const end = start + durFrac;

    let lane = 0;
    // Find first lane that's free at this danmaku's start time
    while (lane < laneEnds.length && laneEnds[lane] > start) {
      lane++;
    }
    if (lane === laneEnds.length) {
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    laneMap.set(dm.id, lane);
  }

  return laneMap;
}

export default function Timeline() {
  const danmakus = useStore((s) => s.danmakus);
  const currentTime = useStore((s) => s.currentTime);
  const duration = useStore((s) => s.duration);
  const selectedId = useStore((s) => s.selectedDanmakuId);
  const setCurrentTime = useStore((s) => s.setCurrentTime);
  const selectDanmaku = useStore((s) => s.selectDanmaku);
  const updateDanmaku = useStore((s) => s.updateDanmaku);
  const setIsPlaying = useStore((s) => s.setIsPlaying);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const scrubberRef = useRef(false);
  const dragIdRef = useRef<string | null>(null);

  const maxTime = Math.max(duration || 60, 60);

  // Compute lane assignments for overlapping danmakus
  const lanes = useMemo(() => computeLanes(danmakus, maxTime), [danmakus, maxTime]);
  const totalLanes = Math.max(1, ...Array.from(lanes.values()), 0) + 1;

  // Convert mouse event to time based on position within timeline-content
  const mouseToTime = useCallback(
    (e: MouseEvent | React.MouseEvent): number => {
      const content = contentRef.current;
      if (!content) return 0;
      const rect = content.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const frac = Math.max(0, Math.min(1, x / rect.width));
      return Math.round(frac * maxTime * 100) / 100;
    },
    [maxTime],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.target === contentRef.current ||
      (e.target as HTMLElement).classList.contains('timeline-content')
    ) {
      scrubberRef.current = true;
      setCurrentTime(mouseToTime(e));
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (scrubberRef.current) {
        setCurrentTime(mouseToTime(e));
      } else if (dragIdRef.current) {
        const newTime = mouseToTime(e);
        updateDanmaku(dragIdRef.current, { time: newTime });
      }
    },
    [mouseToTime, setCurrentTime, updateDanmaku],
  );

  const handleMouseUp = useCallback(() => {
    if (scrubberRef.current) {
      setIsPlaying(false);
    }
    scrubberRef.current = false;
    dragIdRef.current = null;
  }, [setIsPlaying]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.25, Math.min(20, z - e.deltaY * 0.005)));
  }, []);

  const handleDanmakuMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    selectDanmaku(id);
    dragIdRef.current = id;
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timeFrac = maxTime > 0 ? currentTime / maxTime : 0;

  // Height per lane (px), dynamic based on total lanes but capped
  const laneHeight = totalLanes <= 1 ? 26 : Math.max(14, Math.min(26, 60 / totalLanes));

  return (
    <div className="timeline-container">
      <div className="timeline-controls">
        <button onClick={() => setZoom((z) => Math.min(20, z * 1.5))} title="放大">+</button>
        <button onClick={() => setZoom((z) => Math.max(0.25, z / 1.5))} title="缩小">−</button>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
      </div>
      <div
        ref={containerRef}
        className="timeline"
        style={{ height: totalLanes > 1 ? Math.max(80, totalLanes * (laneHeight + 2) + 12) : 80 }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <div
          ref={contentRef}
          className="timeline-content"
          style={{ width: `${zoom * 100}%` }}
        >
          {danmakus.map((dm) => {
            const lane = lanes.get(dm.id) ?? 0;
            return (
              <div
                key={dm.id}
                className={`timeline-danmaku ${dm.mode} ${dm.id === selectedId ? 'selected' : ''}`}
                style={{
                  left: `${(dm.time / maxTime) * 100}%`,
                  top: `${4 + lane * (laneHeight + 2)}px`,
                  height: `${laneHeight}px`,
                  backgroundColor: MODE_COLORS[dm.mode] || '#888',
                }}
                onMouseDown={(e) => handleDanmakuMouseDown(e, dm.id)}
                title={`${formatTime(dm.time)} ${dm.text}`}
              >
                <span className="tl-dm-text">{dm.text.slice(0, 10)}</span>
              </div>
            );
          })}
          <div
            className="time-indicator"
            style={{ left: `${timeFrac * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
