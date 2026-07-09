import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DarkModeStore {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
}

export function syncThemeClass(dark: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', dark);
}

const useDarkModeStore = create<DarkModeStore>()(
  persist(
    (set) => ({
      darkMode: false,
      setDarkMode: (darkMode) => {
        syncThemeClass(darkMode);
        set({ darkMode });
      },
    }),
    {
      name: 'dark-mode-storage',
      onRehydrateStorage: () => (state) => {
        if (state) syncThemeClass(state.darkMode);
      },
    }
  )
);

export default useDarkModeStore;
