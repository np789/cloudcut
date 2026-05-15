import { Track } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import { useUIStore } from '@/state/uiStore';
import TimelineClip from './TimelineClip';

interface Props {
  track: Track;
  projectId: string;
  zoomLevel: number;
  scrollPosition: number;
  trackHeight: number;
}

export default function TimelineTrack({ track, projectId, zoomLevel, scrollPosition, trackHeight }: Props) {
  const { clips } = useProjectStore();
  const { deselectAll } = useUIStore();

  const trackClips = clips.filter((c) => c.trackId === track.id);

  return (
    <div
      className="absolute inset-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) deselectAll();
      }}
    >
      {trackClips.map((clip) => (
        <TimelineClip
          key={clip.id}
          clip={clip}
          track={track}
          projectId={projectId}
          zoomLevel={zoomLevel}
          trackHeight={trackHeight}
        />
      ))}
    </div>
  );
}
