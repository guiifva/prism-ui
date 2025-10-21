import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCampaignById } from "../services/campaignService";
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

const PROVIDER_BADGE_CLASSES: Record<string, string> = {
  WHATSAPP: "bg-channel-whatsapp-500 text-white border border-channel-whatsapp-600 shadow-sm dark:bg-channel-whatsapp-500/90",
  EMAIL: "bg-channel-email-500 text-white border border-channel-email-600 shadow-sm dark:bg-channel-email-500/90",
  PUSH: "bg-channel-push-500 text-white border border-channel-push-600 shadow-sm dark:bg-channel-push-500/90",
  SMS: "bg-channel-sms-500 text-white border border-channel-sms-600 shadow-sm dark:bg-channel-sms-500/90",
  AI_AGENT: "bg-wine-600 text-white border border-wine-700 shadow-sm dark:bg-wine-600/90",
};

const PROVIDER_TYPE_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  PUSH: "Push",
  SMS: "SMS",
  AI_AGENT: "Agente de IA",
};

const PRESET_SEGMENTS_MAP: Record<string, string> = {
  seg_new_users: "Novos usuários (D0–D7)",
  seg_high_ltv: "Alta Recorrência / LTV",
  seg_churn_risk: "Risco de churn",
  seg_black_friday_vips: "BF – VIPs",
  seg_cupom_ativo: "Usuários com cupom ativo",
};

function formatConfigKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatConfigValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return value.trim() === "" ? "—" : value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "—";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function CampaignDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const foundCampaign = getCampaignById(id);
      setCampaign(foundCampaign || null);
    }
    setLoading(false);
  }, [id]);

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
          <p className="text-sm text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">
            Campanha não encontrada
          </h2>
          <p className="mb-6 text-sm text-slate-600">
            A campanha que você está procurando não existe ou foi removida.
          </p>
          <button
            onClick={() => navigate("/")}
            className="rounded-xl bg-wine-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              aria-label="Voltar"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <img
                src={prismLogo}
                alt="Logotipo Prism"
                className="h-9 w-9 rounded-lg bg-white object-contain p-0.5 shadow-sm dark:bg-slate-800"
              />
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Prism</span>
            </div>
            <div className="h-5 w-px bg-slate-300 dark:bg-slate-700"></div>
            <h1 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Detalhes da Campanha</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
              className="rounded-xl bg-wine-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              Editar Campanha
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="space-y-6">
          {/* Card: Informações básicas */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{campaign.name}</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-300">{campaign.description}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                  STATUS_COLORS[campaign.status]
                }`}
              >
                {STATUS_LABELS[campaign.status]}
              </span>
            </div>

            <div className="grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2 dark:border-slate-700">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Período</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Início: </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatDate(campaign.startDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Fim: </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatDate(campaign.endDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Metadados</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Criada em: </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatDateTime(campaign.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Última atualização: </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatDateTime(campaign.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Segmentos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Segmentos vinculados
            </h2>
            {campaign.segments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {campaign.segments.map((segmentId) => (
                  <span
                    key={segmentId}
                    className="inline-flex items-center rounded-full bg-info-50 px-3 py-1 text-sm font-medium text-info-700 border border-info-200 dark:bg-info-600/20 dark:text-info-200 dark:border-info-500/40"
                  >
                    {PRESET_SEGMENTS_MAP[segmentId] || segmentId}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum segmento vinculado</p>
            )}
          </div>

          {/* Card: Provedores */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Provedores configurados
            </h2>
            {campaign.providers.length > 0 ? (
              <div className="space-y-4">
                {campaign.providers.map((provider, index) => {
                  const providerRecord =
                    provider && typeof provider === "object" ? (provider as Record<string, unknown>) : {};
                  const providerTypeRaw = providerRecord["type"];
                  const providerLabelRaw = providerRecord["label"];
                  const providerIdRaw = providerRecord["id"];
                  const providerType =
                    typeof providerTypeRaw === "string" ? providerTypeRaw : "UNKNOWN";
                  const providerLabel =
                    typeof providerLabelRaw === "string" ? providerLabelRaw : "Sem rótulo";
                  const providerId =
                    typeof providerIdRaw === "string" || typeof providerIdRaw === "number"
                      ? String(providerIdRaw)
                      : `provider-${index}`;
                  const hasConfigObject =
                    typeof providerRecord["config"] === "object" && providerRecord["config"] !== null;
                  const config = hasConfigObject ? (providerRecord["config"] as Record<string, unknown>) : {};
                  const configEntries = Object.entries(config).filter(([key]) => key !== "fieldMappings");
                  const rawFieldMappings = config["fieldMappings"];
                  const fieldMappings =
                    rawFieldMappings && typeof rawFieldMappings === "object" && !Array.isArray(rawFieldMappings)
                      ? Object.entries(rawFieldMappings as Record<string, unknown>)
                      : [];
                  const hasFieldMappingSection = Object.prototype.hasOwnProperty.call(config, "fieldMappings");
                  const hasGeneralConfig = configEntries.length > 0;
                  const hasFieldMappings = fieldMappings.length > 0;
                  const showEmptyFieldMappingsState = hasFieldMappingSection && !hasFieldMappings;
                  const hasAnyDetail = hasGeneralConfig || hasFieldMappings || showEmptyFieldMappingsState;

                  return (
                    <div
                      key={providerId}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900/60"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex h-6 items-center rounded-full bg-slate-200 px-2 text-xs font-medium dark:bg-slate-700/60 dark:text-slate-200">
                          #{index + 1}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            PROVIDER_BADGE_CLASSES[providerType] ||
                            "bg-slate-200 text-slate-800 border border-slate-300 shadow-sm dark:bg-slate-600/60 dark:text-slate-200 dark:border-slate-500/60"
                          }`}
                        >
                          {PROVIDER_TYPE_LABELS[providerType] || providerType}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">•</span>
                        <span className="text-sm text-slate-700 dark:text-slate-200">{providerLabel}</span>
                      </div>

                      <div className="mt-3 space-y-4">
                        {hasGeneralConfig && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Configurações gerais
                            </h4>
                            <div className="mt-2 grid gap-3 sm:grid-cols-2">
                              {configEntries.map(([key, value]) => {
                                const displayValue = formatConfigValue(value);
                                const isStructuredObject =
                                  typeof value === "object" && value !== null && !Array.isArray(value);

                                return (
                                  <div
                                    key={key}
                                    className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-600 dark:bg-slate-900/80"
                                  >
                                    <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                      {formatConfigKey(key)}
                                    </span>
                                    {isStructuredObject ? (
                                      <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        {displayValue}
                                      </pre>
                                    ) : (
                                      <span className="mt-1 block font-medium text-slate-900 dark:text-slate-100">
                                        {displayValue}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {hasFieldMappings && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Mapeamento de campos
                            </h4>
                            <div className="mt-2 space-y-2">
                              {fieldMappings.map(([placeholder, schemaField]) => {
                                const schemaFieldLabel =
                                  schemaField === null ||
                                  schemaField === undefined ||
                                  (typeof schemaField === "string" && schemaField.trim() === "")
                                    ? "—"
                                    : String(schemaField);
                                return (
                                  <div
                                    key={placeholder}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900/80"
                                  >
                                    <span className="font-medium text-slate-700 dark:text-slate-200">
                                      {"{{" + placeholder + "}}"}
                                    </span>
                                    <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                      {schemaFieldLabel}
                                    </code>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {showEmptyFieldMappingsState && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Mapeamento de campos
                            </h4>
                            <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-400">
                              Nenhum mapeamento configurado
                            </div>
                          </div>
                        )}

                        {!hasAnyDetail && (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-400">
                            Nenhuma configuração adicional informada
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum provedor configurado</p>
            )}
          </div>

          {/* Card: JSON completo */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Payload completo</h2>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(campaign, null, 2));
                  alert("Payload copiado!");
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Copiar JSON
              </button>
            </div>
            <pre className="max-h-96 overflow-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
              {JSON.stringify(campaign, null, 2)}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
