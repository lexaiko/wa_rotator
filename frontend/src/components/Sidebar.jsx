import React from 'react';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  BarChart3,
  MessageSquareCode,
  Settings,
  Database,
  ExternalLink,
  Zap,
  X,
  LogOut
} from 'lucide-react';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  stats,
  mobileOpen,
  onCloseMobile,
  onLogout
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'campaigns', label: 'Kampanye & Link', icon: Megaphone, badge: stats?.activeCampaigns || null },
    { id: 'source-greeting', label: 'Kategori Sumber', icon: MessageSquareCode, badge: null },
    { id: 'cs', label: 'Tim CS & Bobot', icon: Users, badge: `${stats?.activeCS || 0} Aktif` },
    { id: 'analytics', label: 'Analitik & Log', icon: BarChart3, badge: null },
    { id: 'backup', label: 'Backup & Restore', icon: Database, badge: null },
    { id: 'settings', label: 'Pengaturan Rotator', icon: Settings, badge: null },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0E1424] border-r border-slate-200 dark:border-white/10 flex flex-col justify-between shrink-0 select-none transition-all duration-300 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-5 md:p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center shadow-brand-glow text-white font-black text-xl shrink-0">
                TB
              </div>
              <div className="min-w-0">
                <div className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 truncate">
                  TripBanyuwangi
                </div>
                <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-brand-600 dark:fill-brand-400 shrink-0" /> WA Smart Rotator
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation List */}
          <nav className="p-3.5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-orange-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-orange-200 dark:border-brand-500/30 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span className="whitespace-nowrap truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ml-2 ${
                        isActive
                          ? 'bg-brand-500/20 dark:bg-brand-500/30 text-brand-700 dark:text-brand-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Status Footer & Logout */}
        <div className="p-4 m-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Rotator Engine</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold font-mono">
              &lt; 5ms
            </span>
          </div>

          <a
            href={typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:3001/kawah-ijen' : '/kawah-ijen'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-700 dark:hover:text-brand-300 bg-brand-500/10 dark:bg-brand-500/15 hover:bg-brand-500/20 py-2 rounded-lg transition-colors border border-brand-500/20"
          >
            <span>Coba Redirect Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 py-1.5 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Akun</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
