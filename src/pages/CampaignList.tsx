import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getCampaigns, deleteCampaign, toggleCampaignStatus } from "../services/campaignService";
import { Campaign, CampaignStatus } from "../mocks/campaigns";
import prismLogo from "../assets/prism-logo.png";
import ThemeToggle from "../components/ThemeToggle";

const STATUS_LABELS: Record<CampaignStatus, string> = {
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  FINISHED: "Finalizada",
  SCHEDULED: "Agendada",
};

const STATUS_COLORS: Record<CampaignStatus, string> = {
  ACTIVE: "bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-600/20 dark:text-primary-200 dark:border-primary-500/40",
  PAUSED: "bg-warning-100 text-warning-700 border border-warning-200 dark:bg-warning-600/20 dark:text-warning-200 dark:border-warning-500/40",
  FINISHED: "bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-600/40",
  SCHEDULED: "bg-info-100 text-info-700 border border-info-200 dark:bg-info-600/20 dark:text-info-200 dark:border-info-500/40",
};

const PRESET_SEGMENTS_MAP: Record<string, string> = {
  seg_new_users: "Novos usuários (D0–D7)",
  seg_high_ltv: "Alta Recorrência / LTV",
  seg_churn_risk: "Risco de churn",
  seg_black_friday_vips: "BF – VIPs",
  seg_cupom_ativo: "Usuários com cupom ativo",
};

export default function CampaignList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "ALL">("ALL");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Carrega campanhas ao montar o componente
  useEffect(() => {
    loadCampaigns();
  }, []);

  function loadCampaigns() {
    const allCampaigns = getCampaigns();
    setCampaigns(allCampaigns);
  }

  // Filtra campanhas por busca e status
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Filtro por status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [campaigns, searchQuery, statusFilter]);

  function handleDelete(id: string) {
    const success = deleteCampaign(id);
    if (success) {
      loadCampaigns();
      setDeleteConfirmId(null);
    }
  }

  function handleToggleStatus(id: string) {
    const updated = toggleCampaignStatus(id);
    if (updated) {
      loadCampaigns();
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/90">
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
            <h1 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Campanhas</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => navigate("/campaigns/new")}
              className="rounded-xl bg-wine-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-wine-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              + Nova Campanha
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Filtros */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {/* Busca */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Buscar por nome ou descrição
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite para buscar..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700"
            />
          </div>

          {/* Filtro por status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Filtrar por status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | "ALL")}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
            >
              <option value="ALL">Todos os status</option>
              <option value="ACTIVE">Ativa</option>
              <option value="PAUSED">Pausada</option>
              <option value="FINISHED">Finalizada</option>
              <option value="SCHEDULED">Agendada</option>
            </select>
          </div>
        </div>

        {/* Lista de campanhas */}
        {filteredCampaigns.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <svg
                className="h-8 w-8 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {searchQuery || statusFilter !== "ALL"
                ? "Nenhuma campanha encontrada"
                : "Nenhuma campanha cadastrada"}
            </h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              {searchQuery || statusFilter !== "ALL"
                ? "Tente ajustar os filtros de busca"
                : "Comece criando sua primeira campanha"}
            </p>
            {!searchQuery && statusFilter === "ALL" && (
              <button
                onClick={() => navigate("/campaigns/new")}
                className="rounded-xl bg-wine-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-wine-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                Criar primeira campanha
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600/80 dark:hover:shadow-lg"
              >
                {/* Cabeçalho do card - Limpo e focado */}
                <div className="mb-4">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {campaign.name}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            STATUS_COLORS[campaign.status]
                          }`}
                        >
                          {STATUS_LABELS[campaign.status]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{campaign.description}</p>
                    </div>
                  </div>
                </div>

                {/* Informações do card em grid */}
                <div className="mb-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 dark:border-slate-700">
                  {/* Período */}
                  <div>
                    <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Período
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {formatDate(campaign.startDate)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      até {formatDate(campaign.endDate)}
                    </div>
                  </div>

                  {/* Segmentos */}
                  <div>
                    <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Segmentos {campaign.segments.length > 0 && `(${campaign.segments.length})`}
                    </div>
                    {campaign.segments.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {campaign.segments.slice(0, 2).map((segmentId) => {
                          const segmentName = PRESET_SEGMENTS_MAP[segmentId] || segmentId;
                          const isTruncated = segmentName.length > 20;
                          return (
                            <div key={segmentId} className="group relative">
                              <span className="inline-flex items-center rounded-md bg-info-50 px-2 py-0.5 text-xs font-medium text-info-700 ring-1 ring-inset ring-info-200 cursor-default dark:bg-info-500/20 dark:text-info-200 dark:ring-info-500/40">
                                {isTruncated ? segmentName.substring(0, 20) + '...' : segmentName}
                              </span>
                              {isTruncated && (
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-xs -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                  {segmentName}
                                  <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900"></div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {campaign.segments.length > 2 && (
                          <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-700/40 dark:text-slate-200 dark:ring-slate-600/50">
                            +{campaign.segments.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs italic text-slate-400">Nenhum</span>
                    )}
                  </div>

                  {/* Provedores */}
                  <div>
                    <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Provedores {campaign.providers.length > 0 && `(${campaign.providers.length})`}
                    </div>
                    {campaign.providers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {campaign.providers.slice(0, 2).map((provider) => {
                          const getProviderStyles = () => {
                            switch(provider.type) {
                              case 'WHATSAPP':
                                return 'bg-channel-whatsapp-500 text-white border border-channel-whatsapp-600 shadow-sm dark:bg-channel-whatsapp-500/90';
                              case 'EMAIL':
                                return 'bg-channel-email-500 text-white border border-channel-email-600 shadow-sm dark:bg-channel-email-500/90';
                              case 'PUSH':
                                return 'bg-channel-push-500 text-white border border-channel-push-600 shadow-sm dark:bg-channel-push-500/90';
                              case 'SMS':
                                return 'bg-channel-sms-500 text-white border border-channel-sms-600 shadow-sm dark:bg-channel-sms-500/90';
                              default:
                                return 'bg-slate-200 text-slate-800 border border-slate-300 shadow-sm dark:bg-slate-600/60 dark:text-slate-200 dark:border-slate-500/60';
                            }
                          };

                          return (
                            <div key={provider.id} className="group relative">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold cursor-default ${getProviderStyles()}`}>
                                {provider.type}
                              </span>
                              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-xs -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                {provider.label}
                                <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900"></div>
                              </div>
                            </div>
                          );
                        })}
                        {campaign.providers.length > 2 && (
                          <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-700/40 dark:text-slate-200 dark:ring-slate-600/50">
                            +{campaign.providers.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                        <span className="text-xs italic text-slate-400 dark:text-slate-500">Nenhum</span>
                    )}
                  </div>
                </div>

                {/* Footer com ações */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    {/* Switch de Ativar/Pausar */}
                    <div className="group relative flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (campaign.status === "ACTIVE" || campaign.status === "PAUSED") {
                            handleToggleStatus(campaign.id);
                          }
                        }}
                        disabled={campaign.status !== "ACTIVE" && campaign.status !== "PAUSED"}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 focus:outline-none dark:focus:ring-offset-slate-900 ${
                          campaign.status === "ACTIVE" || campaign.status === "PAUSED"
                            ? "focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 cursor-pointer shadow-sm"
                            : "cursor-not-allowed opacity-50"
                        } ${
                          campaign.status === "ACTIVE"
                            ? "bg-primary-500 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-400"
                            : campaign.status === "PAUSED"
                            ? "bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                        role="switch"
                        aria-checked={campaign.status === "ACTIVE"}
                        title={
                          campaign.status === "FINISHED"
                            ? "Campanhas finalizadas não podem ser reativadas"
                            : campaign.status === "SCHEDULED"
                            ? "Campanhas agendadas devem ser editadas para serem ativadas"
                            : campaign.status === "ACTIVE"
                            ? "Pausar campanha"
                            : "Ativar campanha"
                        }
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
                            campaign.status === "ACTIVE"
                              ? "translate-x-5"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {campaign.status === "ACTIVE" ? "Ativa" : campaign.status === "PAUSED" ? "Pausada" : "—"}
                      </span>

                      {/* Tooltip para switches desabilitados */}
                      {(campaign.status === "FINISHED" || campaign.status === "SCHEDULED") && (
                        <div className="pointer-events-none absolute -top-16 left-0 z-10 w-48 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                          <div className="mb-1 font-semibold">
                            {campaign.status === "FINISHED" ? "Finalizada" : "Agendada"}
                          </div>
                          <div className="text-slate-300">
                            {campaign.status === "FINISHED"
                              ? "Não pode ser reativada"
                              : "Edite para ativar"}
                          </div>
                          {/* Seta do tooltip */}
                          <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 bg-slate-900"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botões de ação em linha */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm"
                    >
                      Ver detalhes
                    </button>
                    <button
                      onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                      className="rounded-lg border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-800 transition-all hover:bg-primary-100 hover:border-primary-400 hover:shadow-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(campaign.id)}
                      className="rounded-lg bg-wine-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-1"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de confirmação de exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Confirmar exclusão
            </h3>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
              Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 rounded-xl bg-wine-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-wine-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
