export type DanmakuMode = 'scroll' | 'top' | 'bottom';

export interface DanmakuItem {
  id: string;
  time: number;       // seconds
  text: string;
  mode: DanmakuMode;
  color: string;      // hex color
  duration?: number;  // seconds, for top/bottom stay duration
}

export interface ProjectData {
  version: 1;
  media: string;
  mediaType: 'video' | 'audio';
  width: number;
  height: number;
  fps: number;
  fontSize: number;
  bgColor: string;
  danmakus: DanmakuItem[];
}

export interface TrackInfo {
  id: number;
  type: DanmakuMode;
  y: number;
  occupiedUntil: number;
}

export interface RenderDanmaku {
  item: DanmakuItem;
  x: number;
  y: number;
  opacity: number;
  trackId: number;
}
