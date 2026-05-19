import { useState } from 'react';
import { Track } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import { useUIStore } from '@/state/uiStore';
import { pxToMs } from '@/utils/timecode';
import { clipsApi } from '@/services/api';
import TimelineClip from './TimelineClip';

interface Props {
  track: Track;
  projectId: string;
  zoomLevel: number;
  scrollPosition: number;
  trackHeight: number;
}

export default function TimelineTrack({
  track, projectId, zoomLevel, scrollPosition, trackHeight
}: Props) {
  const { clips, assets, addClip, loadProject } = useProjectStore();
  const { deselectAll } = useUIStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDropping, setIsDropping] = useState(false);

  const trackClips = clips.filter(c => c.trackId === track.id);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const assetId = e.dataTransfer.getData('assetId');
    if (!assetId) return;

    setIsDropping(true);

    // Calculate drop position in ms
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollPosition;
    const positionMs = Math.max(0, Math.round(pxToMs(x, zoomLevel) / 100) * 100);

    // Get real duration from asset metadata
    const asset = assets.find(a => a.id === assetId);
    const durationMs = asset?.metadata?.durationMs || 10000;

    try {
      await clipsApi.create(projectId, {
        trackId: track.id,
        assetId,
        trackPositionMs: positionMs,
        inPointMs: 0,
        outPointMs: durationMs,
      });

      // Reload project to get fresh data with all relations
      await loadProject(projectId);
    } catch (err) {
      console.error('Failed to create clip:', err);
    } finally {
      setIsDropping(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: isDragOver ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
        border: isDragOver ? '1px dashed var(--primary)' : '1px solid transparent',
        transition: 'background 0.15s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) deselectAll(); }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {trackClips.map(clip => (
        <TimelineClip
          key={clip.id}
          clip={clip}
          track={track}
          projectId={projectId}
          zoomLevel={zoomLevel}
          trackHeight={trackHeight}
        />
      ))}

      {isDragOver && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', color: 'var(--primary)', pointerEvents: 'none',
        }}>
          {isDropping ? 'Adding...' : 'Drop to add clip'}
        </div>
      )}
    </div>
  );
}