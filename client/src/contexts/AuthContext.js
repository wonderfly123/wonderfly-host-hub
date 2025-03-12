// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { setAuthToken } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Set up axios defaults
  axios.defaults.baseURL = 'http://localhost:5002/api';
  
  // Update auth token in API utility and axios defaults
  useEffect(() => {
    if (token) {
      console.log('Setting auth token in defaults');
      localStorage.setItem('token', token);
      setAuthToken(token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    } else if (localStorage.getItem('token')) {
      // This is critical - if token state is empty but localStorage has a token
      // we should restore it rather than removing it
      const storedToken = localStorage.getItem('token');
      console.log('Restoring auth token from localStorage');
      setToken(storedToken);
      setAuthToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setIsAuthenticated(true);
    } else {
      console.log('No token available');
      setAuthToken(null);
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
    }
  }, [token]);

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
          console.log('Token expired, logging out');
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Verify token with backend
        const res = await axios.get('/auth/me');
        setUser(res.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication error:', error);
        // Only remove token if there's a 401 error
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
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
      
      const { token: newToken, user: newUser } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      
      return newUser;
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
      
      const { token: newToken, user: newUser } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      
      return newUser;
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
      
      const { token: newToken, user: newUser, event } = res.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('currentEvent', JSON.stringify(event));
      setToken(newToken);
      setUser({ ...newUser, currentEvent: event });
      setIsAuthenticated(true);
      
      return { user: newUser, event };
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
    setIsAuthenticated(false);
    setAuthToken(null);
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
        isAuthenticated,
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