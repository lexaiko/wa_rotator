import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import DashboardView from './views/DashboardView.jsx';
import CampaignsView from './views/CampaignsView.jsx';
import CSManagementView from './views/CSManagementView.jsx';
import AnalyticsView from './views/AnalyticsView.jsx';
import SimulatorView from './views/SimulatorView.jsx';
import SettingsView from './views/SettingsView.jsx';

export default function App() {
  const VALID_TABS = ['dashboard', 'campaigns', 'cs', 'analytics', 'simulator', 'settings'];

  const [currentTab, setCurrentTabState] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && VALID_TABS.includes(hash)) {
      return hash;
    }
    const saved = localStorage.getItem('tb_active_tab');
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
    return 'dashboard';
  });

  const setCurrentTab = (tab) => {
    setCurrentTabState(tab);
    window.location.hash = tab;
    localStorage.setItem('tb_active_tab', tab);
  };

  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [csList, setCSList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tb_theme') || 'dark';
  });

  useEffect(() => {
    fetchGlobalData();

    // Listen to browser Back/Forward buttons and Hash changes
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && VALID_TABS.includes(hash)) {
        setCurrentTabState(hash);
        localStorage.setItem('tb_active_tab', hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('tb_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const fetchGlobalData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, campsRes, csRes] = await Promise.all([
        fetch('/api/analytics/summary').then(r => r.json()),
        fetch('/api/campaigns').then(r => r.json()),
        fetch('/api/cs').then(r => r.json())
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (campsRes.success) setCampaigns(campsRes.data);
      if (csRes.success) setCSList(csRes.data);
    } catch (err) {
      console.error('Error fetching global rotator data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getHeaderInfo = () => {
    switch (currentTab) {
      case 'campaigns':
        return {
          title: 'Manajemen Kampanye & Link',
          subtitle: 'Daftar smart link rotator untuk iklan Meta, TikTok, dan bio Instagram'
        };
      case 'cs':
        return {
          title: 'Tim CS, Pembobotan & Jam Kerja',
          subtitle: 'Atur rasio bobot pembagian lead, limit harian, dan shift kerja otomatis'
        };
      case 'analytics':
        return {
          title: 'Analitik & Log Klik Detail',
          subtitle: 'Laporan lengkap pengunjung, asal kota, perangkat, dan performa tim CS'
        };
      case 'simulator':
        return {
          title: 'Live Link Rotator Simulator',
          subtitle: 'Uji coba pembobotan dan distribusi rotasi sebelum kampanye diluncurkan'
        };
      case 'settings':
        return {
          title: 'Pengaturan & Integrasi CRM',
          subtitle: 'Konfigurasi fallback darurat, cheatsheet template, dan sinkronisasi CRM'
        };
      case 'dashboard':
      default:
        return {
          title: 'Overview Dashboard & Realtime Stats',
          subtitle: 'Pantau performa trafik klik dan rotasi link WhatsApp TripBanyuwangi'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme === 'light' ? 'light bg-[#F8FAFC] text-slate-900' : 'dark bg-[#0B0F19] text-slate-100'}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        stats={stats}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onRefresh={fetchGlobalData}
          isLoading={isLoading}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'campaigns' && (
            <CampaignsView
              campaigns={campaigns}
              csList={csList}
              onRefresh={fetchGlobalData}
            />
          )}

          {currentTab === 'cs' && (
            <CSManagementView
              csList={csList}
              onRefresh={fetchGlobalData}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              campaigns={campaigns}
              csList={csList}
            />
          )}

          {currentTab === 'simulator' && (
            <SimulatorView
              campaigns={campaigns}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  );
}
