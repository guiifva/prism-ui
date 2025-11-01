import { useState, useRef } from "react";
import { useToast } from "../contexts/ToastContext";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  currentImageUrl?: string;
  uploading?: boolean;
}

export default function ImageUploader({ onImageSelect, currentImageUrl, uploading }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("error", "Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("error", "A imagem deve ter no máximo 5MB.");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Call parent callback
    onImageSelect(file);
  }

  function handleRemove() {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileChange}
          className="hidden"
          id="image-upload"
          disabled={uploading}
        />
        <label
          htmlFor="image-upload"
          className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-2 text-sm font-medium transition-colors ${
            uploading
              ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800"
              : "border-slate-300 bg-white text-slate-700 hover:border-wine-500 hover:bg-wine-50 hover:text-wine-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-wine-500 dark:hover:bg-wine-900/20"
          }`}
        >
          {uploading ? "Enviando..." : previewUrl ? "Trocar imagem" : "Selecionar imagem"}
        </label>
        {previewUrl && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Remover
          </button>
        )}
      </div>

      {previewUrl && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
          <div className="aspect-[16/9] w-full">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-full w-full object-contain"
            />
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                <span className="text-sm font-medium text-white">Enviando imagem...</span>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Formatos aceitos: PNG, JPEG. Tamanho máximo: 5MB
      </p>
    </div>
  );
}
