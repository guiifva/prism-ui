import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createCampaign, updateCampaign, getCampaignById } from "../services/campaignService";
import { CampaignStatus } from "../mocks/campaigns";
import prismLogo from "../assets/prism-logo.png";
import ThemeToggle from "../components/ThemeToggle";

// Função auxiliar para gerar IDs únicos
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

const PRESET_SEGMENTS = [
  { id: "seg_new_users", name: "Novos usuários (D0–D7)" },
  { id: "seg_high_ltv", name: "Alta Recorrência / LTV" },
  { id: "seg_churn_risk", name: "Risco de churn" },
  { id: "seg_black_friday_vips", name: "BF – VIPs" },
  { id: "seg_cupom_ativo", name: "Usuários com cupom ativo" },
];

const PRESET_WHATSAPP_PROVIDERS = [
  { id: "wpp_meta_01", name: "Meta BSP #01" },
  { id: "wpp_360_01", name: "360Dialog #01" },
];

// Templates pré-cadastrados no banco
const PRESET_WHATSAPP_TEMPLATES = [
  {
    id: "tpl_bf_offer",
    name: "Black Friday - Oferta de Crédito",
    body: "Olá {{name}}, chegou a Black Friday! Você tem uma oferta de crédito de {{creditvalue}} com taxa de {{credittax}}. Aproveite!",
  },
  {
    id: "tpl_credit_approval",
    name: "Aprovação de Crédito",
    body: "{{name}}, sua solicitação foi aprovada! Crédito de {{creditvalue}} disponível para {{tradingname}}.",
  },
  {
    id: "tpl_card_offer",
    name: "Oferta de Cartão",
    body: "Olá {{name}}! Temos uma oferta especial de cartão para {{tradingname}} com limite de {{limite}}.",
  },
];

// Campos disponíveis do schema CampaignContactAttributes para interpolação
const CAMPAIGN_CONTACT_FIELDS = [
  { key: "d_tax_identification", label: "CNPJ (Tax ID)" },
  { key: "d_trading_name", label: "Nome Fantasia (Trading Name)" },
  { key: "d_first_name", label: "Primeiro Nome (First Name)" },
  { key: "d_account_type", label: "Tipo de Conta (Account Type)" },
  { key: "d_segment_type", label: "Tipo de Segmento (Segment Type)" },
  { key: "d_city", label: "Cidade (City)" },
  { key: "d_state", label: "Estado (State)" },
  { key: "m_creditengine_last_offer_value_max_formatted", label: "Valor Máximo da Oferta (Max Offer Value)" },
  { key: "m_credit_tax", label: "Taxa de Crédito (Credit Tax)" },
  { key: "m_tiervalue", label: "Tier Value" },
  { key: "d_ifp_category", label: "Categoria iFood Pago" },
  { key: "d_ifp_credit_product", label: "Produto de Crédito iFood Pago" },
  { key: "m_credit_card_limit_approved", label: "Limite de Cartão Aprovado (Card Limit)" },
  { key: "d_card_type", label: "Tipo de Cartão (Card Type)" },
  { key: "d_taxa_d7_motor", label: "Taxa D7 Motor" },
];

const PRESET_PUSH_PROVIDERS = [
  { id: "push_firebase_01", name: "Firebase (FCM) #01" },
  { id: "push_sns_01", name: "AWS SNS #01" },
];

const PRESET_AI_AGENT_PROVIDERS = [
  { id: "ai_blip_01", name: "Blip AI Agent #01" },
  { id: "ai_blip_02", name: "Blip AI Agent #02" },
];

const PRESET_EMAIL_PROVIDERS = [
  { id: "email_ses_01", name: "AWS SES #01" },
  { id: "email_sendgrid_01", name: "SendGrid #01" },
];

// Templates de email (HTML)
const PRESET_EMAIL_TEMPLATES = [
  {
    id: "tpl_email_bf_offer",
    name: "Black Friday - Oferta de Crédito (Email)",
    subject: "🎉 Black Friday: Oferta Especial para {{name}}!",
    body: "Olá {{name}}, chegou a Black Friday! Você tem uma oferta de crédito de {{creditvalue}} com taxa de {{credittax}}. Aproveite!",
  },
  {
    id: "tpl_email_credit_approval",
    name: "Aprovação de Crédito (Email)",
    subject: "✅ Crédito Aprovado - {{tradingname}}",
    body: "{{name}}, sua solicitação foi aprovada! Crédito de {{creditvalue}} disponível para {{tradingname}}.",
  },
];

// Tipos de provider
const PROVIDER_TYPES = {
  WHATSAPP: "WHATSAPP",
  PUSH: "PUSH",
  AI_AGENT: "AI_AGENT",
  EMAIL: "EMAIL",
} as const;

type ProviderType = typeof PROVIDER_TYPES[keyof typeof PROVIDER_TYPES];

// Modelos simples dos providers
interface WhatsAppConfig {
  providerId: string; // id do provider pré-cadastrado
  botName: string;
  flowId: string;
  templateId: string; // id do template pré-cadastrado
  fieldMappings: Record<string, string>; // mapeamento: placeholder -> campo do schema
}

interface PushConfig {
  providerId: string; // id do provider pré-cadastrado
  title: string;
  body: string;
  deepLink: string;
  imageUrl?: string;
}

interface AIAgentConfig {
  providerId: string; // id do provider pré-cadastrado
  blipBotId: string; // id do bot na plataforma Blip
  templateId: string; // id do template pré-cadastrado
  fieldMappings: Record<string, string>; // mapeamento: placeholder -> campo do schema
}

interface EmailConfig {
  providerId: string; // id do provider pré-cadastrado
  senderEmail: string;
  senderName: string;
  subject: string;
  templateId: string; // id do template pré-cadastrado (HTML)
  fieldMappings: Record<string, string>; // mapeamento: placeholder -> campo do schema
}

interface ProviderEntry {
  id: string; // uuid local
  type: ProviderType;
  label: string; // nome amigável no card
  config: WhatsAppConfig | PushConfig | AIAgentConfig | EmailConfig;
}

export default function CampaignForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Dados básicos da campanha
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("SCHEDULED");

  // Segmentos selecionados
  const [segmentFilter, setSegmentFilter] = useState("");
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [showSegmentDropdown, setShowSegmentDropdown] = useState(false);
  const segmentDropdownRef = useRef<HTMLDivElement>(null);

  // Providers adicionados
  const [providers, setProviders] = useState<ProviderEntry[]>([]);
  const [newProviderType, setNewProviderType] = useState<ProviderType | "">("");

  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  // Carrega os dados da campanha se estiver em modo de edição
  useEffect(() => {
    if (isEditMode && id) {
      const campaign = getCampaignById(id);
      if (campaign) {
        setName(campaign.name);
        setDescription(campaign.description);
        setStartDate(campaign.startDate);
        setEndDate(campaign.endDate);
        setStatus(campaign.status);
        setSelectedSegments(campaign.segments);
        setProviders(campaign.providers);
      } else {
        setSubmitMsg("Campanha não encontrada!");
      }
    }
  }, [id, isEditMode]);

  const segmentsFiltered = useMemo(() => {
    const f = segmentFilter.trim().toLowerCase();
    if (!f) return PRESET_SEGMENTS.slice(0, 20); // Limita a 20 itens quando não há filtro
    return PRESET_SEGMENTS.filter((s) => s.name.toLowerCase().includes(f)).slice(0, 50);
  }, [segmentFilter]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (segmentDropdownRef.current && !segmentDropdownRef.current.contains(event.target as Node)) {
        setShowSegmentDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const jsonPreview = useMemo(() => {
    const payload = {
      campaign: {
        name,
        description,
        period: { startDate, endDate },
        segments: selectedSegments,
      },
      dispatchProviders: providers.map((p) => ({
        id: p.id,
        type: p.type,
        label: p.label,
        config: p.config,
      })),
    };
    return JSON.stringify(payload, null, 2);
  }, [name, description, startDate, endDate, selectedSegments, providers]);

  function toggleSegment(id: string) {
    setSelectedSegments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function addProvider() {
    if (!newProviderType) return;

    // Verifica se já existe um provider deste tipo
    const existingProvider = providers.find(p => p.type === newProviderType);
    if (existingProvider) {
      setSubmitMsg(`Já existe um provedor do tipo ${getProviderTypeName(newProviderType)} configurado. Limite: 1 por tipo.`);
      setTimeout(() => setSubmitMsg(null), 5000);
      return;
    }

    if (newProviderType === PROVIDER_TYPES.WHATSAPP) {
      const entry: ProviderEntry = {
        id: generateId(),
        type: PROVIDER_TYPES.WHATSAPP,
        label: "WhatsApp",
        config: {
          providerId: PRESET_WHATSAPP_PROVIDERS[0]?.id || "",
          botName: "",
          flowId: "",
          templateId: PRESET_WHATSAPP_TEMPLATES[0]?.id || "",
          fieldMappings: {},
        } as WhatsAppConfig,
      };
      setProviders((prev) => [...prev, entry]);
    }
    if (newProviderType === PROVIDER_TYPES.PUSH) {
      const entry: ProviderEntry = {
        id: generateId(),
        type: PROVIDER_TYPES.PUSH,
        label: "Push Notification",
        config: {
          providerId: PRESET_PUSH_PROVIDERS[0]?.id || "",
          title: "Black Friday chegou!",
          body: "Descontos imperdíveis. Toque e aproveite.",
          deepLink: "myapp://black-friday",
          imageUrl: "",
        } as PushConfig,
      };
      setProviders((prev) => [...prev, entry]);
    }
    if (newProviderType === PROVIDER_TYPES.AI_AGENT) {
      const entry: ProviderEntry = {
        id: generateId(),
        type: PROVIDER_TYPES.AI_AGENT,
        label: "Agente de IA",
        config: {
          providerId: PRESET_AI_AGENT_PROVIDERS[0]?.id || "",
          blipBotId: "",
          templateId: PRESET_WHATSAPP_TEMPLATES[0]?.id || "",
          fieldMappings: {},
        } as AIAgentConfig,
      };
      setProviders((prev) => [...prev, entry]);
    }
    if (newProviderType === PROVIDER_TYPES.EMAIL) {
      const entry: ProviderEntry = {
        id: generateId(),
        type: PROVIDER_TYPES.EMAIL,
        label: "Email",
        config: {
          providerId: PRESET_EMAIL_PROVIDERS[0]?.id || "",
          senderEmail: "noreply@prism.com",
          senderName: "Prism",
          subject: "",
          templateId: PRESET_EMAIL_TEMPLATES[0]?.id || "",
          fieldMappings: {},
        } as EmailConfig,
      };
      setProviders((prev) => [...prev, entry]);
    }
    setNewProviderType("");
  }

  function getProviderTypeName(type: ProviderType): string {
    const names = {
      [PROVIDER_TYPES.WHATSAPP]: "WhatsApp",
      [PROVIDER_TYPES.PUSH]: "Push",
      [PROVIDER_TYPES.AI_AGENT]: "Agente de IA",
      [PROVIDER_TYPES.EMAIL]: "Email",
    };
    return names[type] || type;
  }

  function removeProvider(id: string) {
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }

  function updateProviderLabel(id: string, label: string) {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, label } : p)));
  }

  function updateWhatsAppConfig(id: string, patch: Partial<WhatsAppConfig>) {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== id || p.type !== PROVIDER_TYPES.WHATSAPP) return p;
        return { ...p, config: { ...(p.config as WhatsAppConfig), ...patch } };
      })
    );
  }

  function updatePushConfig(id: string, patch: Partial<PushConfig>) {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== id || p.type !== PROVIDER_TYPES.PUSH) return p;
        return { ...p, config: { ...(p.config as PushConfig), ...patch } };
      })
    );
  }

  function updateAIAgentConfig(id: string, patch: Partial<AIAgentConfig>) {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== id || p.type !== PROVIDER_TYPES.AI_AGENT) return p;
        return { ...p, config: { ...(p.config as AIAgentConfig), ...patch } };
      })
    );
  }

  function updateEmailConfig(id: string, patch: Partial<EmailConfig>) {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== id || p.type !== PROVIDER_TYPES.EMAIL) return p;
        return { ...p, config: { ...(p.config as EmailConfig), ...patch } };
      })
    );
  }

  function updateFieldMapping(id: string, placeholder: string, schemaField: string) {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== id || p.type !== PROVIDER_TYPES.WHATSAPP) return p;
        const cfg = p.config as WhatsAppConfig;
        return {
          ...p,
          config: {
            ...cfg,
            fieldMappings: { ...cfg.fieldMappings, [placeholder]: schemaField }
          }
        };
      })
    );
  }


  function validateForm() {
    if (!name.trim()) return "Informe um nome único.";
    if (!startDate || !endDate) return "Defina o período (início e fim).";
    if (new Date(startDate) > new Date(endDate)) return "Período inválido: início após o fim.";
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setSubmitMsg(err);
      setTimeout(() => setSubmitMsg(null), 5000);
      return;
    }

    try {
      if (isEditMode && id) {
        // Atualizar campanha existente
        updateCampaign(id, {
          name,
          description,
          startDate,
          endDate,
          status,
          segments: selectedSegments,
          providers,
        });
        setSubmitMsg("Campanha atualizada com sucesso!");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        // Criar nova campanha
        createCampaign({
          name,
          description,
          startDate,
          endDate,
          status,
          segments: selectedSegments,
          providers,
        });
        setSubmitMsg("Campanha criada com sucesso!");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } catch (error) {
      setSubmitMsg("Erro ao salvar campanha. Tente novamente.");
      setTimeout(() => setSubmitMsg(null), 5000);
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
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
            <h1 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              {isEditMode ? "Editar Campanha" : "Nova Campanha"}
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[1fr_420px]">
        {/* COLUNA ESQUERDA */}
        <section className="space-y-6">
          {/* Card: informações básicas */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Informações básicas</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Defina os dados principais da campanha</p>
                </div>
                <span className="rounded-full bg-error-100 px-2.5 py-1 text-xs font-semibold text-error-700 dark:bg-error-500/20 dark:text-error-200 dark:border dark:border-error-400/40">Obrigatório</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Nome único</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="black-friday-2025-vip"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Use um identificador estável (letras, números e hífen).
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Descrição</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Campanha de Black Friday para segmentos VIP e alta recorrência."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Início</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Fim</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                  >
                    <option value="SCHEDULED">Agendada</option>
                    <option value="ACTIVE">Ativa</option>
                    <option value="PAUSED">Pausada</option>
                    <option value="FINISHED">Finalizada</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Card: Segmentos */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Segmentos vinculados</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Escolha os públicos que receberão esta campanha</p>
                </div>
                <span className="rounded-full bg-info-100 px-2.5 py-1 text-xs font-semibold text-info-700">
                  {selectedSegments.length} selecionado{selectedSegments.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Dropdown de seleção - melhor para centenas de itens */}
              <div className="relative mb-3" ref={segmentDropdownRef}>
                <input
                  value={segmentFilter}
                  onChange={(e) => {
                    setSegmentFilter(e.target.value);
                    setShowSegmentDropdown(true);
                  }}
                  onFocus={() => setShowSegmentDropdown(true)}
                  placeholder="Digite para buscar e selecionar segmentos..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                />

                {showSegmentDropdown && segmentsFiltered.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    {segmentsFiltered.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          toggleSegment(s.id);
                          setSegmentFilter("");
                        }}
                        className={`flex w-full items-center gap-2 border-b px-4 py-3 text-left text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 ${
                          selectedSegments.includes(s.id) ? 'bg-slate-100 dark:bg-slate-700/60' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 pointer-events-none"
                          checked={selectedSegments.includes(s.id)}
                          readOnly
                        />
                    <span>{s.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Segmentos selecionados */}
              {selectedSegments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSegments.map((id) => {
                    const seg = PRESET_SEGMENTS.find((x) => x.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-2 rounded-full bg-info-50 px-3 py-1 text-xs font-medium text-info-700 border border-info-200 dark:bg-info-500/20 dark:text-info-200 dark:border-info-500/40"
                      >
                        {seg?.name || id}
                        <button
                          type="button"
                          onClick={() => toggleSegment(id)}
                          className="rounded-full px-2 py-0.5 text-slate-500 hover:bg-slate-200"
                          aria-label="Remover"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {selectedSegments.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                  Nenhum segmento selecionado. Digite acima para buscar e selecionar.
                </div>
              )}
            </div>

            {/* Card: Provedores de disparo */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Provedores de disparo</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Configure os canais de comunicação da campanha</p>
                </div>
                {providers.length > 0 && (
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 border border-primary-200 dark:bg-primary-600/20 dark:text-primary-200 dark:border-primary-500/40">
                    {providers.length} configurado{providers.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Adição de provider */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <select
                  value={newProviderType}
                  onChange={(e) => setNewProviderType(e.target.value as ProviderType)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring sm:max-w-xs dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                >
                  <option value="">Escolher tipo...</option>
                  <option value={PROVIDER_TYPES.WHATSAPP} disabled={providers.some(p => p.type === PROVIDER_TYPES.WHATSAPP)}>
                    WhatsApp {providers.some(p => p.type === PROVIDER_TYPES.WHATSAPP) && '(já adicionado)'}
                  </option>
                  <option value={PROVIDER_TYPES.AI_AGENT} disabled={providers.some(p => p.type === PROVIDER_TYPES.AI_AGENT)}>
                    Agente de IA {providers.some(p => p.type === PROVIDER_TYPES.AI_AGENT) && '(já adicionado)'}
                  </option>
                  <option value={PROVIDER_TYPES.PUSH} disabled={providers.some(p => p.type === PROVIDER_TYPES.PUSH)}>
                    Push Notification {providers.some(p => p.type === PROVIDER_TYPES.PUSH) && '(já adicionado)'}
                  </option>
                  <option value={PROVIDER_TYPES.EMAIL} disabled={providers.some(p => p.type === PROVIDER_TYPES.EMAIL)}>
                    Email {providers.some(p => p.type === PROVIDER_TYPES.EMAIL) && '(já adicionado)'}
                  </option>
                </select>
                <button
                  type="button"
                  onClick={addProvider}
                  className="rounded-xl bg-wine-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-1 disabled:opacity-50 dark:focus:ring-offset-slate-900"
                  disabled={!newProviderType}
                >
                  Adicionar Provedor
                </button>
              </div>

              <div className="space-y-4">
                {providers.map((p, idx) => (
                  <ProviderCard
                    key={p.id}
                    index={idx + 1}
                    entry={p}
                    onRemove={() => removeProvider(p.id)}
                    onUpdateLabel={(label) => updateProviderLabel(p.id, label)}
                    onUpdateWhatsApp={(patch) => updateWhatsAppConfig(p.id, patch)}
                    onUpdatePush={(patch) => updatePushConfig(p.id, patch)}
                    onUpdateAIAgent={(patch) => updateAIAgentConfig(p.id, patch)}
                    onUpdateEmail={(patch) => updateEmailConfig(p.id, patch)}
                    onUpdateFieldMapping={(placeholder, schemaField) => updateFieldMapping(p.id, placeholder, schemaField)}
                  />
                ))}

                {providers.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-600 dark:bg-slate-900">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <svg className="h-6 w-6 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">Nenhum provedor configurado</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Escolha um tipo de canal acima e clique em <span className="font-medium text-slate-700 dark:text-slate-200">Adicionar Provedor</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                className="rounded-xl bg-wine-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                {isEditMode ? "Atualizar campanha" : "Criar campanha"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
              >
                Cancelar
              </button>
              {submitMsg && (
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  submitMsg.includes('preparada') || submitMsg.includes('sucesso')
                    ? 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-600/20 dark:text-primary-200 dark:border-primary-500/40'
                    : 'bg-error-100 text-error-700 border border-error-200 dark:bg-error-500/20 dark:text-error-200 dark:border-error-400/40'
                }`}>
                  {submitMsg.includes('preparada') || submitMsg.includes('sucesso') ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span>{submitMsg}</span>
                </div>
              )}
            </div>
          </form>
        </section>

        {/* COLUNA DIREITA: Preview JSON */}
        <aside className="sticky top-20 h-fit space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Resumo da Configuração</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Visão geral dos dados preenchidos</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${name ? 'bg-primary-500' : 'bg-slate-300'}`}></div>
                <span className={name ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}>
                  {name ? 'Nome definido' : 'Nome não definido'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${startDate && endDate ? 'bg-primary-500' : 'bg-slate-300'}`}></div>
                <span className={startDate && endDate ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}>
                  {startDate && endDate ? 'Período configurado' : 'Período não definido'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${selectedSegments.length > 0 ? 'bg-primary-500' : 'bg-slate-300'}`}></div>
                <span className={selectedSegments.length > 0 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}>
                  {selectedSegments.length > 0 ? `${selectedSegments.length} segmento${selectedSegments.length !== 1 ? 's' : ''} selecionado${selectedSegments.length !== 1 ? 's' : ''}` : 'Nenhum segmento selecionado'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${providers.length > 0 ? 'bg-primary-500' : 'bg-slate-300'}`}></div>
                <span className={providers.length > 0 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}>
                  {providers.length > 0 ? `${providers.length} provedor${providers.length !== 1 ? 'es' : ''} configurado${providers.length !== 1 ? 's' : ''}` : 'Nenhum provedor configurado'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Payload JSON</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Estrutura final da campanha</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(jsonPreview);
                  // Feedback visual opcional
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900"
              >
                📋 Copiar
              </button>
            </div>
            <pre className="max-h-[520px] overflow-auto rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100 shadow-inner">
{jsonPreview}
            </pre>
          </div>
        </aside>
      </main>
    </div>
  );
}

function ProviderCard(props: {
  index: number;
  entry: ProviderEntry;
  onRemove: () => void;
  onUpdateLabel: (label: string) => void;
  onUpdateWhatsApp: (patch: Partial<WhatsAppConfig>) => void;
  onUpdatePush: (patch: Partial<PushConfig>) => void;
  onUpdateAIAgent: (patch: Partial<AIAgentConfig>) => void;
  onUpdateEmail: (patch: Partial<EmailConfig>) => void;
  onUpdateFieldMapping: (placeholder: string, schemaField: string) => void;
}) {
  const { entry, index } = props;
  const [open, setOpen] = useState(true);
  const typeBadgeClasses: Record<ProviderType, string> = {
    WHATSAPP: "bg-channel-whatsapp-500 text-white border border-channel-whatsapp-600 shadow-sm dark:bg-channel-whatsapp-500/90",
    PUSH: "bg-channel-push-500 text-white border border-channel-push-600 shadow-sm dark:bg-channel-push-500/90",
    AI_AGENT: "bg-wine-600 text-white border border-wine-700 shadow-sm dark:bg-wine-600/90",
    EMAIL: "bg-channel-email-500 text-white border border-channel-email-600 shadow-sm dark:bg-channel-email-500/90",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Expandir/Recolher"
            >
              {open ? "−" : "+"}
            </button>
            <span className="inline-flex h-7 items-center rounded-full bg-slate-100 px-2 text-xs dark:bg-slate-700/60 dark:text-slate-200">#{index}</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadgeClasses[entry.type]}`}
            >
              {entry.type === PROVIDER_TYPES.WHATSAPP && "WhatsApp"}
              {entry.type === PROVIDER_TYPES.PUSH && "Push Notification"}
              {entry.type === PROVIDER_TYPES.AI_AGENT && "Agente de IA"}
              {entry.type === PROVIDER_TYPES.EMAIL && "Email"}
            </span>
          </div>
          <input
            value={entry.label}
            onChange={(e) => props.onUpdateLabel(e.target.value)}
            placeholder="Rótulo do provedor (ex.: WhatsApp VIP)"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-200 focus:ring dark:border-slate-600 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
          />
        </div>
        <button
          type="button"
          onClick={props.onRemove}
          className="rounded-xl border border-wine-200 bg-wine-50 px-3 py-2 text-xs font-medium text-wine-700 transition-colors hover:bg-wine-100 dark:border-wine-700/60 dark:bg-wine-600/10 dark:text-wine-200 dark:hover:bg-wine-600/20"
        >
          Remover
        </button>
      </div>

      {open && (
        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
          {entry.type === PROVIDER_TYPES.WHATSAPP && (
            <WhatsAppConfigForm
              config={entry.config as WhatsAppConfig}
              onUpdateWhatsApp={props.onUpdateWhatsApp}
              onUpdateFieldMapping={props.onUpdateFieldMapping}
            />
          )}
          {entry.type === PROVIDER_TYPES.PUSH && (
            <PushConfigForm
              config={entry.config as PushConfig}
              onUpdatePush={props.onUpdatePush}
            />
          )}
          {entry.type === PROVIDER_TYPES.AI_AGENT && (
            <AIAgentConfigForm
              config={entry.config as AIAgentConfig}
              onUpdateAIAgent={props.onUpdateAIAgent}
              onUpdateFieldMapping={props.onUpdateFieldMapping}
            />
          )}
          {entry.type === PROVIDER_TYPES.EMAIL && (
            <EmailConfigForm
              config={entry.config as EmailConfig}
              onUpdateEmail={props.onUpdateEmail}
              onUpdateFieldMapping={props.onUpdateFieldMapping}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface WhatsAppConfigFormProps {
  config: WhatsAppConfig;
  onUpdateWhatsApp: (patch: Partial<WhatsAppConfig>) => void;
  onUpdateFieldMapping: (placeholder: string, schemaField: string) => void;
}

function WhatsAppConfigForm(props: WhatsAppConfigFormProps) {
  const { config } = props;

  // Encontra o template selecionado
  const selectedTemplate = PRESET_WHATSAPP_TEMPLATES.find(t => t.id === config.templateId);

  // Extrai placeholders do template selecionado
  const extractPlaceholders = (body: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = [...body.matchAll(regex)];
    return matches.map(m => m[1]);
  };

  const placeholders = selectedTemplate ? extractPlaceholders(selectedTemplate.body) : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Nome do Bot</label>
          <input
            value={config.botName}
            onChange={(e) => props.onUpdateWhatsApp({ botName: e.target.value })}
            placeholder="bf-bot-vip"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ID do Fluxo</label>
          <input
            value={config.flowId}
            onChange={(e) => props.onUpdateWhatsApp({ flowId: e.target.value })}
            placeholder="flow_123456"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Template Pré-cadastrado</label>
          <select
            value={config.templateId}
            onChange={(e) => props.onUpdateWhatsApp({ templateId: e.target.value, fieldMappings: {} })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
          >
            {PRESET_WHATSAPP_TEMPLATES.map((t) => (
              <option value={t.id} key={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exibe o corpo do template selecionado */}
      {selectedTemplate && (
        <div className="rounded-xl border bg-slate-50 p-4">
          <div className="mb-2 text-sm font-semibold">Corpo do template:</div>
          <div className="whitespace-pre-wrap text-sm text-slate-700">
            {selectedTemplate.body}
          </div>
        </div>
      )}

      {/* Mapeamento de campos */}
      {placeholders.length > 0 && (
        <div className="rounded-xl border p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold">Mapeamento de Campos</h4>
            <p className="text-xs text-slate-500 mt-1">
              Mapeie cada placeholder do template para um campo do schema
            </p>
          </div>
          <div className="space-y-3">
            {placeholders.map((placeholder) => (
              <div key={placeholder} className="grid gap-3 sm:grid-cols-[auto_1fr]">
                <div className="flex items-center">
                  <span className="inline-flex items-center rounded-lg bg-info-100 px-3 py-2 text-sm font-mono text-info-700">
                    {'{{' + placeholder + '}}'}
                  </span>
                </div>
                <div>
                  <select
                    value={config.fieldMappings[placeholder] || ""}
                    onChange={(e) => props.onUpdateFieldMapping(placeholder, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                  >
                    <option value="">Selecione um campo...</option>
                    {CAMPAIGN_CONTACT_FIELDS.map((field) => (
                      <option value={field.key} key={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

interface PushConfigFormProps {
  config: PushConfig;
  onUpdatePush: (patch: Partial<PushConfig>) => void;
}

function PushConfigForm(props: PushConfigFormProps) {
  const { config } = props;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Título</label>
          <input
            value={config.title}
            onChange={(e) => props.onUpdatePush({ title: e.target.value })}
            placeholder="Black Friday chegou!"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Deep Link</label>
          <input
            value={config.deepLink}
            onChange={(e) => props.onUpdatePush({ deepLink: e.target.value })}
            placeholder="myapp://black-friday"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Descrição</label>
          <input
            value={config.body}
            onChange={(e) => props.onUpdatePush({ body: e.target.value })}
            placeholder="Descontos imperdíveis. Toque e aproveite."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Imagem (opcional)</label>
          <input
            value={config.imageUrl || ""}
            onChange={(e) => props.onUpdatePush({ imageUrl: e.target.value })}
            placeholder="https://..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Preview Push */}
      <div className="rounded-xl border bg-slate-50 p-4">
        <div className="mb-2 text-sm font-semibold">Preview do push:</div>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded bg-slate-300" />
          <div>
            <div className="text-sm font-semibold">{config.title || "(sem título)"}</div>
            <div className="text-sm text-slate-700">{config.body || "(sem descrição)"}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Deep link: {config.deepLink || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AIAgentConfigFormProps {
  config: AIAgentConfig;
  onUpdateAIAgent: (patch: Partial<AIAgentConfig>) => void;
  onUpdateFieldMapping: (placeholder: string, schemaField: string) => void;
}

function AIAgentConfigForm(props: AIAgentConfigFormProps) {
  const { config } = props;

  // Encontra o template selecionado
  const selectedTemplate = PRESET_WHATSAPP_TEMPLATES.find(t => t.id === config.templateId);

  // Extrai placeholders do template selecionado
  const extractPlaceholders = (body: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = [...body.matchAll(regex)];
    return matches.map(m => m[1]);
  };

  const placeholders = selectedTemplate ? extractPlaceholders(selectedTemplate.body) : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">ID do Bot na Blip</label>
          <input
            value={config.blipBotId}
            onChange={(e) => props.onUpdateAIAgent({ blipBotId: e.target.value })}
            placeholder="bot-12345"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Template Pré-cadastrado</label>
          <select
            value={config.templateId}
            onChange={(e) => props.onUpdateAIAgent({ templateId: e.target.value, fieldMappings: {} })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
          >
            {PRESET_WHATSAPP_TEMPLATES.map((t) => (
              <option value={t.id} key={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exibe o corpo do template selecionado */}
      {selectedTemplate && (
        <div className="rounded-xl border bg-slate-50 p-4">
          <div className="mb-2 text-sm font-semibold">Corpo do template:</div>
          <div className="whitespace-pre-wrap text-sm text-slate-700">
            {selectedTemplate.body}
          </div>
        </div>
      )}

      {/* Mapeamento de campos */}
      {placeholders.length > 0 && (
        <div className="rounded-xl border p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold">Mapeamento de Campos</h4>
            <p className="text-xs text-slate-500 mt-1">
              Mapeie cada placeholder do template para um campo do schema
            </p>
          </div>
          <div className="space-y-3">
            {placeholders.map((placeholder) => (
              <div key={placeholder} className="grid gap-3 sm:grid-cols-[auto_1fr]">
                <div className="flex items-center">
                  <span className="inline-flex items-center rounded-lg bg-info-100 px-3 py-2 text-sm font-mono text-info-700">
                    {'{{' + placeholder + '}}'}
                  </span>
                </div>
                <div>
                  <select
                    value={config.fieldMappings[placeholder] || ""}
                    onChange={(e) => props.onUpdateFieldMapping(placeholder, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                  >
                    <option value="">Selecione um campo...</option>
                    {CAMPAIGN_CONTACT_FIELDS.map((field) => (
                      <option value={field.key} key={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface EmailConfigFormProps {
  config: EmailConfig;
  onUpdateEmail: (patch: Partial<EmailConfig>) => void;
  onUpdateFieldMapping: (placeholder: string, schemaField: string) => void;
}

function EmailConfigForm(props: EmailConfigFormProps) {
  const { config } = props;

  // Encontra o template selecionado
  const selectedTemplate = PRESET_EMAIL_TEMPLATES.find(t => t.id === config.templateId);

  // Extrai placeholders do template selecionado
  const extractPlaceholders = (body: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = [...body.matchAll(regex)];
    return matches.map(m => m[1]);
  };

  const placeholders = selectedTemplate ? extractPlaceholders(selectedTemplate.body) : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Email do Remetente</label>
          <input
            value={config.senderEmail}
            onChange={(e) => props.onUpdateEmail({ senderEmail: e.target.value })}
            placeholder="noreply@prism.com"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Nome do Remetente</label>
          <input
            value={config.senderName}
            onChange={(e) => props.onUpdateEmail({ senderName: e.target.value })}
            placeholder="Prism"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Template Pré-cadastrado</label>
          <select
            value={config.templateId}
            onChange={(e) => props.onUpdateEmail({ templateId: e.target.value, fieldMappings: {} })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
          >
            {PRESET_EMAIL_TEMPLATES.map((t) => (
              <option value={t.id} key={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exibe o assunto e corpo do template selecionado */}
      {selectedTemplate && (
        <div className="space-y-3">
          <div className="rounded-xl border bg-slate-50 p-4">
            <div className="mb-2 text-sm font-semibold">Assunto do email:</div>
            <div className="whitespace-pre-wrap text-sm text-slate-700">
              {selectedTemplate.subject}
            </div>
          </div>
          <div className="rounded-xl border bg-slate-50 p-4">
            <div className="mb-2 text-sm font-semibold">Corpo do email:</div>
            <div className="whitespace-pre-wrap text-sm text-slate-700">
              {selectedTemplate.body}
            </div>
          </div>
        </div>
      )}

      {/* Mapeamento de campos */}
      {placeholders.length > 0 && (
        <div className="rounded-xl border p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold">Mapeamento de Campos</h4>
            <p className="text-xs text-slate-500 mt-1">
              Mapeie cada placeholder do template para um campo do schema
            </p>
          </div>
          <div className="space-y-3">
            {placeholders.map((placeholder) => (
              <div key={placeholder} className="grid gap-3 sm:grid-cols-[auto_1fr]">
                <div className="flex items-center">
                  <span className="inline-flex items-center rounded-lg bg-info-100 px-3 py-2 text-sm font-mono text-info-700">
                    {'{{' + placeholder + '}}'}
                  </span>
                </div>
                <div>
                  <select
                    value={config.fieldMappings[placeholder] || ""}
                    onChange={(e) => props.onUpdateFieldMapping(placeholder, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                  >
                    <option value="">Selecione um campo...</option>
                    {CAMPAIGN_CONTACT_FIELDS.map((field) => (
                      <option value={field.key} key={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
