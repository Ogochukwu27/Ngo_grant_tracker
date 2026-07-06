// frontend/src/pages/Login.jsx

import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { HeartHandshake, ShieldAlert, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { user, login, register, token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Toggle between login and register forms
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  // Reset form inputs and errors when switching modes
  const toggleMode = () => {
    setIsRegister(!isRegister);
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Form validation
    if (isRegister && !name) {
      setError('Please enter your full name');
      setSubmitting(false);
      return;
    }
    if (!email || !password) {
      setError('Please provide email and password');
      setSubmitting(false);
      return;
    }

    let result;
    if (isRegister) {
      // Call Context Register Handler
      result = await register(name, email, password);
    } else {
      // Call Context Login Handler
      result = await login(email, password);
    }

    if (result.success) {
      // Go to dashboard upon success
      navigate('/dashboard');
    } else {
      setError(result.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative ambient background glows */}
      <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl"></div>
      <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"></div>

      <div className="z-10 w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#feab32] to-[#d34300] text-white shadow-lg shadow-amber-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10">
              <defs>
                <linearGradient id="logoGradLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#feab32" />
                  <stop offset="100%" stopColor="#d34300" />
                </linearGradient>
                <linearGradient id="goldGradLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#104210" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="10" fill="url(#logoGradLogin)" />
              <path d="M7.5 8.5h4.5v1.2H8.7v1.2H12v1.2H8.7v1.2h4.5V15.5H7.5V8.5z" fill="#ffffff" opacity="0.95" />
              <path d="M12.5 8.5h1.2l2.2 4.2V8.5h1.2v7h-1.2l-2.2-4.2v4.2h-1.2v-7z" fill="url(#goldGradLogin)" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white font-sans">
            {isRegister ? 'Create staff account' : 'Sign in to platform'}
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            Evelyn Nwankwo's Fund Initiative
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-8 shadow-xl backdrop-blur-md">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. Jane Smith"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 shadow-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@ngo.org"
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 shadow-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => alert('Demo Feature: Please contact your IT administrator to reset your password.')}
                    className="text-xs font-medium text-primary-400 hover:text-teal-300"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-4 pr-12 py-3 text-white placeholder-slate-500 shadow-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full justify-center rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-400 hover:shadow-primary-400/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : isRegister ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Toggle Screen Mode Links */}
          <div className="mt-8 text-center text-sm text-slate-400">
            {isRegister ? (
              <p>
                Already have an account?{' '}
                <button
                  onClick={toggleMode}
                  className="font-semibold text-primary-400 hover:text-teal-300"
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p>
                First time here?{' '}
                <button
                  onClick={toggleMode}
                  className="font-semibold text-primary-400 hover:text-teal-300"
                >
                  Create staff account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
