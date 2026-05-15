import { useRef, useCallback, useEffect } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { useUIStore } from '@/state/uiStore';
import { usePlaybackStore } from '@/state/playbackStore';
import { msToPs, pxToMs, formatTimecode } from '@/utils/timecode';
import TimelineTrack from './TimelineTrack';
import TimelineRuler from './TimelineRuler';
import Playhead from './Playhead';

interface Props { projectId: string; }

export default function Timeline({ projectId }: Props) {
  const { tracks, clips } = useProjectStore();
  const { zoomLevel, scrollPosition, setScroll, setZoom } = useUIStore();
  const { currentTimeMs, setCurrentTime } = usePlaybackStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const TRACK_HEIGHT = 64;
  const RULER_HEIGHT = 32;
  const HEADER_WIDTH = 96;

  // Total timeline duration based on the latest clip end
  const totalDurationMs = Math.max(
    60000,
    ...clips.map((c) => c.trackPositionMs + c.durationMs),
  );
  const totalWidth = msToPs(totalDurationMs, zoomLevel) + 200;

  // Wheel handler for zoom (Ctrl+scroll) and pan (scroll)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.01 : 0.01;
        setZoom(zoomLevel + delta);
      } else {
        setScroll(scrollPosition + e.deltaY * 0.5);
      }
    },
    [zoomLevel, scrollPosition, setZoom, setScroll],
  );

  // Click on ruler to seek
  const handleRulerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollPosition - HEADER_WIDTH;
      const newTime = pxToMs(Math.max(0, x), zoomLevel);
      setCurrentTime(newTime);
    },
    [scrollPosition, zoomLevel, setCurrentTime],
  );

  return (
    <div
      className="flex flex-col h-full bg-background border-t border-border select-none"
      onWheel={handleWheel}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-border bg-card text-xs">
        <span className="text-muted-foreground font-mono">
          {formatTimecode(currentTimeMs)}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => setZoom(zoomLevel * 1.3)}
          className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground"
        >
          +
        </button>
        <button
          onClick={() => setZoom(zoomLevel * 0.7)}
          className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground"
        >
          −
        </button>
        <button
          onClick={() => setZoom(0.1)}
          className="px-2 py-0.5 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground"
        >
          Fit
        </button>
      </div>

      {/* Main scroll area */}
      <div className="flex-1 overflow-hidden relative" ref={containerRef}>
        <div
          className="absolute inset-0 overflow-x-auto overflow-y-auto"
          onScroll={(e) => setScroll((e.target as HTMLDivElement).scrollLeft)}
        >
          <div style={{ width: totalWidth + HEADER_WIDTH, minHeight: '100%' }}>
            {/* Ruler row */}
            <div className="flex sticky top-0 z-20 bg-card border-b border-border">
              {/* Track header spacer */}
              <div style={{ width: HEADER_WIDTH, minWidth: HEADER_WIDTH }} className="border-r border-border" />
              {/* Ruler */}
              <div
                className="relative flex-1 cursor-pointer"
                style={{ height: RULER_HEIGHT }}
                onClick={handleRulerClick}
              >
                <TimelineRuler
                  totalDurationMs={totalDurationMs}
                  zoomLevel={zoomLevel}
                  scrollPosition={scrollPosition}
                  height={RULER_HEIGHT}
                />
              </div>
            </div>

            {/* Tracks */}
            {tracks.map((track) => (
              <div key={track.id} className="flex border-b border-border" style={{ height: TRACK_HEIGHT }}>
                {/* Track header */}
                <div
                  style={{ width: HEADER_WIDTH, minWidth: HEADER_WIDTH }}
                  className="flex flex-col justify-center px-2 border-r border-border bg-card"
                >
                  <span
                    className="text-xs font-semibold truncate"
                    style={{ color: track.color }}
                  >
                    {track.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{track.type}</span>
                </div>
                {/* Clip area */}
                <div
                  className="relative flex-1"
                  style={{ height: TRACK_HEIGHT }}
                >
                  <TimelineTrack
                    track={track}
                    projectId={projectId}
                    zoomLevel={zoomLevel}
                    scrollPosition={scrollPosition}
                    trackHeight={TRACK_HEIGHT}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Playhead overlay (positioned over the entire scrollable content) */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: HEADER_WIDTH, right: 0, overflow: 'hidden' }}
        >
          <Playhead
            currentTimeMs={currentTimeMs}
            zoomLevel={zoomLevel}
            scrollPosition={scrollPosition}
          />
        </div>
      </div>
    </div>
  );
}
