import { create } from 'zustand';

export type UserState = {
  id: string;
  username: string;
  email: string;
  avatar: string;
} | null;

export const useUserStore = create<UserState>(() => null);
