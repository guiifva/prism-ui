import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import prismLogo from "../assets/prism-logo.png";
import UserMenu from "../components/UserMenu";
import SideMenu from "../components/SideMenu";
import BannerImagePreview from "../components/BannerImagePreview";
import {
  getAllBanners,
  approveBanner,
  rejectBanner,
} from "../services/bannerService";
import type {
  BannerProduct,
  BannerResponse,
  BannerStatus,
  PaginationBannerResponse,
} from "../types/banner";
import { PRODUCT_LABELS, PLACEMENT_LABELS } from "../utils/translations";

const STATUS_LABELS: Record<BannerStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  PENDING: "Pendente",
  REJECTED: "Rejeitado",
};

const STATUS_CLASSES: Record<BannerStatus, string> = {
  ACTIVE: "bg-success-100 text-success-700 border border-success-200 dark:bg-success-600/20 dark:text-success-200 dark:border-success-500/40",
  INACTIVE: "bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-600/40",
  PENDING: "bg-warning-100 text-warning-700 border border-warning-200 dark:bg-warning-600/20 dark:text-warning-200 dark:border-warning-500/40",
  REJECTED: "bg-error-100 text-error-700 border border-error-200 dark:bg-error-600/20 dark:text-error-200 dark:border-error-500/40",
};

const PRODUCTS: (BannerProduct | "ALL")[] = [
  "ALL",
  "CREDIT",
  "ANTICIPATION",
  "CREDIT_CARD",
  "ASSURANCE",
];

const PAGE_SIZES = [5, 10, 20, 50];

export default function BannerList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [banners, setBanners] = useState<BannerResponse[]>([]);

  // Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BannerStatus | "ALL">("ALL");
  const [productFilter, setProductFilter] = useState<BannerProduct | "ALL">("ALL");

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / size));
  }, [totalItems, size]);

  async function loadBanners() {
    setLoading(true);
    setError(null);
    try {
      const resp: PaginationBannerResponse = await getAllBanners(page, size);
      setBanners(resp.data || []);
      setTotalItems(resp.total_items || 0);
    } catch (e) {
      setError((e as Error)?.message || "Falha ao carregar banners");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  const filteredBanners = useMemo(() => {
    let data = banners;
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((b) => b.banner_identifier.toLowerCase().includes(q));
    }
    if (statusFilter !== "ALL") {
      data = data.filter((b) => b.status === statusFilter);
    }
    if (productFilter !== "ALL") {
      data = data.filter((b) => b.product === productFilter);
    }
    return data;
  }, [banners, search, statusFilter, productFilter]);

  async function handleApprove(b: BannerResponse) {
    setActionLoading({ ...actionLoading, [`approve-${b.id}`]: true });
    try {
      await approveBanner(b.campaign_id, b.id);
      await loadBanners();
    } catch (e) {
      setError((e as Error)?.message || "Falha ao aprovar banner");
    } finally {
      setActionLoading({ ...actionLoading, [`approve-${b.id}`]: false });
    }
  }

  async function handleReject(b: BannerResponse) {
    setActionLoading({ ...actionLoading, [`reject-${b.id}`]: true });
    try {
      await rejectBanner(b.campaign_id, b.id);
      await loadBanners();
    } catch (e) {
      setError((e as Error)?.message || "Falha ao rejeitar banner");
    } finally {
      setActionLoading({ ...actionLoading, [`reject-${b.id}`]: false });
    }
  }

  function formatDateTime(dt?: string) {
    if (!dt) return "—";
    try {
      return new Date(dt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dt;
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img
                src={prismLogo}
                alt="Logotipo Prism"
                className="h-9 w-9 rounded-lg bg-white object-contain p-0.5 shadow-sm dark:bg-slate-800"
              />
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Prism</span>
            </div>
            <div className="h-5 w-px bg-slate-300 dark:bg-slate-700"></div>
            <h1 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Gerenciamento de Banners</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <SideMenu />
          <section>
        {/* Filtros */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="search-banner" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Buscar por identificador</label>
            <input
              id="search-banner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="banner_home_credito_01"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
              aria-label="Buscar banners por identificador"
            />
          </div>
          <div>
            <label htmlFor="status-filter" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BannerStatus | "ALL")}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
              aria-label="Filtrar banners por status"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="PENDING">Pendente</option>
              <option value="REJECTED">Rejeitado</option>
            </select>
          </div>
          <div>
            <label htmlFor="product-filter" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Produto</label>
            <select
              id="product-filter"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value as BannerProduct | "ALL")}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
              aria-label="Filtrar banners por produto"
            >
              {PRODUCTS.map((p) => (
                <option key={p} value={p}>
                  {p === "ALL" ? "Todos" : PRODUCT_LABELS[p as BannerProduct]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Carregando banners...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-error-200 bg-error-50 p-4 text-error-700 dark:border-error-700 dark:bg-error-500/20 dark:text-error-200">
            {error}
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-200">Nenhum banner encontrado</h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Tente ajustar os filtros ou crie um novo banner.</p>
            <button
              onClick={() => navigate("/banners/new")}
              className="rounded-xl bg-wine-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-wine-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              Criar novo banner
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBanners.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600/80 dark:hover:shadow-lg"
              >
                {/* Header */}
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <div className="hidden sm:block">
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        <div className="aspect-[343/160] w-[220px]">
                          <BannerImagePreview
                            imageUrl={b.image_url}
                            subtitle={b.subtitle}
                            bannerIdentifier={b.banner_identifier}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Identificador</div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[260px] md:max-w-[360px]">
                        {b.banner_identifier}
                      </h3>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Produto: <span className="font-medium text-slate-900 dark:text-slate-100">{PRODUCT_LABELS[b.product]}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[b.status]}`}>
                    {STATUS_LABELS[b.status]}
                  </span>
                </div>

                {/* Thumbnail para mobile */}
                <div className="mb-4 sm:hidden">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    <div className="aspect-[343/160] w-full">
                      <BannerImagePreview
                        imageUrl={b.image_url}
                        subtitle={b.subtitle}
                        bannerIdentifier={b.banner_identifier}
                      />
                    </div>
                  </div>
                </div>

                {/* Grid info */}
                <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 dark:border-slate-700">
                  <div>
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Placement</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100 break-words">{PLACEMENT_LABELS[b.placement]}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Prioridade</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100">{b.priority}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Período</div>
                    <div className="text-sm text-slate-900 dark:text-slate-100">
                      {formatDateTime(b.start_date)}
                      <span className="text-slate-500"> → </span>
                      {formatDateTime(b.end_date)}
                    </div>
                  </div>
                  {b.destination_screen_id && (
                    <div className="sm:col-span-3">
                      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Tela destino</div>
                      <div className="text-sm text-slate-900 dark:text-slate-100 break-words">{b.destination_screen_id}</div>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                  <button
                    onClick={() => navigate(`/banners/${b.id}`)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    aria-label={`Ver detalhes do banner ${b.banner_identifier}`}
                  >
                    Ver detalhes
                  </button>
                  <button
                    onClick={() => navigate(`/banners/${b.id}/edit`)}
                    className="rounded-lg border border-info-300 bg-info-50 px-3 py-1.5 text-xs font-medium text-info-800 transition-all hover:bg-info-100 dark:border-info-600/40 dark:bg-info-500/20 dark:text-info-200"
                    aria-label={`Editar banner ${b.banner_identifier}`}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleApprove(b)}
                    disabled={b.status !== "PENDING" || actionLoading[`approve-${b.id}`]}
                    className="inline-flex items-center gap-2 rounded-lg bg-success-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`Aprovar banner ${b.banner_identifier}`}
                  >
                    {actionLoading[`approve-${b.id}`] && (
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleReject(b)}
                    disabled={b.status !== "PENDING" || actionLoading[`reject-${b.id}`]}
                    className="inline-flex items-center gap-2 rounded-lg bg-error-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-error-700 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`Rejeitar banner ${b.banner_identifier}`}
                  >
                    {actionLoading[`reject-${b.id}`] && (
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Itens por página:</span>
            <select
              value={size}
              onChange={(e) => {
                setPage(1);
                setSize(parseInt(e.target.value, 10));
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span>
              Página {page} de {totalPages}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Página anterior"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Próxima página"
            >
              Próxima
            </button>
          </div>
        </div>
          </section>
        </div>
      </main>
    </div>
  );
}
