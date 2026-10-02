import React from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-[bounce_0.4s_ease-out] ${
            toast.type === 'coin'
              ? 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-200/50'
              : toast.type === 'success'
              ? 'bg-rose-50/95 border-rose-300 text-rose-950 shadow-rose-200/50'
              : toast.type === 'error'
              ? 'bg-red-50/95 border-red-300 text-red-950 shadow-red-200/50'
              : 'bg-white/95 border-indigo-200 text-indigo-950 shadow-indigo-200/50'
          }`}
        >
          <div className="text-xl shrink-0 mt-0.5">
            {toast.type === 'coin' ? '🪙' : toast.type === 'success' ? '✨' : toast.type === 'error' ? '⚠️' : '🔔'}
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold font-serif">{toast.title}</h4>
            <p className="text-xs mt-0.5 leading-relaxed opacity-90">{toast.message}</p>
            {toast.coinsSpent !== undefined && toast.coinsSpent > 0 && (
              <span className="inline-block mt-1 text-[11px] font-semibold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-full">
                Tiêu tốn: -{toast.coinsSpent} xu 🪙
              </span>
            )}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-gray-400 hover:text-gray-600 text-sm p-0.5"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
