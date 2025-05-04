import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Theme = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

export const useThemeStore = create(
  persist<Theme>(
    (set) => ({
      isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      toggleDarkMode: () => {
        set((state) => ({ isDarkMode: !state.isDarkMode }));
      },
    }),
    {
      name: 'theme',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
