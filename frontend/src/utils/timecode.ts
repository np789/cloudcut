// Format milliseconds as MM:SS:FF (frames at 30fps)
export function formatTimecode(ms: number, fps = 30): string {
  const totalSeconds = Math.floor(ms / 1000);
  const frames = Math.floor((ms % 1000) / (1000 / fps));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

// Format milliseconds as human-readable duration
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

// Convert pixels to milliseconds
export function pxToMs(px: number, zoomLevel: number): number {
  return px / zoomLevel;
}

// Convert milliseconds to pixels
export function msToPs(ms: number, zoomLevel: number): number {
  return ms * zoomLevel;
}
