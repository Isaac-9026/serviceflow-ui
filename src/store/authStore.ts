import { create } from 'zustand';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

// Helper para inicializar el estado en el cliente (evitar hidratación fallida)
export const initAuth = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        // Sanity check para evitar crashes si quedó basura en el storage
        if (!user || !user.nombre) {
          throw new Error("Usuario inválido en localStorage");
        }
        useAuthStore.getState().setAuth(user, token);
      } catch (error) {
        useAuthStore.getState().logout();
      }
    }
  }
};
