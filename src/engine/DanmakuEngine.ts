import type { DanmakuItem, RenderDanmaku } from '../types/danmaku';
import { TrackManager, type TrackAssignment } from './TrackManager';

export interface EngineConfig {
  width: number;
  height: number;
  scrollSpeed: number;
  fontSize: number;
  fontWeight: number;
  strokeWidth: number;
  fontFamily: string;
  trackPadding: number;
}

export class DanmakuEngine {
  private config: EngineConfig;
  private trackManager: TrackManager;
  private assignments: Map<string, TrackAssignment> = new Map();
  private sortedDanmakus: DanmakuItem[] = [];
  private lastDanmakuHash = '';

  constructor(config: EngineConfig) {
    this.config = { ...config };
    this.trackManager = new TrackManager(
      config.width,
      config.height,
      config.fontSize,
      config.trackPadding,
    );
  }

  updateConfig(partial: Partial<EngineConfig>) {
    Object.assign(this.config, partial);
    this.trackManager.resize(
      this.config.width,
      this.config.height,
      partial.fontSize,
    );
  }

  private measureText(ctx: CanvasRenderingContext2D, text: string): number {
    ctx.font = `${this.config.fontWeight} ${this.config.fontSize}px ${this.config.fontFamily}`;
    return ctx.measureText(text).width;
  }

  recomputeAssignments(danmakus: DanmakuItem[], ctx: CanvasRenderingContext2D) {
    const hash = danmakus.map((d) => `${d.id}:${d.text}:${d.mode}:${d.time}`).join('|');
    if (hash === this.lastDanmakuHash) return;
    this.lastDanmakuHash = hash;

    this.sortedDanmakus = [...danmakus].sort((a, b) => a.time - b.time);
    this.trackManager.reset();
    this.assignments.clear();

    for (const item of this.sortedDanmakus) {
      const textWidth = this.measureText(ctx, item.text);
      const assignment = this.trackManager.assignTrack(
        item,
        textWidth,
        this.config.scrollSpeed,
      );
      this.assignments.set(item.id, assignment);
    }
  }

  getVisibleDanmaku(currentTime: number): RenderDanmaku[] {
    const { width, scrollSpeed } = this.config;
    const visible: RenderDanmaku[] = [];

    for (const item of this.sortedDanmakus) {
      const assignment = this.assignments.get(item.id);
      if (!assignment) continue;

      if (item.mode === 'scroll') {
        const elapsed = currentTime - item.time;
        // Use actual measured text width for total travel distance
        const totalDist = width + assignment.textWidth;
        const totalDuration = totalDist / scrollSpeed;

        if (elapsed >= 0 && elapsed <= totalDuration) {
          visible.push({
            item,
            x: width - scrollSpeed * elapsed,
            y: assignment.y,
            opacity: 1,
            trackId: assignment.trackId,
          });
        }
      } else {
        // Top / bottom — no fade, fixed at full opacity until gone
        const duration = item.duration || 3;
        if (currentTime >= item.time && currentTime <= item.time + duration) {
          visible.push({
            item,
            x: width / 2,
            y: assignment.y,
            opacity: 1,
            trackId: assignment.trackId,
          });
        }
      }
    }

    return visible;
  }

  render(ctx: CanvasRenderingContext2D, currentTime: number, opts?: { shadow?: boolean }) {
    const shadow = opts?.shadow ?? true;
    const visible = this.getVisibleDanmaku(currentTime);

    for (const rd of visible) {
      const { item, x, y, opacity } = rd;
      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

      ctx.font = `${this.config.fontWeight} ${this.config.fontSize}px ${this.config.fontFamily}`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = item.color;

      const align = item.mode === 'scroll' ? 'left' : 'center';
      ctx.textAlign = align;

      if (shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
      }

      ctx.fillText(item.text, x, y);

      // Thin black stroke for outline
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = Math.max(1, this.config.fontSize * this.config.strokeWidth);
      ctx.lineJoin = 'round';
      ctx.strokeText(item.text, x, y);
    }

    ctx.globalAlpha = 1;
  }
}
