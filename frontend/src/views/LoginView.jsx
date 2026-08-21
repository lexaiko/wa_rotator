import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Username dan kata sandi wajib diisi.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: username.trim(),
          password,
          remember_me: rememberMe
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal login. Periksa username dan password Anda.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070B14] text-slate-100 flex items-center justify-center p-3 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-brand-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[380px] sm:w-[550px] h-[380px] sm:h-[550px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md lg:max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-2xl relative z-10 my-auto">
        {/* Left Side: Brand & Highlights (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#0E1424]/95 to-[#131B2E]/95 p-8 flex-col justify-between border-r border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl" />

          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center shadow-brand-glow text-white font-black text-xl">
                TB
              </div>
              <div>
                <div className="text-base font-extrabold text-white tracking-tight">TripBanyuwangi</div>
                <div className="text-xs font-bold text-brand-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-brand-400" /> WA Smart Rotator
                </div>
              </div>
            </div>

            {/* Sub-header */}
            <h2 className="text-xl font-black text-white leading-tight mb-3">
              Enterprise WhatsApp Smart Rotator & CRM Intelligence
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sistem distribusi traffic iklan Meta & TikTok ke tim CS secara presisi dengan Nginx Smooth Weighted Algorithm.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Header Form */}
            <div className="mb-6 sm:mb-8">
              {/* Mobile Only Logo */}
              <div className="flex items-center gap-2.5 mb-5 lg:hidden">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-brand-glow">
                  TB
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white">TripBanyuwangi</div>
                  <div className="text-[11px] font-bold text-brand-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-brand-400" /> WA Smart Rotator
                  </div>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Masuk ke Portal Admin
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Silakan masukkan kredensial akun administrator Anda untuk mengelola sistem.
              </p>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                  Username / ID Admin
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Masukkan username..."
                    autoComplete="username"
                    className="w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 font-medium transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Masukkan kata sandi..."
                    autoComplete="current-password"
                    className="w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    aria-label="Toggle Password Visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-brand-500 focus:ring-brand-500/30 accent-brand-500"
                  />
                  <span>Ingat Sesi Login (30 Hari)</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-extrabold text-xs tracking-wide shadow-brand-glow transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Footer */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-end text-[11px] text-slate-500">
            <span>TripBanyuwangi &copy; 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
