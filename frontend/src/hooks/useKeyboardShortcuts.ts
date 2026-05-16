import { useEffect } from 'react';
import { CommandManager } from '@/state/commands/CommandManager';
import { useProjectStore } from '@/state/projectStore';
import { useUIStore } from '@/state/uiStore';
import { usePlaybackStore } from '@/state/playbackStore';
import { createDeleteClipCommand } from '@/state/commands/ClipCommands';
import { clipsApi } from '@/services/api';

export function useKeyboardShortcuts(projectId: string) {
  const { selectedClipIds, deselectAll, setZoom, zoomLevel } = useUIStore();
  const { clips, removeClip } = useProjectStore();
  const { isPlaying, setIsPlaying, currentTimeMs, setCurrentTime } = usePlaybackStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;

      // Space: play/pause
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }

      // Ctrl+Z: undo
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        CommandManager.undo();
      }

      // Ctrl+Shift+Z or Ctrl+Y: redo
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyZ') ||
        ((e.metaKey || e.ctrlKey) && e.code === 'KeyY')
      ) {
        e.preventDefault();
        CommandManager.redo();
      }

      // Delete / Backspace: delete selected clips
      if ((e.code === 'Delete' || e.code === 'Backspace') && selectedClipIds.length > 0) {
        e.preventDefault();
        selectedClipIds.forEach((id) => {
          const clip = clips.find((c) => c.id === id);
          if (clip) {
            CommandManager.execute(createDeleteClipCommand(clip, projectId));
          }
        });
        deselectAll();
      }

      // Home: go to beginning
      if (e.code === 'Home') {
        e.preventDefault();
        setCurrentTime(0);
      }

      // + / - zoom
      if (e.code === 'Equal' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setZoom(zoomLevel * 1.3);
      }
      if (e.code === 'Minus' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setZoom(zoomLevel * 0.7);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    selectedClipIds,
    clips,
    isPlaying,
    currentTimeMs,
    zoomLevel,
    projectId,
    setIsPlaying,
    setCurrentTime,
    setZoom,
    deselectAll,
    removeClip,
  ]);
}
