'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, User, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import PasswordInput from './PasswordInput';
import OTPInput from './OTPInput';
import GoogleOAuthButton from './GoogleOAuthButton';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onForgotPassword }) {
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, sendOTP, verifyOTP } = useAuth();

  if (!isOpen) return null;

  const validateForm = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (mode === 'register') {
      // Name validation
      if (!formData.name || formData.name.trim().length < 2) {
        setError('Name must be at least 2 characters long');
        return false;
      }

      // Password validation
      const passwordErrors = [];
      
      if (formData.password.length < 8) {
        passwordErrors.push('at least 8 characters');
      }
      if (!/[A-Z]/.test(formData.password)) {
        passwordErrors.push('one uppercase letter');
      }
      if (!/[a-z]/.test(formData.password)) {
        passwordErrors.push('one lowercase letter');
      }
      if (!/[0-9]/.test(formData.password)) {
        passwordErrors.push('one digit');
      }
      if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(formData.password)) {
        passwordErrors.push('one special character');
      }

      if (passwordErrors.length > 0) {
        setError(`Password must contain ${passwordErrors.join(', ')}`);
        return false;
      }

      if (/^\s+$/.test(formData.password)) {
        setError('Password cannot contain only spaces');
        return false;
      }
    } else {
      // Login password check (basic)
      if (!formData.password || formData.password.length < 6) {
        setError('Please enter your password');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          setError(result.error);
          
          // If user needs to set password (Google user), show helpful message
          if (result.error?.includes('Forgot Password') || result.error?.includes('Google')) {
            // Error already contains helpful message from backend
          }
        } else {
          onClose();
        }
      } else {
        // Registration - send OTP
        const result = await sendOTP(formData.name, formData.email, formData.password);
        if (!result.success) {
          setError(result.message);
        } else {
          // Move to OTP step
          setStep('otp');
          setError('');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otpValue) => {
    setError('');
    setLoading(true);

    try {
      const result = await verifyOTP(formData.email, otpValue);
      if (!result.success) {
        setError(result.message);
      } else {
        onClose();
      }
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await sendOTP(formData.name, formData.email, formData.password);
      if (!result.success) {
        setError(result.message);
      } else {
        setError('');
        // Show success message temporarily
        const successMsg = 'OTP resent successfully!';
        setError('');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setStep('form');
    setError('');
    setFormData({ name: '', email: '', password: '' });
  };

  const goBackToForm = () => {
    setStep('form');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 p-6 sm:p-8"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {step === 'otp' 
              ? 'Verify Email' 
              : mode === 'login' 
              ? 'Welcome Back' 
              : 'Create Account'}
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            {step === 'otp'
              ? `Enter the 6-digit code sent to ${formData.email}`
              : mode === 'login'
              ? 'Login to continue your learning journey'
              : 'Sign up to start chatting with videos'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
            <div className="whitespace-pre-line">{error}</div>
            {(error.includes('Forgot Password') || error.includes('Google')) && (
              <button
                onClick={() => {
                  onClose();
                  if (onForgotPassword) onForgotPassword();
                }}
                className="mt-3 text-blue-400 hover:text-blue-300 underline font-medium"
              >
                → Open Forgot Password
              </button>
            )}
          </div>
        )}

        {step === 'otp' ? (
          /* OTP Verification Step */
          <div className="space-y-6">
            <OTPInput 
              length={6} 
              onComplete={handleOTPComplete}
              loading={loading}
            />

            <div className="space-y-3">
              <button
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full py-2 text-blue-500 hover:text-blue-400 disabled:text-blue-500/50 font-medium transition text-sm"
              >
                Resend OTP
              </button>

              <button
                onClick={goBackToForm}
                disabled={loading}
                className="w-full py-2 text-gray-400 hover:text-white disabled:text-gray-600 transition text-sm"
              >
                ← Back to form
              </button>
            </div>
          </div>
        ) : (
          /* Login/Register Form */
          <>
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required={mode === 'register'}
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={mode === 'register' ? 8 : 6}
              label="Password"
              hint={mode === 'register' ? 'Min 8 chars with uppercase, lowercase, digit & special character' : ''}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {mode === 'login' ? 'Logging in...' : 'Sending OTP...'}
              </>
            ) : (
              <>{mode === 'login' ? 'Login' : 'Continue'}</>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-slate-900 text-gray-400">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth */}
        <GoogleOAuthButton mode={mode === 'login' ? 'signin' : 'signup'} />

        {/* Switch Mode */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={switchMode}
              className="text-blue-500 hover:text-blue-400 font-medium transition"
            >
              {mode === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </p>
          
          {mode === 'login' && (
            <button
              onClick={() => {
                if (onForgotPassword) {
                  onForgotPassword();
                }
              }}
              className="mt-2 text-gray-400 hover:text-white text-sm transition"
            >
              Forgot Password?
            </button>
          )}
        </div>
        </>
        )}
      </motion.div>
    </div>
  );
}
