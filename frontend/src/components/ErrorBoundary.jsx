import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Frontend ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-[#070B14] text-white flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white">Terjadi Kendala Tampilan</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {this.state.error?.message || 'Ada error runtime pada komponen antarmuka.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold text-xs shadow-brand-glow transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-all"
              >
                Reset Sesi & Cache Lokal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
