// src/frontend/store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/shared/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      clearAuth: () => {
        set({ token: null, user: null, isAuthenticated: false });
        // Opcional: limpiar también el store de citas si es relevante al hacer logout
        // useAppointmentStore.getState().clearAppointments();
      },
    }),
    {
      name: 'auth-storage', // Nombre de la clave en localStorage
      storage: createJSONStorage(() => localStorage), // Especificar localStorage
    }
  )
);
