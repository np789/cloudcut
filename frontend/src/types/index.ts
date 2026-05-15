export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO' | 'TEAM';
  ownerId: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  settings: { resolution: string; fps: number; aspectRatio: string };
  createdAt: string;
  updatedAt: string;
  tracks: Track[];
  assets: Asset[];
}

export interface Track {
  id: string;
  projectId: string;
  type: 'VIDEO' | 'AUDIO';
  label: string;
  orderIndex: number;
  isLocked: boolean;
  isMuted: boolean;
  color: string;
  clips: Clip[];
}

export interface Clip {
  id: string;
  trackId: string;
  projectId: string;
  assetId: string;
  trackPositionMs: number;
  inPointMs: number;
  outPointMs: number;
  durationMs: number;
  transform: { x: number; y: number; scale: number; rotation: number; opacity: number };
  effects: ClipEffect[];
  asset?: Asset;
}

export interface ClipEffect {
  id: string;
  clipId: string;
  type: string;
  orderIndex: number;
  params: Record<string, number>;
  enabled: boolean;
}

export interface Asset {
  id: string;
  projectId: string;
  type: 'VIDEO' | 'AUDIO' | 'IMAGE';
  originalUrl: string;
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
  metadata: {
    durationMs?: number;
    width?: number;
    height?: number;
    codec?: string;
    fileSizeBytes?: number;
  } | null;
  variants: AssetVariant[];
}

export interface AssetVariant {
  id: string;
  assetId: string;
  type: 'PROXY' | 'THUMBNAIL_STRIP' | 'WAVEFORM_DATA';
  url: string;
  metadata: Record<string, unknown> | null;
}

export interface ExportJob {
  id: string;
  projectId: string;
  status: 'QUEUED' | 'PROCESSING' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progressPercent: number;
  outputUrl: string | null;
  format: string;
  resolution: string;
}
