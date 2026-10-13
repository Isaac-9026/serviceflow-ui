import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el JWT en cada request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined' && !config.url?.includes('/auth/login')) {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores (ej. token expirado 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response) {
      const isAuthUrl = error.config?.url?.includes('/auth/login');
      
      // Si la sesión expiró o el token es inválido (401), limpiar y redirigir
      if (error.response.status === 401 && !isAuthUrl) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
