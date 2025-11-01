import { useNavigate } from "react-router-dom";
import prismLogo from "../assets/prism-logo.png";
import UserMenu from "./UserMenu";

interface Breadcrumb {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  showBackButton?: boolean;
  backButtonPath?: string;
  showUserMenu?: boolean;
}

export default function PageHeader({
  title,
  breadcrumbs,
  showBackButton,
  backButtonPath,
  showUserMenu = true,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (backButtonPath) {
      navigate(backButtonPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-white shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={handleBackClick}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              aria-label="Voltar"
            >
              ←
            </button>
          )}
          <div className="flex items-center gap-2">
            <img
              src={prismLogo}
              alt="Logotipo Prism"
              className="h-9 w-9 rounded-lg bg-white object-contain p-0.5 shadow-sm dark:bg-slate-800"
            />
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Prism</span>
          </div>
          <div className="h-5 w-px bg-slate-300 dark:bg-slate-700"></div>

          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-slate-400 dark:text-slate-600">/</span>
                  )}
                  {crumb.path ? (
                    <button
                      onClick={() => navigate(crumb.path!)}
                      className="font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {crumb.label}
                    </span>
                  )}
                </div>
              ))}
            </nav>
          ) : (
            <h1 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{title}</h1>
          )}
        </div>
        {showUserMenu && <UserMenu />}
      </div>
    </header>
  );
}
