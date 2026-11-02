import { create } from 'zustand';
import { User } from '@/types/nova';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  initialize: () => Promise<void>;
  clearError: () => void;
}

const getApiUrl = () => {
  // For local development, use same-origin API routes
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return ''; // Use relative URLs for same-origin requests
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://nova-ai-assistant-3.onrender.com';
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    try {
      const storedToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('nova_auth_token')
          : null;
      const token = storedToken || get().token;

      if (!token) {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          error: null,
        });
        return;
      }

      if (storedToken && storedToken !== get().token) {
        set({ token: storedToken });
      }

      const apiUrl = getApiUrl();
      const url = apiUrl ? `${apiUrl}/api/auth/me` : '/api/auth/me';
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const user = await response.json();
        set({
          token,
          user,
          isAuthenticated: true,
          isInitialized: true,
          error: null,
        });
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nova_auth_token');
        }
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          error: null,
        });
      }
    } catch (err) {
      console.error('Failed to validate token:', err);
      set({ isInitialized: true, error: null });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const apiUrl = getApiUrl();
      const url = apiUrl ? `${apiUrl}/api/auth/login` : '/api/auth/login';
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      
      const data = await response.json();
      if (!response.ok) {
        set({ error: data.detail || 'Login failed' });
        return false;
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('nova_auth_token', data.access_token);
      }
      set({
        token: data.access_token,
        user: data.user || null,
        isAuthenticated: true,
      });
      await get().initialize();
      return true;
    } catch (err) {
      console.error('Authentication failed:', err);
      set({ error: 'Authentication failed. Please check your connection and try again.' });
      return false;
    }
  },

  register: async (email, password) => {
    set({ error: null });
    try {
      const apiUrl = getApiUrl();
      const url = apiUrl ? `${apiUrl}/api/auth/register` : '/api/auth/register';
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      
      const data = await response.json();
      if (!response.ok) {
        set({ error: data.detail || 'Registration failed' });
        return false;
      }

      // Auto-login after successful registration when token is returned
      if (data.access_token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('nova_auth_token', data.access_token);
        }
        set({
          token: data.access_token,
          user: data.user || null,
          isAuthenticated: true,
        });
        await get().initialize();
      }
      return true;
    } catch (err) {
      set({ error: 'Server connection failed' });
      return false;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nova_auth_token');
      const apiUrl = getApiUrl();
      const url = apiUrl ? `${apiUrl}/api/auth/logout` : '/api/auth/logout';
      void fetch(url, { method: 'POST', credentials: 'include' });
    }
    set({ token: null, user: null, isAuthenticated: false, error: null });
  }
}));
