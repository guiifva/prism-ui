import { useToast, Toast, ToastType } from "../contexts/ToastContext";

const toastStyles: Record<ToastType, string> = {
  success: "bg-success-100 text-success-700 border-success-200 dark:bg-success-600/20 dark:text-success-200 dark:border-success-500/40",
  error: "bg-error-100 text-error-700 border-error-200 dark:bg-error-600/20 dark:text-error-200 dark:border-error-500/40",
  warning: "bg-warning-100 text-warning-700 border-warning-200 dark:bg-warning-600/20 dark:text-warning-200 dark:border-warning-500/40",
  info: "bg-info-100 text-info-700 border-info-200 dark:bg-info-600/20 dark:text-info-200 dark:border-info-500/40",
};

const toastIcons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all ${toastStyles[toast.type]}`}
      role="alert"
    >
      <span className="text-lg font-bold">{toastIcons[toast.type]}</span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-lg font-bold opacity-70 transition-opacity hover:opacity-100"
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex flex-col gap-3 p-6">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto animate-in slide-in-from-right">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
