import { useState, useCallback } from 'react';
import { Clip } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import { CommandManager } from '@/state/commands/CommandManager';
import { clipsApi } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { v4 as uuidv4 } from 'uuid';

interface Props { clip: Clip; projectId: string; }

export default function TransformEditor({ clip, projectId }: Props) {
  const { updateClipLocal } = useProjectStore();
  const transform = clip.transform;

  // Debounced save to API
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (field: string, value: number) => {
      const oldTransform = { ...transform };
      const newTransform = { ...transform, [field]: value };
      updateClipLocal(clip.id, { transform: newTransform });

      if (saveTimeout) clearTimeout(saveTimeout);
      const t = setTimeout(() => {
        CommandManager.execute({
          id: uuidv4(),
          type: 'clip.transform',
          description: `Change ${field}`,
          timestamp: Date.now(),
          execute() {
            updateClipLocal(clip.id, { transform: newTransform });
            clipsApi.update(projectId, clip.id, { transform: newTransform }).catch(console.error);
          },
          undo() {
            updateClipLocal(clip.id, { transform: oldTransform });
            clipsApi.update(projectId, clip.id, { transform: oldTransform }).catch(console.error);
          },
        });
      }, 300);
      setSaveTimeout(t);
    },
    [clip, transform, updateClipLocal, projectId, saveTimeout],
  );

  return (
    <div className="space-y-3">
      {/* X / Y */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground">X</Label>
          <Input
            type="number"
            value={transform.x}
            onChange={(e) => handleChange('x', parseFloat(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Y</Label>
          <Input
            type="number"
            value={transform.y}
            onChange={(e) => handleChange('y', parseFloat(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* Scale */}
      <div>
        <div className="flex justify-between mb-1">
          <Label className="text-[10px] text-muted-foreground">Scale</Label>
          <span className="text-[10px] text-muted-foreground">{transform.scale.toFixed(2)}×</span>
        </div>
        <Slider
          value={[transform.scale]}
          min={0.1} max={3} step={0.05}
          onValueChange={([v]) => handleChange('scale', v)}
        />
      </div>

      {/* Rotation */}
      <div>
        <div className="flex justify-between mb-1">
          <Label className="text-[10px] text-muted-foreground">Rotation</Label>
          <span className="text-[10px] text-muted-foreground">{transform.rotation}°</span>
        </div>
        <Slider
          value={[transform.rotation]}
          min={-180} max={180} step={1}
          onValueChange={([v]) => handleChange('rotation', v)}
        />
      </div>

      {/* Opacity */}
      <div>
        <div className="flex justify-between mb-1">
          <Label className="text-[10px] text-muted-foreground">Opacity</Label>
          <span className="text-[10px] text-muted-foreground">{Math.round(transform.opacity * 100)}%</span>
        </div>
        <Slider
          value={[transform.opacity]}
          min={0} max={1} step={0.01}
          onValueChange={([v]) => handleChange('opacity', v)}
        />
      </div>
    </div>
  );
}
