import { useRef, useCallback } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { useUIStore } from '@/state/uiStore';
import { usePlaybackStore } from '@/state/playbackStore';
import { msToPs, pxToMs, formatTimecode } from '@/utils/timecode';
import TimelineTrack from './TimelineTrack';
import Playhead from './Playhead';

interface Props { projectId: string; }

export default function Timeline({ projectId }: Props) {
  const { tracks, clips } = useProjectStore();
  const { zoomLevel, scrollPosition, setScroll, setZoom } = useUIStore();
  const { currentTimeMs, setCurrentTime } = usePlaybackStore();
  const TRACK_HEIGHT = 56;
  const HEADER_WIDTH = 80;

  const totalDurationMs = Math.max(60000, ...clips.map(c => c.trackPositionMs + c.durationMs));
  const totalWidth = msToPs(totalDurationMs, zoomLevel) + 200;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setZoom(zoomLevel + (e.deltaY > 0 ? -0.01 : 0.01));
    } else {
      setScroll(scrollPosition + e.deltaY * 0.5);
    }
  }, [zoomLevel, scrollPosition, setZoom, setScroll]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--background)', borderTop: '1px solid var(--border)' }}
      onWheel={handleWheel}>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '4px 12px', borderBottom: '1px solid var(--border)',
        background: 'var(--card)', flexShrink: 0, height: '32px',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted-foreground)' }}>
          {formatTimecode(currentTimeMs)}
        </span>
        <div style={{ flex: 1 }} />
        {['+', '−', 'Fit'].map(label => (
          <button key={label} onClick={() => {
            if (label === '+') setZoom(zoomLevel * 1.3);
            else if (label === '−') setZoom(zoomLevel * 0.7);
            else setZoom(0.1);
          }} style={{
            padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)',
            background: 'var(--secondary)', color: 'var(--foreground)',
            fontSize: '12px', cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}
        onScroll={e => setScroll((e.target as HTMLDivElement).scrollLeft)}>
        <div style={{ width: totalWidth + HEADER_WIDTH, minHeight: '100%' }}>

          {/* Ruler */}
          <div style={{ display: 'flex', height: '24px', position: 'sticky', top: 0, zIndex: 10, background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: HEADER_WIDTH, minWidth: HEADER_WIDTH, borderRight: '1px solid var(--border)' }} />
            <div style={{ flex: 1, position: 'relative', cursor: 'pointer' }}
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left + scrollPosition;
                setCurrentTime(pxToMs(Math.max(0, x), zoomLevel));
              }}>
              {/* Ruler ticks */}
              {Array.from({ length: Math.ceil(totalDurationMs / 5000) }).map((_, i) => {
                const ms = i * 5000;
                const x = ms * zoomLevel;
                return (
                  <div key={ms} style={{ position: 'absolute', left: x, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ width: '1px', height: '8px', background: 'var(--border)' }} />
                    <span style={{ fontSize: '9px', color: 'var(--muted-foreground)', fontFamily: 'monospace', marginLeft: '2px' }}>
                      {ms >= 60000 ? `${Math.floor(ms/60000)}:${String(Math.floor((ms%60000)/1000)).padStart(2,'0')}` : `${ms/1000}s`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tracks */}
          {tracks.map(track => (
            <div key={track.id} style={{ display: 'flex', height: TRACK_HEIGHT, borderBottom: '1px solid var(--border)' }}>
              {/* Track header */}
              <div style={{
                width: HEADER_WIDTH, minWidth: HEADER_WIDTH,
                borderRight: '1px solid var(--border)',
                background: 'var(--card)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                padding: '0 8px',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: track.color }}>{track.label}</span>
                <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{track.type}</span>
              </div>

              {/* Clips area */}
              <div style={{ flex: 1, position: 'relative' }}>
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

        {/* Playhead */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: HEADER_WIDTH, right: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <Playhead currentTimeMs={currentTimeMs} zoomLevel={zoomLevel} scrollPosition={scrollPosition} />
        </div>
      </div>
    </div>
  );
}