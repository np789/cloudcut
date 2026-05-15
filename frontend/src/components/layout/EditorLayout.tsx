import { useEffect } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { useProjectStore } from '@/state/projectStore';
import { usePusher } from '@/hooks/usePusher';
import TopBar from '@/components/topbar/TopBar';
import AssetBrowser from '@/components/assets/AssetBrowser';
import VideoPlayer from '@/components/player/VideoPlayer';
import InspectorPanel from '@/components/inspector/InspectorPanel';
import Timeline from '@/components/timeline/Timeline';

interface Props { projectId: string | null; }

export default function EditorLayout({ projectId }: Props) {
  const { loadProject, project, isLoading } = useProjectStore();
  usePusher(projectId);

  useEffect(() => {
    if (projectId) loadProject(projectId);
  }, [projectId, loadProject]);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">No project selected.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <TopBar project={project} />
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="vertical">
          {/* Top section: browser + player + inspector */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={20} minSize={15}>
                <AssetBrowser projectId={projectId} />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={55} minSize={30}>
                <VideoPlayer />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={25} minSize={20}>
                <InspectorPanel projectId={projectId} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle />
          {/* Bottom: Timeline */}
          <ResizablePanel defaultSize={40} minSize={20}>
            <Timeline projectId={projectId} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
