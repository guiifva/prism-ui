import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import SideMenu from "../components/SideMenu";
import BannerImagePreview from "../components/BannerImagePreview";
import { approveBanner, getBannerById, rejectBanner } from "../services/bannerService";
import type { BannerResponse, BannerStatus } from "../types/banner";
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

export default function BannerDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [banner, setBanner] = useState<BannerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const b = await getBannerById(id);
      setBanner(b);
    } catch (e) {
      setError((e as Error)?.message || "Falha ao carregar banner");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function dt(d?: string) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d;
    }
  }

  async function onApprove() {
    if (!banner) return;
    setBusy(true);
    try {
      await approveBanner(banner.campaign_id, banner.id);
      await load();
    } catch (e) {
      setError((e as Error)?.message || "Falha ao aprovar");
    } finally {
      setBusy(false);
    }
  }

  async function onReject() {
    if (!banner) return;
    setBusy(true);
    try {
      await rejectBanner(banner.campaign_id, banner.id);
      await load();
    } catch (e) {
      setError((e as Error)?.message || "Falha ao rejeitar");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          <p className="text-sm text-slate-600 dark:text-slate-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!banner) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{error || "Banner não encontrado"}</p>
          <button
            onClick={() => navigate("/banners")}
            className="rounded-xl bg-wine-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2"
          >
            Voltar para Banners
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <PageHeader
        title="Detalhes do Banner"
        showBackButton
        backButtonPath="/banners"
      />

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <SideMenu />
          <div className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-error-200 bg-error-50 p-4 text-error-700 dark:border-error-700 dark:bg-error-500/20 dark:text-error-200">
                {error}
              </div>
            )}

            {/* Card: Informações básicas */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{banner.banner_identifier}</h2>
                  {banner.description && (
                    <p className="mt-2 text-slate-600 dark:text-slate-300">{banner.description}</p>
                  )}
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${STATUS_CLASSES[banner.status]}`}>
                  {STATUS_LABELS[banner.status]}
                </span>
              </div>

              <div className="grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2 dark:border-slate-700">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Período</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Início: </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {dt(banner.start_date)}
                      </span>
                    </div>
                    {banner.end_date && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Fim: </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {dt(banner.end_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Produto e Placement</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Produto: </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {PRODUCT_LABELS[banner.product]}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Placement: </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {PLACEMENT_LABELS[banner.placement]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Visualização do Banner */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Visualização do Banner
              </h2>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 w-full max-w-md">
                <div className="aspect-[343/160]">
                  <BannerImagePreview
                    imageUrl={banner.image_url}
                    subtitle={banner.subtitle}
                    bannerIdentifier={banner.banner_identifier}
                    size="large"
                  />
                </div>
              </div>
              {banner.subtitle && (
                <div className="mt-4">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Subtítulo
                  </h3>
                  <p className="text-sm text-slate-900 dark:text-slate-100">{banner.subtitle}</p>
                </div>
              )}
            </div>

            {/* Card: Configurações */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Configurações
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900/60">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Prioridade
                  </span>
                  <span className="mt-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
                    {banner.priority}
                  </span>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Menor valor = maior prioridade
                  </p>
                </div>
                {banner.destination_screen_id && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900/60">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Tela destino
                    </span>
                    <span className="mt-1 block text-sm font-medium text-slate-900 dark:text-slate-100">
                      {banner.destination_screen_id}
                    </span>
                  </div>
                )}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900/60">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    URL da imagem
                  </span>
                  <span className="mt-1 block break-all text-xs font-medium text-slate-900 dark:text-slate-100">
                    {banner.image_url || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Card: Ações */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                Ações
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate(`/banners/${banner.id}/edit`)}
                  className="rounded-xl border border-info-300 bg-info-50 px-4 py-2 text-sm font-semibold text-info-800 shadow-sm transition-colors hover:bg-info-100 dark:border-info-600/50 dark:bg-info-500/20 dark:text-info-100"
                >
                  Editar
                </button>
                <button
                  onClick={onApprove}
                  disabled={banner.status !== "PENDING" || busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-success-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Aprovar banner ${banner.banner_identifier}`}
                >
                  {busy && (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  Aprovar
                </button>
                <button
                  onClick={onReject}
                  disabled={banner.status !== "PENDING" || busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-error-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-error-700 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Rejeitar banner ${banner.banner_identifier}`}
                >
                  {busy && (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  Rejeitar
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
