import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('eventease_token'));
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('eventease_token');
      if (storedToken) {
        try {
          const res = await api.auth.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      if (res.success) {
        localStorage.setItem('eventease_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setLoading(false);
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      setLoading(false);
      return { success: false, message: err.message };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await api.auth.register(userData);
      if (res.success) {
        localStorage.setItem('eventease_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setLoading(false);
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      setLoading(false);
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('eventease_token');
    setToken(null);
    setUser(null);
  };

  // Instant switch for demo evaluator / judge flow
  const quickSwitchUser = async (targetRole) => {
    const roleCredentials = {
      student: { email: 'alex.student@campus.edu', password: 'password123' },
      organizer: { email: 'sarah.organizer@campus.edu', password: 'password123' },
      admin: { email: 'admin@campus.edu', password: 'password123' },
    };

    const creds = roleCredentials[targetRole];
    if (creds) {
      return await login(creds.email, creds.password);
    }
    return { success: false, message: 'Invalid role preset' };
  };

  const resetAllDemoData = async () => {
    try {
      await api.auth.resetSeed();
      if (user) {
        // Re-login as same user
        await quickSwitchUser(user.role);
      }
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        quickSwitchUser,
        resetAllDemoData,
        isStudent: user?.role === 'student',
        isOrganizer: user?.role === 'organizer' || user?.role === 'admin',
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
