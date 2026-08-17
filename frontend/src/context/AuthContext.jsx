import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/users/me');
          setUser(res.data);
        } catch (error) {
          console.error("Token invalid or expired");
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const loginUser = async (password, personId = null) => {
    const res = await api.post('/auth/login-user', { password, personId });
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const loginAdmin = async (email, password) => {
    const res = await api.post('/auth/login-admin', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
