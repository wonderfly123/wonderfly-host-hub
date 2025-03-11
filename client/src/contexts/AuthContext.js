// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios defaults
  axios.defaults.baseURL = 'http://localhost:5001/api';
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Check if token is valid on initial load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Check if token is expired
        const decodedToken = jwtDecode(token);
        if (decodedToken.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setLoading(false);
          return;
        }

        // Verify token with backend
        const res = await axios.get('/auth/me');
        setUser(res.data.user);
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Register a new admin
  const register = async (userData) => {
    try {
      setError(null);
      const res = await axios.post('/auth/register', userData);
      
      const { token: newToken, user: userData } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return userData;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  // Login as an admin
  const adminLogin = async (credentials) => {
    try {
      setError(null);
      const res = await axios.post('/auth/admin-login', credentials);
      
      const { token: newToken, user: userData } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return userData;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  // Login as a guest
  const guestLogin = async (credentials) => {
    try {
      setError(null);
      const res = await axios.post('/auth/guest-login', credentials);
      
      const { token: newToken, user: userData, event } = res.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('currentEvent', JSON.stringify(event));
      setToken(newToken);
      setUser({ ...userData, currentEvent: event });
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { user: userData, event };
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentEvent');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Check if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        adminLogin,
        guestLogin,
        logout,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};