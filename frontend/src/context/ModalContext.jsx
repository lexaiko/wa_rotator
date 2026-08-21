import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, Trash2, X } from 'lucide-react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null);
  const [alertState, setAlertState] = useState(null);
  const [toasts, setToasts] = useState([]);

  // 1. Custom Toast
  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 2. Custom Confirm Modal
  const showConfirm = useCallback(({
    title = 'Konfirmasi Tindakan',
    message = 'Apakah Anda yakin ingin melanjutkan?',
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    type = 'danger', // 'danger' | 'warning' | 'info'
    onConfirm,
    onCancel
  }) => {
    setConfirmState({
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm: async () => {
        setConfirmState(null);
        if (onConfirm) await onConfirm();
      },
      onCancel: () => {
        setConfirmState(null);
        if (onCancel) onCancel();
      }
    });
  }, []);

  // 3. Custom Alert Modal
  const showAlert = useCallback(({
    title = 'Pemberitahuan',
    message = '',
    type = 'info', // 'error' | 'success' | 'info'
    buttonText = 'Mengerti',
    onClose
  }) => {
    setAlertState({
      title,
      message,
      type,
      buttonText,
      onClose: () => {
        setAlertState(null);
        if (onClose) onClose();
      }
    });
  }, []);

  return (
    <ModalContext.Provider value={{ showConfirm, showAlert, showToast }}>
      {children}

      {/* Global Toast Container */}
      {createPortal(
        <div className="fixed bottom-5 right-5 z-[999999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-xs font-semibold animate-in slide-in-from-bottom-5 fade-in duration-200 ${
                t.type === 'error'
                  ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                  : t.type === 'info'
                  ? 'bg-blue-950/90 border-blue-500/40 text-blue-200'
                  : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                {t.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
                {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                <span>{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Custom Confirm Modal */}
      {confirmState &&
        createPortal(
          <div className="fixed inset-0 z-[999999] w-screen h-screen bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-auto animate-in zoom-in-95 duration-200 space-y-5">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    confirmState.type === 'danger'
                      ? 'bg-rose-500/15 text-rose-500'
                      : confirmState.type === 'warning'
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'bg-brand-500/15 text-brand-500'
                  }`}
                >
                  {confirmState.type === 'danger' ? (
                    <Trash2 className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {confirmState.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {confirmState.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={confirmState.onCancel}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                >
                  {confirmState.cancelText}
                </button>

                <button
                  type="button"
                  onClick={confirmState.onConfirm}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer ${
                    confirmState.type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                      : confirmState.type === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                      : 'bg-brand-500 hover:bg-brand-600 shadow-brand-glow'
                  }`}
                >
                  {confirmState.confirmText}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Custom Alert Modal */}
      {alertState &&
        createPortal(
          <div className="fixed inset-0 z-[999999] w-screen h-screen bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-auto animate-in zoom-in-95 duration-200 space-y-5">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    alertState.type === 'error'
                      ? 'bg-rose-500/15 text-rose-500'
                      : alertState.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-blue-500/15 text-blue-500'
                  }`}
                >
                  {alertState.type === 'error' ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : alertState.type === 'success' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Info className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {alertState.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {alertState.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={alertState.onClose}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand-glow transition-all active:scale-95 cursor-pointer"
                >
                  {alertState.buttonText}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return ctx;
}
