import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import SideMenu from "../components/SideMenu";
import ImageUploader from "../components/ImageUploader";
import BannerImagePreview from "../components/BannerImagePreview";
import { getBannerById, getDestinationScreens, updateBanner, uploadImage } from "../services/bannerService";
import type { BannerPlacement, BannerProduct, BannerResponse, DestinationScreen } from "../types/banner";
import { PRODUCT_LABELS, PLACEMENT_LABELS } from "../utils/translations";

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

export default function BannerEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [banner, setBanner] = useState<BannerResponse | null>(null);

  // Form state
  const [placement, setPlacement] = useState<BannerPlacement | "">("");
  const [bannerIdentifier, setBannerIdentifier] = useState("");
  const [imageSource, setImageSource] = useState<"file" | "url">("url");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState<string>("");
  const [imageUploading, setImageUploading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState<number | "">("");
  const [subtitle, setSubtitle] = useState("");
  const [bannerDescription, setBannerDescription] = useState("");
  const [product, setProduct] = useState<BannerProduct | "">("");
  const [destinationScreenId, setDestinationScreenId] = useState<string>("");
  const [destinationScreens, setDestinationScreens] = useState<DestinationScreen[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!id) return;
        const b = await getBannerById(id);
        setBanner(b);
        // Pre-fill
        setPlacement(b.placement);
        setBannerIdentifier(b.banner_identifier);
        setImageSource("url");
        setImageUrlInput(b.image_url || "");
        setStartDate(toDatetimeLocal(b.start_date));
        setEndDate(b.end_date ? toDatetimeLocal(b.end_date) : "");
        setPriority(b.priority);
        setSubtitle(b.subtitle || "");
        setBannerDescription(b.description || "");
        setProduct(b.product);
        setDestinationScreenId(b.destination_screen_id || "");
      } catch (e) {
        setError((e as Error)?.message || "Falha ao carregar banner");
      } finally {
        setLoading(false);
      }
    })();
    (async () => {
      try {
        const screens = await getDestinationScreens();
        setDestinationScreens(screens);
      } catch (e) {
        console.warn("Falha ao carregar destination screens", e);
      }
    })();
  }, [id]);

  function toDatetimeLocal(value?: string): string {
    if (!value) return "";
    // Try parse with Date and format as yyyy-MM-ddTHH:mm (local time)
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    // Fallback: strip seconds/timezone if present
    const m = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
    return m ? m[1] : "";
  }

  const validationError = useMemo(() => {
    if (!placement) return "Selecione um placement.";
    if (!product) return "Selecione um produto.";
    if (!bannerIdentifier.trim()) return "Informe o identificador do banner.";

    // Descrição obrigatória
    const desc = bannerDescription.trim();
    if (desc.length < 3 || desc.length > 255) {
      return "Descrição deve ter entre 3 e 255 caracteres.";
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
    if (imageSource === "file") {
      if (!imageFile) return "Selecione uma imagem para enviar ou alterne para URL.";
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
    return null;
  }, [placement, product, bannerIdentifier, bannerDescription, startDate, endDate, priority, imageSource, imageFile, imageUrlInput]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validationError) {
      setSubmitMsg(validationError);
      setTimeout(() => setSubmitMsg(null), 5000);
      return;
    }
    if (!banner) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      let finalImageUrl = imageUrlInput.trim();
      if (imageSource === "file" && imageFile) {
        setImageUploading(true);
        finalImageUrl = await uploadImage(imageFile);
        setImageUploading(false);
      }
      const isEndDateValidValue = !!endDate && (new Date(endDate) >= new Date(startDate));
      await updateBanner(banner.campaign_id, banner.id, {
        image_url: finalImageUrl,
        start_date: startDate,
        end_date: endDate || undefined,
        priority: Number(priority),
        status: banner.status, // mantém status atual (aprovar/rejeitar é via ações dedicadas)
        subtitle: subtitle,
        description: bannerDescription,
        product: product as BannerProduct,
        destination_screen_id: destinationScreenId || undefined,
        is_end_date_valid: isEndDateValidValue,
      });
      setSubmitMsg("Banner atualizado com sucesso");
      setTimeout(() => navigate(`/banners/${banner.id}`), 800);
    } catch (e) {
      setSubmitMsg((e as Error)?.message || "Falha ao atualizar banner");
    } finally {
      setSubmitting(false);
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
        title="Editar Banner"
        showBackButton
        backButtonPath={`/banners/${banner.id}`}
      />

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <SideMenu />
          <section>
            {submitMsg && (
              <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {submitMsg}
              </div>
            )}
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Dados do Banner</h2>
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
                      }}
                      className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100 uppercase"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Apenas letras maiúsculas, números e underscore (_). Sem espaços.</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Descrição</label>
                    <textarea required value={bannerDescription} onChange={(e) => setBannerDescription(e.target.value)} rows={3} minLength={3} maxLength={255} placeholder="Descreva o banner (3–255 caracteres)" className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Placement</label>
                    <select
                      required
                      value={placement}
                      onChange={(e) => setPlacement(e.target.value as BannerPlacement)}
                      className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                    >
                      {PLACEMENTS.map((p) => (
                        <option key={p} value={p}>{PLACEMENT_LABELS[p]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Produto</label>
                    <select required value={product} onChange={(e) => setProduct(e.target.value as BannerProduct)} className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100">
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
                      >
                        <span>🔗</span>
                        URL
                      </button>
                    </div>
                    {imageSource === "file" ? (
                      <div className="max-w-[200px] sm:max-w-[320px]">
                        <ImageUploader onImageSelect={setImageFile} currentImageUrl={imageUrlInput} uploading={imageUploading} />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="https://static.ifood.com.br/image/banner.png"
                          className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100"
                        />
                        {imageUrlInput && (
                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 w-full max-w-md">
                            <div className="aspect-[343/160]">
                              <BannerImagePreview
                                imageUrl={imageUrlInput}
                                subtitle={subtitle}
                                bannerIdentifier={bannerIdentifier || "Preview"}
                                size="large"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Início</label>
                    <input type="datetime-local" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Fim (opcional)</label>
                    <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Prioridade</label>
                    <select required value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                        <option key={p} value={p}>{p} {p === 1 ? '(Maior)' : p === 8 ? '(Menor)' : ''}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Menor valor = maior prioridade de exibição</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Tela destino (opcional)</label>
                    <select value={destinationScreenId} onChange={(e) => setDestinationScreenId(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100">
                      <option value="">Nenhuma</option>
                      {destinationScreens.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tela para onde o usuário será direcionado ao clicar</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Subtítulo (opcional)</label>
                    <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Texto secundário exibido no banner" className="w-full h-11 rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-slate-200 focus:ring dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-100" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-wine-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-offset-slate-900">
                  {submitting && (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  Salvar Alterações
                </button>
                <button type="button" onClick={() => navigate(`/banners/${banner.id}`)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
