import { useUIStore } from '@/state/uiStore';
import { useProjectStore } from '@/state/projectStore';

interface Props { projectId: string; }

export default function InspectorPanel({ projectId }: Props) {
  const { selectedClipIds } = useUIStore();
  const { clips, effects } = useProjectStore();
  const selectedClip = clips.find(c => c.id === selectedClipIds[0]);
  const clipEffects = selectedClip ? (effects[selectedClip.id] || []) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--card)' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
          Inspector
        </div>
      </div>

      {!selectedClip ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', textAlign: 'center' }}>
            Select a clip on the timeline to edit it
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Clip Info */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Clip Info
            </div>
            {[
              ['Position', `${(selectedClip.trackPositionMs / 1000).toFixed(2)}s`],
              ['Duration', `${(selectedClip.durationMs / 1000).toFixed(2)}s`],
              ['In Point', `${(selectedClip.inPointMs / 1000).toFixed(2)}s`],
              ['Out Point', `${(selectedClip.outPointMs / 1000).toFixed(2)}s`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>

          {/* Effects */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Effects ({clipEffects.length})
            </div>
            {clipEffects.map(effect => (
              <div key={effect.id} style={{
                padding: '8px', background: 'var(--secondary)', borderRadius: '6px',
                fontSize: '12px', marginBottom: '4px',
              }}>
                {effect.type} — {effect.enabled ? '✓ enabled' : '○ disabled'}
              </div>
            ))}
            {clipEffects.length === 0 && (
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>No effects applied</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}