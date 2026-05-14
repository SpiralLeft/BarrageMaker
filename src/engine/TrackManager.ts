import type { DanmakuItem, DanmakuMode, TrackInfo } from '../types/danmaku';

export interface TrackAssignment {
  danmakuId: string;
  trackId: number;
  y: number;
  textWidth: number;
}

export class TrackManager {
  private scrollTracks: TrackInfo[] = [];
  private topTracks: TrackInfo[] = [];
  private bottomTracks: TrackInfo[] = [];

  private canvasWidth: number;
  private canvasHeight: number;
  private fontSize: number;
  private trackPadding: number;

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    fontSize: number,
    trackPadding = 4,
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.fontSize = fontSize;
    this.trackPadding = trackPadding;
  }

  resize(width: number, height: number, fontSize?: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    if (fontSize !== undefined) {
      this.fontSize = fontSize;
      // Font size change invalidates track y positions — force full rebuild
      this.scrollTracks = [];
      this.topTracks = [];
      this.bottomTracks = [];
    }
  }

  trackHeight(): number {
    return this.fontSize + this.trackPadding;
  }

  private getOrCreateTracks(
    tracks: TrackInfo[],
    count: number,
    type: DanmakuMode,
    startY: number,
  ): TrackInfo[] {
    const th = this.trackHeight();
    while (tracks.length < count) {
      tracks.push({
        id: tracks.length,
        type,
        y: startY + tracks.length * th,
        occupiedUntil: 0,
      });
    }
    return tracks;
  }

  assignTrack(
    item: DanmakuItem,
    textWidth: number,
    scrollSpeed: number,
    buffer = 0.05,
  ): TrackAssignment {
    if (item.mode === 'scroll') {
      return this.assignScrollTrack(item, textWidth, scrollSpeed, buffer);
    }
    return this.assignFixedTrack(item, item.mode, buffer, textWidth);
  }

  private assignScrollTrack(
    item: DanmakuItem,
    textWidth: number,
    speed: number,
    buffer: number,
  ): TrackAssignment {
    const th = this.trackHeight();
    const maxTracks = Math.max(1, Math.floor((this.canvasHeight * 0.7) / th));
    this.getOrCreateTracks(this.scrollTracks, maxTracks, 'scroll', 0);

    // occupiedUntil = entryTime + textWidth/speed: when tail clears right edge
    const clearEntryTime = item.time + textWidth / speed;

    for (const track of this.scrollTracks) {
      // Update Y in case font size / canvas changed
      track.y = track.id * th;
      if (track.occupiedUntil <= item.time + buffer) {
        track.occupiedUntil = Math.max(track.occupiedUntil, clearEntryTime);
        return { danmakuId: item.id, trackId: track.id, y: track.y, textWidth };
      }
    }

    const earliest = this.scrollTracks.reduce((a, b) =>
      a.occupiedUntil < b.occupiedUntil ? a : b,
    );
    earliest.occupiedUntil = Math.max(earliest.occupiedUntil, item.time) + textWidth / speed;
    earliest.y = earliest.id * th;
    return { danmakuId: item.id, trackId: earliest.id, y: earliest.y, textWidth };
  }

  private assignFixedTrack(
    item: DanmakuItem,
    mode: 'top' | 'bottom',
    buffer: number,
    textWidth: number,
  ): TrackAssignment {
    const th = this.trackHeight();
    const maxTracks = Math.max(1, Math.floor((this.canvasHeight * 0.3) / th));

    const tracks = mode === 'top' ? this.topTracks : this.bottomTracks;
    const startY = mode === 'top' ? 0 : this.canvasHeight - maxTracks * th;
    this.getOrCreateTracks(tracks, maxTracks, mode, startY);

    const duration = item.duration || 3;

    for (const track of tracks) {
      track.y = mode === 'top'
        ? track.id * th
        : this.canvasHeight - maxTracks * th + track.id * th;
      if (track.occupiedUntil <= item.time + buffer) {
        track.occupiedUntil = item.time + duration;
        return { danmakuId: item.id, trackId: track.id, y: track.y, textWidth };
      }
    }

    const earliest = tracks.reduce((a, b) =>
      a.occupiedUntil < b.occupiedUntil ? a : b,
    );
    earliest.occupiedUntil = Math.max(earliest.occupiedUntil, item.time) + duration;
    earliest.y = mode === 'top'
      ? earliest.id * th
      : this.canvasHeight - maxTracks * th + earliest.id * th;
    return { danmakuId: item.id, trackId: earliest.id, y: earliest.y, textWidth };
  }

  reset() {
    const clear = (tracks: TrackInfo[]) => tracks.forEach((t) => (t.occupiedUntil = 0));
    clear(this.scrollTracks);
    clear(this.topTracks);
    clear(this.bottomTracks);
  }

  getScrollTrackCount(): number { return this.scrollTracks.length; }
  getTopTrackCount(): number { return this.topTracks.length; }
  getBottomTrackCount(): number { return this.bottomTracks.length; }
}
