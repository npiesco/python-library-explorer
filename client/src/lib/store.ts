// /PythonLibraryExplorer/client/src/lib/store.ts
import { create } from 'zustand';
import { type VirtualEnv } from '@shared/schema';
import { sendExtensionMessage } from './queryClient';
import { queryClient } from './queryClient';

interface VenvStore {
  activeVenv: VirtualEnv | null;
  setActiveVenv: (venv: VirtualEnv | null) => void;
  deactivateVenv: () => Promise<void>;
  cleanupVenvs: () => Promise<void>;
}

export const useVenvStore = create<VenvStore>()((set, get) => ({
  activeVenv: null,
  setActiveVenv: (venv: VirtualEnv | null) => set({ activeVenv: venv }),
  deactivateVenv: async () => {
    const { activeVenv } = get();
    if (!activeVenv) return;

    try {
      await sendExtensionMessage("setActiveVenv", { id: null });
      set({ activeVenv: null });
      await queryClient.invalidateQueries({ queryKey: ["virtualEnvs"] });
    } catch (error) {
      console.error("Failed to deactivate venv:", error);
      throw error;
    }
  },
  cleanupVenvs: async () => {
    try {
      await sendExtensionMessage("venv/cleanup", {});
      await queryClient.invalidateQueries({ queryKey: ["virtualEnvs"] });
    } catch (error) {
      console.error("Failed to cleanup venvs:", error);
      throw error;
    }
  },
})); 