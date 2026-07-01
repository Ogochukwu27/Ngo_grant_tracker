// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';

// Create the Auth Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrencyState] = useState(localStorage.getItem('currency') || 'NGN');
  const [toast, setToast] = useState(null);
  const [theme, setThemeState] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const triggerToast = (message, type = 'success') => {
    setToast(null); // Clear previous if any
    setTimeout(() => {
      setToast({ message, type });
    }, 50);
  };

  // Clear toast helper
  const clearToast = () => setToast(null);

  const setCurrency = (curr) => {
    localStorage.setItem('currency', curr);
    setCurrencyState(curr);
  };

  // 1500 NGN = 1 USD mock exchange rate conversion
  const formatMoney = (amount) => {
    const num = Number(amount) || 0;
    if (currency === 'USD') {
      const converted = num / 1500;
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(converted);
    }
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  const API_URL = 'http://localhost:5000/api';

  // Verify token and load profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/profile`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 200) {
          const profile = await res.json();
          setUser(profile);
        } else {
          // Token expired or invalid, log out
          logout();
        }
      } catch (err) {
        console.error('Failed to load user profile:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [token]);

  // Inactivity auto-logout (10 minutes)
  useEffect(() => {
    if (!token) return;

    let timeoutId;
    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes in ms

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        triggerToast('You have been logged out due to inactivity.', 'error');
      }, INACTIVITY_LIMIT);
    };

    // Events to track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Add event listeners to detect active usage
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize the timer
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [token]);

  /**
   * Log in user
   * @param {string} email
   * @param {string} password
   */
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.status === 200) {
        sessionStorage.setItem('token', data.token);
        setToken(data.token);
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
        });
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Server error. Please try again later.' };
    }
  };

  /**
   * Log out user
   */
  const logout = () => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  /**
   * Register user
   * @param {string} name
   * @param {string} email
   * @param {string} password
   */
  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.status === 201) {
        sessionStorage.setItem('token', data.token);
        setToken(data.token);
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
        });
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, message: 'Server error. Please try again later.' };
    }
  };

  // Helper to fetch authenticated routes automatically including the JWT token
  const authFetch = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;
    
    // Inject Authorization header
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        register,
        authFetch,
        currency,
        setCurrency,
        formatMoney,
        toast,
        triggerToast,
        clearToast,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
