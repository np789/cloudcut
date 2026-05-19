import { useEffect, useState, useRef } from 'react';
import { Asset } from '@/types';
import { assetsApi } from '@/services/api';

interface Props { projectId: string; }

const statusColor: Record<string, string> = {
  READY: '#22c55e',
  PROCESSING: '#3b82f6',
  UPLOADING: '#eab308',
  FAILED: '#ef4444',
};

const typeIcon: Record<string, string> = {
  VIDEO: '🎬',
  AUDIO: '🎵',
  IMAGE: '🖼️',
};

function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const media = file.type.startsWith('video')
      ? document.createElement('video')
      : document.createElement('audio');
    media.src = url;
    media.onloadedmetadata = () => {
      resolve(Math.round(media.duration * 1000));
      URL.revokeObjectURL(url);
    };
    media.onerror = () => resolve(0);
  });
}

export default function AssetBrowser({ projectId }: Props) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tab, setTab] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingName, setUploadingName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAssets(); }, [projectId]);

  const loadAssets = () => {
    assetsApi.list(projectId).then(setAssets).catch(() => {});
  };

  const getDisplayName = (asset: Asset) => {
    const meta = asset.metadata as any;
    if (meta?.filename) {
      const name = meta.filename as string;
      // Remove UUID prefix (format: uuid-uuid-uuid-uuid-uuid-filename.ext)
      const parts = name.split('-');
      if (parts.length > 5) return parts.slice(5).join('-');
      return name;
    }
    return asset.type;
  };

  const getDuration = (asset: Asset) => {
    const meta = asset.metadata as any;
    if (meta?.durationMs && meta.durationMs > 0) {
      return `${(meta.durationMs / 1000).toFixed(1)}s`;
    }
    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadingName(file.name);

    try {
      const type = file.type.startsWith('video') ? 'VIDEO'
        : file.type.startsWith('audio') ? 'AUDIO' : 'IMAGE';

      // Read real duration from file before uploading
      let durationMs = 0;
      if (file.type.startsWith('video') || file.type.startsWith('audio')) {
        durationMs = await getMediaDuration(file);
      }

      const { uploadUrl, key } = await assetsApi.getPresignedUrl(
        projectId, file.name, type, file.type,
      );

      await uploadToS3(uploadUrl, file, setUploadProgress);
      await assetsApi.confirmUpload(projectId, type, key, file.name, durationMs);

      setUploadProgress(100);
      setTimeout(() => {
        loadAssets();
        setUploading(false);
        setUploadProgress(0);
        setUploadingName('');
      }, 800);

    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please check your AWS credentials.');
      setUploading(false);
      setUploadProgress(0);
      setUploadingName('');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadToS3 = (url: string, file: File, onProgress: (pct: number) => void) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed: ${xhr.status}`));
      });
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.send(file);
    });
  };

  const filtered = tab === 'all' ? assets
    : assets.filter(a => a.type === tab.toUpperCase());

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--card)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
          color: 'var(--muted-foreground)', textTransform: 'uppercase',
        }}>
          Assets
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '3px 10px', borderRadius: '4px', border: 'none',
            background: 'var(--primary)', color: 'white',
            fontSize: '11px', cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.7 : 1,
          }}
        >
          {uploading ? `${uploadProgress}%` : '+ Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*,image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      {/* Upload progress */}
      {uploading && (
        <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            fontSize: '11px', color: 'var(--muted-foreground)',
            marginBottom: '4px', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {uploadingName} — {uploadProgress}%
          </div>
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
            <div style={{
              height: '100%', width: `${uploadProgress}%`,
              background: 'var(--primary)', borderRadius: '2px',
              transition: 'width 0.2s ease',
            }} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', padding: '8px',
        borderBottom: '1px solid var(--border)',
      }}>
        {['all', 'video', 'audio'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '3px 10px', borderRadius: '4px', border: 'none',
            fontSize: '12px', cursor: 'pointer',
            background: tab === t ? 'var(--primary)' : 'var(--secondary)',
            color: tab === t ? 'white' : 'var(--muted-foreground)',
            textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {/* Asset list */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '8px',
        display: 'flex', flexDirection: 'column', gap: '4px',
      }}>
        {filtered.map(asset => (
          <div
            key={asset.id}
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('assetId', asset.id);
              e.dataTransfer.setData('assetType', asset.type);
            }}
            style={{
              padding: '8px 10px',
              background: 'var(--secondary)',
              borderRadius: '6px',
              cursor: 'grab',
              border: '1px solid var(--border)',
              userSelect: 'none',
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', gap: '4px',
            }}>
              <span style={{
                fontSize: '12px', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis', flex: 1,
              }}>
                {typeIcon[asset.type]} {getDisplayName(asset)}
              </span>
              <span style={{
                fontSize: '10px', color: statusColor[asset.status],
                fontWeight: 600, flexShrink: 0,
              }}>
                {asset.status}
              </span>
            </div>
            {getDuration(asset) && (
              <div style={{
                fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px'
              }}>
                {getDuration(asset)}
              </div>
            )}
            <div style={{
              fontSize: '10px', color: 'var(--muted-foreground)',
              marginTop: '2px', opacity: 0.6,
            }}>
              drag to timeline
            </div>
          </div>
        ))}
        {filtered.length === 0 && !uploading && (
          <div style={{ padding: '16px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>
              No {tab} assets yet
            </p>
            <p style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
              Click "+ Upload" to add a file
            </p>
          </div>
        )}
      </div>
    </div>
  );
}