import { ReactNode } from "react";

interface Filter {
  id: string;
  label: string;
  type: "text" | "select";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

interface FilterBarProps {
  filters: Filter[];
  className?: string;
  additionalContent?: ReactNode;
}

export default function FilterBar({ filters, className = "", additionalContent }: FilterBarProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filters.map((filter) => (
          <div key={filter.id}>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {filter.label}
            </label>
            {filter.type === "text" ? (
              <input
                type="text"
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                placeholder={filter.placeholder}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
              />
            ) : (
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
              >
                {filter.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
      {additionalContent && (
        <div className="mt-4">{additionalContent}</div>
      )}
    </div>
  );
}
