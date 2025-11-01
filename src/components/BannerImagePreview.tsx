interface BannerImagePreviewProps {
  imageUrl: string | null | undefined;
  subtitle?: string | null;
  bannerIdentifier: string;
  className?: string;
  size?: "small" | "large"; // small para listagem, large para detalhes/edição
}

export default function BannerImagePreview({
  imageUrl,
  subtitle,
  bannerIdentifier,
  className = "",
  size = "small",
}: BannerImagePreviewProps) {
  // Configuração de tamanhos baseado no contexto
  const textSizeClass = size === "small"
    ? "text-[10px] sm:text-xs"
    : "text-xl sm:text-2xl";

  const paddingClass = size === "small"
    ? "px-1.5 pb-1 pt-4"
    : "px-6 pb-5 pt-14";

  return (
    <div className={`relative overflow-hidden h-full w-full ${className}`}>
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={bannerIdentifier}
            className="h-full w-full object-contain"
          />
          {subtitle && (
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent ${paddingClass}`}>
              <p
                className={`text-white ${textSizeClass} leading-tight line-clamp-2`}
                style={{ fontFamily: 'TipoiFoodTextos-Medium, sans-serif' }}
              >
                {subtitle}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
          Sem imagem
        </div>
      )}
    </div>
  );
}
