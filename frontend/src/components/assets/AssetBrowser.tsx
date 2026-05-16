import { useEffect, useState } from 'react';
import { Asset } from '@/types';
import { assetsApi } from '@/services/api';

interface Props { projectId: string; }

const statusColor: Record<string, string> = {
  READY: '#22c55e',
  PROCESSING: '#3b82f6',
  UPLOADING: '#eab308',
  FAILED: '#ef4444',
};

export default function AssetBrowser({ projectId }: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    assetsApi.list(projectId).then(setAssets).catch(() => {});
  }, [projectId]);

  const filtered = tab === 'all' ? assets : assets.filter(a => a.type === tab.toUpperCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--card)' }}>
      {/* Header */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
          Assets
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '8px', borderBottom: '1px solid var(--border)' }}>
        {['all', 'video', 'audio'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '3px 10px',
            borderRadius: '4px',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer',
            background: tab === t ? 'var(--primary)' : 'var(--secondary)',
            color: tab === t ? 'white' : 'var(--muted-foreground)',
            textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {/* Asset list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filtered.map(asset => (
          <div key={asset.id} draggable onDragStart={e => e.dataTransfer.setData('assetId', asset.id)}
            style={{
              padding: '8px 10px',
              background: 'var(--secondary)',
              borderRadius: '6px',
              cursor: 'grab',
              border: '1px solid var(--border)',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 500 }}>{asset.type}</span>
              <span style={{ fontSize: '10px', color: statusColor[asset.status], fontWeight: 600 }}>
                {asset.status}
              </span>
            </div>
            {asset.metadata?.durationMs && (
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                {(asset.metadata.durationMs / 1000).toFixed(1)}s
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', padding: '8px' }}>
            No {tab} assets
          </p>
        )}
      </div>
    </div>
  );
}