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
  const { selectedClipIds, selectClip, snapEnabled } = useUIStore();

  const isSelected = selectedClipIds.includes(clip.id);
  const left = msToPs(clip.trackPositionMs, zoomLevel);
  const width = Math.max(8, msToPs(clip.durationMs, zoomLevel));
  const bgColor = track.type === 'VIDEO' ? '#6c63ff' : '#22c55e';
  const icon = track.type === 'VIDEO' ? '🎬' : '🎵';

  const dragStartRef = useRef<{ mouseX: number; originalPositionMs: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectClip(clip.id, e.shiftKey);

    dragStartRef.current = {
      mouseX: e.clientX,
      originalPositionMs: clip.trackPositionMs,
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaMs = pxToMs(ev.clientX - dragStartRef.current.mouseX, zoomLevel);
      const newPos = Math.max(0, dragStartRef.current.originalPositionMs + deltaMs);
      const snapped = snapEnabled ? Math.round(newPos / 100) * 100 : newPos;
      updateClipLocal(clip.id, { trackPositionMs: snapped });
    };

    const onUp = async (ev: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaMs = pxToMs(ev.clientX - dragStartRef.current.mouseX, zoomLevel);
      const newPos = Math.max(0, dragStartRef.current.originalPositionMs + deltaMs);
      const snapped = snapEnabled ? Math.round(newPos / 100) * 100 : newPos;

      if (Math.abs(snapped - dragStartRef.current.originalPositionMs) > 50) {
        try {
          await clipsApi.update(projectId, clip.id, { trackPositionMs: snapped });
        } catch {
          updateClipLocal(clip.id, {
            trackPositionMs: dragStartRef.current!.originalPositionMs,
          });
        }
      }

      dragStartRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [clip, zoomLevel, snapEnabled, selectClip, updateClipLocal, projectId]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeClip(clip.id);
    try {
      await clipsApi.delete(projectId, clip.id);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, [clip.id, projectId, removeClip]);

  return (
    <div
      style={{
        position: 'absolute',
        left,
        width,
        top: 4,
        height: trackHeight - 8,
        backgroundColor: bgColor,
        borderRadius: '5px',
        cursor: 'grab',
        overflow: 'hidden',
        userSelect: 'none',
        boxShadow: isSelected ? '0 0 0 2px white' : 'none',
      }}
      onMouseDown={handleMouseDown}
      onClick={e => { e.stopPropagation(); selectClip(clip.id, e.shiftKey); }}
    >
      {/* Label */}
      <div style={{
        padding: '4px 8px',
        color: 'white',
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        pointerEvents: 'none',
      }}>
        {icon} {formatDuration(clip.durationMs)}
      </div>

      {/* Delete button - only show when selected */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: 3,
            right: 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#ef4444',
            color: 'white',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            fontWeight: 700,
            lineHeight: 1,
          }}
          onMouseDown={e => e.stopPropagation()}
          onClick={handleDelete}
        >
          ×
        </div>
      )}
    </div>
  );
}