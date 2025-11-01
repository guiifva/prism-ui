import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ImageUploader from "../components/ImageUploader";
import SideMenu from "../components/SideMenu";
import {
  uploadImage,
  createCampaign,
  createBanner,
  importAudienceBatch,
  getDestinationScreens,
} from "../services/bannerService";
import type {
  BannerPlacement,
  BannerProduct,
  DestinationScreen,
} from "../types/banner";
import { PRODUCT_LABELS, PLACEMENT_LABELS } from "../utils/translations";
import { getEmailFromToken } from "../utils/auth";

const PLACEMENTS: BannerPlacement[] = [
  "HOME_SCREEN_TOP_BANNERS",
  "HOME_SCREEN_MIDDLE_BANNERS",
  "ALL_PRODUCTS_SCREEN_BOTTOM_BANNERS",
];

const PRODUCTS: BannerProduct[] = [
  "CREDIT",
  "ANTICIPATION",
  "CREDIT_CARD",
  "ASSURANCE",
];

export default function BannerForm() {
  const navigate = useNavigate();

  // Seção 1: Dados do Banner
  const [placement, setPlacement] = useState<BannerPlacement | "">("");
  const [bannerIdentifier, setBannerIdentifier] = useState("");
  const [imageSource, setImageSource] = useState<"file" | "url">("file");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState<string>("");
  const [imageUploading, setImageUploading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // is_end_date_valid será calculado automaticamente a partir de start/end
  const [priority, setPriority] = useState<number | "">("");
  const [subtitle, setSubtitle] = useState("");
  const [bannerDescription, setBannerDescription] = useState("");
  const [product, setProduct] = useState<BannerProduct | "">("");
  const [destinationScreenId, setDestinationScreenId] = useState<string>("");
  const [destinationScreens, setDestinationScreens] = useState<DestinationScreen[]>([]);
  const [isPublic, setIsPublic] = useState<boolean>(false);

  // Seção 2: Audiência CSV (condicional)
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Estado de UI
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validação em tempo real
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Carrega telas de destino
    (async () => {
      try {
        const screens = await getDestinationScreens();
        setDestinationScreens(screens);
      } catch (e) {
        // Não bloqueia o formulário se falhar; apenas informa
        console.error("Falha ao carregar telas de destino", e);
      }
    })();
  }, []);

  function handleIsPublicChange(checked: boolean) {
    setIsPublic(checked);
    if (checked) {
      setCsvFile(null);
      // Remove erro de CSV se campanha se tornar pública
      setFieldErrors((prev) => {
        const { csvFile: _, ...rest } = prev;
        return rest;
      });
    }
  }

  function validateBannerIdentifier(value: string) {
    if (!value.trim()) {
      setFieldErrors((prev) => ({ ...prev, bannerIdentifier: "Identificador é obrigatório" }));
    } else {
      setFieldErrors((prev) => {
        const { bannerIdentifier: _, ...rest } = prev;
        return rest;
      });
    }
  }

  function validateDescription(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setFieldErrors((prev) => ({ ...prev, bannerDescription: "Descrição é obrigatória" }));
    } else if (trimmed.length < 3) {
      setFieldErrors((prev) => ({ ...prev, bannerDescription: "Descrição deve ter pelo menos 3 caracteres" }));
    } else if (trimmed.length > 255) {
      setFieldErrors((prev) => ({ ...prev, bannerDescription: "Descrição não pode ter mais de 255 caracteres" }));
    } else {
      setFieldErrors((prev) => {
        const { bannerDescription: _, ...rest } = prev;
        return rest;
      });
    }
  }

  function validateImageUrl(value: string) {
    const url = value.trim();
    if (!url) {
      setFieldErrors((prev) => ({ ...prev, imageUrl: "URL é obrigatória" }));
    } else {
      try {
        const u = new URL(url);
        if (u.protocol !== "https:") {
          setFieldErrors((prev) => ({ ...prev, imageUrl: "URL deve usar HTTPS" }));
        } else if (!url.startsWith("https://static.ifood.com.br")) {
          setFieldErrors((prev) => ({ ...prev, imageUrl: "URL deve ser do domínio static.ifood.com.br" }));
        } else {
          setFieldErrors((prev) => {
            const { imageUrl: _, ...rest } = prev;
            return rest;
          });
        }
      } catch {
        setFieldErrors((prev) => ({ ...prev, imageUrl: "URL inválida" }));
      }
    }
  }

  function validateDates(start: string, end: string) {
    if (end && start) {
      try {
        if (new Date(end) < new Date(start)) {
          setFieldErrors((prev) => ({ ...prev, endDate: "Data de fim não pode ser anterior ao início" }));
        } else {
          setFieldErrors((prev) => {
            const { endDate: _, ...rest } = prev;
            return rest;
          });
        }
      } catch {
        // Ignora erros de parsing
      }
    }
  }

  function validateForm(): string | null {
    // Banner
    if (!placement) return "Selecione um placement.";
    if (!product) return "Selecione um produto.";
    if (!bannerIdentifier.trim()) return "Informe o identificador do banner.";

    // Descrição obrigatória
    const desc = bannerDescription.trim();
    if (desc.length < 3 || desc.length > 255) {
      return "Descrição deve ter entre 3 e 255 caracteres.";
    }

    if (imageSource === "file") {
      if (!imageFile) return "Selecione uma imagem do banner.";
    } else {
      const url = imageUrlInput.trim();
      if (!url) return "Informe a URL da imagem.";
      try {
        const u = new URL(url);
        if (u.protocol !== "https:") {
          return "A URL da imagem deve usar HTTPS.";
        }
        if (!url.startsWith("https://static.ifood.com.br")) {
          return "A URL da imagem deve ser do domínio https://static.ifood.com.br";
        }
      } catch {
        return "URL da imagem inválida.";
      }
    }
    if (!startDate) return "Defina a data de início.";
    if (priority === "" || Number.isNaN(Number(priority))) return "Informe a prioridade (número).";
    const priorityNum = Number(priority);
    if (priorityNum < 1 || priorityNum > 8) return "Prioridade deve estar entre 1 e 8.";
    if (endDate) {
      try {
        if (new Date(endDate) < new Date(startDate)) {
          return "Data de término não pode ser anterior ao início.";
        }
      } catch {}
    }

    // Valida CSV condicional
    if (!isPublic) {
      if (!csvFile) return "Campanha privada requer upload de audiência CSV.";
      const maxCsv = 10 * 1024 * 1024;
      if (csvFile.size > maxCsv) return "Arquivo CSV deve ter no máximo 10MB.";
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitMsg(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSubmitting(true);

    let imageUrl = "";
    let campaignId = "";
    let bannerId = "";

    try {
      // 1) Upload da imagem
      if (imageSource === "file") {
        if (imageFile) {
          setImageUploading(true);
          imageUrl = await uploadImage(imageFile);
        }
      } else {
        imageUrl = imageUrlInput.trim();
      }

      // 2) Cria campanha usando a descrição do banner
      const createdBy = getEmailFromToken();
      const campaignResp = await createCampaign({
        description: bannerDescription,
        status: "ACTIVE",
        // partner_external_id removido conforme solicitação
        is_public: isPublic,
        created_by: createdBy,
      });
      campaignId = campaignResp.id;

      // 3) Cria banner
      const isEndDateValidValue = !!endDate && (new Date(endDate) >= new Date(startDate));
      const bannerResp = await createBanner(campaignId, {
        placement: placement as BannerPlacement,
        banner_identifier: bannerIdentifier,
        image_url: imageUrl,
        start_date: startDate,
        end_date: endDate || undefined,
        is_end_date_valid: isEndDateValidValue,
        priority: Number(priority),
        subtitle: subtitle || undefined,
        description: bannerDescription || undefined,
        product: product as BannerProduct,
        created_by: createdBy,
        destination_screen_id: destinationScreenId || undefined,
      });
      bannerId = bannerResp.id;

      // 4) Importa CSV se campanha privada
      if (!isPublic && csvFile) {
        await importAudienceBatch(campaignId, csvFile);
      }

      setSubmitMsg("Banner criado com sucesso!");
      // Redireciona após pequeno delay
      setTimeout(() => navigate("/banners"), 800);
    } catch (err) {
      console.error(err);
      const prefix = campaignId
        ? bannerId
          ? "Erro ao importar audiência. Campanha e banner foram criados."
          : "Erro ao criar banner. Campanha foi criada."
        : imageUrl
        ? "Erro ao criar campanha."
        : "Erro no upload da imagem.";
      setErrorMsg(
        `${prefix} ${(err as Error)?.message ? `Detalhe: ${(err as Error).message}` : ""}`.trim()
      );
    } finally {
      setSubmitting(false);
      setImageUploading(false);
    }
  }

  const csvPreview = useMemo(() => {
    if (!csvFile) return null;
    const sizeKb = (csvFile.size / 1024).toFixed(1);
    return `${csvFile.name} • ${sizeKb} KB`;
  }, [csvFile]);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <PageHeader
        title="Novo Banner"
        showBackButton
        backButtonPath="/banners"
      />

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <SideMenu />
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Dados do Banner */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">1. Dados do Banner</h2>
              <span className="rounded-full bg-error-100 px-2.5 py-1 text-xs font-semibold text-error-700 dark:bg-error-500/20 dark:text-error-200 dark:border dark:border-error-400/40">Obrigatório</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Identificador</label>
                <input
                  required
                  value={bannerIdentifier}
                  onChange={(e) => {
                    // Remove espaços e caracteres inválidos, mantém apenas letras, números e underscore
                    const sanitized = e.target.value
                      .replace(/\s+/g, '_') // Substitui espaços por underscore
                      .replace(/[^a-zA-Z0-9_]/g, '') // Remove caracteres que não são letras, números ou underscore
                      .toUpperCase(); // Converte para maiúsculas
                    setBannerIdentifier(sanitized);
                    validateBannerIdentifier(sanitized);
                  }}
                  onBlur={() => validateBannerIdentifier(bannerIdentifier)}
                  placeholder="BANNER_HOME_CREDITO_01"
                  className={`w-full h-11 rounded-xl border px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100 uppercase ${
                    fieldErrors.bannerIdentifier
                      ? "border-error-500 dark:border-error-500"
                      : "border-slate-200"
                  }`}
                  aria-invalid={!!fieldErrors.bannerIdentifier}
                  aria-describedby={fieldErrors.bannerIdentifier ? "banner-id-error" : undefined}
                />
                {fieldErrors.bannerIdentifier ? (
                  <p id="banner-id-error" className="mt-1 text-xs text-error-700 dark:text-error-400">{fieldErrors.bannerIdentifier}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Apenas letras maiúsculas, números e underscore (_). Sem espaços.</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Descrição</label>
                <textarea
                  required
                  value={bannerDescription}
                  onChange={(e) => {
                    setBannerDescription(e.target.value);
                    validateDescription(e.target.value);
                  }}
                  onBlur={() => validateDescription(bannerDescription)}
                  rows={3}
                  minLength={3}
                  maxLength={255}
                  placeholder="Descreva o banner (3–255 caracteres)"
                  className={`w-full rounded-xl border px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100 ${
                    fieldErrors.bannerDescription
                      ? "border-error-500 dark:border-error-500"
                      : "border-slate-200"
                  }`}
                  aria-invalid={!!fieldErrors.bannerDescription}
                  aria-describedby={fieldErrors.bannerDescription ? "description-error" : undefined}
                />
                {fieldErrors.bannerDescription && (
                  <p id="description-error" className="mt-1 text-xs text-error-700 dark:text-error-400">{fieldErrors.bannerDescription}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Placement</label>
                <select
                  required
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value as BannerPlacement)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                >
                  <option value="">Selecione...</option>
                  {PLACEMENTS.map((p) => (
                    <option key={p} value={p}>{PLACEMENT_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Produto</label>
                <select
                  required
                  value={product}
                  onChange={(e) => setProduct(e.target.value as BannerProduct)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                >
                  <option value="">Selecione...</option>
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>{PRODUCT_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Imagem</label>
                {/* Segmented Control for Image Source */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800 mb-3">
                  <button
                    type="button"
                    onClick={() => setImageSource("file")}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                      imageSource === "file"
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                    aria-label="Selecionar imagem por arquivo"
                  >
                    <span>📁</span>
                    Arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageSource("url")}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                      imageSource === "url"
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                    aria-label="Selecionar imagem por URL"
                  >
                    <span>🔗</span>
                    URL
                  </button>
                </div>
                {imageSource === "file" ? (
                  <div className="max-w-[200px] sm:max-w-[320px]">
                    <ImageUploader onImageSelect={setImageFile} uploading={imageUploading} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => {
                        setImageUrlInput(e.target.value);
                        if (e.target.value.trim()) {
                          validateImageUrl(e.target.value);
                        }
                      }}
                      onBlur={() => imageUrlInput && validateImageUrl(imageUrlInput)}
                      placeholder="https://static.ifood.com.br/image/banner.png"
                      className={`w-full h-11 rounded-xl border px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100 ${
                        fieldErrors.imageUrl
                          ? "border-error-500 dark:border-error-500"
                          : "border-slate-200"
                      }`}
                      aria-invalid={!!fieldErrors.imageUrl}
                      aria-describedby={fieldErrors.imageUrl ? "image-url-error" : undefined}
                    />
                    {fieldErrors.imageUrl && (
                      <p id="image-url-error" className="text-xs text-error-700 dark:text-error-400">{fieldErrors.imageUrl}</p>
                    )}
                    {imageUrlInput && (
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 w-48 sm:w-64">
                        <div className="aspect-[16/9]">
                          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                          {/* @ts-ignore */}
                          <img src={imageUrlInput} alt="Preview" className="h-full w-full object-contain" />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">A URL deve ser do domínio https://static.ifood.com.br</p>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Início</label>
                <input
                  required
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Fim (opcional)</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    validateDates(startDate, e.target.value);
                  }}
                  onBlur={() => validateDates(startDate, endDate)}
                  className={`w-full h-11 rounded-xl border px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100 ${
                    fieldErrors.endDate
                      ? "border-error-500 dark:border-error-500"
                      : "border-slate-200"
                  }`}
                  aria-invalid={!!fieldErrors.endDate}
                  aria-describedby={fieldErrors.endDate ? "end-date-error" : undefined}
                />
                {fieldErrors.endDate && (
                  <p id="end-date-error" className="mt-1 text-xs text-error-700 dark:text-error-400">{fieldErrors.endDate}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Prioridade</label>
                <select
                  required
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                >
                  <option value="">Selecione...</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                    <option key={p} value={p}>{p} {p === 1 ? '(Maior)' : p === 8 ? '(Menor)' : ''}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Menor valor = maior prioridade de exibição</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Tela destino (opcional)</label>
                <select
                  value={destinationScreenId}
                  onChange={(e) => setDestinationScreenId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                >
                  <option value="">Nenhuma</option>
                  {destinationScreens.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tela para onde o usuário será direcionado ao clicar</p>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Subtítulo (opcional)</label>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Texto secundário exibido no banner"
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                />
              </div>
            </div>
          </section>

          {/* Seção 2: Audiência (condicional) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">2. Audiência (CSV)</h2>
              {!isPublic ? (
                <span className="rounded-full bg-error-100 px-2.5 py-1 text-xs font-semibold text-error-700 dark:bg-error-500/20 dark:text-error-200 dark:border dark:border-error-400/40">Obrigatório</span>
              ) : (
                <span className="rounded-full bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-700 dark:bg-success-500/20 dark:text-success-200 dark:border dark:border-success-400/40">Opcional</span>
              )}
            </div>

            {/* Toggle Público/Privado com tooltip melhorado */}
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <input
                  id="is-public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => handleIsPublicChange(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-wine-600 focus:ring-wine-500 dark:border-slate-600 dark:bg-slate-800"
                />
                <label htmlFor="is-public" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Campanha pública
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 ml-7">
                {isPublic
                  ? "✓ Campanha será exibida para todos os usuários do app"
                  : "→ Upload de CSV necessário para definir audiência específica"}
              </p>
            </div>

            {isPublic ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                ℹ️ Campanha pública - não requer CSV.
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Upload do CSV</label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (!f) return setCsvFile(null);
                      const maxCsv = 10 * 1024 * 1024;
                      if (f.size > maxCsv) {
                        setErrorMsg("Arquivo CSV deve ter no máximo 10MB.");
                        e.currentTarget.value = "";
                        return;
                      }
                      setCsvFile(f);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:file:bg-slate-800 dark:hover:file:bg-slate-700"
                  />
                </div>
                {csvPreview && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {csvPreview}
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Arquivo CSV com uma coluna contendo UUIDs (account_reference). Tamanho máximo: 10MB.
                </p>
              </div>
            )}
          </section>

          {/* Mensagens */}
          {(errorMsg || submitMsg) && (
            <div
              className={`rounded-2xl border p-4 ${
                errorMsg
                  ? "border-error-200 bg-error-50 text-error-700 dark:border-error-700 dark:bg-error-500/20 dark:text-error-200"
                  : "border-success-200 bg-success-50 text-success-700 dark:border-success-700 dark:bg-success-500/20 dark:text-success-200"
              }`}
            >
              {errorMsg || submitMsg}
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-wine-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-offset-slate-900"
            >
              {submitting && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Criar Banner
            </button>
            <button
              type="button"
              onClick={() => navigate("/banners")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
          </div>
          </form>
        </div>
      </main>
    </div>
  );
}
