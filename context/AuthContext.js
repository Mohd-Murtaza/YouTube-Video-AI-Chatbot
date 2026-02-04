'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const router = useRouter();

  // Validate token on mount - check localStorage for UI state
  useEffect(() => {
    checkLocalStorageAuth();
  }, []);

  // Helper: Save user to localStorage when user state changes
  const saveUserToLocalStorage = (userData) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  };

  // Helper: Custom setUser that also updates localStorage
  const setUserWithStorage = (userData) => {
    setUser(userData);
    saveUserToLocalStorage(userData);
  };

  // Simple localStorage check - middleware handles token validation
  const checkLocalStorageAuth = () => {
    try {
      const cachedUser = localStorage.getItem('user');
      
      if (cachedUser) {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        console.log('✅ User loaded from localStorage');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('user');
      setUser(null);
      setLoading(false);
    }
  };

  // Send OTP for registration
  const sendOTP = async (name, email, password) => {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    return data;
  };

  // Verify OTP and complete registration
  const verifyOTP = async (email, otp) => {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (response.ok) {
      setUserWithStorage(data.user);
      router.push('/');
    }

    return data;
  };

  // Register (legacy - now uses OTP flow)
  const register = async (name, email, password) => {
    return await sendOTP(name, email, password);
  };

  const login = async (email, password) => {
    setLoginLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserWithStorage(data.user);
        router.push('/');
        return { success: true };
      }

      return { success: false, error: data.message };
    } finally {
      setLoginLoading(false);
    }
  };

  // Forgot password - Send OTP
  const forgotPassword = async (email) => {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data;
  };

  // Reset password with OTP
  const resetPassword = async (email, otp, newPassword, confirmPassword) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
    });

    const data = await response.json();
    return data;
  };

  // Change password (for logged-in users)
  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
    });

    const data = await response.json();
    return data;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUserWithStorage(null);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginLoading,
        setUser: setUserWithStorage,
        register,
        sendOTP,
        verifyOTP,
        login,
        logout,
        forgotPassword,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
