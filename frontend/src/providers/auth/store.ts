import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AuthState = {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
  _hydrated: boolean;
};

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      token: null,
      setToken: (token: string) => set({ token }),
      logout: () => set({ token: null }),
      _hydrated: false,
    }),
    {
      name: 'auth-store',
      onRehydrateStorage: (state) => {
        state._hydrated = true;
      },
      storage: createJSONStorage(() => localStorage),
    }
  )
);
