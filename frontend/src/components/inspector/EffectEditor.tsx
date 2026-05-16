import { ClipEffect } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import { CommandManager } from '@/state/commands/CommandManager';
import { createUpdateEffectCommand } from '@/state/commands/ClipCommands';
import { effectsApi } from '@/services/api';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// Effect type configs: what sliders to show and their ranges
const EFFECT_CONFIGS: Record<string, { param: string; label: string; min: number; max: number; step: number }[]> = {
  brightness:  [{ param: 'value', label: 'Brightness', min: 0, max: 2, step: 0.05 }],
  contrast:    [{ param: 'value', label: 'Contrast',   min: 0, max: 2, step: 0.05 }],
  saturation:  [{ param: 'value', label: 'Saturation', min: 0, max: 2, step: 0.05 }],
  blur:        [{ param: 'value', label: 'Blur (px)',  min: 0, max: 20, step: 0.5 }],
  hue:         [{ param: 'value', label: 'Hue (deg)',  min: -180, max: 180, step: 1 }],
};

interface Props {
  effect: ClipEffect;
  clipId: string;
  projectId: string;
}

export default function EffectEditor({ effect, clipId, projectId }: Props) {
  const { updateEffectLocal, removeEffect } = useProjectStore();
  const config = EFFECT_CONFIGS[effect.type] || [];

  const handleToggle = (enabled: boolean) => {
    updateEffectLocal(clipId, effect.id, { enabled });
    effectsApi.update(projectId, clipId, effect.id, { enabled }).catch(console.error);
  };

  const handleParamChange = (param: string, value: number) => {
    const oldParams = { ...effect.params };
    const newParams = { ...effect.params, [param]: value };
    CommandManager.execute(
      createUpdateEffectCommand(clipId, effect.id, oldParams, newParams, projectId),
    );
  };

  const handleDelete = () => {
    removeEffect(clipId, effect.id);
    effectsApi.delete(projectId, clipId, effect.id).catch(console.error);
  };

  return (
    <div className="p-3 bg-secondary rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={effect.enabled}
            onCheckedChange={handleToggle}
            className="scale-75"
          />
          <span className="text-xs font-medium capitalize">{effect.type}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
        >
          ×
        </Button>
      </div>

      {effect.enabled && config.map(({ param, label, min, max, step }) => (
        <div key={param}>
          <div className="flex justify-between mb-1">
            <Label className="text-[10px] text-muted-foreground">{label}</Label>
            <span className="text-[10px] text-muted-foreground">
              {(effect.params[param] ?? 1).toFixed(step < 1 ? 2 : 0)}
            </span>
          </div>
          <Slider
            value={[effect.params[param] ?? 1]}
            min={min} max={max} step={step}
            onValueChange={([v]) => handleParamChange(param, v)}
          />
        </div>
      ))}
    </div>
  );
}
