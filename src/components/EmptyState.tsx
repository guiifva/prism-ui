import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      {icon && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-xl bg-wine-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-wine-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
