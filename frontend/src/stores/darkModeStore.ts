import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DarkModeStore {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
}

const useDarkModeStore = create<DarkModeStore>()(
  persist(
    (set) => ({
      darkMode: false,
      setDarkMode: (darkMode) => set({ darkMode }),
    }),
    {
      name: 'dark-mode-storage',
    }
  )
);

export default useDarkModeStore;
