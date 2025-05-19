// src/frontend/services/authService.ts
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../store/authStore';
import type { User, AuthResponse } from '@/shared/types';

interface LoginCredentials {
  email: string;
  password?: string; // Password es opcional si usamos social login en el futuro
}

interface RegisterData extends LoginCredentials {
  name: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<User | null> => {
    try {
      const data = await apiClient.post<AuthResponse>('/auth/login', credentials);
      if (data.token && data.user) {
        useAuthStore.getState().setAuth(data.token, data.user);
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Login failed:', error);
      useAuthStore.getState().clearAuth();
      throw error; // Relanzar para que el componente de UI lo maneje
    }
  },

  register: async (registerData: RegisterData): Promise<User | null> => {
    try {
      const data = await apiClient.post<AuthResponse>('/auth/register', registerData);
      if (data.token && data.user) {
        useAuthStore.getState().setAuth(data.token, data.user);
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Registration failed:', error);
      useAuthStore.getState().clearAuth();
      throw error;
    }
  },

  logout: (): void => {
    useAuthStore.getState().clearAuth();
    // Aquí podrías también llamar a un endpoint de logout en el backend si es necesario
    // (ej. para invalidar el token en el servidor si usas una blacklist)
  },

  getCurrentUser: (): User | null => {
    return useAuthStore.getState().user;
  },

  isAuthenticated: (): boolean => {
    return useAuthStore.getState().isAuthenticated;
  },

  getToken: (): string | null => {
    return useAuthStore.getState().token;
  }
};
