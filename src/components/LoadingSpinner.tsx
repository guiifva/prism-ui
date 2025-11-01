interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export default function LoadingSpinner({ size = "md", text, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div
          className={`${sizeClasses[size]} mb-4 inline-block animate-spin rounded-full border-4 border-primary-600 border-t-transparent dark:border-primary-400`}
        ></div>
        {text && (
          <p className="text-sm text-slate-600 dark:text-slate-300">{text}</p>
        )}
      </div>
    </div>
  );
}
