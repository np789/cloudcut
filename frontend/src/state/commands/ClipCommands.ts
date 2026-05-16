import { v4 as uuidv4 } from 'uuid';
import { Command } from './CommandManager';
import { useProjectStore } from '../projectStore';
import { clipsApi, effectsApi } from '@/services/api';
import { Clip, ClipEffect } from '@/types';

// ── Move Clip Command ──────────────────────────────────
export function createMoveClipCommand(
  clip: Clip,
  newPositionMs: number,
  projectId: string,
): Command {
  const originalPositionMs = clip.trackPositionMs;

  return {
    id: uuidv4(),
    type: 'clip.move',
    description: `Move clip to ${(newPositionMs / 1000).toFixed(1)}s`,
    timestamp: Date.now(),
    execute() {
      useProjectStore.getState().updateClipLocal(clip.id, { trackPositionMs: newPositionMs });
      clipsApi.update(projectId, clip.id, { trackPositionMs: newPositionMs }).catch(console.error);
    },
    undo() {
      useProjectStore.getState().updateClipLocal(clip.id, { trackPositionMs: originalPositionMs });
      clipsApi.update(projectId, clip.id, { trackPositionMs: originalPositionMs }).catch(console.error);
    },
  };
}

// ── Delete Clip Command ────────────────────────────────
export function createDeleteClipCommand(clip: Clip, projectId: string): Command {
  return {
    id: uuidv4(),
    type: 'clip.delete',
    description: `Delete clip`,
    timestamp: Date.now(),
    execute() {
      useProjectStore.getState().removeClip(clip.id);
      clipsApi.delete(projectId, clip.id).catch(console.error);
    },
    undo() {
      // Re-add the clip locally — API doesn't support un-delete easily
      // so we just restore it in UI state for now
      useProjectStore.getState().addClip(clip);
    },
  };
}

// ── Trim Clip Command ──────────────────────────────────
export function createTrimClipCommand(
  clip: Clip,
  newInPointMs: number,
  newOutPointMs: number,
  projectId: string,
): Command {
  const originalIn = clip.inPointMs;
  const originalOut = clip.outPointMs;

  return {
    id: uuidv4(),
    type: 'clip.trim',
    description: `Trim clip`,
    timestamp: Date.now(),
    execute() {
      const durationMs = newOutPointMs - newInPointMs;
      useProjectStore.getState().updateClipLocal(clip.id, {
        inPointMs: newInPointMs,
        outPointMs: newOutPointMs,
        durationMs,
      });
      clipsApi.update(projectId, clip.id, {
        inPointMs: newInPointMs,
        outPointMs: newOutPointMs,
      }).catch(console.error);
    },
    undo() {
      const durationMs = originalOut - originalIn;
      useProjectStore.getState().updateClipLocal(clip.id, {
        inPointMs: originalIn,
        outPointMs: originalOut,
        durationMs,
      });
      clipsApi.update(projectId, clip.id, {
        inPointMs: originalIn,
        outPointMs: originalOut,
      }).catch(console.error);
    },
  };
}

// ── Update Effect Command ──────────────────────────────
export function createUpdateEffectCommand(
  clipId: string,
  effectId: string,
  oldParams: Record<string, number>,
  newParams: Record<string, number>,
  projectId: string,
): Command {
  return {
    id: uuidv4(),
    type: 'effect.update',
    description: `Update effect`,
    timestamp: Date.now(),
    execute() {
      useProjectStore.getState().updateEffectLocal(clipId, effectId, { params: newParams });
      effectsApi.update(projectId, clipId, effectId, { params: newParams }).catch(console.error);
    },
    undo() {
      useProjectStore.getState().updateEffectLocal(clipId, effectId, { params: oldParams });
      effectsApi.update(projectId, clipId, effectId, { params: oldParams }).catch(console.error);
    },
  };
}
