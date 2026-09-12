import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, StudentProfile } from '../types.ts';
import { apiRequest, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  setSession: (token: string, user: User, profile?: StudentProfile) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileState: (profile: Partial<StudentProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem(USER_STORAGE_KEY);
    try {
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const currentToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!currentToken) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiRequest('/api/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
        if (res.profile) {
          setProfile(res.profile);
        }
      } else {
        // Token invalid
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
        setProfile(null);
        setToken(null);
      }
    } catch {
      // Offline fallback: keep cached user
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleAuthExpired = () => {
      setUser(null);
      setProfile(null);
      setToken(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const setSession = (newToken: string, newUser: User, newProfile?: StudentProfile) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    if (newProfile) {
      setProfile(newProfile);
    }
  };

  const login = async (loginEmail: string, loginPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (res.success && res.token && res.user) {
        setSession(res.token, res.user, res.profile);
        return { success: true };
      }
      return { success: false, error: res.message || res.error || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (data: any): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res.success) {
        if (res.token && res.user) {
          setSession(res.token, res.user, res.profile);
        }
        return { success: true, message: res.message };
      }
      return { success: false, error: res.message || res.error || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network failure on logout
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      setProfile(null);
      setToken(null);
    }
  };

  const refreshProfile = async () => {
    if (!token || user?.role !== 'STUDENT') return;
    try {
      const res = await apiRequest('/api/student/profile');
      if (res.success && res.profile) {
        setProfile(res.profile);
      }
    } catch (err) {
      console.error('Failed to refresh profile', err);
    }
  };

  const updateProfileState = (updated: Partial<StudentProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updated } : (updated as StudentProfile)));
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = Boolean(user?.role === 'ADMIN');
  const isStudent = Boolean(user?.role === 'STUDENT');

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated,
        isAdmin,
        isStudent,
        isLoading,
        login,
        register,
        setSession,
        logout,
        refreshProfile,
        updateProfileState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
