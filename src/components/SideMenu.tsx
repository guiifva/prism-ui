import { Link, useLocation } from "react-router-dom";

export default function SideMenu() {
  const location = useLocation();
  const isCampaignsSection = location.pathname === "/" || location.pathname.startsWith("/campaigns");
  const isBannersSection = location.pathname.startsWith("/banners");

  const baseItem = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all";
  const activeClasses = "bg-wine-600 text-white shadow-sm";
  const inactiveClasses = "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800";

  return (
    <aside className="sticky top-20 h-fit rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Seção: Campanhas de Disparo */}
      <div className="border-b border-slate-200 p-4 dark:border-slate-700">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Campanhas de Disparo
        </h3>
        <nav className="space-y-1">
          <Link
            to="/"
            className={`${baseItem} ${isCampaignsSection ? activeClasses : inactiveClasses}`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>Listagem</span>
          </Link>
          <Link
            to="/campaigns/new"
            className={`${baseItem} ${inactiveClasses}`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Nova Campanha</span>
          </Link>
        </nav>
      </div>

      {/* Seção: Gestão de Banners */}
      <div className="p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Gestão de Banners
        </h3>
        <nav className="space-y-1">
          <Link
            to="/banners"
            className={`${baseItem} ${isBannersSection ? activeClasses : inactiveClasses}`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Listagem</span>
          </Link>
          <Link
            to="/banners/new"
            className={`${baseItem} ${inactiveClasses}`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Novo Banner</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}

