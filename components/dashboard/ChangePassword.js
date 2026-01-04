'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import PasswordInput from '../auth/PasswordInput';

export default function ChangePassword() {
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

    // Check if user is OAuth
    if (user?.provider && user.provider !== 'local') {
      setError('Password cannot be changed for OAuth accounts');
      return;
    }

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
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  // If OAuth user, show info message
  if (user?.provider && user.provider !== 'local') {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-white">Change Password</h2>
        </div>
        <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg text-blue-400">
          Password cannot be changed for {user.provider} accounts. Please use {user.provider} to manage your account security.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <KeyRound className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-semibold text-white">Change Password</h2>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Changing Password...
            </>
          ) : (
            'Change Password'
          )}
        </button>
      </form>
    </div>
  );
}
