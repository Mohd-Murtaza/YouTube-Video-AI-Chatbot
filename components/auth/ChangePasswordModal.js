'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, KeyRound, CheckCircle2, X } from 'lucide-react';
import PasswordInput from './PasswordInput';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { changePassword, user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // No validation needed - backend will handle all cases

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
      setError('New passwords do not match');
      return;
    }

    if (passwords.oldPassword === passwords.newPassword) {
      setError('New password must be different from old password');
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword(
        passwords.oldPassword,
        passwords.newPassword,
        passwords.confirmPassword
      );

      if (!result.success) {
        setError(result.message);
      } else {
        setSuccess('Password changed successfully!');
        setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setError('');
  };

  const handleClose = () => {
    setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.3)] max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Change Password</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/5 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error/Success Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}

          {/* OAuth Warning */}
          {user?.provider === 'google' && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg text-blue-400 text-sm">
              💡 Tip: You're signed in with Google. You can set a password to enable email login too!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              name="oldPassword"
              value={passwords.oldPassword}
              onChange={handleChange}
              required
              label="Current Password"
              placeholder="Enter current password"
            />

            <PasswordInput
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleChange}
              required
              minLength={8}
              label="New Password"
              placeholder="Enter new password"
              hint="Min 8 chars with uppercase, lowercase, digit & special character"
            />

            <PasswordInput
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              label="Confirm New Password"
              placeholder="Confirm new password"
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
