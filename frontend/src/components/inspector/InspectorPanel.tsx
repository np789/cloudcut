import { useUIStore } from '@/state/uiStore';
import { useProjectStore } from '@/state/projectStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Props { projectId: string; }

export default function InspectorPanel({ projectId }: Props) {
  const { selectedClipIds } = useUIStore();
  const { clips, effects } = useProjectStore();

  const selectedClip = clips.find((c) => c.id === selectedClipIds[0]);
  const clipEffects = selectedClip ? (effects[selectedClip.id] || []) : [];

  if (!selectedClip) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">Select a clip to inspect it</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 flex flex-col gap-4">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Clip Info</h3>
          <div className="text-xs space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Position</span><span>{(selectedClip.trackPositionMs / 1000).toFixed(2)}s</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{(selectedClip.durationMs / 1000).toFixed(2)}s</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">In Point</span><span>{(selectedClip.inPointMs / 1000).toFixed(2)}s</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Out Point</span><span>{(selectedClip.outPointMs / 1000).toFixed(2)}s</span></div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Effects ({clipEffects.length})</h3>
          {clipEffects.length === 0 ? (
            <p className="text-xs text-muted-foreground">No effects. Full editor in Day 5.</p>
          ) : (
            clipEffects.map((effect) => (
              <div key={effect.id} className="text-xs p-2 bg-secondary rounded mb-1">
                {effect.type} — {effect.enabled ? 'enabled' : 'disabled'}
              </div>
            ))
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
