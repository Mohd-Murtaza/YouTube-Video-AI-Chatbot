'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Loader2, X } from 'lucide-react';
import PasswordInput from './PasswordInput';
import OTPInput from './OTPInput';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState('email'); // 'email', 'otp', 'newPassword'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword, resetPassword } = useAuth();

  if (!isOpen) return null;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPassword(email);
      if (!result.success) {
        setError(result.message);
      } else {
        setStep('otp');
        setSuccess('OTP sent to your email!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpValue) => {
    setOtp(otpValue);
    setError('');
    // Move to password step immediately
    setStep('newPassword');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Password validation
    const passwordErrors = [];
    
    if (passwords.newPassword.length < 8) {
      passwordErrors.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(passwords.newPassword)) {
      passwordErrors.push('one uppercase letter');
    }
    if (!/[a-z]/.test(passwords.newPassword)) {
      passwordErrors.push('one lowercase letter');
    }
    if (!/[0-9]/.test(passwords.newPassword)) {
      passwordErrors.push('one digit');
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(passwords.newPassword)) {
      passwordErrors.push('one special character');
    }

    if (passwordErrors.length > 0) {
      setError(`Password must contain ${passwordErrors.join(', ')}`);
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(email, otp, passwords.newPassword, passwords.confirmPassword);
      if (!result.success) {
        setError(result.message);
      } else {
        setSuccess('Password reset successful! You can now login.');
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      if (!result.success) {
        setError(result.message);
      } else {
        setSuccess('OTP resent successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setPasswords({ newPassword: '', confirmPassword: '' });
    setError('');
    setSuccess('');
  };

  const goBack = () => {
    if (step === 'otp') {
      setStep('email');
    } else if (step === 'newPassword') {
      setStep('otp');
    }
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
          onClick={() => {
            onClose();
            resetForm();
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {step === 'email' && 'Forgot Password?'}
            {step === 'otp' && 'Verify Email'}
            {step === 'newPassword' && 'Create New Password'}
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            {step === 'email' && "Enter your email and we'll send you a code"}
            {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
            {step === 'newPassword' && 'Choose a strong password for your account'}
          </p>
        </div>

        {/* Error/Success Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm">
            {success}
          </div>
        )}

        {/* Email Step */}
        {step === 'email' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <div className="space-y-6">
            <OTPInput 
              length={6} 
              onComplete={handleVerifyOTP}
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
                onClick={goBack}
                disabled={loading}
                className="w-full py-2 text-gray-400 hover:text-white disabled:text-gray-600 transition text-sm"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* New Password Step */}
        {step === 'newPassword' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <PasswordInput
              name="newPassword"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              required
              minLength={8}
              label="New Password"
              hint="Min 8 chars with uppercase, lowercase, digit & special character"
            />

            <PasswordInput
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              required
              minLength={8}
              label="Confirm Password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>

            <button
              type="button"
              onClick={goBack}
              disabled={loading}
              className="w-full py-2 text-gray-400 hover:text-white disabled:text-gray-600 transition text-sm"
            >
              ← Back
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
