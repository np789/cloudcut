import { useRef, useCallback } from 'react';
import { usePlaybackStore } from '@/state/playbackStore';
import { pxToMs } from '@/utils/timecode';

interface Props {
  currentTimeMs: number;
  zoomLevel: number;
  scrollPosition: number;
}

export default function Playhead({ currentTimeMs, zoomLevel, scrollPosition }: Props) {
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime);
  const draggingRef = useRef(false);
  const x = currentTimeMs * zoomLevel - scrollPosition;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      const onMove = (ev: MouseEvent) => {
        if (!draggingRef.current) return;
        const container = (e.target as HTMLElement).closest('.timeline-container');
        if (container) {
          const rect = container.getBoundingClientRect();
          const relX = ev.clientX - rect.left + scrollPosition;
          setCurrentTime(pxToMs(Math.max(0, relX), zoomLevel));
        }
      };
      const onUp = () => {
        draggingRef.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [scrollPosition, zoomLevel, setCurrentTime],
  );

  if (x < 0 || x > 5000) return null; // Off-screen

  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-auto cursor-col-resize"
      style={{ left: x, width: 1 }}
      onMouseDown={handleMouseDown}
    >
      {/* Playhead line */}
      <div className="absolute inset-0 bg-red-500 w-px" />
      {/* Playhead handle triangle */}
      <div
        className="absolute top-0 -left-2 w-4 h-4 cursor-grab"
        style={{
          clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
          background: 'hsl(0 84% 60%)',
          transform: 'scaleY(-1)',
        }}
      />
    </div>
  );
}
