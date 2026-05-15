import { useRef, useEffect } from 'react';
import { usePlaybackStore } from '@/state/playbackStore';
import { useProjectStore } from '@/state/projectStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatTimecode } from '@/utils/timecode';

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { currentTimeMs, isPlaying, volume, isMuted, setCurrentTime, setIsPlaying, setVolume, toggleMute } = usePlaybackStore();
  const { project, clips } = useProjectStore();

  // Find the current clip based on playhead position
  const currentClip = clips.find(
    (c) => currentTimeMs >= c.trackPositionMs && currentTimeMs < c.trackPositionMs + c.durationMs,
  );

  const totalDurationMs = Math.max(60000, ...clips.map((c) => c.trackPositionMs + c.durationMs));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  }, [isPlaying, setIsPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime * 1000);
  };

  const handleSeek = (values: number[]) => {
    const ms = values[0];
    setCurrentTime(ms);
    if (videoRef.current) videoRef.current.currentTime = ms / 1000;
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  // Keyboard shortcut: space = play/pause
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPlaying]);

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Video */}
      <div className="flex-1 flex items-center justify-center relative">
        <video
          ref={videoRef}
          className="max-w-full max-h-full"
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
        {!currentClip && (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
            No clip at current position
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-2 bg-card border-t border-border">
        {/* Seek bar */}
        <Slider
          value={[currentTimeMs]}
          min={0}
          max={totalDurationMs}
          step={100}
          onValueChange={handleSeek}
          className="mb-2"
        />
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={togglePlay} className="text-xs px-2">
            {isPlaying ? '⏸' : '▶'}
          </Button>
          <span className="font-mono text-xs text-muted-foreground">
            {formatTimecode(currentTimeMs)} / {formatTimecode(totalDurationMs)}
          </span>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" className="text-xs px-2" onClick={toggleMute}>
            {isMuted ? '🔇' : '🔊'}
          </Button>
          <Slider
            value={[volume]}
            min={0} max={1} step={0.05}
            onValueChange={([v]) => setVolume(v)}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}
