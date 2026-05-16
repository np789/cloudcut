import { useRef, useEffect } from 'react';
import { usePlaybackStore } from '@/state/playbackStore';
import { useProjectStore } from '@/state/projectStore';
import { formatTimecode } from '@/utils/timecode';

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { currentTimeMs, isPlaying, volume, isMuted, setCurrentTime, setIsPlaying, setVolume, toggleMute } = usePlaybackStore();
  const { clips } = useProjectStore();

  const totalDurationMs = Math.max(60000, ...clips.map(c => c.trackPositionMs + c.durationMs));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.play().catch(() => setIsPlaying(false));
    else video.pause();
  }, [isPlaying, setIsPlaying]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') { e.preventDefault(); setIsPlaying(!isPlaying); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPlaying, setIsPlaying]);

  const progress = totalDurationMs > 0 ? (currentTimeMs / totalDurationMs) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000' }}>
      {/* Video area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <video ref={videoRef} style={{ maxWidth: '100%', maxHeight: '100%' }}
          onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime * 1000)}
          onEnded={() => setIsPlaying(false)} />
        <div style={{ position: 'absolute', color: 'rgba(255,255,255,0.3)', fontSize: '13px', pointerEvents: 'none' }}>
          No clip at current position
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '8px 12px', background: 'var(--card)', borderTop: '1px solid var(--border)' }}>
        {/* Progress bar */}
        <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', marginBottom: '8px', cursor: 'pointer' }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const ms = pct * totalDurationMs;
            setCurrentTime(ms);
            if (videoRef.current) videoRef.current.currentTime = ms / 1000;
          }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', borderRadius: '2px' }} />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setIsPlaying(!isPlaying)} style={{
            background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', fontSize: '16px', padding: '0 4px'
          }}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
            {formatTimecode(currentTimeMs)} / {formatTimecode(totalDurationMs)}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={toggleMute} style={{
            background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', fontSize: '14px'
          }}>
            {isMuted ? '🔇' : '🔊'}
          </button>
          <input type="range" min={0} max={1} step={0.05} value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            style={{ width: '60px', accentColor: 'var(--primary)' }} />
        </div>
      </div>
    </div>
  );
}