import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isHydrated: boolean;
    setAuth: (user: User, token: string) => void;
    setAccessToken: (token: string) => void;
    logout: () => void;
    setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isHydrated: false,
            setAuth: (user, accessToken) => set({ user, accessToken }),
            setAccessToken: (accessToken) => set({ accessToken }),
            logout: () => set({ user: null, accessToken: null }),
            setHydrated: () => set({ isHydrated: true }),
        }),
        {
            name: 'auth-store',
            partialize: (s) => ({ user: s.user }),
            onRehydrateStorage: () => (state) => state?.setHydrated(),
        }
    )
);
