import { create } from 'zustand';
import type { DanmakuItem, DanmakuMode, ProjectData } from '../types/danmaku';

interface AppState {
  mediaSrc: string | null;
  mediaType: 'video' | 'audio' | null;
  mediaFileName: string | null;

  currentTime: number;
  duration: number;
  isPlaying: boolean;

  // Global project settings
  width: number;
  height: number;
  fps: number;
  fontSize: number;
  fontWeight: number;
  strokeWidth: number;
  bgColor: string;

  danmakus: DanmakuItem[];
  selectedDanmakuId: string | null;

  // Input state
  inputText: string;
  inputMode: DanmakuMode;
  inputColor: string;

  // Actions
  setMedia: (src: string, type: 'video' | 'audio', fileName: string) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (playing: boolean) => void;

  setWidth: (w: number) => void;
  setHeight: (h: number) => void;
  setFps: (fps: number) => void;
  setFontSize: (size: number) => void;
  setFontWeight: (weight: number) => void;
  setStrokeWidth: (ratio: number) => void;
  setBgColor: (color: string) => void;

  addDanmaku: (item: DanmakuItem) => void;
  updateDanmaku: (id: string, updates: Partial<DanmakuItem>) => void;
  deleteDanmaku: (id: string) => void;
  setDanmakus: (list: DanmakuItem[]) => void;
  selectDanmaku: (id: string | null) => void;

  setInputText: (text: string) => void;
  setInputMode: (mode: DanmakuMode) => void;
  setInputColor: (color: string) => void;

  exportProject: () => ProjectData;
  importProject: (data: ProjectData) => void;
}

let nextId = 1;
function genId(): string {
  return `dm_${Date.now()}_${nextId++}`;
}

export const useStore = create<AppState>((set, get) => ({
  mediaSrc: null,
  mediaType: null,
  mediaFileName: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  width: 1920,
  height: 1080,
  fps: 60,
  fontSize: 36,
  fontWeight: 700,
  strokeWidth: 0.06,
  bgColor: '#000000',
  danmakus: [],
  selectedDanmakuId: null,
  inputText: '',
  inputMode: 'scroll',
  inputColor: '#ffffff',

  setMedia: (src, type, fileName) =>
    set({ mediaSrc: src, mediaType: type, mediaFileName: fileName, currentTime: 0 }),

  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setWidth: (w) => set({ width: w }),
  setHeight: (h) => set({ height: h }),
  setFps: (fps) => set({ fps }),
  setFontSize: (size) => set({ fontSize: size }),
  setFontWeight: (weight) => set({ fontWeight: weight }),
  setStrokeWidth: (ratio) => set({ strokeWidth: ratio }),
  setBgColor: (color) => set({ bgColor: color }),

  addDanmaku: (item) =>
    set((s) => ({ danmakus: [...s.danmakus, item].sort((a, b) => a.time - b.time) })),

  updateDanmaku: (id, updates) =>
    set((s) => ({
      danmakus: s.danmakus
        .map((d) => (d.id === id ? { ...d, ...updates } : d))
        .sort((a, b) => a.time - b.time),
    })),

  deleteDanmaku: (id) =>
    set((s) => ({
      danmakus: s.danmakus.filter((d) => d.id !== id),
      selectedDanmakuId: s.selectedDanmakuId === id ? null : s.selectedDanmakuId,
    })),

  setDanmakus: (list) => set({ danmakus: list }),
  selectDanmaku: (id) => set({ selectedDanmakuId: id }),

  setInputText: (text) => set({ inputText: text }),
  setInputMode: (mode) => set({ inputMode: mode }),
  setInputColor: (color) => set({ inputColor: color }),

  exportProject: () => {
    const s = get();
    return {
      version: 1,
      media: s.mediaFileName || '',
      mediaType: s.mediaType || 'video',
      width: s.width,
      height: s.height,
      fps: s.fps,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      strokeWidth: s.strokeWidth,
      bgColor: s.bgColor,
      danmakus: s.danmakus,
    };
  },

  importProject: (data) =>
    set({
      mediaFileName: data.media,
      mediaType: data.mediaType,
      width: data.width,
      height: data.height,
      fps: data.fps,
      fontSize: data.fontSize ?? 36,
      fontWeight: data.fontWeight ?? 700,
      strokeWidth: data.strokeWidth ?? 0.06,
      bgColor: data.bgColor,
      danmakus: data.danmakus,
    }),
}));

export function createDanmaku(
  time: number,
  text: string,
  mode: DanmakuMode,
  color: string,
): DanmakuItem {
  return {
    id: genId(),
    time,
    text,
    mode,
    color,
    duration: mode !== 'scroll' ? 3 : undefined,
  };
}
