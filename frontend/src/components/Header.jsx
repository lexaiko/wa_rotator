import React from 'react';
import { RefreshCw, Sun, Moon, Menu } from 'lucide-react';

export default function Header({
  title,
  subtitle,
  onRefresh,
  isLoading,
  theme,
  onToggleTheme,
  onToggleMobileMenu
}) {
  return (
    <header className="h-16 md:h-20 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Menu Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 md:hidden hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base md:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {title}
          </h1>
          <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Light / Dark Mode Switcher */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold hidden md:inline">Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-semibold hidden md:inline">Gelap</span>
            </>
          )}
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-500' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-500 font-bold text-xs">
            TB
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Admin TripBwi</div>
            <div className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Super Admin
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
