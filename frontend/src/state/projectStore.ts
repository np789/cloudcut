import { create } from 'zustand';
import { Project, Track, Clip, ClipEffect, Asset } from '@/types';
import { projectsApi } from '@/services/api';

interface ProjectState {
  project: Project | null;
  tracks: Track[];
  clips: Clip[];
  assets: Asset[];
  effects: Record<string, ClipEffect[]>;
  isLoading: boolean;
  error: string | null;

  loadProject: (id: string) => Promise<void>;
  addClip: (clip: Clip) => void;
  updateClipLocal: (clipId: string, changes: Partial<Clip>) => void;
  removeClip: (clipId: string) => void;
  addEffect: (clipId: string, effect: ClipEffect) => void;
  updateEffectLocal: (clipId: string, effectId: string, changes: Partial<ClipEffect>) => void;
  removeEffect: (clipId: string, effectId: string) => void;
  applyRemoteOperation: (operation: { type: string; payload: Record<string, unknown> }) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  tracks: [],
  clips: [],
  assets: [],
  effects: {},
  isLoading: false,
  error: null,

  loadProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await projectsApi.get(id);
      const clips: Clip[] = [];
      const effects: Record<string, ClipEffect[]> = {};

      for (const track of project.tracks) {
        for (const clip of track.clips) {
          clips.push(clip);
          effects[clip.id] = clip.effects || [];
        }
      }

      set({
        project,
        tracks: project.tracks,
        clips,
        assets: project.assets || [],
        effects,
        isLoading: false,
      });
    } catch (e) {
      set({ error: 'Failed to load project', isLoading: false });
    }
  },

  addClip: (clip: Clip) =>
    set((state) => ({
      clips: [...state.clips, clip],
      effects: { ...state.effects, [clip.id]: [] },
    })),

  updateClipLocal: (clipId: string, changes: Partial<Clip>) =>
    set((state) => ({
      clips: state.clips.map((c) => (c.id === clipId ? { ...c, ...changes } : c)),
    })),

  removeClip: (clipId: string) =>
    set((state) => {
      const newEffects = { ...state.effects };
      delete newEffects[clipId];
      return {
        clips: state.clips.filter((c) => c.id !== clipId),
        effects: newEffects,
      };
    }),

  addEffect: (clipId: string, effect: ClipEffect) =>
    set((state) => ({
      effects: {
        ...state.effects,
        [clipId]: [...(state.effects[clipId] || []), effect],
      },
    })),

  updateEffectLocal: (clipId: string, effectId: string, changes: Partial<ClipEffect>) =>
    set((state) => ({
      effects: {
        ...state.effects,
        [clipId]: (state.effects[clipId] || []).map((e) =>
          e.id === effectId ? { ...e, ...changes } : e
        ),
      },
    })),

  removeEffect: (clipId: string, effectId: string) =>
    set((state) => ({
      effects: {
        ...state.effects,
        [clipId]: (state.effects[clipId] || []).filter((e) => e.id !== effectId),
      },
    })),

  applyRemoteOperation: (operation) => {
    const { type, payload } = operation;
    const p = payload as Record<string, unknown>;
    switch (type) {
      case 'clip.update':
        get().updateClipLocal(p.clipId as string, p.changes as Partial<Clip>);
        break;
      case 'clip.delete':
        get().removeClip(p.clipId as string);
        break;
      case 'clip.add':
        get().addClip(p.clip as Clip);
        break;
      case 'effect.update':
        get().updateEffectLocal(p.clipId as string, p.effectId as string, p.changes as Partial<ClipEffect>);
        break;
      case 'effect.delete':
        get().removeEffect(p.clipId as string, p.effectId as string);
        break;
    }
  },
}));