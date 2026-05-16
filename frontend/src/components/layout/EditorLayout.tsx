import { useEffect } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { usePusher } from '@/hooks/usePusher';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import TopBar from '@/components/topbar/TopBar';
import AssetBrowser from '@/components/assets/AssetBrowser';
import VideoPlayer from '@/components/player/VideoPlayer';
import InspectorPanel from '@/components/inspector/InspectorPanel';
import Timeline from '@/components/timeline/Timeline';

interface Props { projectId: string | null; }

export default function EditorLayout({ projectId }: Props) {
  const { loadProject, project, isLoading } = useProjectStore();
  usePusher(projectId);
  useKeyboardShortcuts(projectId || '');

  useEffect(() => {
    if (projectId) loadProject(projectId);
  }, [projectId, loadProject]);

  if (!projectId) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--background)', color: 'var(--muted-foreground)'
      }}>
        No project selected.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--background)', color: 'var(--muted-foreground)'
      }}>
        Loading project...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--background)',
      color: 'var(--foreground)',
      overflow: 'hidden',
    }}>
      {/* Top Bar */}
      <TopBar project={project} />

      {/* Main area: top panels + bottom timeline */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top row: Assets | Player | Inspector */}
        <div style={{ flex: '0 0 60%', display: 'flex', overflow: 'hidden' }}>

          {/* Asset Browser */}
          <div style={{
            width: '200px',
            minWidth: '200px',
            borderRight: '1px solid var(--border)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <AssetBrowser projectId={projectId} />
          </div>

          {/* Video Player */}
          <div style={{ flex: 1, overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
            <VideoPlayer />
          </div>

          {/* Inspector */}
          <div style={{
            width: '260px',
            minWidth: '260px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <InspectorPanel projectId={projectId} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', flexShrink: 0 }} />

        {/* Timeline */}
        <div style={{ flex: '0 0 40%', overflow: 'hidden' }}>
          <Timeline projectId={projectId} />
        </div>
      </div>
    </div>
  );
}