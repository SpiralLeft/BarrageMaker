import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';

export default function MediaPlayer() {
  const mediaSrc = useStore((s) => s.mediaSrc);
  const mediaType = useStore((s) => s.mediaType);
  const isPlaying = useStore((s) => s.isPlaying);
  const currentTime = useStore((s) => s.currentTime);
  const duration = useStore((s) => s.duration);
  const setCurrentTime = useStore((s) => s.setCurrentTime);
  const setDuration = useStore((s) => s.setDuration);
  const setIsPlaying = useStore((s) => s.setIsPlaying);
  const bgColor = useStore((s) => s.bgColor);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animFrameRef = useRef<number>(0);
  const isPlayingRef = useRef(false);

  const getMediaEl = useCallback(
    () => (mediaType === 'video' ? videoRef.current : audioRef.current),
    [mediaType],
  );

  // Keep a ref in sync so rAF callback can read latest isPlaying without re-creating itself
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // rAF loop: sync media time → store. Only runs while playing.
  useEffect(() => {
    if (!isPlaying) return;

    const el = getMediaEl();
    if (!el) return;

    const tick = () => {
      if (!isPlayingRef.current) return; // stopped playing, stop loop
      setCurrentTime(el.currentTime);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, getMediaEl, setCurrentTime]);

  // Sync play/pause store state → media element
  useEffect(() => {
    const el = getMediaEl();
    if (!el) return;
    console.debug('[MediaPlayer] isPlaying effect:', isPlaying, 'el.paused:', el.paused);
    if (isPlaying && el.paused) {
      el.play().catch((err) => console.debug('[MediaPlayer] play() rejected:', err));
    } else if (!isPlaying && !el.paused) {
      el.pause();
    }
  }, [isPlaying, getMediaEl]);

  // Seek: store.currentTime → media element. Only when paused.
  // During playback the media element drives time, not the store.
  useEffect(() => {
    if (isPlaying) return; // never seek during playback — avoid feedback loop
    const el = getMediaEl();
    if (!el) return;
    if (Math.abs(el.currentTime - currentTime) > 0.1) {
      console.debug('[MediaPlayer] seek to:', currentTime, 'el was:', el.currentTime);
      el.currentTime = currentTime;
    }
  }, [currentTime, isPlaying, getMediaEl]);

  const handleTimeUpdate = () => {
    const el = getMediaEl();
    if (el) {
      setDuration(el.duration || 0);
      // When paused, the media element still fires timeupdate on seek —
      // only sync time back to store when the media is actually playing
      if (!el.paused) {
        // no-op: rAF handles this
      } else {
        setCurrentTime(el.currentTime);
      }
    }
  };

  const handlePlay = () => {
    console.debug('[MediaPlayer] onPlay fired');
    setIsPlaying(true);
  };

  const handlePause = () => {
    console.debug('[MediaPlayer] onPause fired');
    setIsPlaying(false);
  };

  const handleEnded = () => {
    console.debug('[MediaPlayer] onEnded fired');
    setIsPlaying(false);
    setCurrentTime(duration);
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!mediaSrc) {
    return (
      <div className="media-player empty">
        <p>导入音频或视频文件以开始</p>
      </div>
    );
  }

  return (
    <div className="media-player">
      {mediaType === 'video' ? (
        <video
          ref={videoRef}
          src={mediaSrc}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onLoadedMetadata={handleTimeUpdate}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <div
          className="audio-background"
          style={{ backgroundColor: bgColor }}
        >
          <audio
            ref={audioRef}
            src={mediaSrc}
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onLoadedMetadata={handleTimeUpdate}
          />
          <span className="audio-label">音频模式</span>
        </div>
      )}
      <div className="time-display">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}
