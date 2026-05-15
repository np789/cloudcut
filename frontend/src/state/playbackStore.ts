import { create } from 'zustand';

interface PlaybackState {
  currentTimeMs: number;
  isPlaying: boolean;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;

  setCurrentTime: (ms: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  currentTimeMs: 0,
  isPlaying: false,
  playbackSpeed: 1,
  volume: 1,
  isMuted: false,

  setCurrentTime: (ms) => set({ currentTimeMs: Math.max(0, ms) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setSpeed: (speed) => set({ playbackSpeed: speed }),
  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}));
