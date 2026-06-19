// frontend/src/pages/Settings.jsx

import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';

const Settings = () => {
  const { authFetch, triggerToast } = useContext(AuthContext);

  // Password fields state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status feedback states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Frontend validations
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      setSubmitting(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      setSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await authFetch('/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (res.status === 200) {
        setSuccess('Password updated successfully!');
        triggerToast('Password changed successfully!', 'success');
        // Clear input fields
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.message || 'Failed to update password.');
        triggerToast(data.message || 'Failed to update password.', 'error');
      }
    } catch (err) {
      console.error('Password change error:', err.message);
      setError('Server connection error. Please try again.');
      triggerToast('Server connection error.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">Account Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your staff credentials and security preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Explanation Dossier */}
        <div className="glass-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Security Credentials</h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Keep your account secure by choosing a strong password. We recommend a mix of capital letters, numbers, and special symbols.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Verified Staff Node
          </div>
        </div>

        {/* Change Password Form Card (spanning 2 columns) */}
        <div className="glass-card p-6 md:col-span-2 space-y-6">
          <div className="flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/60">
            <KeyRound className="h-4 w-4" />
            <span>Update Password</span>
          </div>

          {/* Form Status Banner Notices */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500 animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 rounded-xl border border-success-500/20 bg-success-500/5 p-4 text-sm text-success-700 dark:text-primary-400 animate-in fade-in duration-200">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
            {/* Old Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="input-primary mt-2"
              />
            </div>

            {/* New Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="input-primary mt-2"
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-primary mt-2"
              />
            </div>

            {/* Submit Action button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex justify-center rounded-xl bg-primary-500 hover:bg-primary-400 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
};

export default Settings;
