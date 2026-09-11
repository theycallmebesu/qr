import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';

export const AuthContext = createContext();

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes auto-logout

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState('');
  const inactivityTimerRef = useRef(null);

  const logout = useCallback((reason = '') => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (reason) {
      setSessionExpiredMsg(reason);
    }
  }, []);

  // Reset inactivity timer on user interaction
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (localStorage.getItem('token')) {
      inactivityTimerRef.current = setTimeout(() => {
        logout('Session expired due to 30 minutes of inactivity. Please log in again.');
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [logout]);

  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleUserActivity = () => resetInactivityTimer();

    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [resetInactivityTimer]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          resetInactivityTimer();
        } catch (error) {
          console.error('Session validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [logout, resetInactivityTimer]);

  const login = async (username, password) => {
    setSessionExpiredMsg('');
    const res = await api.post('/auth/login', { username, password });
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      resetInactivityTimer();
    }
    return res.data;
  };

  const quickLogin = async (role) => {
    setSessionExpiredMsg('');
    const res = await api.post('/auth/quick-login', { role });
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      resetInactivityTimer();
    }
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionExpiredMsg,
        clearSessionExpiredMsg: () => setSessionExpiredMsg(''),
        login,
        quickLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
