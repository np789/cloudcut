import { create } from 'zustand';

interface UIState {
  selectedClipIds: string[];
  zoomLevel: number;        // pixels per millisecond
  scrollPosition: number;   // horizontal scroll offset in px
  activeTool: 'select' | 'blade' | 'hand';
  snapEnabled: boolean;

  selectClip: (id: string, additive?: boolean) => void;
  deselectAll: () => void;
  setZoom: (level: number) => void;
  setScroll: (pos: number) => void;
  setActiveTool: (tool: 'select' | 'blade' | 'hand') => void;
  toggleSnap: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedClipIds: [],
  zoomLevel: 0.1,       // 0.1 px/ms = 100px per second
  scrollPosition: 0,
  activeTool: 'select',
  snapEnabled: true,

  selectClip: (id, additive = false) =>
    set((state) => ({
      selectedClipIds: additive
        ? state.selectedClipIds.includes(id)
          ? state.selectedClipIds.filter((x) => x !== id)
          : [...state.selectedClipIds, id]
        : [id],
    })),

  deselectAll: () => set({ selectedClipIds: [] }),
  setZoom: (level) => set({ zoomLevel: Math.max(0.01, Math.min(1, level)) }),
  setScroll: (pos) => set({ scrollPosition: Math.max(0, pos) }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
}));
