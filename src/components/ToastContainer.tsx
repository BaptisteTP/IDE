import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastNotification } from '../types';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        const borderStyle = isSuccess
          ? 'border-emerald-500/40 bg-[#14231b]/95 text-emerald-200'
          : isError
          ? 'border-rose-500/40 bg-[#251417]/95 text-rose-200'
          : isWarning
          ? 'border-amber-500/40 bg-[#251d14]/95 text-amber-200'
          : 'border-blue-500/40 bg-[#141b25]/95 text-blue-200';

        const Icon = isSuccess
          ? CheckCircle2
          : isError
          ? AlertCircle
          : isWarning
          ? AlertTriangle
          : Info;

        const iconColor = isSuccess
          ? 'text-emerald-400'
          : isError
          ? 'text-rose-400'
          : isWarning
          ? 'text-amber-400'
          : 'text-blue-400';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-in ${borderStyle}`}
          >
            <Icon size={18} className={`shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-xs">
              {toast.title && <div className="font-semibold text-white mb-0.5">{toast.title}</div>}
              <div className="leading-relaxed opacity-90 break-words">{toast.message}</div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition shrink-0"
              title="Fermer"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
