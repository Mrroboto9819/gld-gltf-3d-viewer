import { create } from "zustand";
import type { FolderScan, ModelInfo } from "./types";

interface State {
  folder: FolderScan | null;
  selected: ModelInfo | null;
  scanning: boolean;
  error: string | null;
  recenterEpoch: number;
  sidebarCollapsed: boolean;
  search: string;
  setFolder: (scan: FolderScan) => void;
  selectModel: (m: ModelInfo | null) => void;
  setScanning: (v: boolean) => void;
  setError: (e: string | null) => void;
  recenter: () => void;
  toggleSidebar: () => void;
  setSearch: (q: string) => void;
}

export const useAppStore = create<State>((set) => ({
  folder: null,
  selected: null,
  scanning: false,
  error: null,
  recenterEpoch: 0,
  sidebarCollapsed: false,
  search: "",
  setFolder: (folder) =>
    set((s) => ({
      folder,
      selected: folder.models[0] ?? null,
      error: null,
      recenterEpoch: s.recenterEpoch + 1,
      search: "",
    })),
  selectModel: (selected) =>
    set((s) => ({ selected, recenterEpoch: s.recenterEpoch + 1 })),
  setScanning: (scanning) => set({ scanning }),
  setError: (error) => set({ error }),
  recenter: () => set((s) => ({ recenterEpoch: s.recenterEpoch + 1 })),
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSearch: (search) => set({ search }),
}));
