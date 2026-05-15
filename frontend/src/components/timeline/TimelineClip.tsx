import { useRef, useCallback } from 'react';
import { Clip, Track } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import { useUIStore } from '@/state/uiStore';
import { msToPs, pxToMs, formatDuration } from '@/utils/timecode';
import { clipsApi } from '@/services/api';

interface Props {
  clip: Clip;
  track: Track;
  projectId: string;
  zoomLevel: number;
  trackHeight: number;
}

export default function TimelineClip({ clip, track, projectId, zoomLevel, trackHeight }: Props) {
  const { updateClipLocal, removeClip } = useProjectStore();
  const { selectedClipIds, selectClip, snapEnabled, zoomLevel: zoom } = useUIStore();

  const isSelected = selectedClipIds.includes(clip.id);
  const left = msToPs(clip.trackPositionMs, zoomLevel);
  const width = Math.max(8, msToPs(clip.durationMs, zoomLevel));
  const PADDING = 4;

  const dragStartRef = useRef<{ mouseX: number; originalPositionMs: number } | null>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      selectClip(clip.id, e.shiftKey);

      dragStartRef.current = {
        mouseX: e.clientX,
        originalPositionMs: clip.trackPositionMs,
      };

      const onMove = (ev: MouseEvent) => {
        if (!dragStartRef.current) return;
        const deltaX = ev.clientX - dragStartRef.current.mouseX;
        const deltaMs = pxToMs(deltaX, zoomLevel);
        const newPos = Math.max(0, dragStartRef.current.originalPositionMs + deltaMs);
        // Snap to nearest 100ms when snap is enabled
        const snapped = snapEnabled ? Math.round(newPos / 100) * 100 : newPos;
        updateClipLocal(clip.id, { trackPositionMs: snapped });
      };

      const onUp = async (ev: MouseEvent) => {
        if (!dragStartRef.current) return;
        const deltaX = ev.clientX - dragStartRef.current.mouseX;
        const deltaMs = pxToMs(deltaX, zoomLevel);
        const newPos = Math.max(0, dragStartRef.current.originalPositionMs + deltaMs);
        const snapped = snapEnabled ? Math.round(newPos / 100) * 100 : newPos;

        // Only save to API if we actually moved
        if (Math.abs(snapped - dragStartRef.current.originalPositionMs) > 50) {
          try {
            await clipsApi.update(projectId, clip.id, { trackPositionMs: snapped });
          } catch {
            // Rollback on error
            updateClipLocal(clip.id, { trackPositionMs: dragStartRef.current.originalPositionMs });
          }
        }

        dragStartRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [clip, zoomLevel, snapEnabled, selectClip, updateClipLocal, projectId],
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      removeClip(clip.id);
      await clipsApi.delete(projectId, clip.id);
    },
    [clip.id, projectId, removeClip],
  );

  return (
    <div
      className={`absolute top-1 rounded cursor-grab group transition-none ${
        isSelected
          ? 'ring-2 ring-white ring-offset-1 ring-offset-background'
          : 'hover:brightness-110'
      }`}
      style={{
        left,
        width,
        height: trackHeight - 8,
        backgroundColor: track.type === 'VIDEO' ? '#6c63ff' : '#43e97b',
        opacity: 0.9,
      }}
      onMouseDown={handleDragStart}
      onClick={(e) => { e.stopPropagation(); selectClip(clip.id, e.shiftKey); }}
    >
      {/* Clip label */}
      <div className="px-2 py-1 text-white text-[10px] font-medium truncate pointer-events-none">
        {formatDuration(clip.durationMs)}
      </div>

      {/* Delete button (shows on hover) */}
      {isSelected && (
        <button
          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 z-10"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleDelete}
        >
          ×
        </button>
      )}

      {/* Left trim handle */}
      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/20 rounded-l" />
      {/* Right trim handle */}
      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/20 rounded-r" />
    </div>
  );
}
